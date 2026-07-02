import { Request, Response } from "express";
import {
    getMonthlySettings,
    upsertMonthlySettings,
} from "../models/monthlySettings";

export const getSettings = async (
    req: Request<{ month: string }>,
    res: Response
) => {
    const { month } = req.params;
    try {
        const result = await getMonthlySettings(month);
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
    req: Request<{ month: string }, {}, { savings_goal: number }>,
    res: Response
) => {
    const { month } = req.params;
    const { savings_goal } = req.body;
    try {
        const result = await upsertMonthlySettings(month, savings_goal);
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};