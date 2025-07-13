// Coming Soon. This file is the page of the accounts tracker feature, which will allow users to track their accounts and balances. It will include components for displaying account summaries, adding transactions, and visualizing account activity.

import { Box, Heading, Center } from '@chakra-ui/react'


function AccountsTrackerPage() {

  return (
    <Box bg="gray.200" p={4} minH="100vh">
      <Box p={4} maxW="800px" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        {/* <pre>{JSON.stringify(income, null, 2)}</pre>
        <pre>{JSON.stringify(expenses, null, 2)}</pre> */}
        <Center mb={4}>
          <Heading>Accounts Tracker</Heading>
        </Center>
      </Box>
    </Box>
  )
}

export default AccountsTrackerPage