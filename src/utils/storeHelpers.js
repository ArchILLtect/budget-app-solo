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
