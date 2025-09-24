import { Box,
  Heading,
  Center
} from '@chakra-ui/react'
import ScenarioSelector from '../components/ScenarioSelector'
import IncomeCalculator from '../features/planner/IncomeCalculator'
import ExpenseTracker from '../features/planner/ExpenseTracker'
import React, { Suspense, lazy } from 'react'
import InlineSpinner from '../components/InlineSpinner.jsx'
const ExpensePie = lazy(() => import('../components/ExpensePie'))
const preloadExpensePie = () => import('../components/ExpensePie.jsx')

// TODO: Create a toast for when a scenario is created.

function BudgetPlannerPage() {

  return (
    <Box bg="gray.200" p={4} minH="100vh">
      <Box p={4} maxW="800px" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        <Center mb={4}>
          <Heading size="md" fontWeight={700} onMouseEnter={preloadExpensePie}>Budget Planner</Heading>
        </Center>
        <ScenarioSelector />
        <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
        <IncomeCalculator />
        <ExpenseTracker origin='Planner'/>
        <Suspense fallback={<InlineSpinner />}>
          <ExpensePie />
        </Suspense>
      </Box>
    </Box>
  )
}

export default BudgetPlannerPage