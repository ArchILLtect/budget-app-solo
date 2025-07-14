import { useEffect } from 'react'
import { useBudgetStore } from '../../state/budgetStore'
import {
  Box, Flex, Collapse, Heading, Stack, Input, Button, HStack, IconButton,
  Stat, StatGroup, StatLabel, StatNumber
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'
import SavingsPlanner from '../../components/SavingsPlanner';

// TODO: Use FormErrorMessage for better validation feedback

export default function ExpenseTracker({ origin = 'Planner', selectedMonth = null }) {
  const { currentScenario,
    saveScenario, showExpenseInputs, setShowExpenseInputs, incomeSources
  } = useBudgetStore();

  const actualraw = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);
  const actual = actualraw || {};
  const plannerExpenses = useBudgetStore((s) => s.expenses);
  const trackerExpenses = actual.actualExpenses || [];

  const addExpenseRaw = useBudgetStore((s) => s.addExpense);
  const addActualExpense = useBudgetStore((s) => s.addActualExpense);
  const updateExpenseRaw = useBudgetStore((s) => s.updateExpense);
  const updateMonthlyActuals = useBudgetStore((s) => s.updateMonthlyActuals);
  const removeExpenseRaw = useBudgetStore((s) => s.removeExpense);
  const removeActualExpense = useBudgetStore((s) => s.removeActualExpense);
  const isTracker = origin === 'Tracker';
  const expenses = isTracker ? trackerExpenses : plannerExpenses;
  const addExpense = isTracker
    ? (entry) => addActualExpense(selectedMonth, entry)
    : addExpenseRaw;
  const updateExpense = isTracker
    ? (id, data) => updateMonthlyActuals(selectedMonth, id, data)
    : updateExpenseRaw;
  const removeExpense = isTracker
    ? (id) => removeActualExpense(selectedMonth, id)
    : removeExpenseRaw;
  const netIncome = useBudgetStore((s) => s.getTotalNetIncome().net);
  const monthlyIncome = netIncome / 12;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const savingsValue = expenses.find(e => e.id === 'savings')?.amount || 0
  const leftover = monthlyIncome - totalExpenses;

  useEffect(() => {
    if (currentScenario) {
      saveScenario(currentScenario);
    }
  }, [expenses, incomeSources]);

  const handleRemove = (id) => {
    if (window.confirm('Are you sure you want to remove this expense?')) {
      removeExpense(id)
    }
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} mt={6}>
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md" mb={3}>Expenses (Monthly)</Heading>
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowExpenseInputs(!showExpenseInputs)}>
          {showExpenseInputs ? 'Hide Inputs' : 'Show Inputs'}
        </Button>
      </Flex>

      <Stack spacing={3}>
        <Collapse mb={4} in={showExpenseInputs} animateOpacity>
          <Stack spacing={3}>
            {expenses.map((expense) => (
              <HStack key={expense.id}>
                <Input
                  value={expense.name}
                  isInvalid={!expense.name.trim()}
                  onChange={(e) =>
                    updateExpense(expense.id, { name: e.target.value })
                  }
                  placeholder="Expense name"
                />
                <Input
                  type="number"
                  value={expense.amount}
                  isInvalid={expense.amount < 0}
                  onChange={(e) =>
                    updateExpense(expense.id, { amount: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Amount"
                />
                {expense.id !== 'rent' && !expense.isSavings && (
                  <IconButton
                    aria-label="Remove expense"
                    icon={<DeleteIcon />}
                    onClick={() => handleRemove(expense.id)}
                    size="sm"
                    colorScheme="red"
                  />
                )}
              </HStack>
            ))}

            <Button
              onClick={() => addExpense({ name: '', amount: 0 })}
              leftIcon={<AddIcon />}
              size="sm"
              alignSelf="start"
            >
              Add Expense
            </Button>
            <SavingsPlanner />
          </Stack>
        </Collapse>
        {!isTracker &&
          <Box mt={2} px={4} py={3} borderWidth={1} borderRadius="md" bg="gray.50">
            <StatGroup>
              <Stat textAlign={'center'}>
                <StatLabel>Est. Net Income</StatLabel>
                <StatNumber color="teal.600">${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
              </Stat>

              <Stat textAlign={'center'}>
                <StatLabel>Total Expenses</StatLabel>
                <StatNumber color="teal.600">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
              </Stat>

              {savingsValue > 0 && (
                <Stat textAlign={'center'}>
                  <StatLabel>Total Savings</StatLabel>
                  <StatNumber color="teal.600">${savingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
                </Stat>
              )}

              <Stat textAlign={'center'}>
                <StatLabel>Leftover</StatLabel>
                <StatNumber color={leftover >= 0 ? 'green.600' : 'red.600'} fontSize="2xl">
                  ${leftover.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </StatNumber>
              </Stat>
            </StatGroup>
          </Box>
        }
      </Stack>
    </Box>
  )
}