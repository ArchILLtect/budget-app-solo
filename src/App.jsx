import React, { useEffect } from 'react'
import { ChakraProvider, Box } from '@chakra-ui/react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useBudgetStore } from './state/budgetStore'
import BudgetPlannerPage from './pages/BudgetPlannerPage'
import AccountsTrackerPage from './pages/AccountsTrackerPage'
import BudgetTrackerPage from './pages/BudgetTrackerPage'
import Navbar from './components/Navbar'

function PageTracker() {
  const location = useLocation();
  const setCurrentPage = useBudgetStore((s) => s.setCurrentPage);

  useEffect(() => {
    // derive page name from pathname
    const path = location.pathname.replace('/', '') || 'planner';
    setCurrentPage(path);
  }, [location.pathname, setCurrentPage]);

  return null;
}

export default function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box>
          <PageTracker />
          <Navbar />
          <Routes>
            <Route path="/" element={<BudgetPlannerPage />} />
            <Route path="/planner" element={<BudgetPlannerPage />} />
            <Route path="/accounts" element={<AccountsTrackerPage />} />
            <Route path="/tracker" element={<BudgetTrackerPage />} />
          </Routes>
        </Box>
      </Router>
    </ChakraProvider>
  )
}