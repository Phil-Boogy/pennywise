import pool from "../db";
import { Budget } from "../types/index";

export const getAllBudgets = (user_id: number) => {
    return pool.query<Budget>(`
        SELECT budget.id, expense_categories.name AS category, budget.category_id, budget.amount, budget.month
        FROM budget
        JOIN expense_categories ON budget.category_id = expense_categories.id
        WHERE budget.user_id = $1
    `, [user_id]);
};

export const getBudgetsByMonth = (month: string, user_id: number) => {
    return pool.query<Budget>(
        `SELECT budget.id, expense_categories.name AS category, budget.category_id, budget.amount, budget.month
        FROM budget
        JOIN expense_categories ON budget.category_id = expense_categories.id
        WHERE budget.month = $1 AND budget.user_id = $2`,
        [month, user_id]
    );
};

export const createNewBudget = (category_id: number, amount: number, month: string, user_id: number) => {
    return pool.query<Budget>(
        `INSERT INTO budget (category_id, amount, month, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [category_id, amount, month, user_id]
    );
};

export const editBudget = (id: string, category_id: number, amount: number, month: string, user_id: number) => {
    return pool.query<Budget>(
        `UPDATE budget
        SET category_id = $1, amount = $2, month = $3
        WHERE id = $4 AND user_id = $5
        RETURNING *`,
        [category_id, amount, month, id, user_id]
    );
};

export const deleteBudget = (id: string, user_id: number) => {
    return pool.query<Budget>(
        `DELETE FROM budget
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
        [id, user_id]
    );
};