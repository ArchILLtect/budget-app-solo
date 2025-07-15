import { useBudgetStore } from '../state/budgetStore'
import {
  Input,
  Stack,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Button,
  Center
} from '@chakra-ui/react'

export default function IncomeSourceForm({ source, onUpdate }) {

  const removeIncomeSource = useBudgetStore((s) => s.removeIncomeSource)
  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this income source?')) {
      removeIncomeSource(source.id)
    }
  }
  
  return (
    <>
      {/* Income Type Toggle */}
      <FormControl mb={4}>
        <FormLabel>Income Type</FormLabel>
        <RadioGroup
          value={source.type}
          onChange={(val) => onUpdate(source.id, { type: val })}
        >
          <HStack spacing={4}>
              <Radio value="hourly">Hourly</Radio>
              <Radio value="salary">Salary</Radio>
          </HStack>
        </RadioGroup>
      </FormControl>

      {/* Hourly Inputs */}
      {source.type === 'hourly' && (
        <Stack spacing={3}>
          <FormControl>
            <FormLabel>Hourly Rate ($/hr)</FormLabel>
            <Input
              type="number"
              placeholder="Enter your hourly rate"
              value={source.hourlyRate}
              onChange={(e) =>
                onUpdate(source.id, { hourlyRate: parseFloat(e.target.value) || 0 })
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>Hours/Week</FormLabel>
            <Input
              type="number"
              placeholder="Enter hours per week"
              value={source.hoursPerWeek}
              onChange={(e) =>
                onUpdate(source.id, { hoursPerWeek: parseFloat(e.target.value) || 0 })
              }
            />
          </FormControl>
        </Stack>
      )}

      {/* Salary Input */}
      {source.type === 'salary' && (
        <FormControl>
          <FormLabel>Annual Gross Salary</FormLabel>
          <Input
            type="number"
            placeholder="Enter your annual gross salary"
            min="0"
            step="1"
            max="1000000"
            value={source.grossSalary}
            onChange={(e) =>
              onUpdate(source.id, { grossSalary: parseFloat(e.target.value) || 0 })
            }
          />
        </FormControl>
      )}

      {/* State Selector */}
      <FormControl mt={5} mb={4}>
        <FormLabel>Select State (for tax estimate)</FormLabel>
        <Select
          value={source.state}
          onChange={(e) =>
              onUpdate(source.id, { state: e.target.value })
            }
        >
          <option value="WI">Wisconsin</option>
        </Select>
      </FormControl>
      {source.id !== 'primary' && (
        <Center>
          <Button
            mt={4}
            size="sm"
            colorScheme="red"
            onClick={() => handleRemove()}
          >
            Delete This Source
          </Button>
        </Center>
      )}
    </>
  )
}