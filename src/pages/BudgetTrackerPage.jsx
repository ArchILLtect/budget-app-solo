import { Box, Heading, Center } from '@chakra-ui/react';
import TrackerHeader from '../components/TrackerHeader';
import BudgetTracker from '../features/tracker/BudgetTracker';
const preloadMonthlyActualSummary = () => import('../components/MonthlyActualSummary.jsx');
import SavingsGoalsTracker from '../features/tracker/SavingsGoalsTracker';

export default function BudgetTrackerPage() {

  return (
    <Box bg="gray.200" py={4} minH='100vh'>
      <Box p={4} maxW="800px" mx="auto" mb={'5vh'} borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        <Center mb={4}>
          <Heading size="md" fontWeight={700} onMouseEnter={preloadMonthlyActualSummary}>Budget Tracker</Heading>
        </Center>

        <TrackerHeader />

        <BudgetTracker />

        <SavingsGoalsTracker />
      </Box>
    </Box>
  );
}