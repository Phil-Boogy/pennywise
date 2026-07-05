import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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

    const parsed = JSON.parse(content.text) as BudgetSuggestionResponse;
    return parsed;
};