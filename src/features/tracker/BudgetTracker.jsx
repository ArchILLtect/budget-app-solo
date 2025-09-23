import {
  Box
} from '@chakra-ui/react';
import MonthlyPlanSummary from '../../components/MonthlyPlanSummary';
import React, { Suspense, lazy } from 'react';
const MonthlyActualSummary = lazy(() => import('../../components/MonthlyActualSummary'));
import SavingsLog from '../../components/SavingsLog';
import RecurringManager from './RecurringManager';

export default function BudgetTracker() {

  return (
    <Box>
      <MonthlyPlanSummary />
      <Suspense fallback={null}>
        <MonthlyActualSummary />
      </Suspense>
      <RecurringManager />
      <SavingsLog />
    </Box>
  );
}