import { Box, Text, Heading, Stat, StatLabel, StatNumber, StatGroup, Progress, useColorModeValue } from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';
import dayjs from 'dayjs';

export default function MonthlyActualSummary() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const plan = useBudgetStore((s) => s.monthlyPlans[selectedMonth]);
  const actual = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);
  const savingsSoFar = useBudgetStore((s) => s.getSavingsForMonth(selectedMonth));

  const bg = useColorModeValue('white', 'gray.700');

  const netIncome = actual?.actualIncome || 0;
  const expenses = actual?.actualExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const savings = actual?.actualSavings || savingsSoFar || 0;
  const leftover = netIncome - expenses - savings;

  const plannedIncome = plan?.netIncome || 0;
  const plannedSavings = plan?.totalSavings || 0;
  const plannedExpenses = plan?.totalExpenses || 0;
  const plannedLeftover = plannedIncome - plannedSavings - plannedExpenses;

  const percentComplete = plan?.totalSavings ? Math.min((savings / plan.totalSavings) * 100, 100) : 0;

  return (
    <Box p={4} mb={4} borderBottomRadius="lg" boxShadow="md" bg={bg}>
      <Heading size="md" fontWeight="bold" mb={2}>This Month's Summary</Heading>

      <StatGroup>
        <Stat textAlign={'center'}>
          <StatLabel>Actual Net Income</StatLabel>
          <StatNumber color="teal.500">${netIncome.toLocaleString()}</StatNumber>
        </Stat>

        <Stat textAlign={'center'}>
          <StatLabel>Total Expenses</StatLabel>
          <StatNumber color="orange.500">${expenses.toLocaleString()}</StatNumber>
        </Stat>

        <Stat textAlign={'center'}>
          <StatLabel>Total Saved</StatLabel>
          <StatNumber color="green.500">${savings > 0 ? savings.toFixed(2) : savings}</StatNumber>
        </Stat>

        <Stat textAlign={'center'}>
          <StatLabel>Leftover</StatLabel>
          <StatNumber color={leftover >= 0 ? 'blue.500' : 'red.500'}>${leftover.toFixed(2)}</StatNumber>
        </Stat>
      </StatGroup>

      {plan && (
        <Box mt={4}>
          <Text fontSize="sm" color="gray.500">Savings Progress toward Plan</Text>
          <Progress value={percentComplete} size="sm" colorScheme="green" mt={1} borderRadius="md" />
          <Text fontSize="xs" mt={1}>({savings?.toLocaleString()} of {plan.totalSavings?.toLocaleString()} planned)</Text>
        </Box>
      )}
    </Box>
  );
}