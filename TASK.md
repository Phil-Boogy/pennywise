# Two-Pass AI Architecture for Pennywise

## Project Context
Pennywise is a full-stack AI-powered budgeting app for Israeli households.

**Stack:**
- Frontend: React + TypeScript, MUI v9, Redux Toolkit, React Router v7 — in `client/`
- Backend: Express + TypeScript, PostgreSQL (Neon), JWT auth, Anthropic Claude API — in `server/`
- Monorepo: `client/` and `server/` folders

**Current state:**
The app has a single AI endpoint (`POST /api/ai/generate-budget`) that takes raw CSV transactions and returns income sources + budget suggestions in one call. We're refactoring this into a two-pass pipeline.

---

## Database
Both tables already exist in the DB. The `card_last_four` column has already been added to `categorized_transactions`. Do not run any SQL migrations.

```sql
-- already created
CREATE TABLE categorized_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  month TEXT NOT NULL,
  date TEXT NOT NULL,
  merchant TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,
  category_id INTEGER REFERENCES expense_categories(id),
  category_name TEXT,
  reasoning TEXT,
  source TEXT,
  card_last_four TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE merchant_mappings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  merchant TEXT NOT NULL,
  category_id INTEGER REFERENCES expense_categories(id),
  category_name TEXT NOT NULL,
  UNIQUE(merchant, user_id)
);
```

---

## CSV Parsers

Update `client/src/utils/csvParsers.ts`:

**Update `ParsedTransaction` interface:**
```typescript
export interface ParsedTransaction {
  date: string;
  merchant: string;
  amount: number;
  type: "credit" | "debit";
  occurrences?: number;
  source: string; // "mizrahi" | "cal" | "isracard"
  cardLastFour?: string; // extracted from CSV header
}
```

**Update each parser to extract card last four from the header:**
- **Mizrahi:** Bank account, not a credit card — leave `cardLastFour` as `undefined`
- **Cal:** Header contains something like `כאל - 1234` — extract the 4-digit number
- **Isracard:** Header contains `ישראכרט - 0484` — extract `0484`

Also add `source` field to every transaction — `"mizrahi"`, `"cal"`, or `"isracard"` depending on which parser ran.

---

## Pass 1 — Categorization

**New endpoint:** `POST /api/ai/categorize-transactions`

**Input:**
```typescript
{
  transactions: {
    date: string;
    merchant: string;
    amount: number;
    type: "credit" | "debit";
    occurrences: number;
    source: string;
    cardLastFour?: string;
  }[];
  month: string; // e.g. "2026-07-01"
}
```

**Process:**
1. Check `merchant_mappings` table for each merchant — if found, use saved category, skip Claude
2. Send unknown merchants to Claude with web search tool for identification and categorization
3. Save all results to `categorized_transactions` table — upsert on `(user_id, month, date, merchant)` to avoid duplicates
4. Save newly identified merchant→category mappings to `merchant_mappings` for future use

**Output:**
```typescript
{
  categorized: {
    date: string;
    merchant: string;
    amount: number;
    type: "credit" | "debit";
    category_id: number | null;
    category_name: string | null;
    reasoning: string;
    source: string;
    cardLastFour?: string;
  }[];
  categories_summary: {
    category_id: number;
    category_name: string;
    total: number;
    transactions: {
      date: string;
      merchant: string;
      amount: number;
      source: string;
      cardLastFour?: string;
    }[];
  }[];
}
```

---

## Between Passes — SQL Aggregation

In Node (not in Claude), after Pass 1 completes:

```sql
SELECT 
  category_id,
  category_name,
  SUM(amount) as total
FROM categorized_transactions
WHERE user_id = $1 
  AND month = $2 
  AND type = 'debit'
  AND category_id IS NOT NULL
GROUP BY category_id, category_name
ORDER BY total DESC;
```

Pass these aggregated totals to Pass 2.

---

## Pass 2 — Budget Synthesis

**Update existing endpoint:** `POST /api/ai/generate-budget`

