// ----- Database row shapes -----
// These represent what comes back from the DB (SELECT results)

export interface ExpenseCategory {
    id: number;
    name: string;
}

export interface IncomeCategory {
    id: number;
    name: string;
}

export interface Expense {
    id: number;
    category: string;       // joined from expense_categories.name
    description: string;
    amount: number;
    created_at: string;
}

export interface Income {
    id: number;
    category: string;       // joined from income_categories.name
    description: string;
    amount: number;
    created_at: string;
}

export interface Budget {
    id: number;
    category: string;       // joined from expense_categories.name
    category_id: number;
    amount: number;
    month: string;
}

// ----- Request body shapes -----
// These describe what the client sends in POST/PUT requests

export interface CreateCategoryBody {
    name: string;
}

export interface EditCategoryBody {
    name: string;
}

export interface CreateExpenseBody {
    category_id: number;
    description: string;
    amount: number;
}

export interface EditExpenseBody {
    category_id: number;
    description: string;
    amount: number;
}

export interface CreateIncomeBody {
    category_id: number;
    description: string;
    amount: number;
}

export interface EditIncomeBody {
    category_id: number;
    description: string;
    amount: number;
}

export interface CreateBudgetBody {
    category_id: number;
    amount: number;
    month: string;
}

export interface EditBudgetBody {
    category_id: number;
    amount: number;
    month: string;
}

// ----- Route params -----
// For routes with :id in the URL

export interface IdParam {
    id: string;
}