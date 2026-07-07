import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { suggestBudget, analyzeTransactions } from "../services/ai";
import { getAllExpenseCategories } from "../models/expenseCategories";
import { getAllBudgets } from "../models/budgets";
import { getAllIncomes } from "../models/income";
import { generateUnifiedBudget } from "../services/ai";
import { getAllCashExpenses } from "../models/cashExpenses";
import { getBudgetsByMonth as getBudgetsByMonthModel } from "../models/budgets";
import { getExpensesByMonth } from "../models/expenses";


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

export const generateBudget = async (
    req: AuthedRequest<{}, {}, {
        transactions: {
            date: string;
            merchant: string;
            amount: number;
            type: "credit" | "debit";
            occurrences: number;
        }[];
        savingsGoal: number;
    }>,
    res: Response
) => {
    const { transactions, savingsGoal } = req.body;
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

        // build budget vs actual history from DB
        const previousBudgetHistory = budgetsResult.rows.map((b) => ({
            month: b.month,
            category: b.category,
            budgeted: Number(b.amount),
            actual: 0, // we'll enhance this later with actual expense data
        }));

        const result = await generateUnifiedBudget({
            transactions,
            categories,
            cashExpenses,
            savingsGoal: Number(savingsGoal),
            previousBudgetHistory,
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate budget" });
    }
};