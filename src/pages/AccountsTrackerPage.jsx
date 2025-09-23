import { Box, Heading, Center, Flex } from '@chakra-ui/react'
import AccountsTracker from '../features/accounts/AccountsTracker'
import { useBudgetStore } from '../state/budgetStore'
import LoadingSpinner from '../components/LoadingSpinner';

function AccountsTrackerPage() {
  const loading = useBudgetStore(s => s.isLoading);

  return (
    <Box bg="gray.200" p={3} minH='96vh'>
      <Box p={4} maxW="930px" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        <Center mb={4}>
          <Heading size="md" fontWeight={700}>Accounts Tracker</Heading>
        </Center>
        {loading ? (
          <Flex
            pos="fixed"
            top={0}
            left={0}
            w="100vw"
            h="100vh"
            zIndex="modal"
            bg="rgba(0,0,0,0.4)"
            justify="center"
            align="center"
          >
            <LoadingSpinner />
          </Flex>
      ) : (
        <AccountsTracker />
      )}
      </Box>
    </Box>
  )
}

export default AccountsTrackerPage