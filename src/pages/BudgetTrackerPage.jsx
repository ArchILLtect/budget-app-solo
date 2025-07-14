import {
  Box,
  Heading,
  Center
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import TrackerHeader from '../components/TrackerHeader';
import BudgetTracker from '../features/tracker/BudgetTracker';
import SavingsProgressBar from '../features/tracker/SavingsProgressBar';

export default function BudgetTrackerPage() {

  return (
    <Box bg="gray.200" p={4} minH="100vh">
      <Box p={4} maxW="800px" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        <Center mb={4}>
          <Heading size="md" fontWeight={700}>Budget Tracker</Heading>
        </Center>

        <TrackerHeader />

        <BudgetTracker />

        <SavingsProgressBar />
      </Box>
    </Box>
  );
}