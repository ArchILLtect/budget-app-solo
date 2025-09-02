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
