import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import categoriesReducer from "../features/categories/categoriesSlice";
import expensesReducer from "../features/expenses/expensesSlice";
import incomeReducer from "../features/income/incomeSlice";
import budgetReducer from "../features/budget/budgetSlice";
import monthlySettingsReducer from "../features/monthlySettings/monthlySettingsSlice";
import cashExpensesReducer from "../features/cashExpenses/cashExpensesSlice";
import categorizedTransactionsReducer from "../features/categorizedTransactions/categorizedTransactionsSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        categories: categoriesReducer,
        expenses: expensesReducer,
        income: incomeReducer,
        budget: budgetReducer,
        monthlySettings: monthlySettingsReducer,
        cashExpenses: cashExpensesReducer,
        categorizedTransactions: categorizedTransactionsReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;