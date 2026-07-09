import pool from "../db";

export interface MonthlySettings {
    id: number;
    month: string;
    savings_goal: number;
    confirmed_income: number;
    created_at: string;
}

export const getMonthlySettings = (month: string, user_id: number) => {
    return pool.query<MonthlySettings>(
        `SELECT * FROM monthly_settings WHERE month = $1 AND user_id = $2`,
        [month, user_id]
    );
};

export const upsertMonthlySettings = (month: string, savings_goal: number, confirmed_income: number, user_id: number) => {
    return pool.query<MonthlySettings>(
        `INSERT INTO monthly_settings (month, savings_goal, confirmed_income, user_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (month, user_id)
     DO UPDATE SET savings_goal = $2, confirmed_income = $3
     RETURNING *`,
        [month, savings_goal, confirmed_income, user_id]
    );
};