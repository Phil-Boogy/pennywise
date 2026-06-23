import pool from "../db";
import { Budget } from "../types/index";

export const getAllBudgets = () => {
    return pool.query<Budget>(`
        SELECT budget.id, expense_categories.name AS category, budget.amount, budget.month
        FROM budget
        JOIN expense_categories ON budget.category_id = expense_categories.id
    `);
};

export const createNewBudget = (category_id: number, amount: number, month: string) => {
    return pool.query<Budget>(
        `INSERT INTO budget (category_id, amount, month) VALUES ($1, $2, $3) RETURNING *`,
        [category_id, amount, month]
    );
};

export const editBudget = (id: string, category_id: number, amount: number, month: string) => {
    return pool.query<Budget>(
        `UPDATE budget
        SET category_id = $1, amount = $2, month = $3
        WHERE id = $4
        RETURNING *`,
        [category_id, amount, month, id]
    );
};

export const deleteBudget = (id: string) => {
    return pool.query<Budget>(
        `DELETE FROM budget
        WHERE id = $1
        RETURNING *`,
        [id]
    );
};