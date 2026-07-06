import { api } from "./auth";

export interface BudgetSuggestion {
    suggestions: {
        category_id: number;
        category_name: string;
        suggested_amount: number;
        reasoning: string;
    }[];
    summary: string;
}

export const getSuggestedBudget = async (
    month: string,
    savingsGoal: number
): Promise<BudgetSuggestion> => {
    const response = await api.post("/api/ai/suggest-budget", {
        month,
        savingsGoal,
    });
    return response.data;
};