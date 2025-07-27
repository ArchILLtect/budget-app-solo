import { Box, Heading, Stat, StatGroup, Text, Button,
  StatLabel, StatNumber, useColorModeValue, Flex
} from "@chakra-ui/react";
import { useBudgetStore } from '../state/budgetStore';
import dayjs from "dayjs";

export default function MonthlyPlanSummary() {

  const showPlanInputs = useBudgetStore((s) => s.showPlanInputs);
  const setShowPlanInputs = useBudgetStore((s) => s.setShowPlanInputs);
  const selectedMonth = useBudgetStore(s => s.selectedMonth);
  const plan = useBudgetStore(s => s.monthlyPlans[selectedMonth]);

  if (!plan) return null;

  return (
    <Box p={4} boxShadow="md" bg={useColorModeValue('white', 'gray.700')} borderWidth={2}>
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Heading size="md">Plan Summary</Heading>
        {plan.createdAt && (
          <Text fontSize="xs" color="gray.500">
            Plan Created: {dayjs(plan.createdAt).format('MMM D, YYYY')}
          </Text>
        )}
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowPlanInputs(!showPlanInputs)}>
          {showPlanInputs ? 'Hide All Inputs' : 'Show All Inputs'}
        </Button>
      </Flex>

      <Box px={4} py={3} borderWidth={1} borderRadius="md" bg="gray.50">
      <StatGroup>
        <Stat textAlign={'center'}>
            <StatLabel>Planned Net Income</StatLabel>
            <StatNumber color="teal.500">${plan.netIncome?.toLocaleString()}</StatNumber>
        </Stat>

        <Stat textAlign={'center'}>
            <StatLabel>Planned Expenses</StatLabel>
            <StatNumber color="orange.500">${plan.totalExpenses?.toLocaleString()}</StatNumber>
        </Stat>

        {plan.totalSavings > 0 && (
        <Stat textAlign={'center'}>
            <StatLabel>Planned Savings</StatLabel>
            <StatNumber color="blue.500">${plan.totalSavings?.toLocaleString()}</StatNumber>
        </Stat>
        )}

        <Stat textAlign={'center'}>
            <StatLabel>Leftover</StatLabel>
            <StatNumber color={plan.estLeftover >= 0 ? "green.500" : "red.500"} fontSize="2xl">
              ${plan.estLeftover?.toLocaleString()}
            </StatNumber>
        </Stat>
      </StatGroup>
      </Box>
    </Box>
  );
}