Instead of raw transactions, now receives aggregated category totals from Pass 1.

**Input:**
```typescript
{
  categoryTotals: {
    category_id: number;
    category_name: string;
    total: number;
  }[];
  incomeSources: {
    merchant: string;
    average_monthly_amount: number;
    months_seen: number;
  }[];
  savingsGoal: number;
  cashExpenses: { description: string; amount: number }[];
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
```

Claude only sees clean aggregated data — not raw transactions. Faster, cheaper, more accurate budget math.

**Output:** Same as current — income sources, suggested_total_income, budget_suggestions per category.

---

## Frontend Changes

### Budget Page (`client/src/pages/BudgetPage.tsx`)

**Two-step generation flow:**

Step 1 — User uploads CSVs → clicks **"Analyze Transactions"** → triggers Pass 1 (`/api/ai/categorize-transactions`)
- Shows a loading state while Pass 1 runs
- On completion, shows the categorized transaction results (expandable rows) and income sources identified from credit transactions

Step 2 — User reviews categorized transactions, confirms income → clicks **"Generate Budget"** → triggers Pass 2 (`/api/ai/generate-budget`)
- Pass 2 receives aggregated totals from Pass 1 result + income sources + savings goal + cash expenses
- Returns budget suggestions which populate the category input fields as before

**Expandable category rows:**
After Pass 1, each category row becomes expandable. Clicking reveals individual transactions:
```
Groceries    ₪2,200    [LOCK]  ▼
  ├ Supermarket    ₪720    Jul 3    Cal •••• 1234
  ├ Rami Levy      ₪490    Jul 8    Cal •••• 1234
  └ Shuk Hacarmel  ₪180    Jul 11   Cal •••• 1234
```

Show: merchant name, amount, date, source (Cal/Isracard/Mizrahi), card last four (if available).

**Download button:**
After Pass 1, show a "Download Categorized CSV" button that exports the full transaction list.
CSV columns: Date, Merchant, Amount, Type, Category, Source, Card Last Four, Reasoning.

### New Redux Slice
Add `client/src/features/categorizedTransactions/categorizedTransactionsSlice.ts` to store Pass 1 results.

### New API Functions
Add to `client/src/api/ai.ts`:
- `categorizeTransactions(transactions, month)` — calls Pass 1 endpoint
- Update `generateBudget` to accept `categoryTotals` and `incomeSources` instead of raw transactions

---

## Existing Patterns to Follow

**Server:**
- All controllers use `AuthedRequest` from `../middleware/auth` — import it and use `req.userId!`
- Model functions take `user_id` as the last parameter
- Routes use `router.use(authenticateToken)` at the top
- Server uses CommonJS — `tsconfig.json` uses `"module": "CommonJS"` — do not change this
- No `moduleResolution` key in tsconfig — do not add one

**Client:**
- MUI v9 — ALL spacing and style props must go inside `sx={{}}` — never use `mt`, `mb`, `fontWeight` etc. as direct props on Typography or other components
- Redux slices use `createAsyncThunk` with `extraReducers` builder pattern
- API functions live in `client/src/api/` — one file per resource, all use the shared `api` axios instance from `./auth`
- Typed Redux hooks: use `useAppDispatch` and `useAppSelector` from `../hooks/redux`
- No `localStorage` — access tokens live in Redux memory only
- `verbatimModuleSyntax` is enabled — type-only imports must use `import type` syntax
- All amounts from PostgreSQL `NUMERIC` columns come back as strings — wrap with `Number()` on the frontend

**General:**
- All data is scoped to `user_id` — every query filters by user
- Hebrew text in merchant names is expected and normal
- The `expense_categories` and `income_categories` tables have a composite unique constraint on `(name, user_id)` — not just `name`
- The `monthly_settings` table has a composite unique constraint on `(month, user_id)`
- The `budget` table uses `month` as `TEXT` not `DATE` — no timezone conversion issues
- Deployed on Render — client at `pennywise-client.onrender.com`, server at `pennywise-server-kdcl.onrender.com`