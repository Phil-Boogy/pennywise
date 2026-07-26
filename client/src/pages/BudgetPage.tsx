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
    Collapse,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchExpenseCategories } from "../features/categories/categoriesSlice";
import { addBudgetItem, updateBudgetItem, fetchBudgetsByMonth } from "../features/budget/budgetSlice";
import { fetchMonthlySettings, updateMonthlySettings } from "../features/monthlySettings/monthlySettingsSlice";
import { fetchCashExpenses, addCashExpense, removeCashExpense } from "../features/cashExpenses/cashExpensesSlice";
import { runCategorizeTransactions, clearCategorizedTransactions } from "../features/categorizedTransactions/categorizedTransactionsSlice";
import { parseMizrahiCSV, parseCalCSV, parseIsracardCSV, enrichWithOccurrences } from "../utils/csvParsers";
import type { ParsedTransaction } from "../utils/csvParsers";
import { generateBudget } from "../api/ai";
import type { CategorizedTransaction, IncomeSourceInput } from "../api/ai";

type BankFormat = "mizrahi" | "cal" | "isracard";

const BANK_OPTIONS: { value: BankFormat; label: string }[] = [
    { value: "mizrahi", label: "מזרחי טפחות" },
    { value: "cal", label: "כאל" },
    { value: "isracard", label: "ישראכרט" },
];

const SOURCE_LABELS: Record<string, string> = {
    mizrahi: "Mizrahi",
    cal: "Cal",
    isracard: "Isracard",
};

const formatSource = (source: string, cardLastFour?: string) => {
    const label = SOURCE_LABELS[source] ?? source;
    return cardLastFour ? `${label} •••• ${cardLastFour}` : label;
};

const parsers: Record<BankFormat, (csv: string) => ParsedTransaction[]> = {
    mizrahi: parseMizrahiCSV,
    cal: parseCalCSV,
    isracard: parseIsracardCSV,
};

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

const buildIncomeSources = (categorized: CategorizedTransaction[]): IncomeSourceInput[] => {
    const byMerchant = new Map<string, { total: number; months: Set<string> }>();
    categorized.forEach((t) => {
        if (t.type !== "credit") return;
        const monthKey = t.date.slice(0, 7);
        const entry = byMerchant.get(t.merchant) ?? { total: 0, months: new Set<string>() };
        entry.total += t.amount;
        entry.months.add(monthKey);
        byMerchant.set(t.merchant, entry);
    });

    return Array.from(byMerchant.entries()).map(([merchant, { total, months }]) => ({
        merchant,
        average_monthly_amount: Math.round(total / months.size),
        months_seen: months.size,
    }));
};

