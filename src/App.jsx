import React, { useEffect, Suspense, lazy } from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useBudgetStore } from './state/budgetStore'
const BudgetPlannerPage = lazy(() => import('./pages/BudgetPlannerPage'))
const AccountsTrackerPage = lazy(() => import('./pages/AccountsTrackerPage'))
const BudgetTrackerPage = lazy(() => import('./pages/BudgetTrackerPage'))
const ImportHistoryPage = lazy(() => import('./pages/ImportHistoryPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
import NavBar from './components/NavBar'
const LoginPage = lazy(() => import('./pages/LoginPage'))
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
import InlineSpinner from './components/InlineSpinner.jsx'
const IngestionBenchmark = lazy(() => import('./dev/IngestionBenchmark.jsx'));
import { IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';


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
  // Always call hooks (no conditional). Gate behavior afterwards.
  const showBenchmarkRaw = useBudgetStore(s => s.showIngestionBenchmark);
  const setShowIngestionBenchmark = useBudgetStore(s => s.setShowIngestionBenchmark);
  const showIngestionBenchmark = import.meta.env.DEV && showBenchmarkRaw;

  // Expose store for debugging only in dev (no hooks in conditional)
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      window.useBudgetStore = useBudgetStore;
    }
  }, []);

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

          {import.meta.env.DEV && showIngestionBenchmark && (
            <Box
              bg="gray.300"
              color="gray.900"
              borderTop="2px solid"
              borderColor="purple.500"
              zIndex={2100}
              fontSize="sm"
              boxShadow="0 -4px 10px rgba(0,0,0,0.35)"
            >
              <Suspense fallback={null}>
                <IngestionBenchmark
                  onRequestClose={() => setShowIngestionBenchmark(false)}
                />
              </Suspense>
            </Box>
          )}
          <Suspense fallback={<InlineSpinner /> }>
            <Routes>
              <Route path="/" element={<BudgetPlannerPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/planner" element={<BudgetPlannerPage />} />
              <Route path="/tracker" element={<BudgetTrackerPage />} />
              <Route path="/imports" element={<ImportHistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/accounts" element={<RequireAuth><AccountsTrackerPage /></RequireAuth>} />
              <Route path="*" element={<BudgetPlannerPage />} />
            </Routes>
          </Suspense>
          <Footer />
        </Box>
      </Router>
    </ChakraProvider>
  )
}