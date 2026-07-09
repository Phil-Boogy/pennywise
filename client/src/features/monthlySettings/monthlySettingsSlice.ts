import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as settingsApi from "../../api/monthlySettings";
import type { MonthlySettings } from "../../api/monthlySettings";

interface MonthlySettingsState {
    settings: MonthlySettings | null;
    loading: boolean;
    error: string | null;
}

const initialState: MonthlySettingsState = {
    settings: null,
    loading: false,
    error: null,
};

export const fetchMonthlySettings = createAsyncThunk(
    "monthlySettings/fetch",
    async (month: string) => {
        return await settingsApi.getMonthlySettings(month);
    }
);

export const updateMonthlySettings = createAsyncThunk(
    "monthlySettings/update",
    async ({ month, savings_goal, confirmed_income }: {
        month: string;
        savings_goal: number;
        confirmed_income: number;
    }) => {
        return await settingsApi.saveMonthlySettings(month, savings_goal, confirmed_income);
    }
);

const monthlySettingsSlice = createSlice({
    name: "monthlySettings",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMonthlySettings.fulfilled, (state, action) => {
                state.settings = action.payload;
            })
            .addCase(updateMonthlySettings.fulfilled, (state, action) => {
                state.settings = action.payload;
            });
    },
});

export default monthlySettingsSlice.reducer;