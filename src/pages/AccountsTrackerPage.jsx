import { Box, Heading, Center } from '@chakra-ui/react'
import AccountsTracker from '../features/accounts/AccountsTracker'

function AccountsTrackerPage() {

  return (
    <Box bg="gray.200" p={3} minH='96vh'>
      <Box p={4} maxW="930px" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        <Center mb={4}>
          <Heading size="md" fontWeight={700}>Accounts Tracker</Heading>
        </Center>
        <AccountsTracker />
      </Box>
    </Box>
  )
}

export default AccountsTrackerPage