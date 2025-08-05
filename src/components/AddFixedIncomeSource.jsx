import { useState, useEffect } from 'react'
import { useBudgetStore } from '../state/budgetStore'
import {
  Box, Flex, Stack, Input, Button, HStack,
  IconButton, Checkbox, Tooltip
} from '@chakra-ui/react'
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons'

// TODO: Use FormErrorMessage for better validation feedback

export default function AddFixedIncomeSource({ origin = 'Planner', selectedMonth = null }) {

  const overiddenIncomeTotal = useBudgetStore(s => s.monthlyActuals[selectedMonth]?.overiddenIncomeTotal);
  const setOveriddenIncomeTotal = useBudgetStore((s) => s.setOveriddenIncomeTotal);
  const addSourceRaw = useBudgetStore((s) => s.addFixedIncomeSource);
  const updateSourceRaw = useBudgetStore((s) => s.updateFixedIncomeSource);
  const removeSourceRaw = useBudgetStore((s) => s.removeFixedIncomeSource);
  const addActualIncomeSource = useBudgetStore((s) => s.addActualIncomeSource);
  const removeActualIncomeSource = useBudgetStore((s) => s.removeActualIncomeSource);
  const updateMonthlyIncomeActuals = useBudgetStore((s) => s.updateMonthlyIncomeActuals);
  const actualraw = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);
  const actual = actualraw || {};
  const sources = actual.actualFixedIncomeSources || [];

  const [overrideEnabled, setOverrideEnabled] = useState(overiddenIncomeTotal >= 1);

  const isTracker = origin === 'Tracker';

  const addSource = isTracker
  ? (entry) => addActualIncomeSource(selectedMonth, entry)
  : addSourceRaw;
  const updateSource = isTracker
    ? (id, data) => updateMonthlyIncomeActuals(selectedMonth, id, data)
    : updateSourceRaw;
  const removeSource = isTracker
    ? (id) => removeActualIncomeSource(selectedMonth, id)
    : removeSourceRaw;

  const handleRemove = (id) => {
    if (window.confirm('Are you sure you want to remove this expense?')) {
      removeSource(id)
    }
  }

  // ✅ SYNC toggle state on load (in case store updates later)
  useEffect(() => {
    setOverrideEnabled(overiddenIncomeTotal >= 1);
  }, [overiddenIncomeTotal]);

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} mt={6}>

        <Stack spacing={3}>
        {sources.map((source) => (
            <HStack key={source.id}>
            <Input
                value={source.description}
                isInvalid={!source?.description?.trim()}
                onChange={(e) =>
                  updateSource(source.id, { description: e.target.value })
                }
                placeholder="Source name"
            />
            <Input
              type="number"
              value={source.amount}
              isInvalid={source.amount < 0}
              onChange={(e) =>
                updateSource(source.id, { amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="Amount"
            />
            {source.id !== 'main' &&
              <IconButton
                aria-label="Remove source"
                icon={<DeleteIcon />}
                onClick={() => handleRemove(source.id)}
                size="sm"
                colorScheme="red"
              />
            }
            </HStack>
        ))}

        {!isTracker ? (
            <Box width={'25%'} p={1}>
            <Button
                onClick={() => addSource({ name: '', amount: 0 })}
                leftIcon={<AddIcon />}
                size="sm"
            >
                Add Source
            </Button>
            </Box>
        ) : (
        <Flex justifyContent="space-between" alignItems="center">
            <Box width={'25%'} p={1}>
            <Button
                onClick={() => addSource({ name: '', amount: 0 })}
                leftIcon={<AddIcon />}
                size="sm"
            >
                Add Source
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
                        setOveriddenIncomeTotal(selectedMonth, 0);
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
                  value={overrideEnabled ? (overiddenIncomeTotal ?? '') : ''}
                  isDisabled={!overrideEnabled}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setOveriddenIncomeTotal(selectedMonth, isNaN(value) ? 0 : value);
                  }}
              />
            </Flex>
        </Flex>
        )}
        </Stack>
    </Box>
  )
}