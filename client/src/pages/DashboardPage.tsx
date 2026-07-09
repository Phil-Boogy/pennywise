import { useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    LinearProgress,
    Divider,
    Alert,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchExpensesByMonth } from "../features/expenses/expensesSlice";
import { fetchBudgetsByMonth } from "../features/budget/budgetSlice";
import { fetchIncomesByMonth } from "../features/income/incomeSlice";
import { fetchMonthlySettings } from "../features/monthlySettings/monthlySettingsSlice";
import { fetchExpenseCategories } from "../features/categories/categoriesSlice";

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

const DashboardPage = () => {
    const dispatch = useAppDispatch();
    const { items: expenses } = useAppSelector((state) => state.expenses);
    const { items: budgets } = useAppSelector((state) => state.budget);
    const { settings } = useAppSelector((state) => state.monthlySettings);
    const { expenseCategories } = useAppSelector((state) => state.categories);

    const currentMonth = getCurrentMonth();

    useEffect(() => {
        dispatch(fetchExpensesByMonth(currentMonth));
        dispatch(fetchBudgetsByMonth(currentMonth));
        dispatch(fetchIncomesByMonth(currentMonth));
        dispatch(fetchMonthlySettings(currentMonth));
        dispatch(fetchExpenseCategories());
    }, [dispatch, currentMonth]);

    const totalIncome = Number(settings?.confirmed_income) || 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    const savingsGoal = Number(settings?.savings_goal) || 0;
    const remaining = totalIncome - totalExpenses - savingsGoal;
    const isOverBudget = totalExpenses > totalBudgeted;

    return (
        <Box sx={{ maxWidth: 700 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Dashboard — {currentMonth.slice(0, 7)}
            </Typography>

            {/* Summary row */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography color="text.secondary">Total Income</Typography>
                    <Typography>₪{totalIncome.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography color="text.secondary">Total Spent</Typography>
                    <Typography color={isOverBudget ? "error.main" : "inherit"}>
                        ₪{totalExpenses.toLocaleString()}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography color="text.secondary">Total Budgeted</Typography>
                    <Typography>₪{totalBudgeted.toLocaleString()}</Typography>
                </Box>
                {savingsGoal > 0 && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography color="text.secondary">Savings Goal</Typography>
                        <Typography>₪{savingsGoal.toLocaleString()}</Typography>
                    </Box>
                )}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography sx={{ fontWeight: "bold" }}>Remaining</Typography>
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            color: remaining < 0 ? "error.main" : "success.main",
                        }}
                    >
                        ₪{remaining.toLocaleString()}
                    </Typography>
                </Box>
            </Paper>

            {isOverBudget && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    You've exceeded your budget by ₪{(totalExpenses - totalBudgeted).toLocaleString()}.
                </Alert>
            )}

            {/* Per category breakdown */}
            <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Budget vs Actual
            </Typography>

            <Paper sx={{ p: 2 }}>
                {expenseCategories.length === 0 && (
                    <Typography color="text.secondary">
                        No categories yet — add some in the Categories page.
                    </Typography>
                )}
                {expenseCategories.map((cat) => {
                    const budget = budgets.find((b) => b.category_id === cat.id);
                    const spent = expenses
                        .filter((e) => e.category === cat.name)
                        .reduce((sum, e) => sum + Number(e.amount), 0);
                    const budgetAmount = Number(budget?.amount) || 0;
                    const progress = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
                    const isOver = spent > budgetAmount && budgetAmount > 0;

                    return (
                        <Box key={cat.id} sx={{ mb: 2 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                <Typography variant="body2">{cat.name}</Typography>
                                <Typography variant="body2" color={isOver ? "error.main" : "text.secondary"}>
                                    ₪{spent.toLocaleString()} / ₪{budgetAmount.toLocaleString()}
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={Math.min(progress, 100)}
                                color={isOver ? "error" : progress > 80 ? "warning" : "primary"}
                                sx={{ height: 8, borderRadius: 1 }}
                            />
                        </Box>
                    );
                })}
            </Paper>
        </Box>
    );
};

export default DashboardPage;