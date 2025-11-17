# Copilot instructions for budget-app-solo

These notes teach AI agents how to work productively in this repo. Keep them short, specific, and rooted in the current code.

Developer Documentation Hub (human-facing expanded guides & architecture index): `docs/developer/README.md`

## Big picture

-   Frontend-only React 18 + Vite app with Chakra UI and Zustand (persisted to localStorage under key `budget-app-storage`).
-   App routes: `planner`, `tracker`, `accounts`, `login` via React Router in `src/App.jsx`. `Accounts` is protected by `RequireAuth` and a session lock overlay.
-   Global state lives in `src/state/budgetStore.js`. Actions mutate state via `set((state) => ...)` and are persisted; transient auth flags (`sessionExpired`, `hasInitialized`) are intentionally not persisted.
-   Data domains:
    -   Budget planning: `incomeSources`, `expenses`, scenarios (`scenarios` map), `monthlyPlans`, `monthlyActuals` keyed by `YYYY-MM`.
    -   Savings: `savingsGoals` array and `savingsLogs` map keyed by `YYYY-MM`.
    -   Accounts/transactions: `accounts` and `accountMappings`, with CSV-imported transactions.
        -   Strong transaction key (sole key): `accountNumber|YYYY-MM-DD|signedAmount|normalized description[|bal:balance]`.

## Auth/session model

-   Tokens are stored in `localStorage.token`. Demo mode uses `demo-token` (not expired; role `guest`).
-   `getCurrentUser()` calls `${VITE_API_BASE_URL || default}/me` with Axios; store the result in `useBudgetStore().user`.
-   Session lifecycle:
    -   `AuthInitializer` (on app mount) loads user and sets `hasInitialized`.
    -   `TokenExpiryGuard` + `checkTokenExpiry()` run on mount and every 5 minutes (also on route changes) and set `sessionExpired` when needed.
    -   `SessionLockOverlay` blocks UI when `sessionExpired = true` and offers re-login (popup `/login?bypassLock=true`) or logout. Cross-tab sync via `message` and `storage` events in `App.jsx`.
    -   `useAuth().logoutUser()` clears localStorage and resets store.

## State and data shape conventions

-   Dates: days `YYYY-MM-DD`, months `YYYY-MM` (e.g., `selectedMonth`).
-   Transactions (post‑ingestion persistence): `amount` stored as absolute, `rawAmount` retained (signed). Types: `income | expense | savings` (auto‑classified if omitted). Strong key adds account + signed amount + optional balance for collision resistance & idempotency.
-   `addTransactionsToAccount` dedupes via `getStrongTransactionKey` and sorts by `date` ascending.
-   Scenarios are deep-cloned with JSON stringify/parse when saved/loaded. Keep actions pure and return new arrays/objects.
-   Savings logs live in `savingsLogs[month] = [{ id, amount, date, goalId|null, ... }]` and support add/update/delete/reset helpers.

## UI patterns and cross-component comms

-   Chakra UI throughout; modals: `LoadingModal`, `ProgressModal`, `ConfirmModal` are controlled via store actions: `openLoading/closeLoading`, `openProgress/updateProgress/closeProgress`.
-   Feature folders: `features/accounts`, `features/planner`, `features/tracker`; shared components in `src/components`.
-   `findRecurringTransactions` in `utils/analysisUtils.js` groups by normalized vendor description; use it to surface recurring expenses from account txns.

## Ingestion pipeline (refactored)

-   Located in `src/ingest/`: `parseCsv.js`, `runIngestion.js`, `normalizeRow.js`, `classifyTx.js`, `inferCategory.js`, `buildTxKey.js`, `buildPatch.js`, plus streaming helpers and benchmark dev tool.
-   Pure orchestrator: `runIngestion({ fileText | parsedRows, accountNumber, existingTxns })` returns `{ patch, savingsQueue, stats, errors, acceptedTxns }`.
-   Staging + undo: New transactions tagged with `importSessionId` & `staged`; undo can revert a whole session within the allowed window.
-   Strong key: includes accountNumber + signed amount + normalized description (+ optional balance) for deterministic dedupe + idempotent re-import.
-   Early dedupe short‑circuit: Key built immediately after normalization; classification & category inference skipped for existing/intra-file duplicates (exposed via `stats.earlyShortCircuits`).
-   Category inference: immediate (provided/keyword/regex) + vendor consensus pass; telemetry counts surfaced in `stats.categorySources`.
-   Metrics: `ingestMs`, `processMs`, per-stage timings (`normalize/classify/infer/key/dedupe/consensus`), throughput, duplicate ratio.
-   Errors: structured list with types (`parse | normalize | duplicate`).

## Benchmark & performance

-   `src/dev/IngestionBenchmark.jsx` (dev-only) toggled via `Settings > Developer > Show Ingestion Benchmark Panel` (non‑persisted flag).
-   Generates synthetic CSVs (configurable sizes, duplicate fractions), measures wall vs ingest vs process time, exports JSON baselines.
-   Baseline capture button emits canonical 5k/10k/60k/100k snapshots.
-   Baselines persist in `localStorage.ingestionBaselineSnapshots`; clear via panel.

## Tests

-   Unit tests (Vitest):
    -   `src/ingest/__tests__/normalizeRow.test.js` (signed parsing variants)
    -   `src/ingest/__tests__/buildTxKey.test.js` (key formatting & balance inclusion)
    -   `src/ingest/__tests__/categoryInference.test.js` (immediate + consensus inference)
    -   `src/utils/__tests__/strongKeyUtils.test.js` (strong key + uniqueness helpers)
        Add new tests alongside these; keep them fast & deterministic.

## Build, run, lint

-   Dev: `npm run dev` (Vite, default http://localhost:5173). Build: `npm run build`. Preview: `npm run preview`. Lint: `npm run lint`.
-   Vite env: optional `.env` with `VITE_API_BASE_URL=https://...` for the auth `/me` endpoint. `vite.config.js` pre-optimizes `jwt-decode`.

## When adding features

-   Prefer adding store actions in `budgetStore.js`; do not write directly to localStorage except for auth token handling in `utils/auth.js`.
-   Maintain immutability and persistence boundaries: avoid persisting `sessionExpired` and `hasInitialized` (see `partialize`).
-   For transactions, always normalize amounts and dedupe with the strong key (`getStrongTransactionKey` / `buildTxKey`).
-   Respect auth flow: protected pages should render under `RequireAuth`; if initiating long async flows, consider `openLoading`/`openProgress` UX.

## Useful references

-   Routes and app wiring: `src/App.jsx`
-   Store and actions: `src/state/budgetStore.js`
-   Auth utilities: `src/utils/auth.js`, `src/hooks/useAuth.js`, `src/utils/jwtUtils.js`
-   Accounts helpers: `src/utils/storeHelpers.js`, `src/utils/accountUtils.js`
-   Developer guide (category rules & savings queue): `docs/developer/category-rules-and-savings-queue.md`
-   Recurring analysis: `src/utils/analysisUtils.js`

```tip
For quick store inspection during dev, `App.jsx` exposes `window.useBudgetStore`.
```
