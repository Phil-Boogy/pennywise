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

export interface UnifiedBudgetResponse {
    income_sources: {
        merchant: string;
        average_monthly_amount: number;
        total_received: number;
        months_seen: number;
    }[];
    suggested_total_income: number;
    budget_suggestions: {
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

export interface TransactionAnalysis {
    transactions: {
        date: string;
        merchant: string;
        amount: number;
        type: "credit" | "debit";
        occurrences: number;
        category_id: number | null;
        category_name: string | null;
        is_recurring: boolean;
        reasoning: string;
    }[];
    recurring_expenses: {
        merchant: string;
        estimated_monthly_amount: number;
        category_id: number | null;
        category_name: string | null;
    }[];
    income_sources: {
        merchant: string;
        amounts: number[];
        is_salary: boolean;
    }[];
    summary: string;
}

export const analyzeTransactions = async (
    transactions: {
        date: string;
        merchant: string;
        amount: number;
        type: "credit" | "debit";
        occurrences: number;
    }[]
): Promise<TransactionAnalysis> => {
    const response = await api.post("/api/ai/analyze-transactions", {
        transactions,
    });
    return response.data;
};

export const generateBudget = async (
    transactions: {
        date: string;
        merchant: string;
        amount: number;
        type: "credit" | "debit";
        occurrences: number;
    }[],
    savingsGoal: number
): Promise<UnifiedBudgetResponse> => {
    const response = await api.post("/api/ai/generate-budget", {
        transactions,
        savingsGoal,
    });
    return response.data;
};