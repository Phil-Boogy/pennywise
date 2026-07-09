import pool from "../db";
import { ExpenseCategory } from "../types/index";

export const getAllExpenseCategories = (user_id: number) => {
    return pool.query<ExpenseCategory>(`
        SELECT id, name
        FROM expense_categories
        WHERE user_id = $1
        ORDER BY id ASC
    `, [user_id]);
};

export const createNewExpenseCategory = (categoryName: string, user_id: number) => {
    return pool.query<ExpenseCategory>(
        `INSERT INTO expense_categories (name, user_id) VALUES ($1, $2) RETURNING *`,
        [categoryName, user_id]
    );
};

export const editExpenseCategory = (id: string, categoryName: string, user_id: number) => {
    return pool.query<ExpenseCategory>(
        `UPDATE expense_categories
        SET name = $1
        WHERE id = $2 AND user_id = $3
        RETURNING *`,
        [categoryName, id, user_id]
    );
};

export const deleteExpenseCategory = (id: string, user_id: number) => {
    return pool.query<ExpenseCategory>(
        `DELETE FROM expense_categories
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
        [id, user_id]
    );
};