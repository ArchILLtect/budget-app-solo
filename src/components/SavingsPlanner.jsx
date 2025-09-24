import { Stack, Input, FormControl, FormLabel, RadioGroup, Radio } from '@chakra-ui/react'
import { useBudgetStore } from '../state/budgetStore'

// TODO: Use FormErrorMessage for better validation feedback

export default function SavingsPlanner() {
    const { currentScenario, expenses, updateExpense, addExpense, removeExpense, saveScenario } = useBudgetStore();
    const savingsMode = useBudgetStore((s) => s.savingsMode);
    const customSavings = useBudgetStore((s) => s.customSavings);
    const setSavingsMode = useBudgetStore((s) => s.setSavingsMode);
    const setCustomSavings = useBudgetStore((s) => s.setCustomSavings);

    const netIncome = useBudgetStore((s) => s.getTotalNetIncome().net);

    // Apply the savings line based on current inputs (called from event handlers only)
    const applySavings = (nextMode, nextCustom) => {
        const monthlyIncome = (Number(netIncome) || 0) / 12;
        let pct = 0;
        if (nextMode === '10') pct = 0.1;
        else if (nextMode === '20') pct = 0.2;
        else if (nextMode === 'custom') pct = (Number(nextCustom) || 0) / 100;

        const amount = +(monthlyIncome * pct).toFixed(2);
        const existing = expenses.find((e) => e.id === 'savings');

        if (pct <= 0) {
            if (existing) removeExpense('savings');
            return;
        }
        if (existing) {
            if (existing.amount !== amount) updateExpense('savings', { amount });
        } else {
            addExpense({ id: 'savings', name: 'Savings', amount, isSavings: true });
        }
    };

    return (
        <>
            <FormControl mt={4}>
                <FormLabel fontWeight="semibold">Include Savings?</FormLabel>
                <RadioGroup
                    value={savingsMode}
                    onChange={(next) => {
                        if (next !== savingsMode) {
                            setSavingsMode(next);
                            const nextCustom = next === 'custom' ? (customSavings ?? 0) : 0;
                            if (next !== 'custom' && (customSavings ?? 0) !== 0) setCustomSavings(0);
                            applySavings(next, nextCustom);
                            if (currentScenario) saveScenario(currentScenario);
                        }
                    }}
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
                        min={0}
                        value={customSavings ?? 0}
                        placeholder="Enter custom %"
                        onChange={(e) => {
                            const raw = Number(e.target.value);
                            const val = Number.isFinite(raw) ? raw : 0;
                            const clamped = Math.max(0, Math.min(100, val));
                            if (clamped !== (customSavings ?? 0)) {
                                if (savingsMode !== 'custom') setSavingsMode('custom');
                                setCustomSavings(clamped);
                                applySavings('custom', clamped);
                                if (currentScenario) saveScenario(currentScenario);
                            }
                        }}
                    />
                )}
            </FormControl>
        </>
    )
}