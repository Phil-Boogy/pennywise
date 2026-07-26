import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as aiApi from "../../api/ai";
import type { CategorizeTransactionsResponse } from "../../api/ai";

interface CategorizedTransactionsState {
    categorized: CategorizeTransactionsResponse["categorized"];
    categoriesSummary: CategorizeTransactionsResponse["categories_summary"];
    loading: boolean;
    error: string | null;
}

const initialState: CategorizedTransactionsState = {
    categorized: [],
    categoriesSummary: [],
    loading: false,
    error: null,
};

export const runCategorizeTransactions = createAsyncThunk(
    "categorizedTransactions/runCategorizeTransactions",
    async ({
        transactions,
        month,
    }: {
        transactions: {
            date: string;
            merchant: string;
            amount: number;
            type: "credit" | "debit";
            occurrences: number;
            source: string;
            cardLastFour?: string;
        }[];
        month: string;
    }) => {
        return await aiApi.categorizeTransactions(transactions, month);
    }
);

const categorizedTransactionsSlice = createSlice({
    name: "categorizedTransactions",
    initialState,
    reducers: {
        clearCategorizedTransactions: (state) => {
            state.categorized = [];
            state.categoriesSummary = [];
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(runCategorizeTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(runCategorizeTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.categorized = action.payload.categorized;
                state.categoriesSummary = action.payload.categories_summary;
            })
            .addCase(runCategorizeTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? "Failed to categorize transactions";
            });
    },
});

export const { clearCategorizedTransactions } = categorizedTransactionsSlice.actions;
export default categorizedTransactionsSlice.reducer;
