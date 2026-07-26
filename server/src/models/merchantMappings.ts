import pool from "../db";

export interface MerchantMapping {
    id: number;
    user_id: number;
    merchant: string;
    category_id: number | null;
    category_name: string;
}

export const getMerchantMappingsByNames = (merchants: string[], user_id: number) => {
    return pool.query<MerchantMapping>(
        `SELECT * FROM merchant_mappings WHERE merchant = ANY($1::text[]) AND user_id = $2`,
        [merchants, user_id]
    );
};

export const upsertMerchantMapping = (
    merchant: string,
    category_id: number | null,
    category_name: string,
    user_id: number
) => {
    return pool.query<MerchantMapping>(
        `INSERT INTO merchant_mappings (merchant, category_id, category_name, user_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (merchant, user_id)
        DO UPDATE SET category_id = $2, category_name = $3
        RETURNING *`,
        [merchant, category_id, category_name, user_id]
    );
};
