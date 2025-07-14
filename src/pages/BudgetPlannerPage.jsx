import { Box,
  Heading,
  Center
} from '@chakra-ui/react'
import ScenarioSelector from '../components/ScenarioSelector'
import IncomeCalculator from '../features/planner/IncomeCalculator'
import ExpenseTracker from '../features/planner/ExpenseTracker'
import ExpensePie from '../components/ExpensePie'

// TODO: Create a toast for when a scenario is created.

function BudgetPlannerPage() {

  return (
    <Box bg="gray.200" p={4} minH="100vh">
      <Box p={4} maxW="800px" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="md" background={"white"}>
        <Center mb={4}>
          <Heading size="md" fontWeight={700}>Budget Planner</Heading>
        </Center>
        <ScenarioSelector />
        <hr style={{marginTop: 15 + "px", marginBottom: 15 + "px"}}/>
        <IncomeCalculator />
        <ExpenseTracker origin='Planner'/>
        <ExpensePie />
      </Box>
    </Box>
  )
}

export default BudgetPlannerPage