import pool from "../db";
import { IncomeCategory } from "../types/index";

export const getAllIncomeCategories = () => {
    return pool.query<IncomeCategory>(`
        SELECT id, name
        FROM income_categories
    `);
};

export const createNewIncomeCategory = (categoryName: string) => {
    return pool.query<IncomeCategory>(
        `INSERT INTO income_categories (name) VALUES ($1) RETURNING *`,
        [categoryName]
    );
};

export const editIncomeCategory = (id: string, categoryName: string) => {
    return pool.query<IncomeCategory>(
        `UPDATE income_categories
        SET name = $1
        WHERE id = $2
        RETURNING *`,
        [categoryName, id]
    );
};

export const deleteIncomeCategory = (id: string) => {
    return pool.query<IncomeCategory>(
        `DELETE FROM income_categories
        WHERE id = $1
        RETURNING *`,
        [id]
    );
};