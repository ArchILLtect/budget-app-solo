import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { useBudgetStore } from '../state/budgetStore'
import { Box, Heading } from '@chakra-ui/react'

const COLORS = ['#3182ce', '#38a169', '#e53e3e', '#dd6b20', '#805ad5', '#319795']

export default function ExpensePie() {
  const expenses = useBudgetStore((s) => s.expenses)
  const chartData = expenses
    .filter(e => e.amount > 0)
    .map((e, i) => ({
      name: e.name,
      value: e.amount,
    }))

  if (chartData.length < 2) return null

  return (
    <Box borderWidth={1} borderRadius="md" p={4} mt={6}>
      <Heading size="md" mb={3}>Expense Breakdown</Heading>
      <PieChart width={400} height={300}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label
        >
          {chartData.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </Box>
  )
}