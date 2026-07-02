import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    Divider,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchExpenseCategories } from "../features/categories/categoriesSlice";
import { fetchIncomes } from "../features/income/incomeSlice";
import {
    fetchBudgetsByMonth,
    addBudgetItem,
    updateBudgetItem,
} from "../features/budget/budgetSlice";

import {
    fetchMonthlySettings,
    updateMonthlySettings,
} from "../features/monthlySettings/monthlySettingsSlice";

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

const BudgetPage = () => {
    const dispatch = useAppDispatch();
    const { expenseCategories } = useAppSelector((state) => state.categories);
    const { items: incomes } = useAppSelector((state) => state.income);
    const { items: budgets } = useAppSelector((state) => state.budget);
    const { settings } = useAppSelector((state) => state.monthlySettings);

    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [savingsGoal, setSavingsGoal] = useState("");
    const [saved, setSaved] = useState(false);

    const currentMonth = getCurrentMonth();

    useEffect(() => {
        dispatch(fetchExpenseCategories());
        dispatch(fetchIncomes());
        dispatch(fetchMonthlySettings(currentMonth));
        dispatch(fetchBudgetsByMonth(currentMonth));
    }, [dispatch, currentMonth]);

    // pre-populate amounts from existing budgets
    useEffect(() => {
        if (budgets.length > 0) {
            const existingAmounts: Record<number, string> = {};
            budgets.forEach((b) => {
                existingAmounts[b.category_id] = String(Number(b.amount));
            });
            setAmounts(existingAmounts);
        }

        if (settings?.savings_goal) {
            setSavingsGoal(String(Number(settings.savings_goal)));
        }
    }, [budgets, settings]);

    const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalBudgeted = Object.values(amounts).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0
    );
    const savings = Number(savingsGoal) || 0;
    const remaining = totalIncome - totalBudgeted - savings;
    const isOverBudget = remaining < 0;

    const handleAmountChange = (categoryId: number, value: string) => {
        setAmounts((prev) => ({ ...prev, [categoryId]: value }));
    };

    const handleSave = async () => {
        const month = currentMonth;

        // save savings goal
        await dispatch(updateMonthlySettings({
            month,
            savings_goal: savings,
        }));

        // save category budgets
        const promises = expenseCategories
            .filter((cat) => amounts[cat.id] && Number(amounts[cat.id]) > 0)
            .map((cat) => {
                const existingBudget = budgets.find((b) => b.category_id === cat.id);
                if (existingBudget) {
                    return dispatch(updateBudgetItem({
                        id: existingBudget.id,
                        item: { category_id: cat.id, amount: Number(amounts[cat.id]), month },
                    }));
                } else {
                    return dispatch(addBudgetItem({
                        category_id: cat.id,
                        amount: Number(amounts[cat.id]),
                        month,
                    }));
                }
            });

        await Promise.all(promises);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Set Monthly Budget — {currentMonth.slice(0, 7)}
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                    Savings Goal (optional)
                </Typography>
                <TextField
                    size="small"
                    label="How much do you want to save this month?"
                    type="number"
                    fullWidth
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(e.target.value)}
                />
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary" }}>
                    Budget per category
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {expenseCategories.map((cat) => (
                        <Box
                            key={cat.id}
                            sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                            <Typography sx={{ minWidth: 160 }}>{cat.name}</Typography>
                            <TextField
                                size="small"
                                type="number"
                                placeholder="₪0"
                                value={amounts[cat.id] || ""}
                                onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                                sx={{ flexGrow: 1 }}
                            />
                        </Box>
                    ))}
                </Box>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Total Income</Typography>
                        <Typography>₪{totalIncome.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Total Budgeted</Typography>
                        <Typography>₪{totalBudgeted.toLocaleString()}</Typography>
                    </Box>
                    {savings > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Savings Goal</Typography>
                            <Typography>₪{savings.toLocaleString()}</Typography>
                        </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: "bold" }}>Remaining</Typography>
                        <Typography
                            sx={{
                                fontWeight: "bold",
                                color: isOverBudget ? "error.main" : "success.main",
                            }}
                        >
                            ₪{remaining.toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {isOverBudget && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Your budget exceeds your income by ₪{Math.abs(remaining).toLocaleString()}.
                    Consider reducing some categories or your savings goal.
                </Alert>
            )}

            {saved && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Budget saved successfully!
                </Alert>
            )}

            <Button
                variant="contained"
                fullWidth
                onClick={handleSave}
                disabled={expenseCategories.length === 0}
            >
                Save Budget
            </Button>
        </Box>
    );
};

export default BudgetPage;