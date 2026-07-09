import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TransactionAnalysis {
    transactions: {
        date: string;
        merchant: string;
        amount: number;
        type: "credit" | "debit";
        occurrences: number;
        category_id: number | null;
        category_name: string | null;
        is_recurring: boolean;
        reasoning: string;
    }[];
    recurring_expenses: {
        merchant: string;
        estimated_monthly_amount: number;
        category_id: number | null;
        category_name: string | null;
    }[];
    income_sources: {
        merchant: string;
        amounts: number[];
        is_salary: boolean;
    }[];
    summary: string;
}

export interface AnalyzeTransactionsInput {
    transactions: {
        date: string;
        merchant: string;
        amount: number;
        type: "credit" | "debit";
        occurrences: number;
    }[];
    categories: { id: number; name: string }[];
}

export interface CategoryBudgetSuggestion {
    category_id: number;
    category_name: string;
    suggested_amount: number;
    reasoning: string;
}

export interface BudgetSuggestionResponse {
    suggestions: CategoryBudgetSuggestion[];
    summary: string;
}

export interface BudgetSuggestionInput {
    categories: { id: number; name: string }[];
    previousBudgets: { category: string; amount: number }[];
    monthlyIncome: number;
    savingsGoal: number;
    month: string;
}

export interface UnifiedBudgetInput {
    transactions: {
        date: string;
        merchant: string;
        amount: number;
        type: "credit" | "debit";
        occurrences: number;
    }[];
    categories: { id: number; name: string }[];
    cashExpenses: { description: string; amount: number }[];
    savingsGoal: number;
    previousBudgetHistory: {
        month: string;
        category: string;
        budgeted: number;
        actual: number;
    }[];
    overrides?: {
        lockedAmounts: Record<number, number>;
        confirmedIncome: number;
    };
}

export interface UnifiedBudgetResponse {
    income_sources: {
        merchant: string;
        average_monthly_amount: number;
        total_received: number;
        months_seen: number;
    }[];
    suggested_total_income: number;
    budget_suggestions: {
        category_id: number;
        category_name: string;
        suggested_amount: number;
        reasoning: string;
    }[];
    summary: string;
}

export const suggestBudget = async (
    input: BudgetSuggestionInput
): Promise<BudgetSuggestionResponse> => {
    const systemPrompt = `You are a personal budgeting assistant for an Israeli household. 
Your job is to suggest a realistic monthly budget based on the user's income, savings goal, and spending history.

Rules:
- You may ONLY use the expense categories provided. Never invent new ones.
- The total of all suggested amounts must not exceed: monthly income minus savings goal.
- Base suggestions on previous budget amounts when available, adjusting for the savings goal.
- If no previous data exists for a category, suggest a reasonable amount based on Israeli household norms.
- Return ONLY valid JSON, no explanation, no markdown, no preamble.
- All amounts in Israeli shekels as whole numbers.`;

    const userPrompt = `Monthly income: ₪${input.monthlyIncome}
Savings goal: ₪${input.savingsGoal}
Available to budget: ₪${input.monthlyIncome - input.savingsGoal}
Month: ${input.month}

Expense categories:
${input.categories.map((c) => `- id: ${c.id}, name: ${c.name}`).join("\n")}

Previous month budgets:
${input.previousBudgets.length > 0
            ? input.previousBudgets.map((b) => `- ${b.category}: ₪${b.amount}`).join("\n")
            : "No previous budget data available."}

Suggest a monthly budget. Return JSON in this exact format:
{
  "suggestions": [
    {
      "category_id": <number>,
      "category_name": "<string>",
      "suggested_amount": <number>,
      "reasoning": "<one sentence>"
    }
  ],
  "summary": "<2-3 sentence overview of the budget strategy>"
}`;

    const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== "text") {
        throw new Error("Unexpected response type from Claude");
    }

    const cleaned = content.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    return JSON.parse(cleaned) as BudgetSuggestionResponse;
};

