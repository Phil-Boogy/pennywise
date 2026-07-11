# Pennywise 💰

> The app that helps you budget and save.

Pennywise uses AI to turn your Israeli bank and credit card statements into a personalized monthly budget. Upload your CSVs, and the AI analyzes your income and spending patterns, proposes a balanced budget across your expense categories, and lets you fine-tune it before saving. Then track daily expenses against it in real time.

---

## Features

- **AI Budget Generation** — Upload CSVs from Mizrahi Tefahot, Cal, or Isracard and let Claude analyze your transactions, identify income sources, detect recurring expenses, and propose a balanced monthly budget
- **Income Review** — See every income source identified from your statements, exclude one-time items, and confirm your monthly income ceiling
- **Category Locking** — Lock individual budget categories before resubmitting to AI, so it rebalances only the unlocked ones around your corrections
- **Known Cash Expenses** — Add recurring cash payments (tutors, house cleaners, etc.) that persist month to month and are factored into every budget
- **Savings Goal** — Set a monthly savings target and the AI builds the budget around it
- **Live Dashboard** — Track spending vs. budget per category in real time with progress bars
- **Daily Expense Logging** — Log expenses as they happen against the active budget
- **Session Persistence** — Stay logged in across page refreshes via JWT refresh tokens

---

## Tech Stack

**Frontend**
- React + TypeScript
- MUI v9
- Redux Toolkit
- React Router v7
- Axios
- Vite

**Backend**
- Express + TypeScript
- PostgreSQL (Neon)
- JWT authentication (access + refresh tokens, httpOnly cookies)
- Argon2 password hashing
- Anthropic Claude API (claude-haiku-4-5) with web search tool

**Deployment**
- Render (both client and server)

---

## Supported Banks

| Bank | Format |
|------|--------|
| מזרחי טפחות | CSV export from online banking |
| כאל | CSV export from כאל online |
| ישראכרט | CSV export from ישראכרט online |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Anthropic API key

### Installation

```bash
git clone https://github.com/Phil-Boogy/pennywise.git
cd pennywise
```

**Server:**
```bash
cd server
npm install
```

Create `server/.env`:
```
PORT=4000
DATABASE_URL=your_neon_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
NODE_ENV=development
```

```bash
npm run dev
```

**Client:**
```bash
cd client
npm install
```

Create `client/.env`:
```
VITE_API_URL=http://localhost:4000
```

```bash
npm run dev
```

---

## How It Works

1. **Register** — A new account is automatically seeded with 27 default expense categories covering common Israeli household spending
2. **Upload CSVs** — Upload 1-3 months of bank and credit card statements (supports multiple files in one session)
3. **Generate Budget** — AI analyzes all transactions, identifies income sources and spending patterns, and proposes a balanced budget
4. **Review & Refine** — Confirm income, exclude one-time items, lock categories you want to keep fixed, resubmit for AI to rebalance
5. **Save** — Confirmed budget is saved to the database
6. **Track** — Log daily expenses and monitor progress on the dashboard

---

## Project Structure

```
pennywise/
├── client/          # React + TypeScript frontend
│   └── src/
│       ├── api/           # Axios API layer
│       ├── features/      # Redux slices by feature
│       ├── pages/         # Route-level components
│       ├── components/    # Shared UI components
│       ├── hooks/         # Typed Redux hooks
│       ├── router/        # React Router config
│       ├── store/         # Redux store
│       ├── types/         # Shared TypeScript types
│       └── utils/         # CSV parsers
└── server/          # Express + TypeScript backend
    └── src/
        ├── controllers/   # Request handlers
        ├── models/        # Database queries
        ├── routes/        # Express routers
        ├── middleware/     # JWT auth middleware
        ├── services/      # Claude AI integration
        └── constants/     # Default categories
```

---

## Live Demo

- **App:** https://pennywise-client.onrender.com
- **API:** https://pennywise-server-kdcl.onrender.com

---

*Built as a final project for a full-stack web development bootcamp, July 2026.*
