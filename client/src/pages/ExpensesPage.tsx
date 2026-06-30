import { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper,
    MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import { fetchExpenseCategories } from "../features/categories/categoriesSlice";
import { fetchExpenses, addExpense, removeExpense } from "../features/expenses/expensesSlice";

const ExpensesPage = () => {
    const dispatch = useAppDispatch();
    const { items: expenses } = useAppSelector((state) => state.expenses);
    const { expenseCategories } = useAppSelector((state) => state.categories);

    const [categoryId, setCategoryId] = useState<number | "">("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        dispatch(fetchExpenses());
        dispatch(fetchExpenseCategories());
    }, [dispatch]);

    const handleAdd = () => {
        if (!categoryId || !description.trim() || !amount) return;

        dispatch(
            addExpense({
                categoryId: Number(categoryId),
                description: description.trim(),
                amount: Number(amount),
            })
        );

        setDescription("");
        setAmount("");
    };

    const handleDelete = (id: number) => {
        dispatch(removeExpense(id));
    };

    return (
        <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Expenses
            </Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <TextField
                        select
                        size="small"
                        label="Category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(Number(e.target.value))}
                        sx={{ minWidth: 160 }}
                    >
                        {expenseCategories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        size="small"
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        sx={{ flexGrow: 1 }}
                    />

                    <TextField
                        size="small"
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        sx={{ width: 120 }}
                    />

                    <Button variant="contained" onClick={handleAdd}>
                        Add
                    </Button>
                </Box>
            </Paper>

            <Paper>
                <List>
                    {expenses.length === 0 && (
                        <ListItem>
                            <ListItemText
                                primary="No expenses logged yet"
                                sx={{ color: "text.secondary" }}
                            />
                        </ListItem>
                    )}
                    {expenses.map((expense) => (
                        <ListItem
                            key={expense.id}
                            secondaryAction={
                                <IconButton edge="end" onClick={() => handleDelete(expense.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={`${expense.description} — ₪${expense.amount}`}
                                secondary={expense.category}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default ExpensesPage;