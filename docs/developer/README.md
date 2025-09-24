# Developer Documentation Hub

Central index for all developer-facing docs, architecture notes, and extension guides.

For process & quality checklist see: `../../CONTRIBUTING.md` (contribution workflow & PR requirements).

## Core Architecture

-   **App Overview & State Domains:** `.github/copilot-instructions.md` (AI + human quick reference)
-   **Ingestion Refactor Plan / Status:** `../ingestion-refactor-plan.md`
-   **Category Rules & Savings Queue Guide:** `./category-rules-and-savings-queue.md`
-   **Contribution Guide:** `../../CONTRIBUTING.md`

## Key Code Areas

| Concern                   | Location                                    |
| ------------------------- | ------------------------------------------- |
| Global Store (Zustand)    | `src/state/budgetStore.js`                  |
| Ingestion Pipeline        | `src/ingest/`                               |
| Category Inference Rules  | `src/ingest/categoryRules.js`               |
| Savings Review Modal Flow | `src/components/SavingsReviewModal.jsx`     |
| Benchmark Panel           | `src/dev/IngestionBenchmark.jsx`            |
| Strong Key Builder        | `src/ingest/buildTxKey.js`                  |
| Auth Utilities            | `src/utils/auth.js`, `src/hooks/useAuth.js` |
| Recurring Analysis        | `src/utils/analysisUtils.js`                |

## Testing

Current test coverage focuses on ingestion normalization, strong key, category inference, and uniqueness helpers. Add new spec files adjacent to the module under test (e.g., `__tests__` directory in the same feature or utility folder).

## Conventions

-   **Dates:** `YYYY-MM-DD` for daily, `YYYY-MM` for monthly.
-   **Amounts:** Store absolute value in `amount`; signed original in `rawAmount` (used for strong key and classification).
-   **Strong Transaction Key:** `accountNumber|YYYY-MM-DD|signedAmount|normalized description[|bal:balance]` (single source of truth for dedupe/idempotency).
-   **Immutability:** Always produce new arrays/objects in store setters; avoid mutating in-place.
-   **Undo Tagging:** Imported txns receive `importSessionId` and `staged` until finalized.

## Performance & Benchmarking

Use the Developer Settings toggle to enable the ingestion benchmark panel. Capture baselines (5k/10k/60k/100k) before and after performance-sensitive changes; compare throughput (rows/sec) & duplicate ratios.

## Extensibility Targets

| Area                | Planned Enhancements                                    |
| ------------------- | ------------------------------------------------------- |
| Category Inference  | Custom user rules, audit panel, confidence scoring      |
| Savings Queue       | Auto-link heuristics, goal guessing, batch actions      |
| Streaming Ingestion | Worker offload, memory sampling, rolling telemetry      |
| Telemetry History   | Persisted trend charts for duplicate / inference ratios |
| Settings            | Export/import JSON, per-account overrides               |

## Contribution Checklist (Internal)

Before merging a change that touches ingestion, keys, or savings logic:

-   [ ] Added/updated tests
-   [ ] Updated any relevant doc (this hub, specific guide, or plan)
-   [ ] Benchmarked (if affecting ingestion performance)
-   [ ] Verified undo & savings flows still function
-   [ ] Confirmed lint & test suite pass (`npm run lint` / `npm test`)

## Quick Commands

```bash
npm run dev      # Start Vite dev server
npm test         # Run Vitest suite
npm run lint     # ESLint all sources
npm run build    # Production bundle
```

## Open Doc Slots

Planned future docs to add under this folder:

-   `rules-audit-panel.md`
-   `telemetry-history-and-metrics.md`
-   `streaming-ingestion-architecture.md`

---

End of hub.
