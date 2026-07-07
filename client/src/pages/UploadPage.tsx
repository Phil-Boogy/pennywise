import { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    MenuItem,
    TextField,
    List,
    ListItem,
    ListItemText,
    Alert,
    CircularProgress,
    Chip,
    Divider,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import type { ParsedTransaction } from "../utils/csvParsers";
import { parseMizrahiCSV, parseCalCSV, parseIsracardCSV, enrichWithOccurrences } from "../utils/csvParsers";
import { analyzeTransactions } from "../api/ai";
import type { TransactionAnalysis } from "../api/ai";

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

const UploadPage = () => {
    const [bankFormat, setBankFormat] = useState<BankFormat>("mizrahi");
    const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
    const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);
        setTransactions([]);
        setAnalysis(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvText = event.target?.result as string;
                const parser = parsers[bankFormat];
                const parsed = parser(csvText);

                if (parsed.length === 0) {
                    setError("No transactions found. Make sure you selected the correct bank format.");
                    return;
                }

                const enriched = enrichWithOccurrences(parsed);
                setTransactions(enriched);
            } catch (err) {
                setError("Failed to parse CSV. Please check the file and try again.");
            }
        };
        reader.readAsText(file);
    };

    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await analyzeTransactions(
                transactions.map((t) => ({
                    date: t.date,
                    merchant: t.merchant,
                    amount: t.amount,
                    type: t.type,
                    occurrences: t.occurrences ?? 1,
                }))
            );
            setAnalysis(result);
        } catch (err) {
            setError("AI analysis failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const credits = transactions.filter((t) => t.type === "credit");
    const debits = transactions.filter((t) => t.type === "debit");
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = debits.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return (
        <Box sx={{ maxWidth: 700 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Upload Bank Statement
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <TextField
                        select
                        size="small"
                        label="Bank / Credit Card"
                        value={bankFormat}
                        onChange={(e) => {
                            setBankFormat(e.target.value as BankFormat);
                            setTransactions([]);
                            setFileName(null);
                            setError(null);
                            setAnalysis(null);
                        }}
                        sx={{ minWidth: 180 }}
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
                    >
                        {fileName ?? "Choose CSV File"}
                        <input
                            type="file"
                            accept=".csv"
                            hidden
                            onChange={handleFileUpload}
                        />
                    </Button>
                </Box>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {transactions.length > 0 && (
                <>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <Chip label={`${transactions.length} transactions`} />
                            <Chip
                                label={`Credits: ₪${totalCredits.toLocaleString()}`}
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                label={`Debits: ₪${totalDebits.toLocaleString()}`}
                                color="error"
                                variant="outlined"
                            />
                        </Box>
                    </Paper>

                    <Paper sx={{ p: 2, mb: 2, maxHeight: 400, overflow: "auto" }}>
                        <List dense>
                            {transactions.map((t, i) => (
                                <ListItem key={i} divider>
                                    <ListItemText
                                        primary={`${t.merchant} — ₪${Math.abs(t.amount).toLocaleString()}`}
                                        secondary={t.date}
                                    />
                                    <Chip
                                        label={t.type === "credit" ? "Income" : "Expense"}
                                        color={t.type === "credit" ? "success" : "default"}
                                        size="small"
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>

                    <Button
                        variant="contained"
                        fullWidth
                        disabled={loading}
                        onClick={handleAnalyze}
                        sx={{ mb: 3 }}
                    >
                        {loading ? <CircularProgress size={20} /> : "✨ Analyze with AI"}
                    </Button>
                </>
            )}

            {analysis && (
                <>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                            Analysis Summary
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {analysis.summary}
                        </Typography>
                    </Paper>

                    {analysis.income_sources.length > 0 && (
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                                Income Sources
                            </Typography>
                            <List dense>
                                {analysis.income_sources.map((s, i) => (
                                    <ListItem key={i}>
                                        <ListItemText
                                            primary={s.merchant}
                                            secondary={`₪${s.amounts.join(", ₪")}`}
                                        />
                                        {s.is_salary && <Chip label="Salary" color="success" size="small" />}
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}

                    {analysis.recurring_expenses.length > 0 && (
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                                Recurring Expenses
                            </Typography>
                            <List dense>
                                {analysis.recurring_expenses.map((r, i) => (
                                    <ListItem key={i}>
                                        <ListItemText
                                            primary={r.merchant}
                                            secondary={r.category_name ?? "Uncategorized"}
                                        />
                                        <Typography variant="body2">
                                            ₪{r.estimated_monthly_amount.toLocaleString()}/mo
                                        </Typography>
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}

                    <Paper sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                            Categorized Transactions
                        </Typography>
                        <Divider sx={{ mb: 1 }} />
                        <List dense>
                            {analysis.transactions
                                .filter((t) => t.type === "debit")
                                .map((t, i) => (
                                    <ListItem key={i} divider>
                                        <ListItemText
                                            primary={`${t.merchant} — ₪${Math.abs(t.amount).toLocaleString()}`}
                                            secondary={t.category_name ?? "Uncategorized"}
                                        />
                                        {t.is_recurring && (
                                            <Chip label="Recurring" variant="outlined" size="small" />
                                        )}
                                    </ListItem>
                                ))}
                        </List>
                    </Paper>
                </>
            )}
        </Box>
    );
};

export default UploadPage;