import pool from "../db";
import { ExpenseCategory } from "../types/index";

export const getAllExpenseCategories = () => {
    return pool.query<ExpenseCategory>(`
    SELECT id, name
    FROM expense_categories
  `);
};

export const createNewExpenseCategory = (categoryName: string) => {
    return pool.query<ExpenseCategory>(
        `INSERT INTO expense_categories (name) VALUES ($1) RETURNING *`,
        [categoryName]
    );
};

export const editExpenseCategory = (id: string, categoryName: string) => {
    return pool.query<ExpenseCategory>(
        `UPDATE expense_categories
     SET name = $1
     WHERE id = $2
     RETURNING *`,
        [categoryName, id]
    );
};

export const deleteExpenseCategory = (id: string) => {
    return pool.query<ExpenseCategory>(
        `DELETE FROM expense_categories
     WHERE id = $1
     RETURNING *`,
        [id]
    );
};