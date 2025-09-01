import React from "react";
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
  const updateSavingsLog = useBudgetStore((s) => s.updateSavingsLog);
  const deleteSavingsEntry = useBudgetStore((s) => s.deleteSavingsEntry);
  const resetSavingsLog = useBudgetStore((s) => s.resetSavingsLog);
  const logsForMonth = savingsLogs[selectedMonth] || [];
  const [selectedGoal, setSelectedGoal] = useState(savingsGoals[0]?.id || "");
  const [editingLogId, setEditingLogId] = useState(null);
  const [editGoalId, setEditGoalId] = useState("");
  const [amount, setAmount] = useState("");
  const bg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const totalSavings = logsForMonth.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
  const goal = savingsGoals.find((g) => g.id === selectedGoal);
  const hasSelectedGoal = !!goal;
  const logsForGoal = hasSelectedGoal
    ? Object.values(savingsLogs).flat().filter((log) => log.goalId === selectedGoal)
    : [];
  const totalForGoal = hasSelectedGoal ? logsForGoal.reduce((sum, e) => sum + (e.amount || 0), 0) : 0;
  const rawRemaining = hasSelectedGoal ? (goal?.target ?? 0) - totalForGoal : Infinity;
  const remaining = hasSelectedGoal
    ? Math.max(Number.isFinite(rawRemaining) ? rawRemaining : 0, 0)
    : Infinity;
  const goalComplete = hasSelectedGoal ? remaining <= 0 : false;

  // TODO: Clamp the value here also.
  const handleAdd = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    addSavingsLog(selectedMonth, {
      goalId: selectedGoal || null, // "" -> null (no goal)
      amount: value,
      date: dayjs().format("YYYY-MM-DD"),
    });
    setAmount("");
  };

  // begin editing a specific row's goal
  const beginEditRow = (entry) => {
    setEditingLogId(entry.id);
    setEditGoalId(entry.goalId || ""); // "" sentinel for no goal
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
                <ListItem key={entry.id ?? `${entry.date}-${entry.amount}-${index}`}>
                  <Flex justify="space-between" alignItems="center">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">${entry.amount?.toFixed(2)}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {entry.date}
                      </Text>
                    </VStack>
                    {editingLogId === entry.id ? (
                      <Flex gap={2} align="center">
                        <Select
                          width={300}
                          value={editGoalId}
                          onChange={(e) => setEditGoalId(e.target.value)}
                        >
                          <option value="">{'---'}</option>
                          {savingsGoals.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </Select>
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => {
                            const newGoalId = editGoalId || null; // "" -> null
                            updateSavingsLog(selectedMonth, entry.id, { goalId: newGoalId });
                            toast({ title: 'Entry updated', status: 'success', duration: 1500 });
                            setEditingLogId(null);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setEditingLogId(null)}
                        >
                          Cancel
                        </Button>
                      </Flex>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => beginEditRow(entry)}
                      >
                        {savingsGoals.find((g) => g.id === entry.goalId)?.name || '----'}
                        {' '}
                        {savingsGoals.find((g) => g.id === entry.goalId)
                          ? `(${savingsGoals.find((g) => g.id === entry.goalId)?.target ?? '---'})`
                          : ''}
                      </Button>
                    )}
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
                // Only clamp if a goal is selected
                const clamped = hasSelectedGoal && Number.isFinite(remaining)
                  ? Math.min(raw, remaining)
                  : raw;
                setAmount(Number.isFinite(clamped) ? clamped : "");
              }}
              width={300}
              max={hasSelectedGoal && Number.isFinite(remaining) ? remaining : undefined}
              isDisabled={hasSelectedGoal ? goalComplete : false}
            />
            <Select
              width={300}
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
            >
              <option value="">{'---'}</option>
              {savingsGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.name}</option>
              ))}
            </Select>
            <Button colorScheme="teal" onClick={handleAdd} isDisabled={goalComplete}>
              Add Entry
            </Button>
          </Flex>
          <Center>
            <Text fontSize="sm" color={hasSelectedGoal ? (goalComplete ? 'green.600' : 'orange.500') : 'gray.500'}>
              {hasSelectedGoal
                ? (goalComplete
                  ? `✅ Goal complete! HINT: You may need to add a new savings goal to continue saving.` //TODO: Make HINT display on new line.
                  : `⚠️ $${(Number.isFinite(remaining) ? remaining : 0).toLocaleString()} remaining to complete "${goal?.name}"`)
                : `No goal selected — this entry won't count toward any goal.`}
            </Text>
          </Center>
          <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
        </Stack>
      </Collapse>
    </Box>
  );
}