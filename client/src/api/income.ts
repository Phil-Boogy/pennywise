import { api } from "./auth";

export interface Income {
    id: number;
    category: string;
    description: string;
    amount: number;
    created_at: string;
}

export const getIncomes = async (): Promise<Income[]> => {
    const response = await api.get("/api/income");
    return response.data;
};

export const getIncomesByMonth = async (month: string): Promise<Income[]> => {
    const response = await api.get(`/api/income/month/${month}`);
    return response.data;
};

export const createIncome = async (
    category_id: number,
    description: string,
    amount: number
): Promise<Income> => {
    const response = await api.post("/api/income", {
        category_id,
        description,
        amount,
    });
    return response.data;
};

export const deleteIncome = async (id: number): Promise<void> => {
    await api.delete(`/api/income/${id}`);
};