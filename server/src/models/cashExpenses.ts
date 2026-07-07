import pool from "../db";

export interface CashExpense {
    id: number;
    user_id: number;
    description: string;
    amount: number;
    created_at: string;
}

export const getAllCashExpenses = (user_id: number) => {
    return pool.query<CashExpense>(
        `SELECT * FROM cash_expenses WHERE user_id = $1 ORDER BY created_at ASC`,
        [user_id]
    );
};

export const createCashExpense = (description: string, amount: number, user_id: number) => {
    return pool.query<CashExpense>(
        `INSERT INTO cash_expenses (description, amount, user_id) VALUES ($1, $2, $3) RETURNING *`,
        [description, amount, user_id]
    );
};

export const updateCashExpense = (id: string, description: string, amount: number, user_id: number) => {
    return pool.query<CashExpense>(
        `UPDATE cash_expenses SET description = $1, amount = $2 WHERE id = $3 AND user_id = $4 RETURNING *`,
        [description, amount, id, user_id]
    );
};

export const deleteCashExpense = (id: string, user_id: number) => {
    return pool.query<CashExpense>(
        `DELETE FROM cash_expenses WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, user_id]
    );
};