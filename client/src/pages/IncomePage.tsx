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
import { fetchIncomeCategories } from "../features/categories/categoriesSlice";
import { fetchIncomes, addIncome, removeIncome } from "../features/income/incomeSlice";

const IncomePage = () => {
    const dispatch = useAppDispatch();
    const { items: incomes } = useAppSelector((state) => state.income);
    const { incomeCategories } = useAppSelector((state) => state.categories);

    const [categoryId, setCategoryId] = useState<number | "">("");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");

    useEffect(() => {
        dispatch(fetchIncomes());
        dispatch(fetchIncomeCategories());
    }, [dispatch]);

    const handleAdd = () => {
        if (!categoryId || !description.trim() || !amount) return;

        dispatch(
            addIncome({
                categoryId: Number(categoryId),
                description: description.trim(),
                amount: Number(amount),
            })
        );

        setDescription("");
        setAmount("");
    };

    const handleDelete = (id: number) => {
        dispatch(removeIncome(id));
    };

    return (
        <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Income
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
                        {incomeCategories.map((cat) => (
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
                    {incomes.length === 0 && (
                        <ListItem>
                            <ListItemText
                                primary="No income logged yet"
                                sx={{ color: "text.secondary" }}
                            />
                        </ListItem>
                    )}
                    {incomes.map((income) => (
                        <ListItem
                            key={income.id}
                            secondaryAction={
                                <IconButton edge="end" onClick={() => handleDelete(income.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={`${income.description} — ₪${income.amount}`}
                                secondary={income.category}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default IncomePage;