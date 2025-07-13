import {
  Box,
  Text,
  Center,
  Stat,
  StatLabel,
  StatNumber,
  Progress,
  Input,
  Button,
  HStack,
  VStack,
  useToast,
  Flex
} from '@chakra-ui/react';
import { useState } from 'react';
import { useBudgetStore } from '../../state/budgetStore';
import dayjs from 'dayjs';

export default function SavingsProgressBar() {

  const currentMonthKey = dayjs().format('YYYY-MM');
  const monthlyActuals = useBudgetStore((s) => s.monthlyActuals[currentMonthKey]);
  const savingsGoal = useBudgetStore((s) => s.savingsGoal);
  const setSavingsGoal = useBudgetStore((s) => s.setSavingsGoal);
  const resetSavingsLogs = useBudgetStore((s) => s.resetSavingsLogs);
  const getTotalSavingsLogged = useBudgetStore((s) => s.getTotalSavingsLogged);
  const [showGoalEdit, setshowGoalEdit] = useState(false)
  const toast = useToast();
  const [newGoal, setNewGoal] = useState(savingsGoal);

  const totalSaved = getTotalSavingsLogged();
  // const actualSavings = monthlyActuals?.actualSavings || 0;
  const progress = savingsGoal > 0 ? (totalSaved / savingsGoal) * 100 : 0;

  const handleGoalSave = () => {
    setSavingsGoal(newGoal);
    toast({ title: 'Savings goal updated!', status: 'success', duration: 2000 });
  };

  const resetGoal = () => {
    const confirm = window.confirm(
      `Are you sure you want to reset the goal? This will remove your current savings progress of $${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`
    );
    if (confirm) {
      resetSavingsLogs();
      console.log("Resetting savings goal");
      toast({ title: 'Savings goal reset!', status: 'error', duration: 2000 });
    }
  };

  return (
    <Box mt={4} borderWidth={1} p={4} borderRadius="lg" bg="white" boxShadow="md">
      <Flex justify="space-between" align="center" mb={4}>
      <Button size="xs" colorScheme="blue" onClick={() => setshowGoalEdit(!showGoalEdit)}>Edit</Button>
      <Stat mb={4} textAlign="center">
        <StatLabel>Savings Goal Progress</StatLabel>
        <StatNumber color="green.500">
          ${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${savingsGoal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </StatNumber>
      </Stat>
      <Button size="xs" colorScheme="red" onClick={() => resetGoal()}>Reset</Button>
      </Flex>

      <Progress value={progress} size="lg" colorScheme="green" borderRadius="xl" mb={4} />

      {showGoalEdit && (
        <Box borderWidth={1} p={4} borderRadius="lg" bg="gray.50" boxShadow="sm">
          <VStack align="start" spacing={2}>
            <Flex justify="space-between" width="100%">
              <Center>
                <Text fontWeight="bold">Current Goal:</Text>
              </Center>
              <HStack spacing={2}>
                <Input
                  type="number"
                  placeholder="Enter savings goal"
                  value={newGoal}
                  onChange={(e) => setNewGoal(parseFloat(e.target.value) || 0)}
                />
                <Button colorScheme="blue" onClick={handleGoalSave}>
                  Save
                </Button>
              </HStack>
            </Flex>
            <Text fontSize="sm" color="gray.500">
              You have saved {totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })} this month. Your goal is to save {savingsGoal.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
            </Text>
            <Text fontSize="sm" color="gray.500">
              Adjust your savings goal to stay on track with your budget.
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
}