# 💸 Budget App Solo

A personal finance tracker built with **React + Vite + Chakra UI + Zustand**.  
This app helps you import transactions, track spending, plan savings, and review your financial goals—all in one streamlined interface.

---

## ✨ Features

### 🔑 Authentication

-   JWT-based auth with automatic session expiry checks (`TokenExpiryGuard`).
-   Session lock overlay that prompts for re-login if a token expires.

### 🏦 Accounts & Transactions

-   Import transactions via **CSV** (OFX support coming soon).
-   Smart **account mapping** by number → label/institution.
-   Demo mode: inject sample CSV data to try the app without setup.
-   Per-account **month/year views**, with persistent selection.

### 📊 Budgeting & Tracking

-   **Expense Tracker** with monthly actuals vs. plans.
-   **Savings Goals & Logs**:
    -   Create savings goals with target amounts.
    -   Add savings logs toward goals.
    -   Inline goal reassignment or leave logs “unassigned” (`goalId: null`).
    -   Progress indicators and completion checks.
-   Monthly summaries (`MonthlyPlanSummary` + `MonthlyActualSummary`).

### ⚡ User Experience

-   Global loading modals (`LoadingModal`, `ProgressModal`) for long tasks.
-   Clean, responsive Chakra UI styling.
-   Scenario planning modals for comparing what-if budgets.
-   Multiple income sources with auto tax estimation

---

## 🛠️ Tech Stack

-   **Frontend:** React 18 + Vite
-   **UI:** Chakra UI
-   **State Management:** Zustand
-   **Date Handling:** Day.js
-   **Linting/Formatting:** ESLint + Prettier

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/budget-app-solo.git
cd budget-app-solo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

You can start Vite either way:

```bash
npm start
```

or

```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## 📂 Project Structure

```
src/
 ├─ components/        # Shared UI components (modals, nav, footer, etc.)
 ├─ features/
 │   ├─ accounts/      # Account tracking and sync
 │   ├─ planner/       # Expense planner + income calculator
 │   └─ tracker/       # Budget tracker + savings goals
 ├─ pages/             # Top-level app pages
 ├─ state/             # Zustand store (budgetStore.js)
 ├─ utils/             # Utility modules (auth, JWT, Plaid stub, etc.)
 └─ hooks/             # Custom React hooks (useAuth)
```

---

## 📜 Available scripts

These are defined in `package.json`:

-   `npm start` – Start Vite dev server
-   `npm run dev` – Same as start (Vite dev server)
-   `npm run build` – Production build
-   `npm run preview` – Preview built app locally
-   `npm run lint` – Run ESLint

---

## 🤖 For AI coding agents

Project-specific guidance for AI assistants lives in `.github/copilot-instructions.md`. It covers:

-   App architecture (routes, state domains, persistence)
-   Auth/session model (guards, overlay, cross-tab sync)
-   Data conventions (dates, transaction normalization/dedupe)
-   UX patterns (modals controlled via store actions)
-   Key file references to work productively

---

## 📅 Roadmap

-   [ ] Full OFX import support.
-   [ ] Enhanced reporting (trend charts, category breakdowns).
-   [ ] Account mapping management UI (edit mappings after import).
-   [ ] Cloud sync with Plaid API (stub in place).
-   [ ] Scenario planning polish.

## 🧠 Future Goals

-   [ ] Settings menu for "Reset All Data"
-   [ ] Mobile-first optimization
-   [ ] Add AI-based spending advice using OpenAI API
-   [ ] Gamify savings (progress bar + rewards)
-   [ ] Build native PWA or mobile app version
-   [ ] Basic savings toggle with auto-calculation

---

## Attributions:

Wallet icon: Arkinasi @ Flaticon - <a href="https://www.flaticon.com/free-icons/business-and-finance" title="business and finance icons">Business and finance icons created by Arkinasi - Flaticon</a>

## 🤝 Contributing

This project is currently built as a **solo learning project**, but contributions and feedback are welcome!  
Fork the repo, open an issue, or submit a pull request.

---

## 📜 License

MIT License © 2025 ArchILLtect

## Auth system enhancments:

Feature Priority Notes

-   🔁 Refresh Tokens Low–Med Not needed unless sessions must last > 1hr+
-   🧪 Password reset flow Med Add “forgot password” with OTP/email later
-   📬 Email verification Low Useful for future SaaS-like functionality
-   🔒 Role-based route guards Med If you want /admin pages
-   🗂️ AuthContext alternative Low Zustand already handles this nicely
-   🚫 Global 401 handler Med Auto-logout if /me fails on protected fetch
-   🔄 Sync login between tabs Low Broadcast logout across open windows

---

## 📥 CSV import format

The accounts feature accepts CSV with the following columns (header required):

-   date – Transaction date in `YYYY-MM-DD`
-   description – Vendor/description text
-   amount – Number (normalized to absolute value)
-   type – One of `income`, `expense`, `savings`
-   category – Optional free text

Notes:

-   Amounts are normalized to absolute values on import; sign is implied by the `type`.
-   Duplicate prevention uses `${date}|${amount.toFixed(2)}|${description.toLowerCase().trim()}`.
-   Transactions are sorted ascending by `date` after import.

Example:

```csv
date,description,amount,type,category
2025-08-03,Walmart Grocery,89.12,expense,groceries
2025-08-05,Paycheck,2450.00,income,salary
2025-08-10,Transfer to Savings,200.00,savings,
```

---

## 🔐 Auth & demo mode tips

-   Tokens are stored in `localStorage.token`.
-   Demo mode: set `localStorage.token = "demo-token"` to sign in as a guest user (never expires).
-   The app checks token freshness on mount and every 5 minutes; expired sessions show a lock overlay with re-login.
-   Cross-tab login refresh is handled via `window.postMessage` and `storage` events; unlocking propagates across tabs.

---

## 🛠️ Troubleshooting

-   Dev server port in use: if `5173` is busy, stop the other process or run with a different port (e.g., `npm run dev -- --port 5174`).
-   Stale local data: in the browser console run `localStorage.removeItem('budget-app-storage')` to clear persisted store; also clear `localStorage.removeItem('token')` to log out.
-   Session lock persists: visit `/login?bypassLock=true` to re-auth without losing work; successful login clears the lock across tabs.
-   API base URL: if `/me` fails, set a `.env` value like `VITE_API_BASE_URL=https://your-api.example.com` and restart the dev server.
-   CSV import errors: ensure headers match `date,description,amount,type,category` and dates are `YYYY-MM-DD`.
-   Lint/type errors: run `npm run lint` and address reported issues; restart the dev server after large refactors.
