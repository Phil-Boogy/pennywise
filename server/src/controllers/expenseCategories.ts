import { Response } from "express";
import {
    getAllExpenseCategories,
    createNewExpenseCategory,
    editExpenseCategory,
    deleteExpenseCategory,
} from "../models/expenseCategories";
import { CreateCategoryBody, EditCategoryBody, IdParam } from "../types/index";
import { AuthedRequest } from "../middleware/auth";

export const getExpenseCategories = async (req: AuthedRequest, res: Response) => {
    try {
        const result = await getAllExpenseCategories(req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createExpenseCategory = async (
    req: AuthedRequest<{}, {}, CreateCategoryBody>,
    res: Response
) => {
    const { name } = req.body;
    try {
        const result = await createNewExpenseCategory(name, req.userId!);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const editSavedExpenseCategory = async (
    req: AuthedRequest<IdParam, {}, EditCategoryBody>,
    res: Response
) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const result = await editExpenseCategory(id, name, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "somethin' ain't right" });
    }
};

export const deleteSavedExpenseCategory = async (
    req: AuthedRequest<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteExpenseCategory(id, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "aww shucks" });
    }
};