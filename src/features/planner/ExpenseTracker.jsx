import { useState, useEffect } from 'react'
import { useBudgetStore } from '../../state/budgetStore'
import {
  Box,
  Flex,
  Collapse,
  Heading,
  Stack,
  Input,
  Button,
  HStack,
  IconButton,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon } from '@chakra-ui/icons'

// TODO: Use FormErrorMessage for better validation feedback

export default function ExpenseTracker() {
  const { currentScenario,
    saveScenario,
    showExpenseInputs,
    setShowExpenseInputs,
    incomeSources,
    savingsMode,
    setSavingsMode,
    customSavings,
    setCustomSavings,
    expenses,
    addExpense,
    updateExpense,
    removeExpense
  } = useBudgetStore();
  const handleRemove = (id) => {
    if (window.confirm('Are you sure you want to remove this expense?')) {
      removeExpense(id)
    }
  }

  const netIncome = useBudgetStore((s) => s.getTotalNetIncome().net);
  const monthlyIncome = netIncome / 12;

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const savingsValue = expenses.find(e => e.id === 'savings')?.amount || 0
  const leftover = monthlyIncome - totalExpenses;

  useEffect(() => {
    const monthlyIncome = netIncome / 12

    let savingsPercent = 0
    if (savingsMode === '10') savingsPercent = 0.1
    else if (savingsMode === '20') savingsPercent = 0.2
    else if (savingsMode === 'custom' && customSavings)
      savingsPercent = customSavings / 100

    const savingsAmount = parseFloat((monthlyIncome * savingsPercent).toFixed(2))

    const existing = expenses.find((e) => e.id === 'savings')
    if (savingsMode === 'none') {
      if (existing) removeExpense('savings')
    } else {
      if (existing) {
        updateExpense('savings', { amount: savingsAmount })
      } else {
        addExpense({
          id: 'savings',
          name: 'Savings',
          amount: savingsAmount,
          isSavings: true,
        })
      }
    }
  }, [savingsMode, customSavings, netIncome])

  useEffect(() => {
    if (currentScenario) {
      saveScenario(currentScenario);
    }
  }, [savingsMode, customSavings, expenses, incomeSources]);

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

            <FormControl mt={4}>
              <FormLabel fontWeight="semibold">Include Savings?</FormLabel>
              <RadioGroup
                value={savingsMode}
                onChange={(val) => setSavingsMode(val)}
              >
                <Stack direction="row">
                  <Radio value="none">None</Radio>
                  <Radio value="10">10%</Radio>
                  <Radio value="20">20%</Radio>
                  <Radio value="custom">Custom</Radio>
                </Stack>
              </RadioGroup>

              {savingsMode === 'custom' && (
                <Input
                  mt={2}
                  type="number"
                  max={100}
                  min={1}
                  value={customSavings || ''}
                  placeholder="Enter custom %"
                  onChange={(e) => {
                    const raw = parseFloat(e.target.value) || 0
                    const clamped = Math.min(Math.max(raw, 1), 100)
                    setCustomSavings(clamped)
                  }}
                />
              )}
            </FormControl>
          </Stack>
        </Collapse>
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
      </Stack>
    </Box>
  )
}