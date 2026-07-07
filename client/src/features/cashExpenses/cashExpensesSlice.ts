import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as cashExpensesApi from "../../api/cashExpenses";
import type { CashExpense } from "../../api/cashExpenses";

interface CashExpensesState {
    items: CashExpense[];
    loading: boolean;
    error: string | null;
}

const initialState: CashExpensesState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchCashExpenses = createAsyncThunk(
    "cashExpenses/fetch",
    async () => await cashExpensesApi.getCashExpenses()
);

export const addCashExpense = createAsyncThunk(
    "cashExpenses/add",
    async ({ description, amount }: { description: string; amount: number }) =>
        await cashExpensesApi.createCashExpense(description, amount)
);

export const updateCashExpenseItem = createAsyncThunk(
    "cashExpenses/update",
    async ({ id, description, amount }: { id: number; description: string; amount: number }) =>
        await cashExpensesApi.updateCashExpense(id, description, amount)
);

export const removeCashExpense = createAsyncThunk(
    "cashExpenses/remove",
    async (id: number) => {
        await cashExpensesApi.deleteCashExpense(id);
        return id;
    }
);

const cashExpensesSlice = createSlice({
    name: "cashExpenses",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCashExpenses.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(addCashExpense.fulfilled, (state, action) => {
                state.items.push(action.payload);
            })
            .addCase(updateCashExpenseItem.fulfilled, (state, action) => {
                const index = state.items.findIndex((e) => e.id === action.payload.id);
                if (index !== -1) state.items[index] = action.payload;
            })
            .addCase(removeCashExpense.fulfilled, (state, action) => {
                state.items = state.items.filter((e) => e.id !== action.payload);
            });
    },
});

export default cashExpensesSlice.reducer;