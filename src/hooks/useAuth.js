import { useBudgetStore } from '../state/budgetStore';
import { isTokenExpired } from '../utils/jwtUtils';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
    const user = useBudgetStore((s) => s.user);
    const setIsDemoUser = useBudgetStore((s) => s.setIsDemoUser);
    const navigate = useNavigate();

    const logoutUser = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        useBudgetStore.getState().setUser(null);
        useBudgetStore.getState().setSessionExpired(false); // clear overlay
        setIsDemoUser(false);
        navigate('/login');
    };

    const token = localStorage.getItem('token');
    const isLoggedIn = !!user && token && !isTokenExpired(token);

    return { user, isLoggedIn, logoutUser };
};
