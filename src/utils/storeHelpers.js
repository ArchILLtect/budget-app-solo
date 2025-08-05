import { useBudgetStore } from '../state/budgetStore';
import { getCurrentUser } from './auth';

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

    totals.net = totals.income - totals.expenses - totals.savings;

    return totals;
};

export const getTransactionKey = (tx) => {
    const amt = normalizeTransactionAmount(tx.amount) || 0;
    return `${tx.date}|${amt.toFixed(2)}|${(tx.description || '').toLowerCase().trim()}`;
};

export const getSavingsKey = (tx) => {
    const amt = normalizeTransactionAmount(tx.amount) || 0;
    return `${tx.date}|${amt.toFixed(2)}`;
};

export const getUniqueTransactions = (existing, incoming, getKey = getTransactionKey) => {
    const seen = new Set(existing.map(getKey));
    return incoming.filter((tx) => !seen.has(getKey(tx)));
};

export const normalizeTransactionAmount = (tx) => {
    const abs = Math.abs(parseFloat(tx.amount) || 0);

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
