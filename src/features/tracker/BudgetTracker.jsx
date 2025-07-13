import {
  Box
} from '@chakra-ui/react';
import MonthlyPlanSummary from '../../components/MonthlyPlanSummary';
import MonthlyActualSummary from '../../components/MonthlyActualSummary';
import SavingsLog from '../../components/SavingsLog';

export default function BudgetTracker() {

  return (
    <Box>
      <MonthlyPlanSummary />

      <MonthlyActualSummary />

      <SavingsLog />
    </Box>
  );
}