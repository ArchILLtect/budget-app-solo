import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTotalTaxes, calculateNetIncome } from '../utils/calcUtils';
import { getStrongTransactionKey } from '../utils/storeHelpers';
import dayjs from 'dayjs';

// TODO: Allow users to change overtime threshold and tax rates

const currentMonth = dayjs().format('YYYY-MM'); // e.g. "2025-07"

export const useBudgetStore = create(
    persist(
        (set) => ({
            ORIGIN_COLOR_MAP: {
                csv: 'purple',
                ofx: 'green',
                plaid: 'red',
                manual: 'blue',
            },
            currentPage: 'planner', // or null initially
            user: null, // User object will be set after login
            filingStatus: 'headOfHousehold', // 'single' | 'marriedSeparate' | 'marriedJoint' | 'headOfHouseHold'
            incomeSources: [
                {
                    id: 'primary',
                    description: 'Primary Job',
                    type: 'hourly',
                    hourlyRate: 25,
                    hoursPerWeek: 40,
                    grossSalary: 52000,
                    state: 'WI',
                    createdAt: new Date().toISOString(),
                },
            ],
            scenarios: {
                Main: {
                    name: 'Main',
                    incomeSources: [
                        {
                            id: 'primary',
                            description: 'Primary Job',
                            type: 'hourly',
                            hourlyRate: 25,
                            hoursPerWeek: 40,
                            grossSalary: 0,
                            state: 'WI',
                        },
                    ],
                    expenses: [
                        { id: 'rent', name: 'Rent', description: 'Rent', amount: 0 },
                    ],
                    savingsMode: '20',
                    filingStatus: 'single', // 'single' | 'marriedSeparate' | 'marriedJoint' | 'headOfHouseHold'
                },
                College: {
                    name: 'College',
                    incomeSources: [
                        {
                            id: 'primary',
                            description: 'Primary Job',
                            type: 'hourly',
                            hourlyRate: 25,
                            hoursPerWeek: 20,
                            grossSalary: 52000,
                            state: 'WI',
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    expenses: [
                        { id: 'rent', name: 'Rent', description: 'Rent', amount: 1000 },
                    ],
                    filingStatus: 'single', // 'single' | 'marriedSeparate' | 'marriedJoint' | 'headOfHouseHold'
                    customSavings: 0,
                    savingsMode: '10',
                },
            },
            expenses: [
                { id: 'rent', name: 'Rent', description: 'Rent', amount: 1600 },
                {
                    id: 'groceries',
                    name: 'Groceries',
                    description: 'Groceries',
                    amount: 400,
                },
                { id: 'phone', name: 'Phone', description: 'Phone', amount: 100 },
            ],
            savingsMode: 'none', // 'none' | '10' | '20' | 'custom'
            customSavings: 0,
            currentScenario: 'Main',
            // 📅 Current month being tracked
            selectedMonth: currentMonth,
            selectedSourceId: 'primary',
            showPlanInputs: false, // Controls visibility of input fields
            showActualInputs: false,
            showIncomeInputs: false,
            showExpenseInputs: true,
            showSavingsLogInputs: true,
            showGoalInputs: true,
            showRecurringTXs: false,
            savingsGoals: [{ id: 'yearly', name: 'Yearly Savings Goal', target: 10000 }],
            savingsLogs: {}, // key: '2025-07', value: [{ amount, date }]
            monthlyPlans: {},
            // 📊 Actuals for the month
            monthlyActuals: {},
            sessionExpired: false,
            hasInitialized: false,
            isDemoUser: false,
            accountMappings: {},
            accounts: {},
            // Staging model: savings queue entries per account waiting for budget application
            pendingSavingsByAccount: {}, // { [accountNumber]: [queueEntry, ...] }
            savingsReviewQueue: [],
            // Persisted import history for audit & undo (latest first)
            importHistory: [], // [{ sessionId, accountNumber, importedAt, newCount, dupesExisting, dupesIntraFile, savingsCount, hash, undoneAt? }]
            // Optional refinement TODOs (staging/import lifecycle):
            // - (Optional) Centralize per-session runtime status computation (active/applied/partial/expired/undone) as a derived selector to DRY logic across UI components.
            // - (Optional) Persist lightweight analytics (e.g. avg dedupe ratio, category inference hit rate) for future insights panel.
            // - (Optional) Add background worker for streaming CSV parse & progressive dedupe feedback.
            // - (Optional) Expose a settings UI to adjust undo window, auto-expiration days, and import history retention size.
            importUndoWindowMinutes: 30, // configurable (future settings panel) window in which a staged session can be undone
            importHistoryMaxEntries: 30,
            importHistoryMaxAgeDays: 30,
            stagedAutoExpireDays: 30,
            // Streaming auto-toggle thresholds (user configurable)
            streamingAutoLineThreshold: 3000, // lines
            streamingAutoByteThreshold: 500_000, // bytes (~0.5MB)
            // Dev-only benchmark panel toggle (not persisted via partialize for safety)
            showIngestionBenchmark: false,
            isSavingsModalOpen: false,
            resolveSavingsPromise: null,
            isLoadingModalOpen: false,
            loadingHeader: '',
            isConfirmModalOpen: false,
            isProgressOpen: false,
            progressHeader: '',
            progressCount: 0,
            progressTotal: 0,
            isLoading: false,
            setIsLoading: (val) => set({ isLoading: val }),
            // Phase 2: import manifests (file hash -> accounts -> metadata)
            importManifests: {},
            // Last ingestion telemetry (persisted for tuning)
            lastIngestionTelemetry: null,
            setLastIngestionTelemetry: (telemetry) =>
                set(() => ({ lastIngestionTelemetry: telemetry })),
            registerImportManifest: (hash, accountNumber, meta) =>
                set((state) => {
                    const existing = state.importManifests[hash] || {
                        firstImportedAt: new Date().toISOString(),
                        accounts: {},
                        size: meta?.size || 0,
                        sampleName: meta?.sampleName || '',
                    };
                    return {
                        importManifests: {
                            ...state.importManifests,
                            [hash]: {
                                ...existing,
                                accounts: {
                                    ...existing.accounts,
                                    [accountNumber]: {
                                        importedAt: new Date().toISOString(),
                                        newCount: meta?.newCount ?? 0,
                                        dupes: meta?.dupes ?? 0,
                                    },
                                },
                            },
                        },
                    };
                }),
            // Phase 4: process savings queue after ingestion apply
            processSavingsQueue: (entries) =>
                set((state) => {
                    if (!entries || !entries.length) return {};
                    // Merge with any existing queue; open modal
                    const merged = [...(state.savingsReviewQueue || []), ...entries];
                    return {
                        savingsReviewQueue: merged,
                        isSavingsModalOpen: true,
                    };
                }),
            // --- Staging model helpers ---
            addPendingSavingsQueue: (accountNumber, entries) =>
                set((state) => {
                    if (!entries || !entries.length) return {};
                    const current = state.pendingSavingsByAccount[accountNumber] || [];
                    return {
                        pendingSavingsByAccount: {
                            ...state.pendingSavingsByAccount,
                            [accountNumber]: current.concat(entries),
                        },
                    };
                }),
            clearPendingSavingsForAccount: (accountNumber) =>
                set((state) => {
                    if (!state.pendingSavingsByAccount[accountNumber]) return {};
                    const next = { ...state.pendingSavingsByAccount };
                    delete next[accountNumber];
                    return { pendingSavingsByAccount: next };
                }),
            markTransactionsBudgetApplied: (accountNumber, months) =>
                set((state) => {
                    const acct = state.accounts[accountNumber];
                    if (!acct?.transactions) return {};
                    const monthSet = months ? new Set(months) : null; // null means all
                    let changed = false;
                    const updated = acct.transactions.map((tx) => {
                        if (tx.staged && !tx.budgetApplied) {
                            const txMonth = tx.date?.slice(0, 7);
                            if (!monthSet || monthSet.has(txMonth)) {
                                changed = true;
                                return { ...tx, staged: false, budgetApplied: true };
                            }
                        }
                        return tx;
                    });
                    if (!changed) return {};
                    return {
                        accounts: {
                            ...state.accounts,
                            [accountNumber]: { ...acct, transactions: updated },
                        },
                    };
                }),
            processPendingSavingsForAccount: (accountNumber, months) =>
                set((state) => {
                    const pending = state.pendingSavingsByAccount[accountNumber] || [];
                    if (!pending.length) return {};
                    const monthSet = months ? new Set(months) : null;
                    const toQueue = monthSet
                        ? pending.filter((e) => monthSet.has(e.month))
                        : pending;
                    if (!toQueue.length) return {};
                    const remaining = monthSet
                        ? pending.filter((e) => !monthSet.has(e.month))
                        : [];
                    return {
                        pendingSavingsByAccount: {
                            ...state.pendingSavingsByAccount,
                            [accountNumber]: remaining,
                        },
                        savingsReviewQueue: [
                            ...(state.savingsReviewQueue || []),
                            ...toQueue,
                        ],
                        isSavingsModalOpen: true,
                    };
                }),
            recordImportHistory: (entry) =>
                set((state) => {
                    const maxEntries = state.importHistoryMaxEntries || 30;
                    const filtered = state.importHistory.filter(
                        (e) => e.sessionId !== entry.sessionId // replace if duplicate
                    );
                    const updated = [entry, ...filtered].slice(0, maxEntries);
                    return { importHistory: updated };
                }),
            pruneImportHistory: (maxEntries = 30, maxAgeDays = 30) =>
                set((state) => {
                    const effectiveMaxEntries =
                        state.importHistoryMaxEntries || maxEntries;
                    const effectiveMaxAgeDays =
                        state.importHistoryMaxAgeDays || maxAgeDays;
                    const cutoff = Date.now() - effectiveMaxAgeDays * 86400000;
                    const pruned = state.importHistory
                        .filter((h) => {
                            const t = Date.parse(h.importedAt);
                            return Number.isFinite(t) ? t >= cutoff : true;
                        })
                        .slice(0, effectiveMaxEntries); // keep newest already at front
                    if (pruned.length === state.importHistory.length) return {};
                    return { importHistory: pruned };
                }),
            expireOldStagedTransactions: (maxAgeDays = 30) =>
                set((state) => {
                    let changed = false;
                    const effectiveDays = state.stagedAutoExpireDays || maxAgeDays;
                    const cutoff = Date.now() - effectiveDays * 86400000;
                    const accounts = { ...state.accounts };
                    for (const acctNum of Object.keys(accounts)) {
                        const acct = accounts[acctNum];
                        if (!acct?.transactions) continue;
                        let acctChanged = false;
                        const txns = acct.transactions.map((tx) => {
                            if (tx.staged && !tx.budgetApplied) {
                                const hist = state.importHistory.find(
                                    (h) => h.sessionId === tx.importSessionId
                                );
                                if (hist) {
                                    const t = Date.parse(hist.importedAt);
                                    if (Number.isFinite(t) && t < cutoff) {
                                        changed = true;
                                        acctChanged = true;
                                        return {
                                            ...tx,
                                            staged: false,
                                            budgetApplied: true,
                                            autoApplied: true,
                                        };
                                    }
                                }
                            }
                            return tx;
                        });
                        if (acctChanged) {
                            accounts[acctNum] = { ...acct, transactions: txns };
                        }
                    }
                    return changed ? { accounts } : {};
                }),
            undoStagedImport: (accountNumber, sessionId) =>
                set((state) => {
                    const acct = state.accounts[accountNumber];
                    if (!acct?.transactions) return {};
                    const hist = state.importHistory.find(
                        (h) =>
                            h.sessionId === sessionId && h.accountNumber === accountNumber
                    );
                    if (!hist) return {};
                    // Enforce undo window & not already undone
                    if (hist.undoneAt) return {};
                    const windowMs = (state.importUndoWindowMinutes || 30) * 60000;
                    const importedTime = Date.parse(hist.importedAt);
                    if (
                        Number.isFinite(importedTime) &&
                        Date.now() - importedTime > windowMs
                    ) {
                        return {}; // expired; cannot undo
                    }
                    let removed = 0;
                    const remainingTx = acct.transactions.filter((tx) => {
                        const match = tx.importSessionId === sessionId && tx.staged;
                        if (match) removed++;
                        return !match; // remove if staged and session matches
                    });
                    if (!removed) return {}; // nothing staged to undo (already applied?)
                    // Filter pending savings entries for this session
                    const pending = state.pendingSavingsByAccount[accountNumber] || [];
                    const remainingPending = pending.filter(
                        (e) => e.importSessionId !== sessionId
                    );
                    // Mark history entry undoneAt & removed count
                    const importHistory = state.importHistory.map((h) =>
                        h.sessionId === sessionId &&
                        h.accountNumber === accountNumber &&
                        !h.undoneAt
                            ? { ...h, undoneAt: new Date().toISOString(), removed }
                            : h
                    );
                    return {
                        accounts: {
                            ...state.accounts,
                            [accountNumber]: { ...acct, transactions: remainingTx },
                        },
                        pendingSavingsByAccount: {
                            ...state.pendingSavingsByAccount,
                            [accountNumber]: remainingPending,
                        },
                        importHistory,
                    };
                }),
            // Derived helpers / selectors
            getImportSessionRuntime: (accountNumber, sessionId) => {
                const state = useBudgetStore.getState();
                const hist = state.importHistory.find(
                    (h) => h.sessionId === sessionId && h.accountNumber === accountNumber
                );
                if (!hist) return null;
                const acct = state.accounts[accountNumber];
                let stagedNow = 0;
                if (acct?.transactions) {
                    stagedNow = acct.transactions.filter(
                        (t) => t.importSessionId === sessionId && t.staged
                    ).length;
                }
                const removed = hist.removed || 0;
                const appliedCount = (hist.newCount || 0) - stagedNow - removed;
                const importedAtMs = Date.parse(hist.importedAt);
                const undoWindowMinutes = state.importUndoWindowMinutes || 30;
                const expiresAt = Number.isFinite(importedAtMs)
                    ? importedAtMs + undoWindowMinutes * 60000
                    : null;
                const now = Date.now();
                const expired = expiresAt ? now > expiresAt : false;
                const canUndo = !hist.undoneAt && !expired && stagedNow > 0;
                let status;
                if (hist.undoneAt) {
                    status =
                        removed > 0 && removed < hist.newCount
                            ? 'partial-undone'
                            : 'undone';
                } else if (stagedNow > 0) {
                    status = expired ? 'expired' : 'active';
                } else {
                    status =
                        appliedCount === hist.newCount ? 'applied' : 'partial-applied';
                }
                return {
                    stagedNow,
                    appliedCount,
                    removed,
                    canUndo,
                    expired,
                    status,
                    expiresAt,
                    importedAt: hist.importedAt,
                    newCount: hist.newCount,
                    savingsCount: hist.savingsCount,
                    hash: hist.hash,
                };
            },
            getAccountStagedSessionSummaries: (accountNumber) => {
                const state = useBudgetStore.getState();
                const acct = state.accounts[accountNumber];
                if (!acct?.transactions) return [];
                const bySession = new Map();
                for (const tx of acct.transactions) {
                    if (tx.staged && tx.importSessionId) {
                        bySession.set(
                            tx.importSessionId,
                            (bySession.get(tx.importSessionId) || 0) + 1
                        );
                    }
                }
                return Array.from(bySession.entries())
                    .map(([sessionId, count]) => {
                        const r = state.getImportSessionRuntime(accountNumber, sessionId);
                        return { sessionId, count, ...r };
                    })
                    .sort((a, b) =>
                        (b.importedAt || '').localeCompare(a.importedAt || '')
                    );
            },
            // Settings mutators
            updateImportSettings: (partial) =>
                set((state) => {
                    const changes = {};
                    let changed = false;
                    for (const k of Object.keys(partial || {})) {
                        if (state[k] !== partial[k] && partial[k] !== undefined) {
                            changes[k] = partial[k];
                            changed = true;
                        }
                    }
                    return changed ? changes : {};
                }),
            setShowIngestionBenchmark: (flag) => set({ showIngestionBenchmark: !!flag }),
            // Promise-based savings linking flow
            awaitSavingsLink: (entries) => {
                // enqueue and open modal, then return a promise resolved by resolveSavingsLink
                set({ savingsReviewQueue: entries, isSavingsModalOpen: true });
                return new Promise((resolve) => {
                    useBudgetStore.setState({ resolveSavingsPromise: resolve });
                });
            },
            resolveSavingsLink: (result) => {
                const resolver = useBudgetStore.getState().resolveSavingsPromise;
                if (typeof resolver === 'function') {
                    try {
                        resolver(result);
                    } catch {
                        // noop
                    }
                }
                set({
                    resolveSavingsPromise: null,
                    isSavingsModalOpen: false,
                    savingsReviewQueue: [],
                });
            },
            addMultipleSavingsLogs: (month, logs) =>
                set((state) => {
                    const current = state.savingsLogs[month] || [];
                    return {
                        savingsLogs: {
                            ...state.savingsLogs,
                            [month]: [...current, ...logs],
                        },
                    };
                }),
            openProgress: (header, total) =>
                set({
                    isProgressOpen: true,
                    progressHeader: header,
                    progressCount: 0,
                    progressTotal: total,
                }),
            updateProgress: (count) => set({ progressCount: count }),
            closeProgress: () =>
                set({
                    isProgressOpen: false,
                    progressHeader: '',
                    progressCount: 0,
                    progressTotal: 0,
                }),
            openLoading: (header) =>
                set({
                    isLoadingModalOpen: true,
                    loadingHeader: header,
                }),
            closeLoading: () =>
                set({
                    isLoadingModalOpen: false,
                    loadingHeader: '',
                }),
            setConfirmModalOpen: (open) => set({ isConfirmModalOpen: open }),
            setSavingsReviewQueue: (entries) => set({ savingsReviewQueue: entries }),
            clearSavingsReviewQueue: () => set({ savingsReviewQueue: [] }),
            setSavingsModalOpen: (open) => set({ isSavingsModalOpen: open }),
            clearAllAccounts: () => set(() => ({ accounts: {} })),
            setSessionExpired: (value) => set({ sessionExpired: value }),
            setHasInitialized: (value) => set({ hasInitialized: value }),
            setCurrentPage: (page) => set(() => ({ currentPage: page })),
            setUser: (user) => set(() => ({ user })),
            setShowPlanInputs: (value) => set(() => ({ showPlanInputs: value })),
            setShowActualInputs: (value) => set(() => ({ showActualInputs: value })),
            setShowIncomeInputs: (value) => set(() => ({ showIncomeInputs: value })),
            setShowExpenseInputs: (value) => set(() => ({ showExpenseInputs: value })),
            setShowGoalInputs: (value) => set(() => ({ showGoalInputs: value })),
            setShowRecurringTXs: (value) => set(() => ({ showRecurringTXs: value })),
            setSelectedMonth: (month) => set(() => ({ selectedMonth: month })),
            setFilingStatus: (value) => set(() => ({ filingStatus: value })),
            resetSavingsLogs: () => set(() => ({ savingsLogs: {} })),
            selectIncomeSource: (id) => set(() => ({ selectedSourceId: id })),
            setSavingsMode: (mode) => set(() => ({ savingsMode: mode })),
            setCustomSavings: (value) => set(() => ({ customSavings: value })),
            setScenario: (name) => set({ currentScenario: name }),
            setIsDemoUser: (val) => set({ isDemoUser: val }),
            setShowSavingsLogInputs: (value) =>
                set(() => ({ showSavingsLogInputs: value })),
            addOrUpdateAccount: (accountNumber, data) =>
                set((state) => ({
                    accounts: {
                        ...state.accounts,
                        [accountNumber]: {
                            ...(state.accounts[accountNumber] || {}),
                            ...data,
                        },
                    },
                })),
            addTransactionsToAccount: (accountNumber, transactions) =>
                set((state) => {
                    const existing = state.accounts[accountNumber]?.transactions || [];
                    const seen = new Set(
                        existing.map((t) => getStrongTransactionKey(t, accountNumber))
                    );
                    const newTxs = [];
                    for (const tx of transactions) {
                        const key = getStrongTransactionKey(tx, accountNumber);
                        if (!seen.has(key)) {
                            seen.add(key);
                            newTxs.push({
                                ...tx,
                                accountNumber: tx.accountNumber || accountNumber,
                            });
                        }
                    }
                    const updated = [...existing, ...newTxs].sort((a, b) =>
                        a.date.localeCompare(b.date)
                    );

                    return {
                        accounts: {
                            ...state.accounts,
                            [accountNumber]: {
                                ...(state.accounts[accountNumber] || {}),
                                transactions: updated,
                            },
                        },
                    };
                }),
            setAccountMapping: (accountNumber, mapping) =>
                set((state) => ({
                    accountMappings: {
                        ...state.accountMappings,
                        [accountNumber]: mapping,
                    },
                })),
            removeAccount: (accountNumber) =>
                set((state) => {
                    const updated = { ...state.accounts };
                    delete updated[accountNumber];
                    return { accounts: updated };
                }),
            addSavingsGoal: (goal) =>
                set((state) => {
                    const newGoal = {
                        id: goal.id || crypto.randomUUID(),
                        ...goal,
                        createdAt: new Date().toISOString(),
                    };
                    const updated = [...state.savingsGoals, newGoal];
                    return {
                        savingsGoals: updated,
                    };
                }),
            removeSavingsGoal: (id) =>
                set((state) => {
                    const updated = state.savingsGoals.filter((e) => e.id !== id);
                    return {
                        savingsGoals: updated,
                    };
                }),
            updateSavingsGoal: (id, newData) =>
                set((state) => {
                    const updated = state.savingsGoals.map((e) =>
                        e.id === id ? { ...e, ...newData } : e
                    );
                    return {
                        savingsGoals: updated,
                    };
                }),
            addSavingsLog: (month, entry) =>
                set((state) => {
                    const logs = state.savingsLogs[month] || [];
                    const newEntry = {
                        id: entry.id || crypto.randomUUID(),
                        createdAt: entry.createdAt || new Date().toISOString(),
                        ...entry,
                    };
                    return {
                        savingsLogs: {
                            ...state.savingsLogs,
                            [month]: [...logs, newEntry],
                        },
                    };
                }),
            updateSavingsLog: (month, id, updates) =>
                set((state) => {
                    const logs = state.savingsLogs[month] || [];
                    const updatedLogs = logs.map((e) =>
                        e.id === id ? { ...e, ...updates } : e
                    );
                    return {
                        savingsLogs: { ...state.savingsLogs, [month]: updatedLogs },
                    };
                }),
            getSavingsForMonth: (month) => {
                const { savingsLogs } = useBudgetStore.getState();
                const logs = savingsLogs[month] || [];
                return logs.reduce((sum, e) => sum + e.amount, 0);
            },
            saveMonthlyPlan: (month, planData) =>
                set((state) => {
                    const newPlan = {
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        ...planData,
                    };

                    // Only clone actuals if none exist for this month yet
                    const existingActual = state.monthlyActuals[month];

                    const newActual = existingActual ?? {
                        actualTotalNetIncome: +planData.netIncome?.toFixed(2) || 0,
                        actualExpenses: JSON.parse(
                            JSON.stringify(planData.expenses || [])
                        ),
                        actualFixedIncomeSources: JSON.parse(
                            JSON.stringify([
                                {
                                    id: 'main',
                                    description: 'Main (Plan)',
                                    amount: +planData.netIncome?.toFixed(2) || 0,
                                },
                            ])
                        ),
                        savingsMode: planData.savingsMode,
                        customSavings: planData.customSavings,
                    };

                    return {
                        monthlyPlans: {
                            ...state.monthlyPlans,
                            [month]: newPlan,
                        },
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: newActual,
                        },
                    };
                }),
            removeMonthlyPlan: (month) =>
                set((state) => {
                    const updatedPlans = { ...state.monthlyPlans };
                    delete updatedPlans[month];

                    const updatedActuals = { ...state.monthlyActuals };
                    delete updatedActuals[month];

                    return {
                        monthlyPlans: updatedPlans,
                        monthlyActuals: updatedActuals,
                    };
                }),
            updateMonthlyExpenseActuals: (month, id, newData) =>
                set((state) => {
                    const existing = state.monthlyActuals[month];
                    if (!existing || !Array.isArray(existing.actualExpenses)) return {};

                    const updatedExpenses = existing.actualExpenses.map((e) =>
                        e.id === id ? { ...e, ...newData } : e
                    );

                    return {
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: {
                                ...existing,
                                actualExpenses: updatedExpenses,
                            },
                        },
                    };
                }),
            addActualExpense: (month, expense) =>
                set((state) => {
                    const newExpense = {
                        ...expense,
                        id: expense.id || crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    };
                    const existing = state.monthlyActuals[month];
                    const updated = [...existing.actualExpenses, newExpense];
                    return {
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: {
                                ...existing,
                                actualExpenses: updated,
                            },
                        },
                    };
                }),
            removeActualExpense: (month, id) =>
                set((state) => {
                    const existing = state.monthlyActuals[month];
                    const updated = existing.actualExpenses.filter((e) => e.id !== id);
                    return {
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: {
                                ...existing,
                                actualExpenses: updated,
                            },
                        },
                    };
                }),
            updateMonthlyActuals: (month, updates) =>
                set((state) => ({
                    monthlyActuals: {
                        ...state.monthlyActuals,
                        [month]: {
                            ...state.monthlyActuals[month],
                            ...updates,
                        },
                    },
                })),
            updateMonthlyIncomeActuals: (month, id, newData) =>
                set((state) => {
                    const existing = state.monthlyActuals[month];
                    if (!existing || !Array.isArray(existing.actualFixedIncomeSources))
                        return {};

                    const updatedIncomeSources = existing.actualFixedIncomeSources.map(
                        (e) => (e.id === id ? { ...e, ...newData } : e)
                    );

                    return {
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: {
                                ...existing,
                                actualFixedIncomeSources: updatedIncomeSources,
                            },
                        },
                    };
                }),
            addActualIncomeSource: (month, expense) =>
                set((state) => {
                    const newExpense = {
                        ...expense,
                        id: expense.id || crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    };
                    const existing = state.monthlyActuals[month];
                    const updated = [...existing.actualFixedIncomeSources, newExpense];
                    return {
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: {
                                ...existing,
                                actualFixedIncomeSources: updated,
                            },
                        },
                    };
                }),
            removeActualIncomeSource: (month, id) =>
                set((state) => {
                    const existing = state.monthlyActuals[month];
                    const updated = existing.actualFixedIncomeSources.filter(
                        (e) => e.id !== id
                    );
                    return {
                        monthlyActuals: {
                            ...state.monthlyActuals,
                            [month]: {
                                ...existing,
                                actualFixedIncomeSources: updated,
                            },
                        },
                    };
                }),
            setActualCustomSavings: (month, value) =>
                set((state) => ({
                    monthlyActuals: {
                        ...state.monthlyActuals,
                        [month]: {
                            ...state.monthlyActuals[month],
                            customSavings: value,
                        },
                    },
                })),
            setOveriddenExpenseTotal: (month, value) =>
                set((state) => ({
                    monthlyActuals: {
                        ...state.monthlyActuals,
                        [month]: {
                            ...state.monthlyActuals[month],
                            overiddenExpenseTotal: value >= 1 ? value : 0, // Save only meaningful values
                        },
                    },
                })),
            setOveriddenIncomeTotal: (month, value) =>
                set((state) => ({
                    monthlyActuals: {
                        ...state.monthlyActuals,
                        [month]: {
                            ...state.monthlyActuals[month],
                            overiddenIncomeTotal: value >= 1 ? value : 0, // Save only meaningful values
                        },
                    },
                })),
            // 🔁 Reset the entire log for a month -- BudgetTracker-->Savings Log
            resetSavingsLog: (month) =>
                set((state) => {
                    const newLogs = { ...state.savingsLogs };
                    delete newLogs[month];
                    return { savingsLogs: newLogs };
                }),
            // ❌ Delete a specific entry (by index or ID) -- BudgetTracker-->Savings Log
            deleteSavingsEntry: (month, index) =>
                set((state) => {
                    const logs = state.savingsLogs[month] || [];
                    return {
                        savingsLogs: {
                            ...state.savingsLogs,
                            [month]: logs.filter((_, i) => i !== index),
                        },
                    };
                }),
            getTotalGrossIncome: () => {
                const { incomeSources } = useBudgetStore.getState();
                if (!Array.isArray(incomeSources)) return 0;
                return calculateNetIncome(incomeSources);
            },
            getTotalNetIncome: () => {
                const totalGross = useBudgetStore.getState().getTotalGrossIncome();
                const taxes = calculateTotalTaxes(totalGross);
                return {
                    net: totalGross - taxes.total,
                    gross: totalGross,
                    breakdown: taxes,
                };
            },
            addIncomeSource: (source) =>
                set((state) => {
                    const newSource = {
                        ...source,
                        id: source.id || crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    };
                    const updated = [...state.incomeSources, newSource];
                    return {
                        incomeSources: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                incomeSources: updated,
                            },
                        },
                    };
                }),
            updateIncomeSource: (id, updates) =>
                set((state) => {
                    const updated = state.incomeSources.map((s) =>
                        s.id === id ? { ...s, ...updates } : s
                    );
                    return {
                        incomeSources: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                incomeSources: updated,
                            },
                        },
                    };
                }),
            removeIncomeSource: (id) =>
                set((state) => {
                    const updated = state.incomeSources.filter((s) => s.id !== id);
                    return {
                        incomeSources: updated,
                        selectedSourceId:
                            state.selectedSourceId === id
                                ? updated[0]?.id || null
                                : state.selectedSourceId,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                incomeSources: updated,
                            },
                        },
                    };
                }),
            // TODO: All FIXED Income Source functions need updating.
            addFixedIncomeSource: (source) =>
                set((state) => {
                    const newSource = {
                        ...source,
                        id: source.id || crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    };
                    const updated = [...state.incomeSources, newSource];
                    return {
                        incomeSources: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                incomeSources: updated,
                            },
                        },
                    };
                }),
            updateFixedIncomeSource: (id, updates) =>
                set((state) => {
                    const updated = state.incomeSources.map((s) =>
                        s.id === id ? { ...s, ...updates } : s
                    );
                    return {
                        incomeSources: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                incomeSources: updated,
                            },
                        },
                    };
                }),
            removeFixedIncomeSource: (id) =>
                set((state) => {
                    const updated = state.incomeSources.filter((s) => s.id !== id);
                    return {
                        incomeSources: updated,
                        selectedSourceId:
                            state.selectedSourceId === id
                                ? updated[0]?.id || null
                                : state.selectedSourceId,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                incomeSources: updated,
                            },
                        },
                    };
                }),
            addExpense: (expense) =>
                set((state) => {
                    const newExpense = {
                        ...expense,
                        id: expense.id || crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    };
                    const updated = [...state.expenses, newExpense];
                    return {
                        expenses: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                expenses: updated,
                            },
                        },
                    };
                }),
            updateExpense: (id, newData) =>
                set((state) => {
                    const updated = state.expenses.map((e) =>
                        e.id === id ? { ...e, ...newData } : e
                    );
                    return {
                        expenses: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                expenses: updated,
                            },
                        },
                    };
                }),
            removeExpense: (id) =>
                set((state) => {
                    const updated = state.expenses.filter((e) => e.id !== id);
                    return {
                        expenses: updated,
                        scenarios: {
                            ...state.scenarios,
                            [state.currentScenario]: {
                                ...state.scenarios[state.currentScenario],
                                expenses: updated,
                            },
                        },
                    };
                }),
            resetScenario: () =>
                set({
                    incomeSources: [
                        {
                            id: 'primary',
                            description: 'Primary Job',
                            type: 'hourly',
                            hourlyRate: 25,
                            hoursPerWeek: 40,
                            grossSalary: 0,
                            state: 'WI',
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    selectedSourceId: 'primary',
                    expenses: [
                        { id: 'rent', name: 'Rent', description: 'Rent', amount: 0 },
                    ],
                    savingsMode: 'none',
                    customSavings: 0,
                    filingStatus: 'headOfHousehold', // 'single' | 'married' | 'head'
                    // TODO: reset scenarios to default?
                }),
            saveScenario: (name) =>
                set((state) => ({
                    scenarios: {
                        ...state.scenarios,
                        [name]: {
                            name,
                            incomeSources: JSON.parse(
                                JSON.stringify(state.incomeSources)
                            ),
                            expenses: JSON.parse(JSON.stringify(state.expenses)),
                            savingsMode: state.savingsMode,
                            customSavings: state.customSavings,
                            showIncomeInputs: true,
                            filingStatus: state.filingStatus,
                        },
                    },
                    currentScenario: name,
                })),
            updateScenario: (key, updates) =>
                set((state) => ({
                    scenarios: {
                        ...state.scenarios,
                        [key]: {
                            ...state.scenarios[key],
                            ...updates,
                        },
                    },
                })),
            loadScenario: (name) =>
                set((state) => {
                    const scenario = state.scenarios[name];
                    return scenario
                        ? {
                              incomeSources: JSON.parse(
                                  JSON.stringify(scenario.incomeSources)
                              ),
                              expenses: JSON.parse(JSON.stringify(scenario.expenses)),
                              savingsMode: scenario.savingsMode || 'none',
                              customSavings: scenario.customSavings || 0,
                              currentScenario: name,
                              filingStatus: scenario.filingStatus,
                              // TODO: add following to reset input opening on scenario change
                              showIncomeInputs: false, // 👈 Optional reset
                          }
                        : {};
                }),
            deleteScenario: (name) =>
                set((state) => {
                    const updated = { ...state.scenarios };
                    delete updated[name];

                    const isCurrent = state.currentScenario === name;
                    const fallback = Object.keys(updated)[0] || 'Main';

                    return {
                        scenarios: updated,
                        ...(isCurrent && updated[fallback]
                            ? {
                                  currentScenario: fallback,
                                  incomeSources: JSON.parse(
                                      JSON.stringify(updated[fallback].incomeSources)
                                  ),
                                  expenses: JSON.parse(
                                      JSON.stringify(updated[fallback].expenses)
                                  ),
                                  savingsMode: updated[fallback].savingsMode || 'none',
                                  customSavings: updated[fallback].customSavings || 0,
                                  filingStatus: updated[fallback].filingStatus,
                              }
                            : {}),
                    };
                }),
            // Add a migration utility to re-classify non-savings transactions by sign.
            createStore: (set) => ({
                // ...existing state & actions...

                migrateSignBasedTypes: () => {
                    set((state) => {
                        if (!state.accounts) return {};
                        let changed = false;
                        const accounts = { ...state.accounts };
                        for (const acctNum of Object.keys(accounts)) {
                            const acct = accounts[acctNum];
                            if (!acct?.transactions) continue;
                            let txChanged = false;
                            const txns = acct.transactions.map((tx) => {
                                if (tx.type === 'savings') return tx;
                                const signed =
                                    typeof tx.rawAmount === 'number'
                                        ? tx.rawAmount
                                        : Number(tx.amount) || 0;
                                const desired = signed >= 0 ? 'income' : 'expense';
                                if (tx.type !== desired) {
                                    txChanged = true;
                                    return { ...tx, type: desired };
                                }
                                return tx;
                            });
                            if (txChanged) {
                                changed = true;
                                accounts[acctNum] = { ...acct, transactions: txns };
                            }
                        }
                        return changed ? { accounts } : {};
                    });
                },

                migrateSignedAmountsAndTypes: () => {
                    set((state) => {
                        if (!state.accounts) return {};
                        let changed = false;
                        const accounts = { ...state.accounts };
                        for (const acctNum of Object.keys(accounts)) {
                            const acct = accounts[acctNum];
                            if (!acct?.transactions) continue;
                            let txChanged = false;
                            const txns = acct.transactions.map((tx) => {
                                let updated = tx;
                                // Repair rawAmount sign from original.Amount if parentheses present and rawAmount non-negative
                                const origAmtStr =
                                    tx.original?.Amount || tx.original?.amount;
                                if (
                                    typeof updated.rawAmount === 'number' &&
                                    updated.rawAmount >= 0 &&
                                    typeof origAmtStr === 'string' &&
                                    /^\(.*\)$/.test(origAmtStr.trim())
                                ) {
                                    updated = {
                                        ...updated,
                                        rawAmount: -Math.abs(updated.rawAmount),
                                    };
                                }

                                // Re-classify non-savings
                                if (updated.type !== 'savings') {
                                    const signed =
                                        typeof updated.rawAmount === 'number'
                                            ? updated.rawAmount
                                            : Number(updated.amount) || 0;
                                    const desired = signed >= 0 ? 'income' : 'expense';
                                    if (updated.type !== desired) {
                                        updated = { ...updated, type: desired };
                                    }
                                }

                                if (updated !== tx) {
                                    txChanged = true;
                                }
                                return updated;
                            });
                            if (txChanged) {
                                changed = true;
                                accounts[acctNum] = { ...acct, transactions: txns };
                            }
                        }
                        return changed ? { accounts } : {};
                    });
                },

                // ...existing actions...
            }),
        }),

        {
            name: 'budget-app-storage', // key in localStorage
            partialize: (state) => {
                // Intentionally strip transient flags and UI modal/progress from persistence
                const clone = { ...state };
                delete clone.sessionExpired;
                delete clone.hasInitialized;
                delete clone.isSavingsModalOpen;
                delete clone.savingsReviewQueue;
                delete clone.resolveSavingsPromise;
                delete clone.isConfirmModalOpen;
                delete clone.isLoadingModalOpen;
                delete clone.isProgressOpen;
                delete clone.progressHeader;
                delete clone.progressCount;
                delete clone.progressTotal;
                delete clone.loadingHeader;
                delete clone.showIngestionBenchmark; // dev-only toggle not persisted
                // importHistory is retained for audit/undo
                return clone;
            },
        }
    )
);
