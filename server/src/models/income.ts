import pool from "../db";
import { Income } from "../types/index";

export const getAllIncomes = (user_id: number) => {
    return pool.query<Income>(`
        SELECT income.id, income_categories.name AS category, income.description, income.amount, income.created_at
        FROM income
        JOIN income_categories ON income.category_id = income_categories.id
        WHERE income.user_id = $1
        ORDER BY income.created_at DESC
    `, [user_id]);
};

export const createNewIncome = (category_id: number, description: string, amount: number, user_id: number) => {
    return pool.query<Income>(
        `INSERT INTO income (category_id, description, amount, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [category_id, description, amount, user_id]
    );
};

export const editIncome = (id: string, category_id: number, description: string, amount: number, user_id: number) => {
    return pool.query<Income>(
        `UPDATE income
        SET category_id = $1, description = $2, amount = $3
        WHERE id = $4 AND user_id = $5
        RETURNING *`,
        [category_id, description, amount, id, user_id]
    );
};

export const deleteIncome = (id: string, user_id: number) => {
    return pool.query<Income>(
        `DELETE FROM income
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
        [id, user_id]
    );
};