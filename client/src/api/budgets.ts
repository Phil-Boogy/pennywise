import { api } from "./auth";

export interface Budget {
    id: number;
    category: string;
    category_id: number;
    amount: number;
    month: string;
}

export interface CreateBudgetItem {
    category_id: number;
    amount: number;
    month: string;
}

export interface EditBudgetItem {
    category_id: number;
    amount: number;
    month: string;
}

export const getBudgets = async (): Promise<Budget[]> => {
    const response = await api.get("/api/budgets");
    return response.data;
};

export const getBudgetsByMonth = async (month: string): Promise<Budget[]> => {
    const response = await api.get(`/api/budgets/month/${month}`);
    return response.data;
};

export const createBudget = async (item: CreateBudgetItem): Promise<Budget> => {
    const response = await api.post("/api/budgets", item);
    return response.data;
};

export const editBudget = async (id: number, item: EditBudgetItem): Promise<Budget> => {
    const response = await api.put(`/api/budgets/${id}`, item);
    return response.data;
};

export const deleteBudget = async (id: number): Promise<void> => {
    await api.delete(`/api/budgets/${id}`);
};