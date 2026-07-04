import { Response } from "express";
import {
    getAllIncomes,
    createNewIncome,
    editIncome,
    deleteIncome,
} from "../models/income";
import { CreateIncomeBody, EditIncomeBody, IdParam } from "../types/index";
import { AuthedRequest } from "../middleware/auth";

export const getIncomes = async (req: AuthedRequest, res: Response) => {
    try {
        const result = await getAllIncomes(req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createIncome = async (
    req: AuthedRequest<{}, {}, CreateIncomeBody>,
    res: Response
) => {
    const { category_id, description, amount } = req.body;
    try {
        const result = await createNewIncome(category_id, description, amount, req.userId!);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "WTF?!?!?!" });
    }
};

export const editSavedIncome = async (
    req: AuthedRequest<IdParam, {}, EditIncomeBody>,
    res: Response
) => {
    const { id } = req.params;
    const { category_id, description, amount } = req.body;
    try {
        const result = await editIncome(id, category_id, description, amount, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const deleteSavedIncome = async (
    req: AuthedRequest<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteIncome(id, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "aww shucks" });
    }
};