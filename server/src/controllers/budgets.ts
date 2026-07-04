import { Response } from "express";
import {
    getAllBudgets,
    createNewBudget,
    editBudget,
    deleteBudget,
    getBudgetsByMonth as getBudgetsByMonthModel,
} from "../models/budgets";
import { CreateBudgetBody, EditBudgetBody, IdParam } from "../types/index";
import { AuthedRequest } from "../middleware/auth";

export const getBudgets = async (req: AuthedRequest, res: Response) => {
    try {
        const result = await getAllBudgets(req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};

export const getBudgetsByMonth = async (
    req: AuthedRequest<{ month: string }>,
    res: Response
) => {
    const { month } = req.params;
    try {
        const result = await getBudgetsByMonthModel(month, req.userId!);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
};

export const createBudget = async (
    req: AuthedRequest<{}, {}, CreateBudgetBody>,
    res: Response
) => {
    const { category_id, amount, month } = req.body;
    try {
        const result = await createNewBudget(category_id, amount, month, req.userId!);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};

export const editSavedBudget = async (
    req: AuthedRequest<IdParam, {}, EditBudgetBody>,
    res: Response
) => {
    const { id } = req.params;
    const { category_id, amount, month } = req.body;
    try {
        const result = await editBudget(id, category_id, amount, month, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};

export const deleteSavedBudget = async (
    req: AuthedRequest<IdParam>,
    res: Response
) => {
    const { id } = req.params;
    try {
        const result = await deleteBudget(id, req.userId!);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Awwww Shoot" });
    }
};