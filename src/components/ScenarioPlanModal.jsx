import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Select, Checkbox, useToast
} from "@chakra-ui/react";
import { useState } from "react";
import { useBudgetStore } from "../state/budgetStore";
import { calculateTotalTaxes, calculateNetIncome } from "../utils/calcUtils";

export default function ScenarioPlanModal({ isOpen, onClose }) {
  const scenarios = useBudgetStore((s) => s.scenarios);
  const saveMonthlyPlan = useBudgetStore((s) => s.saveMonthlyPlan);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const monthlyActuals = useBudgetStore((s) => s.monthlyActuals);
  const currentActuals = monthlyActuals[selectedMonth];

  // const [applyAsActuals, setApplyAsActuals] = useState(false); // planned feature
  const [selectedScenario, setSelectedScenario] = useState(Object.keys(scenarios)[0] || "");
  const toast = useToast();

  const handleSave = () => {
    const scenario = scenarios[selectedScenario];
    if (!scenario) return;

    const grossIncome = calculateNetIncome(scenario.incomeSources);
    const totalTaxes = calculateTotalTaxes(grossIncome);
    const netIncome = (grossIncome - totalTaxes.total) / 12;

    const savingsPercent =
      scenario.savingsMode === "10"
        ? 0.1
        : scenario.savingsMode === "20"
        ? 0.2
        : scenario.savingsMode === "custom"
        ? (scenario.customSavings || 0) / 100
        : 0;

    const estSavings = +(netIncome * savingsPercent).toFixed(2);
    const totalExpenses = scenario.expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const estLeftover = netIncome - totalExpenses;

    saveMonthlyPlan(selectedMonth, {
      scenarioName: selectedScenario,
      incomeSources: JSON.parse(JSON.stringify(scenario.incomeSources)),
      expenses: JSON.parse(JSON.stringify(scenario.expenses)),
      savingsMode: scenario.savingsMode,
      customSavings: scenario.customSavings,
      netIncome: netIncome,
      savingsPercent: savingsPercent,
      totalSavings: estSavings,
      totalExpenses: totalExpenses,
      estLeftover: estLeftover
    });

    /* TODO: Apply to actuals if selected
    if (applyAsActuals && !currentActuals) {
      useBudgetStore.getState().updateMonthlyActuals(selectedMonth, {
        actualFixedIncomeSources: JSON.parse(JSON.stringify(scenario.incomeSources)),
        actualExpenses: JSON.parse(JSON.stringify(scenario.expenses)),
        actualTotalNetIncome: netIncome,
        savingsMode: scenario.savingsMode,
        customSavings: scenario.customSavings,
      });
    }*/

    if (currentActuals) {
      toast({
        title: "Plan Saved",
        description: "Actuals already exist and were not changed.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Plan & Actuals Saved",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Select a Scenario</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
          >
            {Object.keys(scenarios).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </Select>
          {/* TODO: Add scenario checkbox for applying to actuals
          <Checkbox
            isChecked={applyAsActuals}
            onChange={(e) => setApplyAsActuals(e.target.checked)}
            colorScheme="teal"
            mt={4}
          >
            Also apply this scenario to actuals
          </Checkbox>*/}
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleSave} colorScheme="teal" mr={3}>Use Scenario</Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}