import { useState, useEffect, useMemo } from 'react'
import { useBudgetStore } from '../../state/budgetStore'
import { Box, Flex, Heading, HStack, Radio, FormControl, FormLabel, Tabs,TabList,
  TabPanels, Tab, TabPanel, Stack, Text, Tooltip, Stat, StatLabel, StatNumber,
  StatHelpText, StatGroup, Collapse, RadioGroup, Button
} from '@chakra-ui/react'
import AddFixedIncomeSource from '../../components/AddFixedIncomeSource'
import IncomeSourceForm from '../../components/IncomeSourceForm'
import { InfoIcon } from '@chakra-ui/icons'

export default function IncomeCalculator({ origin = 'Planner', selectedMonth = null }) {
  const [showDetails, setShowDetails] = useState(false)
  const { scenarios, currentScenario, updateScenario } = useBudgetStore();
  const sources = useBudgetStore((s) => s.incomeSources)
  const showIncomeInputs = useBudgetStore((s) => s.showIncomeInputs)
  const setShowIncomeInputs = useBudgetStore((s) => s.setShowIncomeInputs)
  const selectedId = useBudgetStore((s) => s.selectedSourceId)
  const setSelected = useBudgetStore((s) => s.selectIncomeSource)
  const updateSource = useBudgetStore((s) => s.updateIncomeSource)
  const addSource = useBudgetStore((s) => s.addIncomeSource)
  const setFilingStatus = useBudgetStore((s) => s.setFilingStatus)
  const grossTotal = useBudgetStore.getState().getTotalGrossIncome();
  const monthlyActuals = useBudgetStore((s) => s.monthlyActuals[selectedMonth]);

  const activeSource = useMemo(() => sources.find((s) => s.id === selectedId) || sources[0] || {}, [sources, selectedId])
  const { net, breakdown } = useBudgetStore.getState().getTotalNetIncome();

  const isTracker = origin === 'Tracker';
  // TODO: Connect filing status with tax rate calcs

  const handleAddSource = () => {
    const id = crypto.randomUUID(); // generate a new ID here
    const newSource = {
      id,
      description: `Income ${sources.length + 1}`,
      type: 'hourly',
      hourlyRate: 0,
      hoursPerWeek: 0,
      grossSalary: 0,
      state: 'WI',
    }

    addSource(newSource)     // ✅ uses our updated store logic
    setSelected(id)          // ✅ auto-switch to the new tab
  }

  const handleUpdateFilingStatus = (val) => {

    updateScenario(currentScenario, { filingStatus: val })
    setFilingStatus(val)
  }

  const handleTempButton = () => {
    // Intentional: temporary feature placeholder
    window.alert('This feature coming soon')
  }

  // Update the active source's net when total changes
  useEffect(() => {
    if (activeSource?.id) {
      updateSource(activeSource.id, { netIncome: net })
    }
    // include both dependencies to satisfy exhaustive-deps
  }, [net, activeSource, updateSource])

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} mb={6}>
      <Flex justifyContent="space-between" alignItems="center" borderWidth={1} p={3} borderRadius="lg">
        <Heading size="md">Monthly Income</Heading>
        {!isTracker &&
          <Button variant={'outline'} colorScheme="blue" onClick={() => handleTempButton()}>Use Fixed Income</Button>
        }
        {!isTracker ? (
          <Heading size="md">${(net/12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Heading>
        ) : (
          <Heading size="md">
            {monthlyActuals?.actualTotalNetIncome
              ? `$${monthlyActuals.actualTotalNetIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : 'No Actual Income Yet'}
          </Heading>
        )}
      </Flex>
      <Flex justifyContent={'end'} my={2}>
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowIncomeInputs(!showIncomeInputs)}>
          {showIncomeInputs ? 'Hide Income Inputs' : 'Show Income Inputs'}
        </Button>
      </Flex>


      <Collapse mb={4} in={showIncomeInputs} animateOpacity>
      {isTracker ? (
        <AddFixedIncomeSource origin={origin} selectedMonth={selectedMonth} />
      ) : (
        <>
          <FormControl mb={4}>
            <FormLabel>Filing Status</FormLabel>
            <RadioGroup
              value={scenarios[currentScenario].filingStatus}
              onChange={(val) => handleUpdateFilingStatus(val)}
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
                  <Tab key={source.id}>{source.description}</Tab>
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
          </>
      )}
      </Collapse>

      {/* Estimated Income Output */}
      {grossTotal > 0 && !isTracker ? (
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
                <Stack gap={0}>
                  <Text>After taxes</Text>
                  <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowDetails(!showDetails)}>
                    {showDetails ? 'Hide Breakdown' : 'Show Breakdown'}
                  </Button>
                </Stack>

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
      ) : (null) }
    </Box>
  )
}