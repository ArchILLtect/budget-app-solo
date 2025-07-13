import { useState, useEffect } from 'react'
import { useBudgetStore } from '../../state/budgetStore'
import {
  Box,
  Flex,
  Heading,
  HStack,
  Radio,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stack,
  Text,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Collapse,
  RadioGroup,
  Button
} from '@chakra-ui/react'
import IncomeSourceForm from '../../components/IncomeSourceForm'
import { InfoIcon } from '@chakra-ui/icons'

export default function IncomeCalculator() {
  const [showDetails, setShowDetails] = useState(false)

  const { scenarios, currentScenario, updateScenario } = useBudgetStore();
  const sources = useBudgetStore((s) => s.incomeSources)
  const showIncomeInputs = useBudgetStore((s) => s.showIncomeInputs)
  const setShowIncomeInputs = useBudgetStore((s) => s.setShowIncomeInputs)
  const selectedId = useBudgetStore((s) => s.selectedSourceId)
  const setSelected = useBudgetStore((s) => s.selectIncomeSource)
  const updateSource = useBudgetStore((s) => s.updateIncomeSource)
  const addSource = useBudgetStore((s) => s.addIncomeSource)
  const grossTotal = useBudgetStore.getState().getTotalGrossIncome();

  const activeSource = sources.find((s) => s.id === selectedId) || sources[0] || {}
  const { net, breakdown } = useBudgetStore.getState().getTotalNetIncome();

  // TODO: Add filing status and adjust brackets accordingly
  // For now, we assume single filer
  // This can be extended to include other filing statuses like married, head of household, etc.
  // For simplicity, we will use the single filer brackets for both federal and state taxes

  const handleAddSource = () => {
    const id = crypto.randomUUID(); // generate a new ID here
    const newSource = {
      id,
      label: `Income ${sources.length + 1}`,
      type: 'hourly',
      hourlyRate: 0,
      hoursPerWeek: 0,
      grossSalary: 0,
      state: 'WI',
    }

    addSource(newSource)     // ✅ uses our updated store logic
    setSelected(id)          // ✅ auto-switch to the new tab
  }

  useEffect(() => {
    if (activeSource) {
      updateSource(activeSource.id, { netIncome: net })
    }
  }, [net])

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} mb={6}>
      <Flex mb={2} justifyContent="space-between" alignItems="center">
        <Heading size="md">Income</Heading>
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowIncomeInputs(!showIncomeInputs)}>
          {showIncomeInputs ? 'Hide Inputs' : 'Show Inputs'}
        </Button>
      </Flex>

      <Collapse mb={4} in={showIncomeInputs} animateOpacity>
      
      <FormControl mb={4}>
        <FormLabel>Filing Status</FormLabel>
        <RadioGroup
          value={scenarios[currentScenario].filingStatus}
          onChange={(val) => updateScenario(currentScenario, { filingStatus: val })}
        >
          <HStack spacing={4}>
              <Radio value="single">Single</Radio>
              <Radio value="headOfHousehold">Head of household</Radio>
              <Radio value="marriedSeparate">Married filing seperately</Radio>
              <Radio value="marriedJoint">Married filing jointly</Radio>
          </HStack>
        </RadioGroup>
      </FormControl>
      
        <Tabs
          index={sources.findIndex((s) => s.id === selectedId)}
          onChange={(index) => {
            if (index < sources.length) {
              setSelected(sources[index].id)
            }
            // else: it's the +Add tab — no need to set selected source yet
          }}
          isLazy
          variant="enclosed"
        >
          <TabList>
            {sources.map((source) => (
              <Tab key={source.id}>{source.label}</Tab>
            ))}
            <Tab onClick={() => handleAddSource()}>+ Add</Tab>
          </TabList>

          <TabPanels>
            {sources.map((source) => (
              <TabPanel key={source.id}>
                {/* YOUR income input form for this source */}
                <IncomeSourceForm source={source} onUpdate={updateSource} />
              </TabPanel>
            ))}

            {/* Fallback panel shown only if sources = [] (shouldn’t happen, but safe to keep) */}
            <TabPanel>
              <Button onClick={() => handleAddSource()}>
                Create New Income Source
              </Button>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Collapse>

      {/* Estimated Income Output */}
      {grossTotal > 0 && (
        <Box mt={2} px={4} py={3} borderWidth={1} borderRadius="md" bg="gray.50">
          <StatGroup>
            <Stat textAlign={'center'}>
              <StatLabel>Est. Gross Salary</StatLabel>
              <StatNumber color="teal.600">${grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</StatNumber>
              <StatHelpText mb={0}>Before taxes</StatHelpText>
            </Stat>

            <Stat textAlign={'center'}>
              <StatLabel>
                💰 Est. Net Salary
                <Tooltip label="Includes federal, state, SS, and Medicare taxes" hasArrow placement="right">
                  <InfoIcon ml={2} color="gray.500" />
                </Tooltip>
              </StatLabel>
              <StatNumber color="green.600">
                ${net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </StatNumber>
              <StatHelpText mb={0}>
                After taxes
                <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowDetails(!showDetails)}>
                  {showDetails ? 'Hide Breakdown' : 'Show Breakdown'}
                </Button>

                <Collapse in={showDetails} animateOpacity>
                  <Stack mt={3} spacing={2}>
                    <Box bg="gray.100" p={3} borderRadius="md">
                      <Text fontWeight="semibold">Estimated Federal Tax:</Text>
                      <Text>${breakdown.federalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </Box>
                    <Box bg="gray.100" p={3} borderRadius="md">
                      <Text fontWeight="semibold">State Tax (WI):</Text>
                      <Text>${breakdown.stateTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </Box>
                    <Box bg="gray.100" p={3} borderRadius="md">
                      <Text fontWeight="semibold">Social Security:</Text>
                      <Text>${breakdown.ssTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </Box>
                    <Box bg="gray.100" p={3} borderRadius="md">
                      <Text fontWeight="semibold">Medicare:</Text>
                      <Text>${breakdown.medicareTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    </Box>
                  </Stack>
                </Collapse>
              </StatHelpText>
            </Stat>
          </StatGroup>
        </Box>
      )}
    </Box>
  )
}