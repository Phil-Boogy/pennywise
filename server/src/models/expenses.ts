import pool from "../db";
import { Expense } from "../types/index";

export const getAllExpenses = (user_id: number) => {
    return pool.query<Expense>(`
        SELECT expenses.id, expense_categories.name AS category, expenses.description, expenses.amount, expenses.created_at
        FROM expenses
        JOIN expense_categories ON expenses.category_id = expense_categories.id
        WHERE expenses.user_id = $1
        ORDER BY expenses.created_at DESC
    `, [user_id]);
};

export const createNewExpense = (category_id: number, description: string, amount: number, user_id: number) => {
    return pool.query<Expense>(
        `INSERT INTO expenses (category_id, description, amount, user_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [category_id, description, amount, user_id]
    );
};

export const editExpense = (id: string, category_id: number, description: string, amount: number, user_id: number) => {
    return pool.query<Expense>(
        `UPDATE expenses
        SET category_id = $1, description = $2, amount = $3
        WHERE id = $4 AND user_id = $5
        RETURNING *`,
        [category_id, description, amount, id, user_id]
    );
};

export const deleteExpense = (id: string, user_id: number) => {
    return pool.query<Expense>(
        `DELETE FROM expenses
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
        [id, user_id]
    );
};

export const getExpensesByMonth = (month: string, user_id: number) => {
    return pool.query<Expense>(`
        SELECT expenses.id, expense_categories.name AS category, expenses.description, expenses.amount, expenses.created_at
        FROM expenses
        JOIN expense_categories ON expenses.category_id = expense_categories.id
        WHERE expenses.user_id = $1
        AND DATE_TRUNC('month', expenses.created_at) = $2::date
        ORDER BY expenses.created_at DESC
    `, [user_id, month]);
};