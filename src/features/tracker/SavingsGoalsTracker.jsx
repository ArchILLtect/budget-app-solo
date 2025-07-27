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
  const resetSavingsLogs = useBudgetStore((s) => s.resetSavingsLogs);
  const savingsLogs = useBudgetStore((s) => s.savingsLogs);
  const showGoalInputs = useBudgetStore((s) => s.showGoalInputs);
  const setShowGoalInputs = useBudgetStore((s) => s.setShowGoalInputs);
  const savingsGoals = useBudgetStore((s) => s.savingsGoals);
  const addSavingsGoal = useBudgetStore((s) => s.addSavingsGoal);
  const removeSavingsGoal = useBudgetStore((s) => s.removeSavingsGoal);
  const updateSavingsGoal = useBudgetStore((s) => s.updateSavingsGoal);
  const [editGoalId, setEditGoalId] = useState(null);
  const goals = savingsGoals;
  const toast = useToast();
  const totalSaved = Object.values(savingsLogs)
    .flat()
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);

  const handleGoalDelete = (id) => {
  removeSavingsGoal(id)
    toast({ title: 'Savings goal deleted!', status: 'error', duration: 2000 });
  };
  const handleGoalAdd = () => {
    addSavingsGoal({ name: 'New Savings', amount: 0 })
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

  const progressData = goals.map((goal) => {
    const logs = Object.values(savingsLogs).flat().filter((l) => l.goalId === goal.id);
    const total = logs.reduce((sum, l) => sum + (l.amount || 0), 0);
    const progress = goal.amount > 0 ? (total / goal.amount) * 100 : 0;
    return { goal, total, progress };
  });
  

  return (
    <Box mt={4} borderWidth={1} p={4} borderRadius="lg" bg="white" boxShadow="md">
      <Flex justify="space-between" align="center">
        <Heading size="md">Savings Goals</Heading>
        <Heading size="md"># of Goals: {goals.length}</Heading>
      </Flex>

      <Center>
        <Button size="xs" variant="link" colorScheme="blue" onClick={() => setShowGoalInputs(!showGoalInputs)}>
          {showGoalInputs ? '▲ Hide All Goals ▲' : '▼ Show/Edit Goals ▼'}
        </Button>
      </Center>

      <Collapse mb={4} in={showGoalInputs} animateOpacity>
      {progressData.map(({ goal, total, progress }) => (
        <Card p={4} mb={4} borderWidth={1} borderColor={'gray.100'} bg={'whitesmoke'} key={goal.id}>
          <Flex justify="space-between" align="center" mb={4}>
            <Button
              size="xs"
              colorScheme="blue"
              onClick={() => setEditGoalId(editGoalId === goal.id ? null : goal.id)}
            >
              {editGoalId === goal.id ? 'Close' : 'Edit'}
            </Button>
            <Stat mb={4} textAlign="center">
              <StatLabel fontSize={'lg'}>{goal.name} {goal.id === 'yearly' ? selectedYear : ''}</StatLabel>
              <StatNumber color="green.500">
                ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} / ${goal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </StatNumber>
            </Stat>
            <Button size="xs" colorScheme="red" onClick={() => resetGoal()}>Reset</Button>
          </Flex>
          <Progress value={progress} size="lg" colorScheme="green" bg={'gray.200'} borderRadius="xl" mb={4} />
          {editGoalId === goal.id && (
            <Box borderWidth={1} borderRadius="lg" bg="gray.50" boxShadow="sm">
              <VStack align="start" spacing={2} p={4}>
                {goal.id !== 'yearly' ? (
                  <Flex justify="space-between" width="100%">
                    <Center>
                      <Text fontWeight="bold" flexWrap={'nowrap'}>Goal Name:</Text>
                    </Center>
                    <HStack spacing={2}>
                      <Input
                        value={goal.name}
                        isInvalid={goal.name == ''}
                        onChange={(e) =>
                          updateSavingsGoal(goal.id, { name: e.target.value })
                        }
                        placeholder="Name"
                      />
                    </HStack>
                  </Flex>
                ) : ("")}
                <Flex justify="space-between" width="100%">
                  <Center>
                    <Text fontWeight="bold">Current Goal:</Text>
                  </Center>
                  <HStack spacing={2}>
                    <Input
                      type="number"
                      placeholder="Enter savings goal"
                      value={goal.amount}
                      onChange={(e) => updateSavingsGoal(goal.id, { amount: parseFloat(e.target.value) || 0 })}
                    />
                  </HStack>
                </Flex>
                <Text fontSize="sm" color="gray.500">
                  You have
                  saved ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} towards
                  this goal. Your goal is to
                  save ${goal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Adjust your monthly savings goals to stay on track with your budget.
                </Text>
              </VStack>
            </Box>
          )}
          {goal.id !== 'yearly' && (
            <Center>
              <Button
                mt={4}
                size="sm"
                variant={'outline'}
                colorScheme="red"
                onClick={() => handleGoalDelete(goal.id)}
              >
                Delete This Goal
              </Button>
            </Center>
          )}
        </Card>
        ))}
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