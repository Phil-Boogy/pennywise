import pool from "../db";

export interface MonthlySettings {
    id: number;
    month: string;
    savings_goal: number;
    created_at: string;
}

export const getMonthlySettings = (month: string) => {
    return pool.query<MonthlySettings>(
        `SELECT * FROM monthly_settings WHERE month = $1`,
        [month]
    );
};

export const upsertMonthlySettings = (month: string, savings_goal: number) => {
    return pool.query<MonthlySettings>(
        `INSERT INTO monthly_settings (month, savings_goal)
     VALUES ($1, $2)
     ON CONFLICT (month)
     DO UPDATE SET savings_goal = $2
     RETURNING *`,
        [month, savings_goal]
    );
};