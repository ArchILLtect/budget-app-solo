# CSV / Apply-to-Budget Ingestion Refactor Plan (STATUS UPDATE)

Purpose: Replace the monolithic, modal-blocking, multi-write transaction import & apply flow with a pure, testable, atomic, resumable pipeline that improves correctness, UX, and performance.

Last Update: 2025-09-24 (baseline capture + early dedupe short-circuit + benchmark enhancements)

## High-Level Goals

-   Pure ingestion pipeline (parse → normalize → classify → dedupe → aggregate) returns a patch + savings queue. ✅ (pipeline exists; savings queue still placeholder)
-   Atomic state apply (1–2 writes). ✅ (dev harness uses single patch apply)
-   Decoupled savings linking (queue). ✅ (store API ready; not yet wired to ingestion pipeline)
-   Deterministic dedupe & idempotent re-import (manifest + strong key). ✅
-   Preview (“dry run”) before mutation. ✅ (dev harness = preview; production modal pending)
-   Optional rollback (“Undo last import”). ✅ (session-scoped undo implemented with time-window enforcement)
-   Streaming / worker & progress. ☐ (planned Phase 5)
-   Observability (stats, errors panel). Partially ✅ (basic stats + duplicate breakdown + row errors list)

## Success Metrics (tracking)

-   5k row import timing baseline: ☐ (not captured)
-   Re-import identical file newCount = 0: ✅
-   Writes per import ≤2: ✅ (current dev flow)
-   No savings-link deadlock: ✅ (previous fix)
-   Lint/build clean after changes: ✅

## Phase Status Overview

| Phase | Description                                    | Status       | Notes                                                    |
| ----- | ---------------------------------------------- | ------------ | -------------------------------------------------------- |
| 0     | Baseline & fixes                               | 2/3 complete | Timing baseline missing                                  |
| 1     | Extract pure ingestion                         | ✅ Complete  | Modules created & integrated                             |
| 2     | Stronger dedupe & manifest                     | ✅ Complete  | Legacy key removed; SHA-256 added                        |
| 2b    | Signed parsing & duplicate diagnostics (added) | ✅           | Negative parsing, signed keys, breakdown                 |
| 2c    | Category inference engine (added)              | ✅           | Keyword + regex + consensus pass                         |
| 3     | Production preview modal                       | ✅ Complete  | ImportTransactionsModal + confirm summary                |
| 4     | Savings queue apply sequencing                 | ✅ Partial   | Queue populated & modal triggered; linking UX present    |
| 5     | Streaming (PapaParse worker)                   | ✅ Partial   | Streaming parser + prod modal integration + real % bar   |
| 6     | Error & Undo support                           | ✅ Partial   | Undo implemented; error panel scaffolding + type tagging |
| 7     | Prefetch / perf polish                         | In Progress  | Baseline + short-circuit implemented                     |
| 8     | Final docs & cleanup                           | Partial      | README TODOs updated; plan needs ongoing sync            |

## Phase 0 – Baseline & Current Fixes

-   [x] Promise-based savings linking (awaitSavingsLink / resolveSavingsLink)
-   [x] Remove effect-driven autosaves / loops in Planner & linking flow
-   [x] Capture baseline timings (synthetic 5k/10k/60k/100k via benchmark Capture Baseline)

## Phase 1 – Extract Pure Ingestion

-   [x] Create `src/ingest/` directory
-   [x] Add modules: `parseCsv.js`, `normalizeRow.js`, `classifyTx.js`, `buildTxKey.js`, `runIngestion.js`, `buildPatch.js`
-   [x] Move parsing & loop logic into `runIngestion.js` (pure)
-   [x] runIngestion accepts explicit deps (no store access)
-   [ ] Unit-test `normalizeRow` & `buildTxKey` (basic test scaffold added earlier; signed cases test still pending)

## Phase 2 – Stronger Dedupe & Manifest

(Original checklist adjusted to reflect final implementation)

-   [x] Implement improved key (now: `account|date|signedAmount|normalized description[|bal:balance]`)
-   [x] Remove legacy key (dev-only; no migration needed)
-   [x] Add `importManifests` with SHA-256 short hash
-   [x] Warning on re-import (dev harness)
-   [x] Duplicate breakdown (existing vs intra-file)
-   [x] Signed amount parsing (parentheses, trailing sign, etc.)
-   [x] Account number auto-detect from CSV
-   [x] SHA-256 hashing upgrade (replaces quick hash)

