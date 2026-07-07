import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import {
    getAllCashExpenses,
    createCashExpense,
    updateCashExpense,
    deleteCashExpense,
} from "../models/cashExpenses";

export const getCashExpenses = async (req: AuthedRequest, res: Response) => {
    try {
        const result = await getAllCashExpenses(req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createNewCashExpense = async (
    req: AuthedRequest<{}, {}, { description: string; amount: number }>,
    res: Response
) => {
    const { description, amount } = req.body;
    try {
        const result = await createCashExpense(description, amount, req.userId!);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const updateSavedCashExpense = async (
    req: AuthedRequest<{ id: string }, {}, { description: string; amount: number }>,
    res: Response
) => {
    const { id } = req.params;
    const { description, amount } = req.body;
    try {
        const result = await updateCashExpense(id, description, amount, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const deleteSavedCashExpense = async (
    req: AuthedRequest<{ id: string }>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteCashExpense(id, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "something went wrong" });
    }
};