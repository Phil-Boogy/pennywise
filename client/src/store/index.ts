import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import categoriesReducer from "../features/categories/categoriesSlice";
import expensesReducer from "../features/expenses/expensesSlice";
import incomeReducer from "../features/income/incomeSlice";
import budgetReducer from "../features/budget/budgetSlice";
import monthlySettingsReducer from "../features/monthlySettings/monthlySettingsSlice";



export const store = configureStore({
    reducer: {
        auth: authReducer,
        categories: categoriesReducer,
        expenses: expensesReducer,
        income: incomeReducer,
        budget: budgetReducer,
        monthlySettings: monthlySettingsReducer,

    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;