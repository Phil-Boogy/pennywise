import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    Alert,
    Divider,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Chip,
    Checkbox,
    CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchExpenseCategories } from "../features/categories/categoriesSlice";
import { addBudgetItem, updateBudgetItem, fetchBudgetsByMonth } from "../features/budget/budgetSlice";
import { fetchMonthlySettings, updateMonthlySettings } from "../features/monthlySettings/monthlySettingsSlice";
import { fetchCashExpenses, addCashExpense, removeCashExpense } from "../features/cashExpenses/cashExpensesSlice";
import { parseMizrahiCSV, parseCalCSV, parseIsracardCSV, enrichWithOccurrences } from "../utils/csvParsers";
import type { ParsedTransaction } from "../utils/csvParsers";
import { generateBudget } from "../api/ai";
import type { UnifiedBudgetResponse } from "../api/ai";

type BankFormat = "mizrahi" | "cal" | "isracard";

const BANK_OPTIONS: { value: BankFormat; label: string }[] = [
    { value: "mizrahi", label: "מזרחי טפחות" },
    { value: "cal", label: "כאל" },
    { value: "isracard", label: "ישראכרט" },
];

const parsers: Record<BankFormat, (csv: string) => ParsedTransaction[]> = {
    mizrahi: parseMizrahiCSV,
    cal: parseCalCSV,
    isracard: parseIsracardCSV,
};

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

