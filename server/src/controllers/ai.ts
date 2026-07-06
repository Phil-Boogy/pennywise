import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import { suggestBudget } from "../services/ai";
import { getAllExpenseCategories } from "../models/expenseCategories";
import { getAllBudgets } from "../models/budgets";
import { getAllIncomes } from "../models/income";

export const getBudgetSuggestion = async (
    req: AuthedRequest<{}, {}, { month: string; savingsGoal: number }>,
    res: Response
) => {
    const { month, savingsGoal } = req.body;
    const userId = req.userId!;

    try {
        // fetch all the data Claude needs
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