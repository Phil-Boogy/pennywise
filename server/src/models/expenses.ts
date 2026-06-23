import pool from "../db";
import { Expense } from "../types/index";

export const getAllExpenses = () => {
    return pool.query<Expense>(`
        SELECT expenses.id, expense_categories.name AS category, expenses.description, expenses.amount, expenses.created_at
        FROM expenses
        JOIN expense_categories ON expenses.category_id = expense_categories.id
    `);
};

export const createNewExpense = (category_id: number, description: string, amount: number) => {
    return pool.query<Expense>(
        `INSERT INTO expenses (category_id, description, amount) VALUES ($1, $2, $3) RETURNING *`,
        [category_id, description, amount]
    );
};

export const editExpense = (id: string, category_id: number, description: string, amount: number) => {
    return pool.query<Expense>(
        `UPDATE expenses
        SET category_id = $1, description = $2, amount = $3
        WHERE id = $4
        RETURNING *`,
        [category_id, description, amount, id]
    );
};

export const deleteExpense = (id: string) => {
    return pool.query<Expense>(
        `DELETE FROM expenses
        WHERE id = $1
        RETURNING *`,
        [id]
    );
};