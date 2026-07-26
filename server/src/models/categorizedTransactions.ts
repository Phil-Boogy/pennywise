import pool from "../db";

export interface CategorizedTransaction {
    id: number;
    user_id: number;
    month: string;
    date: string;
    merchant: string;
    amount: number;
    type: string;
    category_id: number | null;
    category_name: string | null;
    reasoning: string | null;
    source: string | null;
    card_last_four: string | null;
    created_at: string;
}

export interface CategoryTotal {
    category_id: number;
    category_name: string;
    total: number;
}

export const upsertCategorizedTransaction = (
    month: string,
    date: string,
    merchant: string,
    amount: number,
    type: string,
    category_id: number | null,
    category_name: string | null,
    reasoning: string | null,
    source: string | null,
    card_last_four: string | null,
    user_id: number
) => {
    return pool.query<CategorizedTransaction>(
        `INSERT INTO categorized_transactions
            (user_id, month, date, merchant, amount, type, category_id, category_name, reasoning, source, card_last_four)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (user_id, month, date, merchant)
        DO UPDATE SET
            amount = $5,
            type = $6,
            category_id = $7,
            category_name = $8,
            reasoning = $9,
            source = $10,
            card_last_four = $11
        RETURNING *`,
        [user_id, month, date, merchant, amount, type, category_id, category_name, reasoning, source, card_last_four]
    );
};

export const getCategorizedTransactionsByMonth = (month: string, user_id: number) => {
    return pool.query<CategorizedTransaction>(
        `SELECT * FROM categorized_transactions
        WHERE user_id = $1 AND month = $2
        ORDER BY date ASC`,
        [user_id, month]
    );
};

export const getCategoryTotalsByMonth = (month: string, user_id: number) => {
    return pool.query<CategoryTotal>(
        `SELECT
            category_id,
            category_name,
            SUM(amount) as total
        FROM categorized_transactions
        WHERE user_id = $1
            AND month = $2
            AND type = 'debit'
            AND category_id IS NOT NULL
        GROUP BY category_id, category_name
        ORDER BY total DESC`,
        [user_id, month]
    );
};
