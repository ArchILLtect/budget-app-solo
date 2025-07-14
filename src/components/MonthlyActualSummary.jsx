import { Box, Text, Heading, Stat, StatLabel, StatNumber, Stack, HStack,
  StatGroup, Progress, useColorModeValue, Flex, Button, Collapse, Input,
  IconButton, FormControl, FormLabel, Radio, RadioGroup
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import { useEffect } from 'react';
import { useBudgetStore } from '../state/budgetStore';
import dayjs from 'dayjs';
import ExpenseTracker from '../features/planner/ExpenseTracker';

export default function MonthlyActualSummary() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const showExpenseInputs = useBudgetStore((s) => s.showExpenseInputs);
  const setShowExpenseInputs = useBudgetStore((s) => s.setShowExpenseInputs);
  const plan = useBudgetStore((s) => s.monthlyPlans[selectedMonth]);
  const actual = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);
  const savingsSoFar = useBudgetStore((s) => s.getSavingsForMonth(selectedMonth));
  const addExpense = useBudgetStore((s) => s.addActualExpense);
  const removeActualExpense = useBudgetStore((s) => s.removeActualExpense);
  const updateExpense = useBudgetStore((s) => s.updateMonthlyActuals);

  const bg = useColorModeValue('white', 'gray.700');

  const netIncome = actual?.actualIncome || 0;
  const expenses = actual?.actualExpenses || [];
  const totalExpenses = actual?.actualExpenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const savings = actual?.actualSavings || savingsSoFar || 0;
  const savingsMode = actual?.savingsMode || 'none';
  const customSavings = actual?.customSavings || 0;
  const leftover = netIncome - totalExpenses - savings;

  const plannedIncome = plan?.netIncome || 0;
  const plannedSavings = plan?.totalSavings || 0;
  const plannedExpenses = plan?.totalExpenses || 0;
  const plannedLeftover = plannedIncome - plannedSavings - plannedExpenses;

  const percentComplete = plan?.totalSavings ? Math.min((savings / plan.totalSavings) * 100, 100) : 0;

  return (
    <Box p={4} mb={4} borderBottomRadius="lg" boxShadow="md" bg={bg}>
      {actual &&
      <>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md" fontWeight="bold" mb={2}>This Month's Summary</Heading>
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowExpenseInputs(!showExpenseInputs)}>
          {showExpenseInputs ? 'Hide Inputs' : 'Show Inputs'}
        </Button>
      </Flex>

      <Stack spacing={3}>
        <Collapse mb={4} in={showExpenseInputs} animateOpacity>
          <ExpenseTracker origin='Tracker' selectedMonth={selectedMonth} />
          
          <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
        </Collapse>
      </Stack>
      </>
      }
      <Box mt={2} px={4} py={3} borderWidth={1} borderRadius="md" bg="gray.50">
        <StatGroup>
          <Stat textAlign={'center'}>
            <StatLabel>Actual Net Income</StatLabel>
            <StatNumber color="teal.500">${netIncome.toLocaleString()}</StatNumber>
          </Stat>

          <Stat textAlign={'center'}>
            <StatLabel>Total Expenses</StatLabel>
            <StatNumber color="orange.500">${totalExpenses.toLocaleString()}</StatNumber>
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
      </Box>

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