import { Request, Response } from "express";
import {
    getAllBudgets,
    createNewBudget,
    editBudget,
    deleteBudget,
    getBudgetsByMonth as getBudgetsByMonthModel,
} from "../models/budgets";
import { CreateBudgetBody, EditBudgetBody, IdParam } from "../types/index";

export const getBudgets = async (req: Request, res: Response) => {
    try {
        const result = await getAllBudgets();
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};

export const getBudgetsByMonth = async (req: Request<{ month: string }>, res: Response) => {
    const { month } = req.params;
    try {
        const result = await getBudgetsByMonthModel(month);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createBudget = async (
    req: Request<{}, {}, CreateBudgetBody>,
    res: Response
) => {
    const { category_id, amount, month } = req.body;
    try {
        const result = await createNewBudget(category_id, amount, month);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};

export const editSavedBudget = async (
    req: Request<IdParam, {}, EditBudgetBody>,
    res: Response
) => {
    const { id } = req.params;
    const { category_id, amount, month } = req.body;
    try {
        const result = await editBudget(id, category_id, amount, month);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};

export const deleteSavedBudget = async (
    req: Request<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteBudget(id);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};