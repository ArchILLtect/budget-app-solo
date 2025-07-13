import {
  Box,
  Flex,
  Center,
  Heading,
  List,
  ListItem,
  Text,
  Input,
  Button,
  HStack,
  VStack,
} from "@chakra-ui/react";
import { DeleteIcon } from '@chakra-ui/icons'
import { useState } from "react";
import { useBudgetStore } from "../state/budgetStore";
import dayjs from "dayjs";

export default function SavingsLog() {
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const savingsLogs = useBudgetStore((s) => s.savingsLogs);
  const addSavingsLog = useBudgetStore((s) => s.addSavingsLog);
  const deleteSavingsEntry = useBudgetStore((s) => s.deleteSavingsEntry);
  const resetSavingsLog = useBudgetStore((s) => s.resetSavingsLog);
  const logsForMonth = savingsLogs[selectedMonth] || [];
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;

    addSavingsLog(selectedMonth, {
      amount: value,
      date: dayjs().format("YYYY-MM-DD"),
    });
  };

  return (
    <Box bg="white" p={4} borderRadius="md" boxShadow="sm" mt={6}>
      <Heading size="sm" mb={3}>
        💸 Savings Log
      </Heading>

      <HStack mb={3}>
        <Input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleAdd}>
          Add Entry
        </Button>
      </HStack>

      {logsForMonth.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          No savings recorded for this month yet.
        </Text>
      ) : (
        <Box>
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
                  <Button
                    size="xs"
                    colorScheme="red"
                    onClick={() => deleteSavingsEntry(selectedMonth, index)}
                  >
                    <DeleteIcon />
                  </Button>
                </Flex>
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



    </Box>
  );
}