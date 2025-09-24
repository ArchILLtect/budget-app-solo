# Contributing to Budget App

Thanks for your interest in improving this project! This document outlines the lightweight process and the key conventions you should follow. For deeper architectural context and extension guides, ALWAYS start with the Developer Documentation Hub:

> See: `docs/developer/README.md` (Developer Documentation Hub)

## 🔍 Where to Look First

| Need                                   | Start Here                                                     |
| -------------------------------------- | -------------------------------------------------------------- |
| App architecture & state domains       | `.github/copilot-instructions.md` (quick/high-signal overview) |
| Deeper docs & extension guides         | `docs/developer/README.md`                                     |
| Category rules & savings queue details | `docs/developer/category-rules-and-savings-queue.md`           |
| Ingestion refactor status roadmap      | `docs/ingestion-refactor-plan.md`                              |

## 🛠 Local Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest suite
npm run lint     # ESLint
```

## ✅ PR / Change Checklist

Before opening a PR (or completing a local change you plan to keep):

-   [ ] Tests added/updated for any logic change (especially ingestion, keys, category inference, savings flows)
-   [ ] Docs updated IF you touched ingestion, rules, savings logic, or added a new concept (hub + specific guide if applicable)
-   [ ] Ingestion benchmark re-run if performance-sensitive (`Settings > Developer > Show Ingestion Benchmark Panel`)
-   [ ] Verified undo staging works for any new ingestion path (import, undo, re-import idempotency)
-   [ ] Confirmed strong transaction key usage (`buildTxKey` / `getStrongTransactionKey`) for all new txn logic
-   [ ] Lint & tests pass (`npm run lint` / `npm test`)

## 🧱 Core Conventions (Must Not Break)

1. Strong Transaction Key is the single source of truth for dedupe & idempotency:
   `accountNumber|YYYY-MM-DD|signedAmount|normalized description[|bal:balance]`
2. Store mutations: always return new objects/arrays; no in-place mutation of nested arrays.
3. Amount storage: `amount` is absolute; `rawAmount` preserves original sign.
4. Dates: months `YYYY-MM`, days `YYYY-MM-DD`.
5. Imported txns get `importSessionId` + `staged` until finalized (enables undo).

## 🧪 Testing Guidelines

-   Co-locate tests under a `__tests__` folder adjacent to the module (follow existing patterns under `src/ingest/` & `src/utils/`).
-   Keep tests deterministic and fast—no network, no timers unless mocked.
-   For new inference logic: add at least one test asserting category source attribution.
-   For performance-sensitive ingestion adjustments: optionally capture benchmark before & after (document results in PR description if material).

## 📈 Benchmarking

Use the ingestion benchmark panel for synthetic scale validation. Capture baselines (5k/10k/60k/100k) before large refactors. Watch:

-   Throughput (rows/sec)
-   Duplicate ratio
-   Early short-circuit count
-   Stage timing shifts (normalize / classify / infer / key / dedupe / consensus)

If a change regresses throughput > ~5% at 10k+ scale, investigate before merging unless justified.

## 🧩 Extending Category Rules

Add or adjust rule logic in the dedicated category rules module (see hub for file path). Update the Category Rules & Savings Queue guide if semantics change or new rule sources added. Include telemetry counters where relevant.

## 💾 Savings Queue Enhancements

If adding heuristics (auto-linking, goal inference):

-   Keep logic pure and testable.
-   Provide an opt-out path if introducing automation.
-   Log or attribute heuristic decisions for future audit panel integration.

## 🔐 Auth & Session Notes

-   Do not persist `sessionExpired` or `hasInitialized` (see store partialize logic).
-   Treat token handling only via `utils/auth.js` utilities.

## 🧼 Documentation Hygiene

Whenever a change introduces or removes a concept, ask: Does the hub need a new row? Does an existing guide need an updated section? Avoid duplicating narrative across multiple docs—link instead.

## 🧭 Issue / Idea Triage (Internal Roadmap Buckets)

| Area          | Examples                                                      |
| ------------- | ------------------------------------------------------------- |
| Performance   | Worker offload, memory sampling, streaming parser refinements |
| Observability | Telemetry history, inference audit panel                      |
| UX Flow       | Batch savings actions, improved recurring expense surfacing   |
| Extensibility | Custom user category rules, export/import settings            |

## 🙋 Questions

If something is ambiguous: open a small draft PR or add a placeholder section in the docs hub flagged with a TODO—better to leave a breadcrumb than silent drift.

Happy budgeting & building!
