import React, { useEffect } from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useBudgetStore } from './state/budgetStore'
import BudgetPlannerPage from './pages/BudgetPlannerPage'
import AccountsTrackerPage from './pages/AccountsTrackerPage'
import BudgetTrackerPage from './pages/BudgetTrackerPage'
import NavBar from './components/NavBar'
import LoginPage from './pages/LoginPage'
import AuthInitializer from './components/AuthInitializer'
import RequireAuth from './components/RequireAuth'
import Footer from './components/Footer'
import TokenExpiryGuard from './components/TokenExpiryGuard'
import SessionLockOverlay from './components/SessionLockOverlay'
import { getCurrentUser } from './utils/auth'
import { applySessionRefresh } from './utils/storeHelpers'
import { checkTokenExpiry } from './utils/jwtUtils'
import ProgressModal from './components/ProgressModal'
import LoadingModal from './components/LoadingModal'


function PageTracker() {
  const location = useLocation();
  const setCurrentPage = useBudgetStore((s) => s.setCurrentPage);

  useEffect(() => {
    const path = location.pathname.replace('/', '') || 'planner';
    setCurrentPage(path);

    checkTokenExpiry(); // 🔥 Check token on every page switch
  }, [location.pathname, setCurrentPage]);

  return null;
}

export default function App() {

  //This is a workaround to ensure useBudgetStore is available globally
  //This is useful for debugging in the browser console
  //and for accessing the store in components that don't use hooks directly
  //Remove this in production
  if (typeof window !== 'undefined') {
    window.useBudgetStore = useBudgetStore;
  }

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'loginSuccess') {
        // Refresh user state manually
        /* TODO: Remove this after positive results from testing auth system
        getCurrentUser().then((user) => {
          if (user) {
            applySessionRefresh();
          }
        });*/
        // Optimistic: clear the lock immediately, then refresh user
        useBudgetStore.getState().setSessionExpired(false);
        getCurrentUser().then((user) => {
          if (user) applySessionRefresh(); // sets user lears lock again for safety
        });
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'token' && e.newValue) {
        // Token changed in another tab/window → refresh and unlock
        useBudgetStore.getState().setSessionExpired(false);
        applySessionRefresh();
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <ChakraProvider>
      <Router>
        <Box>
          <AuthInitializer />
          <TokenExpiryGuard />
          <SessionLockOverlay />
          <PageTracker />
          <NavBar />
          <ProgressModal />
          <LoadingModal />
          <Routes>
            <Route path="/" element={<BudgetPlannerPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/planner" element={<BudgetPlannerPage />} />
            <Route path="/tracker" element={<BudgetTrackerPage />} />
            <Route path="/accounts" element={<RequireAuth><AccountsTrackerPage /></RequireAuth>} />
            <Route path="*" element={<BudgetPlannerPage />} />
          </Routes>
          <Footer />
        </Box>
      </Router>
    </ChakraProvider>
  )
}