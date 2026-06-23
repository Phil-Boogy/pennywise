import pool from "../db";
import { Income } from "../types/index";

export const getAllIncomes = () => {
    return pool.query<Income>(`
        SELECT income.id, income_categories.name AS category, income.description, income.amount, income.created_at
        FROM income
        JOIN income_categories ON income.category_id = income_categories.id
    `);
};

export const createNewIncome = (category_id: number, description: string, amount: number) => {
    return pool.query<Income>(
        `INSERT INTO income (category_id, description, amount) VALUES ($1, $2, $3) RETURNING *`,
        [category_id, description, amount]
    );
};

export const editIncome = (id: string, category_id: number, description: string, amount: number) => {
    return pool.query<Income>(
        `UPDATE income
        SET category_id = $1, description = $2, amount = $3
        WHERE id = $4
        RETURNING *`,
        [category_id, description, amount, id]
    );
};

export const deleteIncome = (id: string) => {
    return pool.query<Income>(
        `DELETE FROM income
        WHERE id = $1
        RETURNING *`,
        [id]
    );
};