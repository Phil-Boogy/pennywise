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
    Tabs,
    Tab,
    Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
    fetchExpenseCategories,
    addExpenseCategory,
    removeExpenseCategory,
    fetchIncomeCategories,
    addIncomeCategory,
    removeIncomeCategory,
} from "../features/categories/categoriesSlice";

const CategoriesPage = () => {
    const dispatch = useAppDispatch();
    const { expenseCategories, incomeCategories } = useAppSelector(
        (state) => state.categories
    );

    const [tab, setTab] = useState<"expense" | "income">("expense");
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        dispatch(fetchExpenseCategories());
        dispatch(fetchIncomeCategories());
    }, [dispatch]);

    const handleAdd = () => {
        if (!newCategoryName.trim()) return;

        if (tab === "expense") {
            dispatch(addExpenseCategory(newCategoryName.trim()));
        } else {
            dispatch(addIncomeCategory(newCategoryName.trim()));
        }
        setNewCategoryName("");
    };

    const handleDelete = (id: number) => {
        if (tab === "expense") {
            dispatch(removeExpenseCategory(id));
        } else {
            dispatch(removeIncomeCategory(id));
        }
    };

    const categories = tab === "expense" ? expenseCategories : incomeCategories;

    return (
        <Box sx={{ maxWidth: 600 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
                Categories
            </Typography>

            <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
                <Tab label="Expense Categories" value="expense" />
                <Tab label="Income Categories" value="income" />
            </Tabs>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder={`New ${tab} category name`}
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAdd();
                        }}
                    />
                    <Button variant="contained" onClick={handleAdd}>
                        Add
                    </Button>
                </Box>
            </Paper>

            <Paper>
                <List>
                    {categories.length === 0 && (
                        <ListItem>
                            <ListItemText
                                primary="No categories yet"
                                sx={{ color: "text.secondary" }}
                            />
                        </ListItem>
                    )}
                    {categories.map((category) => (
                        <ListItem
                            key={category.id}
                            secondaryAction={
                                <IconButton edge="end" onClick={() => handleDelete(category.id)}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText primary={category.name} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default CategoriesPage;