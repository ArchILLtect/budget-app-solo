import { useEffect } from 'react';
import { useBudgetStore } from '../state/budgetStore';
import { getCurrentUser } from '../utils/auth';
import { checkTokenExpiry } from '../utils/jwtUtils';

export default function AuthInitializer() {
  const setUser = useBudgetStore((s) => s.setUser);
  const setHasInitialized = useBudgetStore((s) => s.setHasInitialized);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (user) setUser(user);
      checkTokenExpiry(); // run on mount
      setHasInitialized(true); // We've now attempted login state
    };
    init();

  
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // every 5 mins

    return () => clearInterval(interval);
  }, [setUser, setHasInitialized]);

  return null;
}