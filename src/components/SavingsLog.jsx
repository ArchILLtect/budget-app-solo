import {
  Box, Flex, Center, Heading, Stack, List, ListItem, Text,
  Input, Button, useToast, VStack, Collapse, useColorModeValue,
  Select
} from "@chakra-ui/react";
import { DeleteIcon } from '@chakra-ui/icons'
import { useState } from "react";
import { useBudgetStore } from "../state/budgetStore";
import dayjs from "dayjs";

export default function SavingsLog() {
  const showInputs = useBudgetStore((s) => s.showSavingsLogInputs);
  const setShowInputs = useBudgetStore((s) => s.setShowSavingsLogInputs);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const savingsLogs = useBudgetStore((s) => s.savingsLogs);
  const addSavingsLog = useBudgetStore((s) => s.addSavingsLog);
  const deleteSavingsEntry = useBudgetStore((s) => s.deleteSavingsEntry);
  const resetSavingsLog = useBudgetStore((s) => s.resetSavingsLog);
  const logsForMonth = savingsLogs[selectedMonth] || [];
  const [amount, setAmount] = useState("");
  const bg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const totalSavings = logsForMonth.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

  const handleAdd = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    addSavingsLog(selectedMonth, {
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
                    <Text>For: {entry.id}</Text>
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
            <Stack mt={10} spacing={3}>
              <Flex justifyContent="space-between" alignItems="center" mb={3}>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  width={300}
                />
                <Select width={300}>
                  {/* TODO: Need to add options based on existing Savings Goals */}
                  <option>Yearly</option>
                </Select>
                <Button colorScheme="teal" onClick={handleAdd}>
                  Add Entry
                </Button>
              </Flex>
              <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
            </Stack>
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
      </Collapse>



    </Box>
  );
}