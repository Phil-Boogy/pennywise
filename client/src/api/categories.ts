import { api } from "./auth";

export interface Category {
    id: number;
    name: string;
}

export const getExpenseCategories = async (): Promise<Category[]> => {
    const response = await api.get("/api/expense-categories");
    return response.data;
};

export const createExpenseCategory = async (name: string): Promise<Category> => {
    const response = await api.post("/api/expense-categories", { name });
    return response.data;
};

export const deleteExpenseCategory = async (id: number): Promise<void> => {
    await api.delete(`/api/expense-categories/${id}`);
};

export const getIncomeCategories = async (): Promise<Category[]> => {
    const response = await api.get("/api/income-categories");
    return response.data;
};

export const createIncomeCategory = async (name: string): Promise<Category> => {
    const response = await api.post("/api/income-categories", { name });
    return response.data;
};

export const deleteIncomeCategory = async (id: number): Promise<void> => {
    await api.delete(`/api/income-categories/${id}`);
};