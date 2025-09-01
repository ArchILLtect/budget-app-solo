import {
  Box, Flex, Center, Heading, Stack, List, ListItem, Text,
  Input, Button, useToast, VStack, Collapse, useColorModeValue,
  Select
} from "@chakra-ui/react";
import { DeleteIcon } from '@chakra-ui/icons'
import { useState } from "react";
import { useBudgetStore } from "../state/budgetStore";
import dayjs from "dayjs";

// TODO: Refactor (see other TODO) savings log entry amount input's max prop to use selected goal's total goal amount.

export default function SavingsLog() {
  const showInputs = useBudgetStore((s) => s.showSavingsLogInputs);
  const setShowInputs = useBudgetStore((s) => s.setShowSavingsLogInputs);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const savingsGoals = useBudgetStore((s) => s.savingsGoals);
  const savingsLogs = useBudgetStore((s) => s.savingsLogs);
  const addSavingsLog = useBudgetStore((s) => s.addSavingsLog);
  const deleteSavingsEntry = useBudgetStore((s) => s.deleteSavingsEntry);
  const resetSavingsLog = useBudgetStore((s) => s.resetSavingsLog);
  const logsForMonth = savingsLogs[selectedMonth] || [];
  const [selectedGoal, setSelectedGoal] = useState(savingsGoals[0]?.id || "");
  const [amount, setAmount] = useState("");
  const bg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const totalSavings = logsForMonth.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const goal = savingsGoals.find((g) => g.id === selectedGoal);
  const logsForGoal = Object.values(savingsLogs)
    .flat()
    .filter((log) => log.goalId === selectedGoal);
  const totalForGoal = logsForGoal.reduce((sum, e) => sum + (e.amount || 0), 0);
  const rawRemaining = (goal?.target ?? 0) - totalForGoal;
  const remaining = Number.isFinite(rawRemaining) ? Math.max(rawRemaining, 0) : 0;
  const goalComplete = remaining <= 0;

  // TODO: Clamp the value here also.
  const handleAdd = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    addSavingsLog(selectedMonth, {
      goalId: selectedGoal,
      amount: value,
      date: dayjs().format("YYYY-MM-DD"),
    });
  };

  const handleRemove = (month, index) => {
    deleteSavingsEntry(month, index)
    toast({ title: 'Savings log deleted!', status: 'error', duration: 2000 });
  }

  return (
    <Box p={4} boxShadow="md" borderRadius="lg" mt={6} bg={bg} borderWidth={1}>

      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="md">Savings Logs</Heading>
        <Heading size="md">Total: ${totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Heading>
      </Flex>
      <Center>
        <Button size="xs" variant="link" colorScheme="blue" onClick={() => setShowInputs(!showInputs)}>
          {showInputs ? '▲ Hide All Logs ▲' : '▼ Show/Edit Logs ▼'}
        </Button>
      </Center>

      <Collapse in={showInputs} animateOpacity>
        {logsForMonth.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            No savings recorded for this month yet.
          </Text>
        ) : (
          <Box mt={6}>
            <List spacing={2}>
              {logsForMonth.map((entry, index) => (
                <ListItem key={index}>
                  <Flex justify="space-between" alignItems="center">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">${entry.amount.toFixed(2)}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {entry.date}
                      </Text>
                    </VStack>
                    <Text>
                      {savingsGoals.find((g) => g.id === entry.goalId)?.name || '----'}
                    </Text>
                    <Button
                      size="xs"
                      colorScheme="red"
                      onClick={() => handleRemove(selectedMonth, index)}
                    >
                      <DeleteIcon />
                    </Button>
                  </Flex>
                  <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
                </ListItem>
              ))}
            </List>
            {/* Reset Button */}
            <Center>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                onClick={() => resetSavingsLog(selectedMonth)}
                mt={2}
              >
                Reset Log
              </Button>
            </Center>
          </Box>
        )}
        <Stack mt={10} spacing={3}>
          <Flex justifyContent="space-between" alignItems="center" mb={3}>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const raw = parseFloat(e.target.value);
                if (!Number.isFinite(raw)) return setAmount("");
                // Only clamp when remaining is a finite number
                const clamped = Number.isFinite(remaining) ? Math.min(raw, remaining) : raw;
                // Never set NaN into the input
                setAmount(Number.isFinite(clamped) ? clamped : "");
              }}
              width={300}
              max={Number.isFinite(remaining) ? remaining : undefined}
              isDisabled={goalComplete}
            />
            <Select
              width={300}
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
            >
              <option value={"---"}>{"---"}</option>
              {savingsGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.name}</option>
              ))}
            </Select>
            <Button colorScheme="teal" onClick={handleAdd} isDisabled={goalComplete}>
              Add Entry
            </Button>
          </Flex>
          <Center>
            <Text fontSize="sm" color={goalComplete ? 'green.600' : 'orange.500'}>
              {goalComplete
                ? `✅ Goal complete! HINT: You may need to add a new savings goal to continue saving.` //TODO: Make HINT display on new line.
                : `⚠️ $${(Number.isFinite(remaining) ? remaining : 0).toLocaleString()} remaining to complete "${goal?.name}"`
              }
            </Text>
          </Center>
          <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
        </Stack>
      </Collapse>
    </Box>
  );
}