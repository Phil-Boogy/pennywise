import { api } from "./auth";

export interface MonthlySettings {
    id?: number;
    month: string;
    savings_goal: number;
    confirmed_income: number;
    created_at?: string;
}

export const getMonthlySettings = async (month: string): Promise<MonthlySettings> => {
    const response = await api.get(`/api/monthly-settings/${month}`);
    return response.data;
};

export const saveMonthlySettings = async (
    month: string,
    savings_goal: number,
    confirmed_income: number
): Promise<MonthlySettings> => {
    const response = await api.post(`/api/monthly-settings/${month}`, {
        savings_goal,
        confirmed_income,
    });
    return response.data;
};