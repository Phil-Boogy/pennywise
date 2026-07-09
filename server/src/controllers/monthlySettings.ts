import { Response } from "express";
import {
    getMonthlySettings,
    upsertMonthlySettings,
} from "../models/monthlySettings";
import { AuthedRequest } from "../middleware/auth";

export const getSettings = async (
    req: AuthedRequest<{ month: string }>,
    res: Response
) => {
    const { month } = req.params;
    try {
        const result = await getMonthlySettings(month, req.userId!);
        if (result.rows.length === 0) {
            res.json({ month, savings_goal: 0 });
            return;
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const saveSettings = async (
    req: AuthedRequest<{ month: string }, {}, { savings_goal: number; confirmed_income: number }>,
    res: Response
) => {
    const { month } = req.params;
    const { savings_goal, confirmed_income } = req.body;
    try {
        const result = await upsertMonthlySettings(month, savings_goal, confirmed_income ?? 0, req.userId!);
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};