## Phase 2c – Category Inference (NEW)

-   [x] Inference engine (`inferCategory`) with:
    -   [x] Normalization + prefix stripping
    -   [x] Keyword map
    -   [x] Regex rules
    -   [x] Vendor root consensus pass
-   [x] Config file (`categoryRules.js`)
-   [x] Telemetry counts (per inference method) returned in stats
-   [ ] Dev audit panel for inferred vs original
-   [ ] Persistence of user-defined rules

## Phase 3 – Dry Run Preview (Production Integration)

-   [x] `ImportTransactionsModal` implemented (production UI)
-   [x] Pipeline invocation decoupled; modal drives ingestion
-   [x] User confirm -> apply patch; cancel -> discard
-   [x] Summary panel (new, duplicates, category inference source breakdown + percentages)
-   [x] Telemetry persisted (last run) in store
-   [ ] Replace title attributes with Chakra Tooltip components (follow‑up UX polish)
-   [ ] Visualization (sparkline / mini bars) for category source distribution
-   [ ] Maintain telemetry history (multi-run trend analytics)

## Phase 4 – Atomic Apply & Savings Queue

-   [x] Populate `savingsQueue` (collect classified `savings` txns)
-   [x] Invoke savings linking flow AFTER patch commit (modal auto-opens)
-   [x] Toast on queue presence (count)
-   [x] Heuristic skip of internal transfers (patterns: "internal transfer", "xfer to checking", etc.)
-   [x] Tag new transactions with `importSessionId` (undo prep)
-   [x] Include `originalTxId` & `importSessionId` in queue entries
-   [ ] Optional: batch-add small savings (< threshold) without review
-   [ ] Optional: configurable skip patterns per user/account

## Phase 5 – Streaming & Progress

-   [x] Added `parseCsvStreaming.js` (chunk-based Papa wrapper)
-   [x] Added `IngestionStreamingHarness` dev component (row progress)
-   [x] `runIngestion` now accepts `parsedRows` for streamed invocation
        -- [x] Integrate streaming path in production modal (progress UI + abort)
-   [x] Adaptive strategy: auto-switch to streaming above configurable row/byte threshold
-   [x] Configurable streaming auto-thresholds (line/KB) surfaced in Settings
-   [x] User cancel mid-stream (abort controller)
        -- [x] Progress bar: real % based on total line count estimation
-   [x] Early dedupe short-circuit (skip classify/infer when duplicate detected pre-classify)
-   [ ] Memory profile check with large sample file
-   [ ] Enable PapaParse worker mode for off-main-thread parsing
-   [ ] Rolling duplicate ratio display during stream
-   [ ] Backpressure: batch classification every N rows (tunable) instead of per-row accumulation
-   [ ] Interim telemetry snapshot (rows/sec, duplicate %, category inference hit %)
-   [ ] Info tooltip in modal showing current streaming thresholds (lines / KB)
-   [ ] Telemetry event whenever auto-toggle to streaming triggers (for tuning thresholds)
-   [ ] Per-file temporary threshold override control (raise/lower just for this import)
-   [ ] Global "Always use streaming" user flag / quick toggle

## Phase 6 – Error & Undo Support

-   [x] Collect row errors (basic)
-   [x] Capture line numbers
-   [x] Tag error types (parse/normalize/duplicate) (initial tagging: normalize+duplicate; parse to follow when parser surfaces structured errors)
        -- [x] Display collapsible error panel (baseline + filters + counts + export + color)
-   [x] Tag imported txns with `importSessionId`
-   [x] Implement `undoLastImport(sessionId)` action (time-window guarded; batch undo supported)
-   [x] Visual differentiation for partially undone vs fully undone sessions (badges, progress bars)
-   [x] Download errors CSV button (optional)
-   [x] Show counts per filter button (optional)
-   [x] Color-code error rows by type (optional UI polish)
-   [x] Surface true parse-time errors (parser + streaming structured failures)
-   [ ] Tooltip legend for color coding (basic disabled legend button present)
-   [ ] Debounce & large export warning for CSV (basic debounce + warning implemented; enhance?)
-   [ ] Virtualized error list for >5k errors
-   [ ] Flag removed transactions explicitly (`_removedDuringUndo`) and surface in UI
-   [ ] Legend near session menu explaining color meanings (staged/applied/partial)
-   [ ] Tooltip on progress bars with applied vs remaining vs removed counts

