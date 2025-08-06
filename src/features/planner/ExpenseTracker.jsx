import { useState, useEffect } from 'react'
import { useBudgetStore } from '../../state/budgetStore'
import {
  Box, Flex, Collapse, Heading, Stack, Input, Button, HStack,
  IconButton, Stat, StatGroup, StatLabel, StatNumber, Tooltip,
  Checkbox, Text
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons'
import SavingsPlanner from '../../components/SavingsPlanner';

// TODO: Use FormErrorMessage for better validation feedback

export default function ExpenseTracker({ origin = 'Planner', selectedMonth = null }) {
  const { currentScenario,
    saveScenario, showExpenseInputs, setShowExpenseInputs, incomeSources
  } = useBudgetStore();
  const plannerExpenses = useBudgetStore((s) => s.expenses);
  const addExpenseRaw = useBudgetStore((s) => s.addExpense);
  const updateExpenseRaw = useBudgetStore((s) => s.updateExpense);
  const removeExpenseRaw = useBudgetStore((s) => s.removeExpense);
  const addActualExpense = useBudgetStore((s) => s.addActualExpense);
  const removeActualExpense = useBudgetStore((s) => s.removeActualExpense);
  const actualraw = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);
  const updateMonthlyExpenseActuals = useBudgetStore((s) => s.updateMonthlyExpenseActuals);
  const overiddenExpenseTotal = useBudgetStore((s) => s.monthlyActuals[selectedMonth]?.overiddenExpenseTotal);
  const setOveriddenExpenseTotal = useBudgetStore((s) => s.setOveriddenExpenseTotal);

  const [overrideEnabled, setOverrideEnabled] = useState(overiddenExpenseTotal >= 1);
  const isTracker = origin === 'Tracker';
  const actual = actualraw || {};
  const trackerExpenses = actual.actualExpenses || [];
  const expenses = isTracker ? trackerExpenses : plannerExpenses;
  const addExpense = isTracker
    ? (entry) => addActualExpense(selectedMonth, entry)
    : addExpenseRaw;
  const updateExpense = isTracker
    ? (id, data) => updateMonthlyExpenseActuals(selectedMonth, id, data)
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

  // ✅ SYNC toggle state on load (in case store updates later)
  useEffect(() => {
    setOverrideEnabled(overiddenExpenseTotal >= 1);
  }, [overiddenExpenseTotal]);

  const handleRemove = (id) => {
    if (window.confirm('Are you sure you want to remove this expense?')) {
      removeExpense(id)
    }
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} mt={6}>
      <Flex justifyContent="space-between" alignItems="center" borderWidth={1} p={3} borderRadius="lg">
        <Heading size="md">Expenses (Monthly)</Heading>
        <Heading size="md">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Heading>
      </Flex>
      <Flex justifyContent={'end'} my={2}>
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowExpenseInputs(!showExpenseInputs)}>
          {showExpenseInputs ? 'Hide Expense Inputs' : 'Show Expense Inputs'}
        </Button>
      </Flex>


      <Stack spacing={3}>
        <Collapse mb={4} in={showExpenseInputs} animateOpacity>
          <Stack spacing={3}>
            {expenses.map((expense) => (
              <HStack key={expense.id}>
                <Input
                  value={expense?.name}
                  isInvalid={!expense?.name?.trim()}
                  isDisabled={expense?.name === "Rent"}
                  onChange={(e) =>
                    updateExpense(expense.id, { name: e.target.value })
                  }
                  placeholder="Expense name"
                />
                <Input
                  type="number"
                  value={expense.amount}
                  isInvalid={expense.amount <= 0}
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

            {!isTracker ? (
              <Box width={'25%'} p={1}>
                <Button
                  onClick={() => addExpense({ name: '', amount: 0 })}
                  leftIcon={<AddIcon />}
                  size="sm"
                >
                  Add Expense
                </Button>
              </Box>
            ) : (
            <Flex justifyContent="space-between" alignItems="center">
              <Box width={'25%'} p={1}>
                <Button
                  onClick={() => addExpense({ name: '', amount: 0 })}
                  leftIcon={<AddIcon />}
                  size="sm"
                >
                  Add Expense
                </Button>
              </Box>
              <Flex gap={2} alignItems="center" p={2} borderWidth={1} borderColor={'lightpink'}>
                <Flex gap={2} alignItems="center" py={'7px'} px={4} borderWidth={1}
                    borderColor={'gray.200'} borderRadius={'md'}>
                  <Checkbox
                    isChecked={overrideEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setOverrideEnabled(checked);
                      if (!checked) {
                        setOveriddenExpenseTotal(selectedMonth, 0);
                      }
                    }}
                    whiteSpace={'nowrap'}
                  >
                    Total Override
                  </Checkbox>
                  <Tooltip label="Use this to override the system-calculated total." hasArrow placement="top">
                    <span>
                      <InfoIcon color="gray.500" />
                    </span>
                  </Tooltip>
                </Flex>
                <Input
                  type="number"
                  value={overrideEnabled ? (overiddenExpenseTotal ?? '') : ''}
                  isDisabled={!overrideEnabled}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setOveriddenExpenseTotal(selectedMonth, isNaN(value) ? 0 : value);
                  }}
                />
              </Flex>
            </Flex>
            )}
            {!isTracker &&
              <SavingsPlanner />
            }
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