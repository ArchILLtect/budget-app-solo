import {
  Box, Text, Center, Stat, StatLabel, StatNumber, Progress, Input,
  Button, HStack, VStack, useToast, Flex, Heading, Card, Collapse
} from '@chakra-ui/react';
import { useState } from 'react';
import { useBudgetStore } from '../../state/budgetStore';
import { AddIcon, DeleteIcon, InfoIcon } from '@chakra-ui/icons'
import dayjs from 'dayjs';

export default function SavingsGoalsTracker() {

  const selectedMonth =  useBudgetStore((s) => s.selectedMonth);
  const selectedYear = dayjs(selectedMonth).format('YYYY');
  //const currentMonthKey = dayjs().format('YYYY-MM');
  //const monthlyActuals = useBudgetStore((s) => s.monthlyActuals[currentMonthKey]);
  const savingsGoal = useBudgetStore((s) => s.savingsGoal);
  const setSavingsGoal = useBudgetStore((s) => s.setSavingsGoal);
  const resetSavingsLogs = useBudgetStore((s) => s.resetSavingsLogs);
  const getTotalSavingsLogged = useBudgetStore((s) => s.getTotalSavingsLogged);
  const showGoalInputs = useBudgetStore((s) => s.showGoalInputs);
  const setShowGoalInputs = useBudgetStore((s) => s.setShowGoalInputs);
  const [showGoalEdit, setshowGoalEdit] = useState(false)
  const [newGoal, setNewGoal] = useState(savingsGoal);
  const toast = useToast();
  const totalSaved = getTotalSavingsLogged();
  // TODO: Progress *must* be based on specific goal.
  const progress = savingsGoal > 0 ? (totalSaved / savingsGoal) * 100 : 0;

  const handleGoalSave = () => {
    setSavingsGoal(newGoal);
    toast({ title: 'Savings goal updated!', status: 'success', duration: 2000 });
  };

  const handleGoalDelete = (id) => {
    const confirm = window.confirm(
      `COMING SOON.`
    );
    toast({ title: 'Savings goal deleted!', status: 'error', duration: 2000 });
  };
  const handleGoalAdd = () => {
    const confirm = window.confirm(
      `COMING SOON.`
    );
    toast({ title: 'Savings goal added!', status: 'success', duration: 2000 });
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
      <Flex justify="space-between" align="center">
        <Heading size="md">Savings Goals</Heading>
        <Heading size="md"># of Goals: 1{/* Replace with goals.length */}</Heading>
      </Flex>

      <Center>
        <Button size="xs" variant="link" colorScheme="blue" onClick={() => setShowGoalInputs(!showGoalInputs)}>
          {showGoalInputs ? '▲ Hide All Goals ▲' : '▼ Show/Edit Goals ▼'}
        </Button>
      </Center>

      <Collapse mb={4} in={showGoalInputs} animateOpacity>
      {/* TODO: Need to Display cards based on current Savings goals */}
        <Card p={4} mb={4}>
          <Flex justify="space-between" align="center" mb={4}>
            <Button size="xs" colorScheme="blue" onClick={() => setshowGoalEdit(!showGoalEdit)}>Edit</Button>
            <Stat mb={4} textAlign="center">
              <StatLabel>{selectedYear} Savings Goal Progress</StatLabel>
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
                  You have
                  saved ${totalSaved.toLocaleString(undefined, { minimumFractionDigits: 2 })} towards
                  this goal. Your goal is to
                  save ${savingsGoal.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Adjust your monthly savings goals to stay on track with your budget.
                </Text>
              </VStack>
            </Box>
          )}
          {/*goal.id !== 'yearly' && ( */}
            <Center>
              <Button
                mt={4}
                size="sm"
                variant={'outline'}
                colorScheme="red"
                onClick={() => handleGoalDelete({/*goal.id*/})}
              >
                Delete This Source
              </Button>
            </Center>
        {/*})}*/}
        </Card>

        <Box width={'25%'} p={1}>
          <Button
            onClick={() => handleGoalAdd()}
            leftIcon={<AddIcon />}
            size="sm"
            colorScheme='green'
          >
            Add Savings Goal
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}