import { Response } from "express";
import {
    getAllExpenses,
    createNewExpense,
    editExpense,
    deleteExpense,
} from "../models/expenses";
import { CreateExpenseBody, EditExpenseBody, IdParam } from "../types/index";
import { AuthedRequest } from "../middleware/auth";

export const getExpenses = async (req: AuthedRequest, res: Response) => {
    try {
        const result = await getAllExpenses(req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createExpense = async (
    req: AuthedRequest<{}, {}, CreateExpenseBody>,
    res: Response
) => {
    const { category_id, description, amount } = req.body;
    try {
        const result = await createNewExpense(category_id, description, amount, req.userId!);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const editSavedExpense = async (
    req: AuthedRequest<IdParam, {}, EditExpenseBody>,
    res: Response
) => {
    const { id } = req.params;
    const { category_id, description, amount } = req.body;
    try {
        const result = await editExpense(id, category_id, description, amount, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const deleteSavedExpense = async (
    req: AuthedRequest<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteExpense(id, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "aww shucks" });
    }
};