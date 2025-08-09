import { jwtDecode } from 'jwt-decode';
import { useBudgetStore } from '../state/budgetStore';
import { createStandaloneToast } from '@chakra-ui/react';

const { toast } = createStandaloneToast();

export const isTokenExpired = (token) => {
    if (!token) return true;
    if (token === 'demo-token') return false;

    try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        return decoded.exp < now;
    } catch (err) {
        console.error('Invalid token:', err);
        return true;
    }
};

export function checkTokenExpiry() {
    const token = localStorage.getItem('token');
    /* TODO: Remove this after positive results from testing auth system
    if (token && isTokenExpired(token)) {
        useBudgetStore.getState().setSessionExpired(true);
        toast({
            title: 'Session expired',
            status: 'info',
            duration: 5000,
        });
    } */
    if (!token) return;
    const expired = isTokenExpired(token);
    const store = useBudgetStore.getState();
    if (expired) {
        store.setSessionExpired(true);
        toast({ title: 'Session expired', status: 'info', duration: 5000 });
    } else {
        // 🍀 Fresh token? Ensure we’re unlocked.
        store.setSessionExpired(false);
    }
}
