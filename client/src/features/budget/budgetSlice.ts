import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as budgetsApi from "../../api/budgets";
import type { Budget, CreateBudgetItem, EditBudgetItem } from "../../api/budgets";

interface BudgetState {
    items: Budget[];
    loading: boolean;
    error: string | null;
}

const initialState: BudgetState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchBudgets = createAsyncThunk(
    "budget/fetchBudgets",
    async () => {
        return await budgetsApi.getBudgets();
    }
);

export const fetchBudgetsByMonth = createAsyncThunk(
    "budget/fetchBudgetsByMonth",
    async (month: string) => {
        return await budgetsApi.getBudgetsByMonth(month);
    }
);

export const addBudgetItem = createAsyncThunk(
    "budget/addBudgetItem",
    async (item: CreateBudgetItem) => {
        return await budgetsApi.createBudget(item);
    }
);

export const updateBudgetItem = createAsyncThunk(
    "budget/updateBudgetItem",
    async ({ id, item }: { id: number; item: EditBudgetItem }) => {
        return await budgetsApi.editBudget(id, item);
    }
);

export const removeBudgetItem = createAsyncThunk(
    "budget/removeBudgetItem",
    async (id: number) => {
        await budgetsApi.deleteBudget(id);
        return id;
    }
);

const budgetSlice = createSlice({
    name: "budget",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBudgets.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(fetchBudgetsByMonth.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(addBudgetItem.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            .addCase(updateBudgetItem.fulfilled, (state, action) => {
                const index = state.items.findIndex((b) => b.id === action.payload.id);
                if (index !== -1) {
                    state.items[index] = action.payload;
                }
            })
            .addCase(removeBudgetItem.fulfilled, (state, action) => {
                state.items = state.items.filter((b) => b.id !== action.payload);
            });
    },
});

export default budgetSlice.reducer;