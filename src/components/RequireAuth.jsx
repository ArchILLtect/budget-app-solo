import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBudgetStore } from '../state/budgetStore';

export default function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth();
  const sessionExpired = useBudgetStore((s) => s.sessionExpired);
  const hasInitialized = useBudgetStore((s) => s.hasInitialized);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasInitialized && !isLoggedIn && !sessionExpired) {
      // Only redirect if not expired session
      navigate('/login');
    }
  }, [isLoggedIn, hasInitialized, sessionExpired, navigate]);

  return hasInitialized && isLoggedIn && !sessionExpired ? children : null;
}