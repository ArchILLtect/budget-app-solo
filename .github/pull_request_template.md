## PR Title

Concise summary (imperative): e.g. "Refactor ingestion key builder to support balance suffix".

## Summary

What changed and why? Mention any performance, UX, or data model implications.

## Checklist

-   [ ] Tests added/updated (logic, edge cases) OR not needed (explain below)
-   [ ] Lint passes (`npm run lint`)
-   [ ] Test suite passes (`npm test`)
-   [ ] Updated docs (Developer Hub / specific guide / plan) if concepts changed
-   [ ] Ingestion benchmark considered (ran if perf-sensitive)
-   [ ] Strong transaction key used consistently (no ad-hoc keys)
-   [ ] Undo staging still works (if touching ingestion / transactions)
-   [ ] Savings queue logic unchanged or tests updated

## Screens / Evidence (if UI or perf related)

| Type | Before | After |
| ---- | ------ | ----- |
| UI   | (img)  | (img) |

Perf (if applicable):

```
Baseline: rows=10000 ingestMs=___ processMs=___ rows/sec=___ duplicateRatio=__%
After:    rows=10000 ingestMs=___ processMs=___ rows/sec=___ duplicateRatio=__%
Delta: +/__ % throughput
```

## Doc Updates

List modified docs or confirm N/A.

## Notes / Follow-ups

Optional future tasks or constraints.

---

Closes: # (issue link if applicable)
