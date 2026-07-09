import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as expensesApi from "../../api/expenses";
import type { Expense } from "../../api/expenses";

interface ExpensesState {
    items: Expense[];
    loading: boolean;
    error: string | null;
}

const initialState: ExpensesState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchExpensesByMonth = createAsyncThunk(
    "expenses/fetchExpensesByMonth",
    async (month: string) => {
        return await expensesApi.getExpensesByMonth(month);
    }
);

export const addExpense = createAsyncThunk(
    "expenses/addExpense",
    async ({
        categoryId,
        description,
        amount,
    }: {
        categoryId: number;
        description: string;
        amount: number;
    }) => {
        return await expensesApi.createExpense(categoryId, description, amount);
    }
);

export const removeExpense = createAsyncThunk(
    "expenses/removeExpense",
    async (id: number) => {
        await expensesApi.deleteExpense(id);
        return id;
    }
);

const expensesSlice = createSlice({
    name: "expenses",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchExpensesByMonth.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(addExpense.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(removeExpense.fulfilled, (state, action) => {
                state.items = state.items.filter((e) => e.id !== action.payload);
            });
    },
});

export default expensesSlice.reducer;