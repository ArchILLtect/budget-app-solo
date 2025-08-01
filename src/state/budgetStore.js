import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTotalTaxes, calculateNetIncome } from '../utils/calcUtils';
import dayjs from 'dayjs';

// TODO: Allow users to change overtime threshold and tax rates

const currentMonth = dayjs().format('YYYY-MM'); // e.g. "2025-07"

export const useBudgetStore = create(
    persist(
        (set) => ({
            currentPage: 'planner', // or null initially
            user: null, // User object will be set after login
            filingStatus: 'headOfHousehold', // 'single' | 'marriedSeparate' | 'marriedJoint' | 'headOfHousehold'
            incomeSources: [
                {
                    id: 'primary',
                    label: 'Primary Job',
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
                            label: 'Primary Job',
                            type: 'hourly',
                            hourlyRate: 25,
                            hoursPerWeek: 40,
                            grossSalary: 0,
                            state: 'WI',
                        },
                    ],
                    expenses: [{ id: 'rent', name: 'Rent', amount: 0 }],
                    savingsMode: '20',
                    filingStatus: 'single', // 'single' | 'marriedSeparate' | 'marriedJoint' | 'headOfHousehold'
                },
                College: {
                    name: 'College',
                    incomeSources: [
                        {
                            id: 'primary',
                            label: 'Primary Job',
                            type: 'hourly',
                            hourlyRate: 25,
                            hoursPerWeek: 20,
                            grossSalary: 52000,
                            state: 'WI',
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    expenses: [{ id: 'rent', name: 'Rent', amount: 1000 }],
                    filingStatus: 'single', // 'single' | 'marriedSeparate' | 'marriedJoint' | 'headOfHousehold'
                    customSavings: 0,
                    savingsMode: '10',
                },
            },
            expenses: [
                { id: 'rent', name: 'Rent', amount: 1600 },
                { id: 'groceries', name: 'Groceries', amount: 400 },
                { id: 'phone', name: 'Phone', amount: 100 },
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
            savingsGoals: [{ id: 'yearly', name: 'Yearly Savings Goal', amount: 10000 }],
            savingsLogs: {}, // key: '2025-07', value: [{ amount, date }]
            monthlyPlans: {},
            // 📊 Actuals for the month
            monthlyActuals: {},
            sessionExpired: false,
            hasInitialized: false,
            syncedAccounts: [],
            addSyncedAccount: (account) =>
                set((state) => ({
                    syncedAccounts: [
                        ...state.syncedAccounts,
                        {
                            id: account.id || crypto.randomUUID(),
                            name: account.name || 'Unnamed Account',
                            source: account.source || 'csv',
                            importedAt: new Date().toISOString(),
                            transactions: account.transactions || [],
                            fileName: account.fileName || '',
                        },
                    ],
                })),
            removeSyncedAccount: (id) =>
                set((state) => ({
                    syncedAccounts: state.syncedAccounts.filter((acct) => acct.id !== id),
                })),
            clearSyncedAccounts: () => set(() => ({ syncedAccounts: [] })),
            setSessionExpired: (value) => set({ sessionExpired: value }),
            setHasInitialized: (value) => set({ hasInitialized: value }),
            setCurrentPage: (page) => set(() => ({ currentPage: page })),
            setUser: (user) => set(() => ({ user })),
            setShowPlanInputs: (value) => set(() => ({ showPlanInputs: value })),
            setShowActualInputs: (value) => set(() => ({ showActualInputs: value })),
            setShowIncomeInputs: (value) => set(() => ({ showIncomeInputs: value })),
            setShowExpenseInputs: (value) => set(() => ({ showExpenseInputs: value })),
            setShowSavingsLogInputs: (value) =>
                set(() => ({ showSavingsLogInputs: value })),
            setShowGoalInputs: (value) => set(() => ({ showGoalInputs: value })),
            setSelectedMonth: (month) => set(() => ({ selectedMonth: month })),
            setFilingStatus: (value) => set(() => ({ filingStatus: value })),
            resetSavingsLogs: () => set(() => ({ savingsLogs: {} })),
            selectIncomeSource: (id) => set(() => ({ selectedSourceId: id })),
            setSavingsMode: (mode) => set(() => ({ savingsMode: mode })),
            setCustomSavings: (value) => set(() => ({ customSavings: value })),
            setScenario: (name) => set({ currentScenario: name }),
            // getTotalSavingsLogged: () => {
            //     const { savingsLogs } = useBudgetStore.getState();
            //     return Object.values(savingsLogs)
            //         .flat()
            //         .reduce((sum, entry) => sum + (entry.amount || 0), 0);
            // },
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
                    return {
                        savingsLogs: {
                            ...state.savingsLogs,
                            [month]: [...logs, entry],
                        },
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
                            JSON.stringify(
                                [
                                    {
                                        id: 'main',
                                        name: 'Main (Plan)',
                                        amount: +planData.netIncome?.toFixed(2) || 0,
                                    },
                                ] || []
                            )
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
            /*setActualSavingsMode: (month, mode) =>
                set((state) => ({
                    monthlyActuals: {
                        ...state.monthlyActuals,
                        [month]: {
                            ...state.monthlyActuals[month],
                            savingsMode: mode,
                        },
                    },
                })),*/
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
                            label: 'Primary Job',
                            type: 'hourly',
                            hourlyRate: 25,
                            hoursPerWeek: 40,
                            grossSalary: 0,
                            state: 'WI',
                            createdAt: new Date().toISOString(),
                        },
                    ],
                    selectedSourceId: 'primary',
                    expenses: [{ id: 'rent', name: 'Rent', amount: 0 }],
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
        }),

        {
            name: 'budget-app-storage', // key in localStorage
        }
    )
);
