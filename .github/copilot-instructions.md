# Copilot instructions for budget-app-solo

These notes teach AI agents how to work productively in this repo. Keep them short, specific, and rooted in the current code.

## Big picture

-   Frontend-only React 18 + Vite app with Chakra UI and Zustand (persisted to localStorage under key `budget-app-storage`).
-   App routes: `planner`, `tracker`, `accounts`, `login` via React Router in `src/App.jsx`. `Accounts` is protected by `RequireAuth` and a session lock overlay.
-   Global state lives in `src/state/budgetStore.js`. Actions mutate state via `set((state) => ...)` and are persisted; transient auth flags (`sessionExpired`, `hasInitialized`) are intentionally not persisted.
-   Data domains:
    -   Budget planning: `incomeSources`, `expenses`, scenarios (`scenarios` map), `monthlyPlans`, `monthlyActuals` keyed by `YYYY-MM`.
    -   Savings: `savingsGoals` array and `savingsLogs` map keyed by `YYYY-MM`.
    -   Accounts/transactions: `accounts` and `accountMappings`, with CSV-imported transactions; deduping uses `getTransactionKey`.

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
-   Transactions: amounts normalized to absolute values; types are `income | expense | savings`. Uniqueness key: `${date}|${amount.toFixed(2)}|${description.toLowerCase().trim()}`.
-   `addTransactionsToAccount` dedupes via `getTransactionKey` and sorts by `date` ascending.
-   Scenarios are deep-cloned with JSON stringify/parse when saved/loaded. Keep actions pure and return new arrays/objects.
-   Savings logs live in `savingsLogs[month] = [{ id, amount, date, goalId|null, ... }]` and support add/update/delete/reset helpers.

## UI patterns and cross-component comms

-   Chakra UI throughout; modals: `LoadingModal`, `ProgressModal`, `ConfirmModal` are controlled via store actions: `openLoading/closeLoading`, `openProgress/updateProgress/closeProgress`.
-   Feature folders: `features/accounts`, `features/planner`, `features/tracker`; shared components in `src/components`.
-   `findRecurringTransactions` in `utils/analysisUtils.js` groups by normalized vendor description; use it to surface recurring expenses from account txns.

## Build, run, lint

-   Dev: `npm run dev` (Vite, default http://localhost:5173). Build: `npm run build`. Preview: `npm run preview`. Lint: `npm run lint`.
-   Vite env: optional `.env` with `VITE_API_BASE_URL=https://...` for the auth `/me` endpoint. `vite.config.js` pre-optimizes `jwt-decode`.

## When adding features

-   Prefer adding store actions in `budgetStore.js`; do not write directly to localStorage except for auth token handling in `utils/auth.js`.
-   Maintain immutability and persistence boundaries: avoid persisting `sessionExpired` and `hasInitialized` (see `partialize`).
-   For transactions, always normalize amounts and dedupe with `getTransactionKey` to avoid duplicates on re-import.
-   Respect auth flow: protected pages should render under `RequireAuth`; if initiating long async flows, consider `openLoading`/`openProgress` UX.

## Useful references

-   Routes and app wiring: `src/App.jsx`
-   Store and actions: `src/state/budgetStore.js`
-   Auth utilities: `src/utils/auth.js`, `src/hooks/useAuth.js`, `src/utils/jwtUtils.js`
-   Accounts helpers: `src/utils/storeHelpers.js`, `src/utils/accountUtils.js`
-   Recurring analysis: `src/utils/analysisUtils.js`

```tip
For quick store inspection during dev, `App.jsx` exposes `window.useBudgetStore`.
```
