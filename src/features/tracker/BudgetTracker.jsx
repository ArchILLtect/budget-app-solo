import {
  Box
} from '@chakra-ui/react';
import MonthlyPlanSummary from '../../components/MonthlyPlanSummary';
import MonthlyActualSummary from '../../components/MonthlyActualSummary';
import SavingsLog from '../../components/SavingsLog';
import RecurringManager from './RecurringManager';

export default function BudgetTracker() {

  return (
    <Box>
      <MonthlyPlanSummary />
      <MonthlyActualSummary />
      <RecurringManager />
      <SavingsLog />
    </Box>
  );
}