import { Response } from "express";
import {
    getAllIncomeCategories,
    createNewIncomeCategory,
    editIncomeCategory,
    deleteIncomeCategory,
} from "../models/incomeCategories";
import { CreateCategoryBody, EditCategoryBody, IdParam } from "../types/index";
import { AuthedRequest } from "../middleware/auth";

export const getIncomeCategories = async (req: AuthedRequest, res: Response) => {
    try {
        const result = await getAllIncomeCategories(req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Sheeeeeeit" });
    }
};

export const createIncomeCategory = async (
    req: AuthedRequest<{}, {}, CreateCategoryBody>,
    res: Response
) => {
    const { name } = req.body;
    try {
        const result = await createNewIncomeCategory(name, req.userId!);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Ohhhh nooooo!" });
    }
};

export const editSavedIncomeCategory = async (
    req: AuthedRequest<IdParam, {}, EditCategoryBody>,
    res: Response
) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const result = await editIncomeCategory(id, name, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Sheeeeit" });
    }
};

export const deleteSavedIncomeCategory = async (
    req: AuthedRequest<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteIncomeCategory(id, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "aww shucks" });
    }
};