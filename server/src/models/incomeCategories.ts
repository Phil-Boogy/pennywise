import pool from "../db";
import { IncomeCategory } from "../types/index";

export const getAllIncomeCategories = (user_id: number) => {
    return pool.query<IncomeCategory>(`
        SELECT id, name
        FROM income_categories
        WHERE user_id = $1
    `, [user_id]);
};

export const createNewIncomeCategory = (categoryName: string, user_id: number) => {
    return pool.query<IncomeCategory>(
        `INSERT INTO income_categories (name, user_id) VALUES ($1, $2) RETURNING *`,
        [categoryName, user_id]
    );
};

export const editIncomeCategory = (id: string, categoryName: string, user_id: number) => {
    return pool.query<IncomeCategory>(
        `UPDATE income_categories
        SET name = $1
        WHERE id = $2 AND user_id = $3
        RETURNING *`,
        [categoryName, id, user_id]
    );
};

export const deleteIncomeCategory = (id: string, user_id: number) => {
    return pool.query<IncomeCategory>(
        `DELETE FROM income_categories
        WHERE id = $1 AND user_id = $2
        RETURNING *`,
        [id, user_id]
    );
};