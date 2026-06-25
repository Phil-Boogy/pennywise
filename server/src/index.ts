import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import "./db";

import authRouter from "./routes/auth";
import expenseCategoriesRouter from "./routes/expenseCategories";
import expensesRouter from "./routes/expenses";
import incomeCategoriesRouter from "./routes/incomeCategories";
import incomeRouter from "./routes/income";
import budgetsRouter from "./routes/budgets";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/expense-categories", expenseCategoriesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/income-categories", incomeCategoriesRouter);
app.use("/api/income", incomeRouter);
app.use("/api/budgets", budgetsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});