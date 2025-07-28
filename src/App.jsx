import React, { useEffect } from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useBudgetStore } from './state/budgetStore'
import BudgetPlannerPage from './pages/BudgetPlannerPage'
import AccountsTrackerPage from './pages/AccountsTrackerPage'
import BudgetTrackerPage from './pages/BudgetTrackerPage'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import AuthInitializer from './components/AuthInitializer'
import RequireAuth from './components/RequireAuth'
import Footer from './components/Footer'
import TokenExpiryGuard from './components/TokenExpiryGuard'
import SessionLockOverlay from './components/SessionLockOverlay'
import { getCurrentUser } from './utils/auth'
import { applySessionRefresh } from './utils/storeHelpers'
import { checkTokenExpiry } from './utils/jwtUtils'


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
        getCurrentUser().then((user) => {
          if (user) {
            applySessionRefresh();
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <ChakraProvider>
      <Router>
        <Box>
          <AuthInitializer />
          <TokenExpiryGuard />
          <SessionLockOverlay />
          <PageTracker />
          <Navbar />
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