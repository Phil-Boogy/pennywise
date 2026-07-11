import { Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "../constants/defaultCategories";
import { createNewExpenseCategory } from "../models/expenseCategories";
import { createNewIncomeCategory } from "../models/incomeCategories";
import { findUserByEmail, createUser, findUserById } from "../models/users";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

const generateAccessToken = (userId: number): string => {
    return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userId: number): string => {
    return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const register = async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response
) => {
    const { email, password } = req.body;
    try {
        const existing = await findUserByEmail(email);
        if (existing.rows.length > 0) {
            res.status(409).json({ message: "Email already in use" });
            return;
        }
        const password_hash = await argon2.hash(password);
        const result = await createUser(email, password_hash);
        const user = result.rows[0];
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        // seed default categories for new user
        await Promise.all([
            ...DEFAULT_EXPENSE_CATEGORIES.map((name) =>
                createNewExpenseCategory(name, user.id)
            ),
            ...DEFAULT_INCOME_CATEGORIES.map((name) =>
                createNewIncomeCategory(name, user.id)
            ),
        ]);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({ accessToken, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const login = async (
    req: Request<{}, {}, { email: string; password: string }>,
    res: Response
) => {
    const { email, password } = req.body;
    try {
        const result = await findUserByEmail(email);
        if (result.rows.length === 0) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const user = result.rows[0];
        const isValid = await argon2.verify(user.password_hash, password);
        if (!isValid) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({ accessToken, user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const refresh = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        res.status(401).json({ message: "No refresh token" });
        return;
    }
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { userId: number };
        const accessToken = generateAccessToken(decoded.userId);
        const userResult = await findUserById(decoded.userId);
        if (userResult.rows.length === 0) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const user = userResult.rows[0];
        res.json({ accessToken, user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
    });
    res.json({ message: "Logged out successfully" });
};