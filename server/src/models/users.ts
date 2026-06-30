import pool from "../db";

export interface User {
    id: number;
    email: string;
    password_hash: string;
    created_at: string;
}

export const findUserByEmail = (email: string) => {
    return pool.query<User>(
        `SELECT * FROM users WHERE email = $1`,
        [email]
    );
};

export const findUserById = (id: number) => {
    return pool.query<User>(
        `SELECT * FROM users WHERE id = $1`,
        [id]
    );
};

export const createUser = (email: string, password_hash: string) => {
    return pool.query<User>(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
        [email, password_hash]
    );
};