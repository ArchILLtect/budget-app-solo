import { useBudgetStore } from '../state/budgetStore';
import { getCurrentUser } from './auth';
// Strong ingestion key builder (accountNumber|date|signedAmount|normalized desc[|bal:balance])
// Imported here to provide a gradual migration path away from the legacy key used
// for persisted historical transactions. We keep both for a stabilization window.
import { buildTxKey } from '../ingest/buildTxKey.js';

export const applySessionRefresh = async () => {
    const user = await getCurrentUser();
    if (user) {
        const store = useBudgetStore.getState();
        store.setUser(user);
        store.setSessionExpired(false);
    }
};

export const getAvailableMonths = (account) => {
    if (!account?.transactions?.length) return [];

    const uniqueMonths = new Set();

    account.transactions.forEach((tx) => {
        if (tx.date) {
            const monthKey = tx.date.slice(0, 7); // 'YYYY-MM'
            uniqueMonths.add(monthKey);
        }
    });

    return Array.from(uniqueMonths).sort((a, b) => b.localeCompare(a)); // Descending
};

export const getMonthlyTotals = (account, month) => {
    const txs = account.transactions.filter((tx) => tx.date?.startsWith(month));

    const totals = {
        income: 0,
        expenses: 0,
        savings: 0,
        net: 0,
    };

    txs.forEach((tx) => {
        const amt = parseFloat(tx.amount) || 0;
        switch (tx.type) {
            case 'income':
                totals.income += amt;
                break;
            case 'savings':
                totals.savings += amt;
                break;
            case 'expense':
            default:
                totals.expenses += amt;
                break;
        }
    });

    totals.net = totals.income + totals.expenses - totals.savings;

    return totals;
};

// Strong key (single source of truth) -------------------------------------------------
export const getStrongTransactionKey = (tx, accountNumber) =>
    buildTxKey({ ...tx, accountNumber: tx.accountNumber || accountNumber });

export const getUniqueTransactions = (existing, incoming, accountNumber) => {
    const seen = new Set(
        existing.map((tx) => getStrongTransactionKey(tx, accountNumber))
    );
    return incoming.filter((tx) => {
        const key = getStrongTransactionKey(tx, accountNumber);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const getSavingsKey = (tx) => {
    const amt = normalizeTransactionAmount(tx.amount) || 0;
    return `${tx.date}|${amt.toFixed(2)}`;
};

export const normalizeTransactionAmount = (tx, direct = false) => {
    const abs = Math.abs(parseFloat(direct ? tx : tx.amount) || 0);

    return abs;
};

// syncedAccountData shape:
/**
 * {
 *   type: 'csv',
 *   fileName: string,
 *   importedAt: ISOString,
 *   rows: Array<{
 *     id: string,
 *     date: string (YYYY-MM-DD),
 *     description: string,
 *     amount: number,
 *     type: 'income' | 'expense' | 'savings',
 *     category?: string
 *   }>
 * }
 */

// transaction shape:
/**
 * {
 *   id: 'generated-id',        // crypto.randomUUID()
 *   sourceAccountId: 'acct-123',
 *   date: '2025-08-03',
 *   description: 'Walmart Grocery',
 *   amount: 89.12,
 *   type: 'expense',           // or 'income', 'savings'
 *   category: 'groceries'
 * }
 */
