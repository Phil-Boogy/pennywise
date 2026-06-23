import { Request, Response } from "express";
import {
    getAllIncomeCategories,
    createNewIncomeCategory,
    editIncomeCategory,
    deleteIncomeCategory,
} from "../models/incomeCategories";
import { CreateCategoryBody, EditCategoryBody, IdParam } from "../types/index";

export const getIncomeCategories = async (req: Request, res: Response) => {
    try {
        const result = await getAllIncomeCategories();
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Sheeeeeeit" });
    }
};

export const createIncomeCategory = async (
    req: Request<{}, {}, CreateCategoryBody>,
    res: Response
) => {
    const { name } = req.body;
    try {
        const result = await createNewIncomeCategory(name);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Ohhhh nooooo!" });
    }
};

export const editSavedIncomeCategory = async (
    req: Request<IdParam, {}, EditCategoryBody>,
    res: Response
) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const result = await editIncomeCategory(id, name);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Sheeeeit" });
    }
};

export const deleteSavedIncomeCategory = async (
    req: Request<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteIncomeCategory(id);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "aww shucks" });
    }
};