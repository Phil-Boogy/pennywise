import { api } from "./auth";

export interface Expense {
    id: number;
    category: string;
    description: string;
    amount: number;
    created_at: string;
}

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await api.get("/api/expenses");
    return response.data;
};

export const getExpensesByMonth = async (month: string): Promise<Expense[]> => {
    const response = await api.get(`/api/expenses/month/${month}`);
    return response.data;
};

export const createExpense = async (
    category_id: number,
    description: string,
    amount: number
): Promise<Expense> => {
    const response = await api.post("/api/expenses", {
        category_id,
        description,
        amount,
    });
    return response.data;
};

export const deleteExpense = async (id: number): Promise<void> => {
    await api.delete(`/api/expenses/${id}`);
};