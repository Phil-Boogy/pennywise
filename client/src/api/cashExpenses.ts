import { api } from "./auth";

export interface CashExpense {
    id: number;
    description: string;
    amount: number;
    created_at: string;
}

export const getCashExpenses = async (): Promise<CashExpense[]> => {
    const response = await api.get("/api/cash-expenses");
    return response.data;
};

export const createCashExpense = async (
    description: string,
    amount: number
): Promise<CashExpense> => {
    const response = await api.post("/api/cash-expenses", { description, amount });
    return response.data;
};

export const updateCashExpense = async (
    id: number,
    description: string,
    amount: number
): Promise<CashExpense> => {
    const response = await api.put(`/api/cash-expenses/${id}`, { description, amount });
    return response.data;
};

export const deleteCashExpense = async (id: number): Promise<void> => {
    await api.delete(`/api/cash-expenses/${id}`);
};