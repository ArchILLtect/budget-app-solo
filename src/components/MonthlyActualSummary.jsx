import { Box, Text, Heading, Stat, StatLabel, StatNumber, Stack,
  StatGroup, Progress, StatHelpText, Flex, Button, Collapse,
  useColorModeValue
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';
import ExpenseTracker from '../features/planner/ExpenseTracker';
import IncomeCalculator from '../features/planner/IncomeCalculator';
import dayjs from 'dayjs';

export default function MonthlyActualSummary() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const showActualInputs = useBudgetStore((s) => s.showActualInputs);
  const setShowActualInputs = useBudgetStore((s) => s.setShowActualInputs);
  const plan = useBudgetStore((s) => s.monthlyPlans[selectedMonth]);
  const actual = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);
  const savingsSoFar = useBudgetStore((s) => s.getSavingsForMonth(selectedMonth));
  const overiddenIncomeTotal = useBudgetStore(s => s.monthlyActuals[selectedMonth]?.overiddenIncomeTotal);
  const overiddenExpenseTotal = useBudgetStore(s => s.monthlyActuals[selectedMonth]?.overiddenExpenseTotal);
  const bg = useColorModeValue('white', 'gray.700');
  const calculateWithOverride = (overrideValue, fallbackFn) =>
      overrideValue != null && overrideValue >= 1 ? overrideValue : fallbackFn();
  const netIncome = calculateWithOverride(overiddenIncomeTotal, () =>
      actual?.actualFixedIncomeSources?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0);
  const totalExpenses = calculateWithOverride(overiddenExpenseTotal, () =>
      actual?.actualExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0);
  const savings = actual?.actualSavings || savingsSoFar || 0;
  const leftover = netIncome - totalExpenses - savings;
  const percentComplete = plan?.totalSavings ? Math.min((savings / plan.totalSavings) * 100, 100) : 0;
  const actuals = useBudgetStore((s) => s.monthlyActuals);
  const savingsLogs = useBudgetStore((s) => s.savingsLogs);

  const selectedYear = dayjs(selectedMonth).format('YYYY');
  // Get all monthlyActual objects for the selected year
  const actualsThisYear = Object.fromEntries(
    Object.entries(actuals).filter(([key]) => key.startsWith(selectedYear))
  );
  // Get all savingsLogs objects for the selected year
  const savingsLogsThisYear = Object.fromEntries(
    Object.entries(savingsLogs).filter(([key]) => key.startsWith(selectedYear))
  );
  // Get the total actual income for the selected year summed from each month
  const totalNetIncome = Object.values(actualsThisYear)
    .reduce((sum, month) => sum + (month.actualTotalNetIncome || 0), 0);
  // Get the total actual expenses for the selected year summed from each month
  const totalExpensesThisYear = Object.values(actualsThisYear)
    .reduce((sum, month) => {
      const monthTotal = month.actualExpenses?.reduce((mSum, expense) => {
        return mSum + (expense.amount || 0);
      }, 0) || 0;
      return sum + monthTotal;
    }, 0);
  // Get the total actual expenses for the selected year summed from each month
    const totalSavingsThisYear = Object.values(savingsLogsThisYear)
      .reduce((sum, month) => {
        const monthTotal = month.reduce((mSum, log) => {
          return mSum + (log.amount || 0);
        }, 0) || 0;
        return sum + monthTotal;
      }, 0);

  return (
    <Box p={4} borderBottomRadius="lg" boxShadow="md" bg={bg} borderWidth={2}>
      {actual &&
      <>
        <Flex justifyContent="space-between" alignItems="center" mb={3}>
          <Heading size="md">This Month's Summary</Heading>
          <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowActualInputs(!showActualInputs)}>
            {showActualInputs ? 'Hide All Inputs' : 'Show All Inputs'}
          </Button>
        </Flex>

        <Stack spacing={3}>
          <Collapse mb={4} in={showActualInputs} animateOpacity>

            <IncomeCalculator origin='Tracker' selectedMonth={selectedMonth} />
            <ExpenseTracker origin='Tracker' selectedMonth={selectedMonth} />
            
            <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
          </Collapse>
        </Stack>
      </>
      }
      <Box px={4} py={3} borderWidth={1} borderRadius="md" bg="gray.50">
        <StatGroup>
          <Stat textAlign={'center'}>
            <StatLabel>Actual Net Income</StatLabel>
            <StatNumber color="teal.500">${overiddenIncomeTotal ? overiddenIncomeTotal : netIncome.toLocaleString()}</StatNumber>
          </Stat>
          <Stat textAlign={'center'}>
            <StatLabel>Total Expenses</StatLabel>
            <StatNumber color="orange.500">${overiddenExpenseTotal ? overiddenExpenseTotal : totalExpenses.toLocaleString()}</StatNumber>
          </Stat>
          <Stat textAlign={'center'}>
            <StatLabel>Total Saved</StatLabel>
            <StatNumber color="blue.500">${savings.toLocaleString()}</StatNumber>
          </Stat>
          <Stat textAlign={'center'}>
            <StatLabel>Leftover</StatLabel>
            <StatNumber color={leftover >= 0 ? 'green.500' : 'red.500'}>${leftover.toLocaleString()}</StatNumber>
          </Stat>
        </StatGroup>
      </Box>

      {plan?.totalSavings > 0 ? (
        <Box mt={4}>
          <Text fontSize="sm" color="gray.500">Savings progress toward this month's savings plan:</Text>
          <Progress value={percentComplete} size="sm" colorScheme="green" mt={1} borderRadius="md" />
          <Text fontSize="xs" mt={1}>({savings?.toLocaleString()} of {plan.totalSavings?.toLocaleString()} planned)</Text>
        </Box>
      ) : ('')}
      <Heading size="md" my={3}>{selectedYear} Summary</Heading>
      <Box mb={4} px={4} py={3} borderWidth={1} borderRadius="md" bg="gray.50">
        <StatGroup>
          <Stat textAlign={'center'}>
            <StatLabel>{selectedYear} Total Income</StatLabel>
            <StatNumber color="teal.600">${totalNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
          </Stat>
          <Stat textAlign={'center'}>
            <StatLabel>{selectedYear} Total Expenses</StatLabel>
            <StatNumber color="teal.600">${totalExpensesThisYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
          </Stat>
          <Stat textAlign={'center'}>
            <StatLabel>{selectedYear} Total Savings</StatLabel>
            <StatNumber color="teal.600">${totalSavingsThisYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
          </Stat>
        </StatGroup>
      </Box>
    </Box>
  );
}