const BudgetPage = () => {
    const dispatch = useAppDispatch();
    const { expenseCategories } = useAppSelector((state) => state.categories);
    const { items: budgets } = useAppSelector((state) => state.budget);
    const { settings } = useAppSelector((state) => state.monthlySettings);
    const { items: cashExpenses } = useAppSelector((state) => state.cashExpenses);
    const {
        categorized,
        categoriesSummary,
        loading: categorizeLoading,
    } = useAppSelector((state) => state.categorizedTransactions);

    const currentMonth = getCurrentMonth();

    // CSV state
    const [uploadedFiles, setUploadedFiles] = useState<{
        id: string;
        name: string;
        format: BankFormat;
        count: number
    }[]>([]);
    const [allTransactions, setAllTransactions] = useState<(ParsedTransaction & { fileId: string })[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<BankFormat>("mizrahi");

    // Pass 1 state
    const [analyzed, setAnalyzed] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    // Budget state
    const [savingsGoal, setSavingsGoal] = useState("");
    const [amounts, setAmounts] = useState<Record<number, string>>({});
    const [lockedCategories, setLockedCategories] = useState<Set<number>>(new Set());
    const [confirmedIncome, setConfirmedIncome] = useState("");
    const [incomeSources, setIncomeSources] = useState<IncomeSourceInput[]>([]);
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
        if (settings?.confirmed_income) {
            setConfirmedIncome(String(Number(settings.confirmed_income)));
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
                const fileId = `${file.name}-${Date.now()}`;
                const enriched = enrichWithOccurrences(parsed).map((t) => ({ ...t, fileId }));
                setAllTransactions((prev) => [...prev, ...enriched]);
                setUploadedFiles((prev) => [
                    ...prev,
                    { id: fileId, name: file.name, format: selectedFormat, count: enriched.length },
                ]);
                setError(null);
            } catch {
                setError("Failed to parse CSV. Please check the file and try again.");
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const handleAnalyzeTransactions = async () => {
        if (allTransactions.length === 0) {
            setError("Please upload at least one CSV file before analyzing.");
            return;
        }
        setError(null);
        try {
            const result = await dispatch(
                runCategorizeTransactions({
                    transactions: allTransactions.map((t) => ({
                        date: t.date,
                        merchant: t.merchant,
                        amount: t.amount,
                        type: t.type,
                        occurrences: t.occurrences ?? 1,
                        source: t.source,
                        cardLastFour: t.cardLastFour,
                    })),
                    month: currentMonth,
                })
            ).unwrap();

            const sources = buildIncomeSources(result.categorized);
            setIncomeSources(sources);
            setExcludedSources(new Set());
            setConfirmedIncome(String(sources.reduce((sum, s) => sum + s.average_monthly_amount, 0)));
            setAnalyzed(true);
        } catch {
            setError("Failed to analyze transactions. Please try again.");
        }
    };

    const handleGenerateBudget = async () => {
        if (categoriesSummary.length === 0) {
            setError("Please analyze transactions before generating a budget.");
            return;
        }
        setAiLoading(true);
        setError(null);
        try {
            const activeIncomeSources = incomeSources.filter((_, i) => !excludedSources.has(i));
            const categoryTotals = categoriesSummary.map((c) => ({
                category_id: c.category_id,
                category_name: c.category_name,
                total: c.total,
            }));

            const result = await generateBudget(
                categoryTotals,
                activeIncomeSources,
                savings
            );

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

    const handleResubmit = async () => {
        setAiLoading(true);
        setError(null);
        try {
            const activeIncomeSources = incomeSources.filter((_, i) => !excludedSources.has(i));
            const categoryTotals = categoriesSummary.map((c) => ({
                category_id: c.category_id,
                category_name: c.category_name,
                total: c.total,
            }));

            const result = await generateBudget(
                categoryTotals,
                activeIncomeSources,
                savings,
                {
                    lockedAmounts: Object.fromEntries(
                        [...lockedCategories].map((id) => [id, Number(amounts[id])])
                    ),
                    confirmedIncome: Number(confirmedIncome),
                }
            );

            // only update unlocked categories
            const suggested: Record<number, string> = {};
            result.budget_suggestions.forEach((s) => {
                if (!lockedCategories.has(s.category_id)) {
                    suggested[s.category_id] = String(s.suggested_amount);
                }
            });
            setAmounts((prev) => ({ ...prev, ...suggested }));
            setAiSummary(result.summary);
        } catch {
            setError("Resubmit failed. Please try again.");
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

    const toggleExpandedCategory = (categoryId: number) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const handleDownloadCSV = () => {
        const header = ["Date", "Merchant", "Amount", "Type", "Category", "Source", "Card Last Four", "Reasoning"];
        const rows = categorized.map((t) => [
            t.date,
            t.merchant,
            String(t.amount),
            t.type,
            t.category_name ?? "",
            t.source,
            t.cardLastFour ?? "",
            t.reasoning,
        ]);
        const csvContent = [header, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `categorized-transactions-${currentMonth.slice(0, 7)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleSave = async () => {
        const month = currentMonth;

        await dispatch(updateMonthlySettings({
            month,
            savings_goal: savings,
            confirmed_income: Number(confirmedIncome),
        }));

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
                                    const fileId = uploadedFiles[i].id;
                                    setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
                                    setAllTransactions((prev) => prev.filter((t) => t.fileId !== fileId));
                                    setAnalyzed(false);
                                    dispatch(clearCategorizedTransactions());
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

            {/* Step 1: Analyze Transactions */}
            <Button
                variant="contained"
                fullWidth
                onClick={handleAnalyzeTransactions}
                disabled={categorizeLoading || allTransactions.length === 0}
                sx={{ mb: 2 }}
            >
                {categorizeLoading ? <CircularProgress size={20} /> : "🔍 Analyze Transactions"}
            </Button>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Categorized Transactions (Pass 1 result) */}
            {analyzed && (
                <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                            Categorized Transactions
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownloadCSV}
                        >
                            Download CSV
                        </Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {categoriesSummary.map((cat) => (
                            <Box key={cat.category_id}>
                                <Box
                                    sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }}
                                    onClick={() => toggleExpandedCategory(cat.category_id)}
                                >
                                    <Typography sx={{ flexGrow: 1, fontWeight: 500 }}>{cat.category_name}</Typography>
                                    <Typography>₪{cat.total.toLocaleString()}</Typography>
                                    <IconButton size="small">
                                        {expandedCategories.has(cat.category_id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>
                                <Collapse in={expandedCategories.has(cat.category_id)}>
                                    <List dense sx={{ pl: 2 }}>
                                        {cat.transactions.map((t, i) => (
                                            <ListItem key={i} sx={{ py: 0.25 }}>
                                                <ListItemText
                                                    primary={`${t.merchant} — ₪${t.amount.toLocaleString()}`}
                                                    secondary={`${t.date} · ${formatSource(t.source, t.cardLastFour)}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                                <Divider sx={{ mt: 1 }} />
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Income Sources (from Pass 1 credit transactions) */}
            {analyzed && incomeSources.length > 0 && (
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

            {/* Step 2: Generate Budget */}
            {analyzed && (
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGenerateBudget}
                    disabled={aiLoading || categoriesSummary.length === 0}
                    sx={{ mb: 2 }}
                >
                    {aiLoading ? <CircularProgress size={20} /> : "✨ Generate Budget"}
                </Button>
            )}

            {aiSummary && (
                <>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleResubmit}
                        disabled={aiLoading || lockedCategories.size === 0}
                        sx={{ mb: 2 }}
                    >
                        {aiLoading ? <CircularProgress size={20} /> : "🔄 Resubmit with Locked Categories"}
                    </Button>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        {aiSummary}
                    </Alert>
                </>
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
