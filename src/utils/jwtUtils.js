import { jwtDecode } from 'jwt-decode';
import { useBudgetStore } from '../state/budgetStore';
import { createStandaloneToast } from '@chakra-ui/react';

const { toast } = createStandaloneToast();

export const isTokenExpired = (token) => {
    if (!token) return true;

    try {
        const decoded = jwtDecode(token); // 👈 use the new named import
        const now = Date.now() / 1000;
        return decoded.exp < now;
    } catch (err) {
        console.error('Invalid token:', err);
        return true;
    }
};

export function checkTokenExpiry() {
    const token = localStorage.getItem('token');

    if (token && isTokenExpired(token)) {
        useBudgetStore.getState().setSessionExpired(true);
        toast({
            title: 'Session expired',
            status: 'info',
            duration: 5000,
        });
    }
}