const BudgetPage = () => {
    const dispatch = useAppDispatch();
    const { expenseCategories } = useAppSelector((state) => state.categories);
    const { items: budgets } = useAppSelector((state) => state.budget);
    const { settings } = useAppSelector((state) => state.monthlySettings);
    const { items: cashExpenses } = useAppSelector((state) => state.cashExpenses);

    const currentMonth = getCurrentMonth();

    // CSV state
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; format: BankFormat; count: number }[]>([]);
    const [allTransactions, setAllTransactions] = useState<ParsedTransaction[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<BankFormat>("mizrahi");

    // Budget state
    const [savingsGoal, setSavingsGoal] = useState("");
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [lockedCategories, setLockedCategories] = useState<Set<number>>(new Set());
    const [confirmedIncome, setConfirmedIncome] = useState("");
    const [incomeSources, setIncomeSources] = useState<UnifiedBudgetResponse["income_sources"]>([]);
    const [excludedSources, setExcludedSources] = useState<Set<number>>(new Set());
    const [aiSummary, setAiSummary] = useState("");

    // Cash expense form
    const [newCashDesc, setNewCashDesc] = useState("");
    const [newCashAmount, setNewCashAmount] = useState("");

    // UI state
    const [aiLoading, setAiLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        dispatch(fetchExpenseCategories());
        dispatch(fetchBudgetsByMonth(currentMonth));
        dispatch(fetchMonthlySettings(currentMonth));
        dispatch(fetchCashExpenses());
    }, [dispatch, currentMonth]);

    // pre-populate from DB
    useEffect(() => {
        if (budgets.length > 0 && Object.keys(amounts).length === 0) {
            const existing: Record<number, string> = {};
            budgets.forEach((b) => {
                existing[b.category_id] = String(Number(b.amount));
            });
            setAmounts(existing);
        }
    }, [budgets]);

    useEffect(() => {
        if (settings?.savings_goal) {
            setSavingsGoal(String(Number(settings.savings_goal)));
        }
    }, [settings]);

    // derived values
    const totalCashExpenses = cashExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalBudgeted = Object.values(amounts).reduce((sum, val) => sum + (Number(val) || 0), 0);
    const savings = Number(savingsGoal) || 0;
    const income = Number(confirmedIncome) || 0;
    const remaining = income - totalBudgeted - savings - totalCashExpenses;
    const isOverBudget = remaining < 0;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target?.result as string;
                const parser = parsers[selectedFormat];
                const parsed = parser(csvText);
                if (parsed.length === 0) {
                    setError("No transactions found. Check the bank format selection.");
                    return;
                }
                const enriched = enrichWithOccurrences(parsed);
                setAllTransactions((prev) => [...prev, ...enriched]);
                setUploadedFiles((prev) => [
                    ...prev,
                    { name: file.name, format: selectedFormat, count: enriched.length },
                ]);
                setError(null);
            } catch {
                setError("Failed to parse CSV. Please check the file and try again.");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleGenerateBudget = async () => {
        if (allTransactions.length === 0) {
            setError("Please upload at least one CSV file before generating a budget.");
            return;
        }
        setAiLoading(true);
        setError(null);
        try {
            const result = await generateBudget(
                allTransactions.map((t) => ({
                    date: t.date,
                    merchant: t.merchant,
                    amount: t.amount,
                    type: t.type,
                    occurrences: t.occurrences ?? 1,
                })),
                savings
            );

            setIncomeSources(result.income_sources);
            setConfirmedIncome(String(result.suggested_total_income));
            setAiSummary(result.summary);

            const suggested: Record<number, string> = {};
            result.budget_suggestions.forEach((s) => {
                if (!lockedCategories.has(s.category_id)) {
                    suggested[s.category_id] = String(s.suggested_amount);
                }
            });
            setAmounts((prev) => ({ ...prev, ...suggested }));
        } catch {
            setError("AI budget generation failed. Please try again.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleToggleExclude = (index: number, amount: number) => {
        const next = new Set(excludedSources);
        if (next.has(index)) {
            next.delete(index);
            setConfirmedIncome((prev) => String(Number(prev) + amount));
        } else {
            next.add(index);
            setConfirmedIncome((prev) => String(Math.max(0, Number(prev) - amount)));
        }
        setExcludedSources(next);
    };

    const handleToggleLock = (categoryId: number) => {
        const next = new Set(lockedCategories);
        if (next.has(categoryId)) {
            next.delete(categoryId);
        } else {
            next.add(categoryId);
        }
        setLockedCategories(next);
    };

    const handleAmountChange = (categoryId: number, value: string) => {
        setAmounts((prev) => ({ ...prev, [categoryId]: value }));
    };

    const handleAddCashExpense = () => {
        if (!newCashDesc.trim() || !newCashAmount) return;
        dispatch(addCashExpense({
            description: newCashDesc.trim(),
            amount: Number(newCashAmount),
        }));
        setNewCashDesc("");
        setNewCashAmount("");
    };

    const handleSave = async () => {
        const month = currentMonth;

        await dispatch(updateMonthlySettings({ month, savings_goal: savings }));

        const promises = expenseCategories
            .filter((cat) => amounts[cat.id] && Number(amounts[cat.id]) > 0)
            .map((cat) => {
                const existing = budgets.find((b) => b.category_id === cat.id);
                if (existing) {
                    return dispatch(updateBudgetItem({
                        id: existing.id,
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
        <Box sx={{ maxWidth: 700 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Budget — {currentMonth.slice(0, 7)}
            </Typography>

            {/* CSV Upload */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                    Upload Bank Statements
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    <TextField
                        select
                        size="small"
                        label="Bank / Card"
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as BankFormat)}
                        sx={{ minWidth: 160 }}
                    >
                        {BANK_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadFileIcon />}
                        size="small"
                    >
                        Add CSV
                        <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                    </Button>
                </Box>

                {uploadedFiles.length > 0 && (
                    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {uploadedFiles.map((f, i) => (
                            <Chip
                                key={i}
                                label={`${f.name} (${f.count})`}
                                size="small"
                                onDelete={() => {
                                    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
                                }}
                            />
                        ))}
                        <Chip
                            label={`${allTransactions.length} total transactions`}
                            color="primary"
                            size="small"
                            variant="outlined"
                        />
                    </Box>
                )}
            </Paper>

            {/* Savings Goal */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                    Savings Goal
                </Typography>
                <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="₪0"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(e.target.value)}
                />
            </Paper>

            {/* Known Cash Expenses */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                    Known Cash Expenses
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Description (e.g. House cleaner)"
                        value={newCashDesc}
                        onChange={(e) => setNewCashDesc(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />
                    <TextField
                        size="small"
                        type="number"
                        placeholder="₪"
                        value={newCashAmount}
                        onChange={(e) => setNewCashAmount(e.target.value)}
                        sx={{ width: 100 }}
                    />
                    <Button variant="outlined" size="small" onClick={handleAddCashExpense}>
                        Add
                    </Button>
                </Box>
                {cashExpenses.length > 0 && (
                    <List dense>
                        {cashExpenses.map((e) => (
                            <ListItem
                                key={e.id}
                                secondaryAction={
                                    <IconButton size="small" onClick={() => dispatch(removeCashExpense(e.id))}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemText
                                    primary={e.description}
                                    secondary={`₪${Number(e.amount).toLocaleString()}/month`}
                                />
                            </ListItem>
                        ))}
                        <Divider />
                        <ListItem>
                            <ListItemText
                                primary="Total cash expenses"
                                secondary={`₪${totalCashExpenses.toLocaleString()}/month`}
                            />
                        </ListItem>
                    </List>
                )}
            </Paper>

            {/* Generate Button */}
            <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateBudget}
                disabled={aiLoading || allTransactions.length === 0}
                sx={{ mb: 2 }}
            >
                {aiLoading ? <CircularProgress size={20} /> : "✨ Generate Budget with AI"}
            </Button>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* AI Summary */}
            {aiSummary && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {aiSummary}
                </Alert>
            )}

            {/* Income Sources */}
            {incomeSources.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                        Income Sources
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Uncheck one-time items to exclude them from your monthly income.
                    </Typography>
                    <List dense>
                        {incomeSources.map((source, i) => (
                            <ListItem key={i}>
                                <Checkbox
                                    checked={!excludedSources.has(i)}
                                    onChange={() => handleToggleExclude(i, source.average_monthly_amount)}
                                    size="small"
                                />
                                <ListItemText
                                    primary={source.merchant}
                                    secondary={`₪${source.average_monthly_amount.toLocaleString()}/month avg — seen ${source.months_seen} month(s)`}
                                />
                            </ListItem>
                        ))}
                    </List>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            Confirmed monthly income:
                        </Typography>
                        <TextField
                            size="small"
                            type="number"
                            value={confirmedIncome}
                            onChange={(e) => setConfirmedIncome(e.target.value)}
                            sx={{ width: 140 }}
                        />
                    </Box>
                </Paper>
            )}

            {/* Category Budgets */}
            {expenseCategories.length > 0 && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                        Budget per Category
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Lock a category to prevent AI from changing it on resubmit.
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {expenseCategories.map((cat) => (
                            <Box key={cat.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography sx={{ minWidth: 160 }}>{cat.name}</Typography>
                                <TextField
                                    size="small"
                                    type="number"
                                    placeholder="₪0"
                                    value={amounts[cat.id] || ""}
                                    onChange={(e) => handleAmountChange(cat.id, e.target.value)}
                                    sx={{ flexGrow: 1 }}
                                />
                                <Button
                                    size="small"
                                    variant={lockedCategories.has(cat.id) ? "contained" : "outlined"}
                                    onClick={() => handleToggleLock(cat.id)}
                                    sx={{ minWidth: 60 }}
                                >
                                    {lockedCategories.has(cat.id) ? "Locked" : "Lock"}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Live Summary */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Monthly Income</Typography>
                        <Typography>₪{income.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Savings Goal</Typography>
                        <Typography>₪{savings.toLocaleString()}</Typography>
                    </Box>
                    {totalCashExpenses > 0 && (
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography color="text.secondary">Cash Expenses</Typography>
                            <Typography>₪{totalCashExpenses.toLocaleString()}</Typography>
                        </Box>
                    )}
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography color="text.secondary">Total Budgeted</Typography>
                        <Typography>₪{totalBudgeted.toLocaleString()}</Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: "bold" }}>Remaining</Typography>
                        <Typography sx={{ fontWeight: "bold", color: isOverBudget ? "error.main" : "success.main" }}>
                            ₪{remaining.toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {isOverBudget && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Your budget exceeds income by ₪{Math.abs(remaining).toLocaleString()}. Adjust categories or reduce your savings goal.
                </Alert>
            )}

            {saved && <Alert severity="success" sx={{ mb: 2 }}>Budget saved successfully!</Alert>}

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