import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as incomeApi from "../../api/income";
import type { Income } from "../../api/income";

interface IncomeState {
    items: Income[];
    loading: boolean;
    error: string | null;
}

const initialState: IncomeState = {
    items: [],
    loading: false,
    error: null,
};

export const fetchIncomes = createAsyncThunk(
    "income/fetchIncomes",
    async () => {
        return await incomeApi.getIncomes();
    }
);

export const fetchIncomesByMonth = createAsyncThunk(
    "income/fetchIncomesByMonth",
    async (month: string) => {
        return await incomeApi.getIncomesByMonth(month);
    }
);

export const addIncome = createAsyncThunk(
    "income/addIncome",
    async ({
        categoryId,
        description,
        amount,
    }: {
        categoryId: number;
        description: string;
        amount: number;
    }) => {
        return await incomeApi.createIncome(categoryId, description, amount);
    }
);

export const removeIncome = createAsyncThunk(
    "income/removeIncome",
    async (id: number) => {
        await incomeApi.deleteIncome(id);
        return id;
    }
);

const incomeSlice = createSlice({
    name: "income",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchIncomes.fulfilled, (state, action) => {
                state.items = action.payload;
            })
            .addCase(addIncome.fulfilled, (state, action) => {
                state.items.unshift(action.payload);
            })
            .addCase(removeIncome.fulfilled, (state, action) => {
                state.items = state.items.filter((i) => i.id !== action.payload);
            })
            .addCase(fetchIncomesByMonth.fulfilled, (state, action) => {
                state.items = action.payload;
            });
    },
});

export default incomeSlice.reducer;