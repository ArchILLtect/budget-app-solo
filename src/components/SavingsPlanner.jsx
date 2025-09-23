
import { Stack, Input, FormControl, FormLabel, RadioGroup, Radio } from '@chakra-ui/react'
import { useEffect } from 'react';
import { useBudgetStore } from '../state/budgetStore'

// TODO: Use FormErrorMessage for better validation feedback

export default function SavingsPlanner() {
    const { currentScenario, expenses, updateExpense, addExpense, removeExpense,
        saveScenario, incomeSources
    } = useBudgetStore();
    const savingsMode = useBudgetStore((s) => s.savingsMode);
    const customSavings = useBudgetStore((s) => s.customSavings);
    const setSavingsMode = useBudgetStore((s) => s.setSavingsMode);
    const setCustomSavings = useBudgetStore((s) => s.setCustomSavings);

    const netIncome = useBudgetStore((s) => s.getTotalNetIncome().net);
    
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
    }, [savingsMode, customSavings, netIncome, expenses, addExpense, removeExpense, updateExpense])

    useEffect(() => {
        if (currentScenario) {
            saveScenario(currentScenario);
        }
    }, [savingsMode, customSavings, expenses, incomeSources, currentScenario, saveScenario]);

    return (
        <>
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
        </>
    )
}