export const analyzeTransactions = async (
    input: AnalyzeTransactionsInput
): Promise<TransactionAnalysis> => {
    const systemPrompt = `You are a financial analyst for an Israeli household. 
Analyze bank and credit card transactions and categorize them.

Rules:
- You may ONLY use the expense categories provided. Never invent new ones.
- If a transaction doesn't fit any category, set category_id and category_name to null.
- Credit transactions (income) should have category_id null.
- Identify recurring expenses: same merchant appearing multiple times with consistent amounts.
- Identify income sources and whether they appear to be salary.
- Use web search if you cannot identify a merchant from its name alone.
- Return ONLY valid JSON, no markdown, no preamble.
- All amounts in Israeli shekels.`;

    const userPrompt = `Expense categories available:
${input.categories.map((c) => `- id: ${c.id}, name: ${c.name}`).join("\n")}

Transactions to analyze:
${JSON.stringify(input.transactions, null, 2)}

Analyze these transactions and return JSON in this exact format:
{
  "transactions": [
    {
      "date": "<date>",
      "merchant": "<merchant>",
      "amount": <number>,
      "type": "<credit|debit>",
      "occurrences": <number>,
      "category_id": <number or null>,
      "category_name": "<string or null>",
      "is_recurring": <boolean>,
      "reasoning": "<one sentence>"
    }
  ],
  "recurring_expenses": [
    {
      "merchant": "<merchant>",
      "estimated_monthly_amount": <number>,
      "category_id": <number or null>,
      "category_name": "<string or null>"
    }
  ],
  "income_sources": [
    {
      "merchant": "<merchant>",
      "amounts": [<number>],
      "is_salary": <boolean>
    }
  ],
  "summary": "<3-4 sentence overview of spending patterns and key findings>"
}`;

    const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }] as never,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
    }

    const cleaned = textContent.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

    return JSON.parse(cleaned) as TransactionAnalysis;
};

export const generateUnifiedBudget = async (
    input: UnifiedBudgetInput
): Promise<UnifiedBudgetResponse> => {
    const totalCashExpenses = input.cashExpenses.reduce((sum, e) => sum + e.amount, 0);

    const systemPrompt = `You are a financial analyst and budgeting assistant for an Israeli household.
Your job is to analyze transactions, identify income sources, and suggest a balanced monthly budget.

Rules:
- You may ONLY use the expense categories provided. Never invent new ones.
- Identify all income sources from transactions. Do NOT label them as salary or any specific type — just describe them by merchant name and amounts.
- Suggest a total monthly income figure based on recurring income patterns. Exclude clear one-time payments.
- The total of all suggested category budget amounts must not exceed: suggested income minus savings goal minus known cash expenses.
- Weight recent months more heavily than older months when identifying spending patterns.
- Factor in budget vs actual history when available — if the user consistently overspends a category, suggest a more realistic amount.
- Known cash expenses are fixed and cannot be cut.
- Return ONLY valid JSON, no markdown, no preamble.
- All amounts in Israeli shekels as whole numbers.`;

    const userPrompt = `Expense categories:
${input.categories.map((c) => `- id: ${c.id}, name: ${c.name}`).join("\n")}

Known cash expenses (fixed, cannot be cut):
${input.cashExpenses.length > 0
            ? input.cashExpenses.map((e) => `- ${e.description}: ₪${e.amount}/month`).join("\n")
            : "None"}
Total cash expenses: ₪${totalCashExpenses}/month

Savings goal: ₪${input.savingsGoal}/month
${input.overrides ? `
User confirmed monthly income: ₪${input.overrides.confirmedIncome} (use this instead of deriving from transactions)

Locked category amounts (do NOT change these):
${Object.entries(input.overrides.lockedAmounts)
                .map(([id, amount]) => {
                    const cat = input.categories.find((c) => c.id === Number(id));
                    return `- ${cat?.name ?? id}: ₪${amount} (LOCKED)`;
                })
                .join("\n")}
` : ""}

Previous budget vs actual history:
${input.previousBudgetHistory.length > 0
            ? input.previousBudgetHistory.map((h) =>
                `- ${h.month} ${h.category}: budgeted ₪${h.budgeted}, actual ₪${h.actual}`
            ).join("\n")
            : "No history available — this is the first budget."}

Transactions (${input.transactions.length} total):
${JSON.stringify(input.transactions, null, 2)}

Return JSON in this exact format:
{
  "income_sources": [
    {
      "merchant": "<merchant name>",
      "average_monthly_amount": <number>,
      "total_received": <number>,
      "months_seen": <number>
    }
  ],
  "suggested_total_income": <number>,
  "budget_suggestions": [
    {
      "category_id": <number>,
      "category_name": "<string>",
      "suggested_amount": <number>,
      "reasoning": "<one sentence>"
    }
  ],
  "summary": "<3-4 sentences covering income picture, spending patterns, and budget strategy>"
}`;

    const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8000,
        tools: [{ type: "web_search_20250305", name: "web_search" }] as never,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
    }

    const cleaned = textContent.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

    return JSON.parse(cleaned) as UnifiedBudgetResponse;
};