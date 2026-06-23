import { Request, Response } from "express";
import {
    getAllExpenses,
    createNewExpense,
    editExpense,
    deleteExpense,
} from "../models/expenses";
import { CreateExpenseBody, EditExpenseBody, IdParam } from "../types/index";

export const getExpenses = async (req: Request, res: Response) => {
    try {
        const result = await getAllExpenses();
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createExpense = async (
    req: Request<{}, {}, CreateExpenseBody>,
    res: Response
) => {
    const { category_id, description, amount } = req.body;
    try {
        const result = await createNewExpense(category_id, description, amount);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const editSavedExpense = async (
    req: Request<IdParam, {}, EditExpenseBody>,
    res: Response
) => {
    const { id } = req.params;
    const { category_id, description, amount } = req.body;
    try {
        const result = await editExpense(id, category_id, description, amount);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const deleteSavedExpense = async (
    req: Request<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteExpense(id);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "aww shucks" });
    }
};