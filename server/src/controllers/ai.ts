import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import {
    suggestBudget,
    analyzeTransactions,
    categorizeMerchants,
    generateUnifiedBudget,
    CategorizedMerchantResult,
    UnifiedBudgetResponse,
} from "../services/ai";
import { getAllExpenseCategories } from "../models/expenseCategories";
import { getAllBudgets } from "../models/budgets";
import { getAllIncomes } from "../models/income";
import { getAllCashExpenses } from "../models/cashExpenses";
import { getMerchantMappingsByNames, upsertMerchantMapping } from "../models/merchantMappings";
import {
    upsertCategorizedTransaction,
    getCategorizedTransactionsByMonth,
    getCategoryTotalsByMonth,
} from "../models/categorizedTransactions";

export const getBudgetSuggestion = async (
    req: AuthedRequest<{}, {}, { month: string; savingsGoal: number }>,
    res: Response
) => {
    const { month, savingsGoal } = req.body;
    const userId = req.userId!;

    try {
        const [categoriesResult, budgetsResult, incomesResult] = await Promise.all([
            getAllExpenseCategories(userId),
            getAllBudgets(userId),
            getAllIncomes(userId),
        ]);

        const categories = categoriesResult.rows.map((c) => ({
            id: c.id,
            name: c.name,
        }));

        const previousBudgets = budgetsResult.rows.map((b) => ({
            category: b.category,
            amount: Number(b.amount),
        }));

        const monthlyIncome = incomesResult.rows.reduce(
            (sum, i) => sum + Number(i.amount),
            0
        );

        const suggestion = await suggestBudget({
            categories,
            previousBudgets,
            monthlyIncome,
            savingsGoal: Number(savingsGoal),
            month,
        });

        res.json(suggestion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate budget suggestion" });
    }
};

export const getTransactionAnalysis = async (
    req: AuthedRequest<{}, {}, {
        transactions: {
            date: string;
            merchant: string;
            amount: number;
            type: "credit" | "debit";
            occurrences: number;
        }[];
    }>,
    res: Response
) => {
    const { transactions } = req.body;
    const userId = req.userId!;

    try {
        const categoriesResult = await getAllExpenseCategories(userId);
        const categories = categoriesResult.rows.map((c) => ({
            id: c.id,
            name: c.name,
        }));

        const analysis = await analyzeTransactions({ transactions, categories });
        res.json(analysis);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to analyze transactions" });
    }
};

interface IncomingTransaction {
    date: string;
    merchant: string;
    amount: number;
    type: "credit" | "debit";
    occurrences: number;
    source: string;
    cardLastFour?: string;
}

export const categorizeTransactionsController = async (
    req: AuthedRequest<{}, {}, {
        transactions: IncomingTransaction[];
        month: string;
    }>,
    res: Response
) => {
    const { transactions, month } = req.body;
    const userId = req.userId!;

    try {
        const categoriesResult = await getAllExpenseCategories(userId);
        const categories = categoriesResult.rows.map((c) => ({ id: c.id, name: c.name }));

        const uniqueMerchants = Array.from(new Set(transactions.map((t) => t.merchant)));

        const mappingsResult = await getMerchantMappingsByNames(uniqueMerchants, userId);
        const mappingByMerchant = new Map(mappingsResult.rows.map((m) => [m.merchant, m]));

        const unknownMerchants = uniqueMerchants.filter((m) => !mappingByMerchant.has(m));

        let aiResults: CategorizedMerchantResult[] = [];
        if (unknownMerchants.length > 0) {
            const merchantSamples = unknownMerchants.map((merchant) => {
                const sample = transactions.find((t) => t.merchant === merchant)!;
                return { merchant, sampleAmount: Math.abs(sample.amount), type: sample.type };
            });
            aiResults = await categorizeMerchants({ merchants: merchantSamples, categories });
        }
        const aiResultByMerchant = new Map(aiResults.map((r) => [r.merchant, r]));

        // Save every transaction to categorized_transactions (upsert avoids duplicates)
        await Promise.all(
            transactions.map((t) => {
                const mapping = mappingByMerchant.get(t.merchant);
                const aiResult = aiResultByMerchant.get(t.merchant);

                const category_id = mapping ? mapping.category_id : aiResult?.category_id ?? null;
                const category_name = mapping ? mapping.category_name : aiResult?.category_name ?? null;
                const reasoning = mapping
                    ? "Previously categorized for this merchant"
                    : aiResult?.reasoning ?? "Could not identify this merchant";

                return upsertCategorizedTransaction(
                    month,
                    t.date,
                    t.merchant,
                    Math.abs(t.amount),
                    t.type,
                    category_id,
                    category_name,
                    reasoning,
                    t.source,
                    t.cardLastFour ?? null,
                    userId
                );
            })
        );

        // Save newly identified merchant -> category mappings for future use
        await Promise.all(
            unknownMerchants.map((merchant) => {
                const aiResult = aiResultByMerchant.get(merchant);
                if (aiResult && aiResult.category_id !== null && aiResult.category_name) {
                    return upsertMerchantMapping(merchant, aiResult.category_id, aiResult.category_name, userId);
                }
                return Promise.resolve();
            })
        );

        // Between-passes SQL aggregation: read back the authoritative state for the month
        const [monthRowsResult, totalsResult] = await Promise.all([
            getCategorizedTransactionsByMonth(month, userId),
            getCategoryTotalsByMonth(month, userId),
        ]);

        const categorized = monthRowsResult.rows.map((row) => ({
            date: row.date,
            merchant: row.merchant,
            amount: Number(row.amount),
            type: row.type as "credit" | "debit",
            category_id: row.category_id,
            category_name: row.category_name,
            reasoning: row.reasoning,
            source: row.source ?? undefined,
            cardLastFour: row.card_last_four ?? undefined,
        }));

        const transactionsByCategory = new Map<
            number,
            { date: string; merchant: string; amount: number; source?: string; cardLastFour?: string }[]
        >();
        for (const c of categorized) {
            if (c.type !== "debit" || c.category_id === null) continue;
            if (!transactionsByCategory.has(c.category_id)) {
                transactionsByCategory.set(c.category_id, []);
            }
            transactionsByCategory.get(c.category_id)!.push({
                date: c.date,
                merchant: c.merchant,
                amount: c.amount,
                source: c.source,
                cardLastFour: c.cardLastFour,
            });
        }

        const categories_summary = totalsResult.rows.map((t) => ({
            category_id: t.category_id,
            category_name: t.category_name,
            total: Number(t.total),
            transactions: transactionsByCategory.get(t.category_id) ?? [],
        }));

        res.json({ categorized, categories_summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to categorize transactions" });
    }
};

export const generateBudget = async (
    req: AuthedRequest<{}, {}, {
        categoryTotals: { category_id: number; category_name: string; total: number }[];
        incomeSources: { merchant: string; average_monthly_amount: number; months_seen: number }[];
        savingsGoal: number;
        overrides?: {
            lockedAmounts: Record<number, number>;
            confirmedIncome: number;
        };
    }>,
    res: Response
) => {
    const { categoryTotals, incomeSources, savingsGoal, overrides } = req.body;
    const userId = req.userId!;

    try {
        const [categoriesResult, cashExpensesResult, budgetsResult] = await Promise.all([
            getAllExpenseCategories(userId),
            getAllCashExpenses(userId),
            getAllBudgets(userId),
        ]);

        const categories = categoriesResult.rows.map((c) => ({
            id: c.id,
            name: c.name,
        }));

        const cashExpenses = cashExpensesResult.rows.map((e) => ({
            description: e.description,
            amount: Number(e.amount),
        }));

        const previousBudgetHistory = budgetsResult.rows.map((b) => ({
            month: b.month,
            category: b.category,
            budgeted: Number(b.amount),
            actual: 0,
        }));

        const totalFromSources = incomeSources.reduce((sum, s) => sum + s.average_monthly_amount, 0);
        const suggestedTotalIncome = overrides?.confirmedIncome ?? totalFromSources;

        const synthesis = await generateUnifiedBudget({
            categoryTotals,
            categories,
            suggestedTotalIncome,
            cashExpenses,
            savingsGoal: Number(savingsGoal),
            previousBudgetHistory,
            overrides,
        });

        const result: UnifiedBudgetResponse = {
            income_sources: incomeSources.map((s) => ({
                merchant: s.merchant,
                average_monthly_amount: s.average_monthly_amount,
                total_received: s.average_monthly_amount * s.months_seen,
                months_seen: s.months_seen,
            })),
            suggested_total_income: suggestedTotalIncome,
            budget_suggestions: synthesis.budget_suggestions,
            summary: synthesis.summary,
        };

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate budget" });
    }
};
