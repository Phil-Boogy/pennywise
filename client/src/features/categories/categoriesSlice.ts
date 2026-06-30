import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as categoriesApi from "../../api/categories";
import type { Category } from "../../api/categories";

interface CategoriesState {
    expenseCategories: Category[];
    incomeCategories: Category[];
    loading: boolean;
    error: string | null;
}

const initialState: CategoriesState = {
    expenseCategories: [],
    incomeCategories: [],
    loading: false,
    error: null,
};

export const fetchExpenseCategories = createAsyncThunk(
    "categories/fetchExpenseCategories",
    async () => {
        return await categoriesApi.getExpenseCategories();
    }
);

export const addExpenseCategory = createAsyncThunk(
    "categories/addExpenseCategory",
    async (name: string) => {
        return await categoriesApi.createExpenseCategory(name);
    }
);

export const removeExpenseCategory = createAsyncThunk(
    "categories/removeExpenseCategory",
    async (id: number) => {
        await categoriesApi.deleteExpenseCategory(id);
        return id;
    }
);

export const fetchIncomeCategories = createAsyncThunk(
    "categories/fetchIncomeCategories",
    async () => {
        return await categoriesApi.getIncomeCategories();
    }
);

export const addIncomeCategory = createAsyncThunk(
    "categories/addIncomeCategory",
    async (name: string) => {
        return await categoriesApi.createIncomeCategory(name);
    }
);

export const removeIncomeCategory = createAsyncThunk(
    "categories/removeIncomeCategory",
    async (id: number) => {
        await categoriesApi.deleteIncomeCategory(id);
        return id;
    }
);

const categoriesSlice = createSlice({
    name: "categories",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchExpenseCategories.fulfilled, (state, action) => {
                state.expenseCategories = action.payload;
            })
            .addCase(addExpenseCategory.fulfilled, (state, action) => {
                state.expenseCategories.push(action.payload);
            })
            .addCase(removeExpenseCategory.fulfilled, (state, action) => {
                state.expenseCategories = state.expenseCategories.filter(
                    (c) => c.id !== action.payload
                );
            })
            .addCase(fetchIncomeCategories.fulfilled, (state, action) => {
                state.incomeCategories = action.payload;
            })
            .addCase(addIncomeCategory.fulfilled, (state, action) => {
                state.incomeCategories.push(action.payload);
            })
            .addCase(removeIncomeCategory.fulfilled, (state, action) => {
                state.incomeCategories = state.incomeCategories.filter(
                    (c) => c.id !== action.payload
                );
            });
    },
});

export default categoriesSlice.reducer;