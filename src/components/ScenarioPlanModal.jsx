import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Select
} from "@chakra-ui/react";
import { useState } from "react";
import { useBudgetStore } from "../state/budgetStore";
import { calculateTotalTaxes, calculateNetIncome } from "../utils/calcUtils";

export default function ScenarioPlanModal({ isOpen, onClose }) {
  const scenarios = useBudgetStore((s) => s.scenarios);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const saveMonthlyPlan = useBudgetStore((s) => s.saveMonthlyPlan);

  const [selectedScenario, setSelectedScenario] = useState(Object.keys(scenarios)[0] || "");

  const handleSave = (e) => {
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
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleSave} colorScheme="teal" mr={3}>Use Scenario</Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
      </ModalContent>
    </Modal>
  );
}