## Phase 7 – Prefetch & Performance Polish

-   [x] Prefetch ingestion bundle on hover/focus of import trigger (lazy load + hover dynamic import)
-   [x] Timing metrics surfaced (ingest/process/parse ms, rows/sec, duplicate ratio) (metrics panel)
-   [x] Per-stage timing breakdown (normalize / classify / infer / key / dedupe / consensus)
-   [ ] Capture baseline snapshot (5k & 10k rows) using new metrics (next)
-   [x] Dev helper `IngestionBenchmark` component scaffolded (run synthetic benchmark, export JSON) — now mountable via debug toggle in settings.
-   [ ] (Optional) Code-split savings modals
-   [x] Automated benchmark mounting behind debug toggle (dev-only)

### Phase 7 – Next Suggested Steps (UPDATED)

-   [x] Capture baseline with default fractions (synthetic; auto-download JSON)
-   [x] Implement early dedupe short-circuit & rerun benchmark; metric `earlyShortCircuits` added
-   [ ] Add memory sampling (Performance API or coarse heap snapshot) for large (10k+) synthetic files
-   [ ] (Optional) Persist baseline results for regression comparison (localStorage / file)

## Phase 8 – Documentation & Clean-Up

-   [x] README future enhancement TODOs for category inference
-   [ ] Update `.github/copilot-instructions.md` with new ingestion modules (partial)
-   [x] Add signed amount parsing tests (`normalizeRow.test.js`)
-   [x] Add key construction tests (`buildTxKey.test.js`)
-   [x] Add category inference coverage tests (`categoryInference.test.js`)
-   [ ] Migrate legacy `SyncAccountsModal` CSV path to use `runIngestion` pipeline (currently still using ad-hoc parsing + legacy key helper)
-   [x] Metrics panel developer doc (README section + instructions)
-   [x] Persist baseline benchmark snapshots (localStorage)
-   [ ] Remove any obsolete legacy import utilities still in repo
-   [x] Developer guide: extending category rules & savings queue

## Recently Completed (Post Original Plan)

-   Strong key with balance variant
-   Signed amount + rawAmount classification
-   SHA-256 hashing
-   Category inference engine (keywords, regex, consensus)
-   Account auto-detect from CSV
-   Duplicate diagnostics (sample + breakdown)

## New / Outstanding ACTION ITEMS (Prioritized)

1. Streaming parser full integration in production modal (done)
2. Category inference visualization & tooltip polish (sparklines + method %)
3. Telemetry history & persistent ingestion analytics (dedupe ratio trends)
4. Error panel: line numbers + expandable list (counts/color/export done; parse surfacing + virtualization next)
5. Visual distinctions + badges for partial applied / partial undone across UI (done)
6. Performance baseline capture (5k/10k row timing; rows/sec + memory snapshot) (ADD: use new benchmark toggle + baseline task)
7. Unit tests: signed amount parsing, dedupe key collisions, inference consensus edge cases
8. Savings queue enhancements (auto-link small savings; configurable skip patterns)
9. Worker offload (PapaParse worker mode + main-thread status channel)
10. Settings enhancements: per-account overrides, export/import settings JSON
11. Maintenance log (prune/expire events persisted with timestamp)
12. Dev audit panel for inference (accept/reject rule evolution)
13. Early dedupe short-circuit (then re-benchmark) (DONE)
14. Memory sampling integration (NEW)

## Open Questions

-   Should savings transactions be auto-tagged with a goal guess (pattern-based) before review? (Y/N)
-   Do we want per-account configurable custom keyword maps vs global?
-   Retain balance in key or move to auxiliary uniqueness test only? (Current: included when valid)

## Next Recommended Step

Integrate the streaming parser path and progress reporting into the production `ImportTransactionsModal`, then add the error panel + telemetry visualization (unblocks performance measurement and richer analytics history).

---

### Developer Guide Reference

The detailed guide for extending category inference rules and enhancing the savings queue was moved to:

`docs/developer/category-rules-and-savings-queue.md`

Update that document when adding new rule sources, heuristics, or telemetry.

(Continue checking boxes here as work proceeds.)
