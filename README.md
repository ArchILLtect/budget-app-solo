# 💸 Budget App Solo

[![Docs Index](https://img.shields.io/badge/Docs-developer%20hub-blue)](docs/developer/README.md) [![Contributing](https://img.shields.io/badge/Contributing-guide-brightgreen)](CONTRIBUTING.md)

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
-   `npm test` – Run Vitest unit test suite (ingestion + strong key utils)

---

## 🤖 For AI coding agents

Project-specific guidance for AI assistants lives in `.github/copilot-instructions.md`. It covers:

-   App architecture (routes, state domains, persistence)
-   Auth/session model (guards, overlay, cross-tab sync)
-   Data conventions (dates, transaction normalization/dedupe)
-   UX patterns (modals controlled via store actions)
-   Key file references to work productively

## 🧩 Developer Docs

For deeper architectural notes and extension guides see:

-   Developer Docs Hub: `docs/developer/README.md`
-   Ingestion Refactor Plan: `docs/ingestion-refactor-plan.md`
-   Category Rules & Savings Queue Guide: `docs/developer/category-rules-and-savings-queue.md`

Update these when adding new ingestion stages, rule types, or savings queue heuristics.

---

## 📅 Roadmap

-   [ ] Full OFX import support.
-   [ ] Enhanced reporting (trend charts, category breakdowns).
-   [ ] Account mapping management UI (edit mappings after import).
-   [ ] Cloud sync with Plaid API (stub in place).
-   [ ] Scenario planning polish.

### Documentation & Contribution

-   [x] Add CONTRIBUTING guide & badge in README
-   [x] Add Developer Hub backlink to CONTRIBUTING
-   [x] Add PR template with automation checklist

## 🧠 Future Goals

-   [ ] Settings menu for "Reset All Data"
-   [ ] Mobile-first optimization
-   [ ] Add AI-based spending advice using OpenAI API
-   [ ] Gamify savings (progress bar + rewards)
-   [ ] Build native PWA or mobile app version
-   [ ] Basic savings toggle with auto-calculation

### Ingestion Pipeline (Current)

Refactored to a pure, testable pipeline with staging + undo and performance telemetry.

Key capabilities:

1. Pure orchestration (`runIngestion`) → returns a patch (applied atomically), savings queue candidates, stats & errors.
2. Strong duplicate key ONLY (no legacy fallback): `account|YYYY-MM-DD|signedAmount|normalized description[|bal:balance]`. This unification simplifies dedupe and ensures idempotent re-import; the earlier interim legacy key has been removed prior to first deployment.
3. Early dedupe short‑circuit: duplicates bypass classify/infer work; counts exposed in `stats.earlyShortCircuits`.
4. Category inference: immediate (provided / keyword / regex) + consensus pass for unlabeled vendor roots.
5. Metrics: ingest vs process time, per‑stage breakdown, rows/sec, duplicate ratio, category source counts.
6. Structured errors: parse / normalize / duplicate (capped) with sample duplicate list.
7. Staging & Undo: imported transactions tagged with `importSessionId` & `staged`; batch undo reverts before budget application or within a time window.
8. Streaming-ready: accepts `parsedRows` for streaming parser path (Papa) with progress UI (threshold-based auto-switch planned for refinement).
9. Dev Benchmark: enable in Settings (Developer toggle) to synthesize CSVs, measure throughput, and export baselines (5k/10k/60k/100k).

Planned / remaining polish:

-   Memory sampling & worker offload (Papa worker mode)
-   Persistent telemetry history & mini analytics panel
-   Category inference audit panel (accept/reject rule evolution)
-   Downloadable / importable custom inference rules
-   Streaming duplicate ratio live updates
-   Maintenance log & settings export/import

---

## Attributions:

Wallet icon: Arkinasi @ Flaticon - <a href="https://www.flaticon.com/free-icons/business-and-finance" title="business and finance icons">Business and finance icons created by Arkinasi - Flaticon</a>

## 🤝 Contributing

This project is currently built as a **solo learning project**, but contributions and feedback are welcome!  
See the full contribution workflow & quality checklist in the [CONTRIBUTING guide](CONTRIBUTING.md).  
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

## 📥 CSV Import Format & Keying

The accounts feature accepts CSV with the following columns (header required):

-   date – Transaction date in `YYYY-MM-DD`
-   description – Vendor/description text
-   amount – Number (normalized to absolute value)
-   type – One of `income`, `expense`, `savings`
-   category – Optional free text

Notes:

-   Amounts are normalized to absolute values (`amount`) while the original sign is kept in `rawAmount`.
-   Strong transaction key (used everywhere): `account|date|signedAmount|normalized description[|bal:balance]`.
-   `amount` is stored absolute; `rawAmount` preserves the signed original (used in the strong key signedAmount component).
-   Transactions are sorted ascending by `date` after merge.

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

## Category Inference (Current & TODO)

-## Developer: Metrics Panel & Benchmark Toggle

The import modal includes a metrics panel (timings, duplicate ratio, rows/sec, per‑stage breakdown) automatically after a dry run. For deeper performance analysis you can enable the synthetic ingestion benchmark panel:

1. Go to Settings → Developer section.
2. Toggle "Show Ingestion Benchmark Panel".
3. A fixed panel appears (dev only) allowing you to:
    - Generate synthetic CSVs of arbitrary sizes and duplicate ratios.
    - Simulate streaming (pre-parsed rows path).
    - View per-run wall / ingest / process timings, rows/sec, duplicate %.
    - Capture canonical baselines (5k / 10k / 60k / 100k) via the "Capture Baseline" button.
    - Persist captured baselines in `localStorage` (`ingestionBaselineSnapshots`) for regression comparison; clear them with "Clear Baselines".
    - Export JSON of detailed runs or baselines for historical tracking.

Tip: Use baseline snapshots before and after performance changes (e.g., enabling early dedupe short‑circuit) to quantify impact. Rows/sec = total rows ÷ ingest time (ms) \* 1000.

These are planned follow‑ups to the ingestion category inference system:

-   Immediate inference: provided category (if meaningful) → keyword map (longest first) → regex rules.
-   Consensus pass: vendor root dominance (configurable thresholds) fills unlabeled.
-   Telemetry: per-source counts (`provided`, `keyword`, `regex`, `consensus`, `none`).

Planned enhancements:

-   Dev audit panel (per-transaction inference method) with accept/reject feedback.
-   Custom user-defined rules persisted & merged at runtime.
-   Visual analytics (sparklines / bars) for inference distribution.
-   Historical telemetry aggregation across imports.
-   Tooltips/UI polish for method explanations.

## 🧪 Testing

Run tests (headless):

```bash
npm test
```

Tests currently cover:

1. Transaction normalization edge cases (sign parsing, mixed formats)
2. Strong transaction key formatting & balance inclusion
3. Category inference (immediate + consensus)
4. Strong key utilities (`getStrongTransactionKey`, `getUniqueTransactions`, normalization abs behavior)

Add new tests adjacent to related modules (e.g. `src/ingest/__tests__/`). Keep them fast & deterministic.

## Demo / Data Generation TODOs

-   [ ] Demo CSV generator: Adapt IngestionBenchmark logic to let demo users generate realistic synthetic CSV files (seeded) including:
    -   Recurring paychecks, rent, utilities, subscriptions, groceries, fuel, shopping
    -   Configurable row count (e.g. 500 / 2k / 5k)
    -   Optional duplicate + noise injection
    -   Multi-account output (separate or combined)
    -   Deterministic seed for reproducible walkthroughs
    -   One-click “Generate & Open in Import Modal” action
    -   Future: parameter presets (Light / Typical / Heavy spender)
