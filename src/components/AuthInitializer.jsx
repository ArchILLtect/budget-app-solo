import { useEffect } from 'react';
import { useBudgetStore } from '../state/budgetStore';
import { getCurrentUser } from '../utils/auth';

export default function AuthInitializer() {
  const setUser = useBudgetStore((s) => s.setUser);
  const setHasInitialized = useBudgetStore((s) => s.setHasInitialized);

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (user) setUser(user);
      setHasInitialized(true); // We've now attempted login state
    };
    init();
  }, []);

  return null;
}