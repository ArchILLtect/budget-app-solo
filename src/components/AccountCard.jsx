import {
  Box, Tabs, TabList, TabPanels, Tab, TabPanel, Text, Flex,
  VStack, Tag, Button, Table, Thead, Th, Tr, Td, Tbody, Center,
  useToast
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { formatDate } from "../utils/accountUtils";
import {
  getMonthlyTotals, getUniqueTransactions,
  normalizeTransactionAmount, getSavingsKey
} from '../utils/storeHelpers';
import { useBudgetStore } from "../state/budgetStore";

// Utility to organize the data (maybe move to helpers later)
function groupTransactions(transactions) {
  const grouped = {};

  transactions.forEach((tx) => {
    const date = new Date(tx.date);
    const year = date.getFullYear();
    const month = date.toLocaleString("default", { month: "long" });

    if (!grouped[year]) grouped[year] = {};
    if (!grouped[year][month]) grouped[year][month] = [];
    grouped[year][month].push(tx);
  });

  return grouped;
}

export default function AccountCard({ acct, months }) {
  const removeSyncedAccount = useBudgetStore((s) => s.removeSyncedAccount);
  const addActualExpense = useBudgetStore(s => s.addActualExpense);
  const addActualIncomeSource = useBudgetStore(s => s.addActualIncomeSource);
  const addSavingsLog = useBudgetStore(s => s.addSavingsLog);
  const savingsGoals = useBudgetStore(s => s.savingsGoals);
  const accountMappings = useBudgetStore(s => s.accountMappings);
  const [selectedYear, setSelectedYear] = useState();
  const grouped = useMemo(() => groupTransactions(acct.transactions), [acct.transactions]);
  const years = Object.keys(grouped).sort();
  const currentYear = selectedYear || years.at(-1);
  const currentMonths = Object.keys(grouped[currentYear] || {});
  const accountNumber = acct.transactions[0]?.accountNumber
  const institution = accountMappings[accountNumber].institution || "Institution Unknown";
  const accountLabel = accountMappings[accountNumber].label || acct.name;

  const toast = useToast();

  return (
    <>
      <Flex key={acct.id} justifyContent="space-between" alignItems="center" mb={3}>
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold">{accountLabel}</Text>
          <Text fontSize="sm" color="gray.500">
            {institution}
          </Text>
          <Text fontSize="sm" color="gray.500">
              Imported {dayjs(acct.importedAt).format("MMM D, YYYY @ h:mm A")}
          </Text>
        </VStack>
        <Flex alignItems="center" gap={3}>
          <Tag size="sm" colorScheme="purple">{acct.source.toUpperCase()}</Tag>
          <Button size="xs" colorScheme="red" onClick={() => removeSyncedAccount(acct.id)}>
              Remove
          </Button>
        </Flex>
      </Flex>

      {/* ✅ Monthly Tabbed View Here */}
      <Tabs isLazy variant="enclosed" colorScheme="teal" mt={4}>
        <TabList>
          {months.map((month) => {
            const monthName = formatDate(month, 'longMonth');
            const year = formatDate(month, 'year');
            return (
              <Tab key={monthName}>{monthName} {year}</Tab>
            )
          })}
        </TabList>

        <TabPanels>
          {months.map((month) => {
            const monthRows = acct.transactions.filter((tx) =>
              tx.date?.startsWith(month)
            );
            const totals = getMonthlyTotals(acct, month);

            const handleApplyToBudget = () => {
              const store = useBudgetStore.getState();
              // Ensure the month exists in monthlyActuals
              if (!store.monthlyActuals[month]) {
                  useBudgetStore.setState((state) => ({
                  monthlyActuals: {
                    ...state.monthlyActuals,
                    [month]: {
                      actualExpenses: [],
                      actualFixedIncomeSources: [],
                      actualTotalNetIncome: 0,
                      customSavings: 0,
                    },
                  },
                }));
              }
              const existing = store.monthlyActuals[month] || {};
              const expenses = existing.actualExpenses || [];
              const income = (existing.actualFixedIncomeSources || []).filter(
                (i) => i.id !== "main"
              );
              const savings = store.savingsLogs[month] || [];

              const monthRows = acct.transactions.filter((tx) =>
                tx.date?.startsWith(month)
              );

              const newExpenses = getUniqueTransactions(
                expenses,
                monthRows.filter((tx) => tx.type === "expense")
              );

              const newIncome = getUniqueTransactions(
                income,
                monthRows.filter((tx) => tx.type === "income")
              );

              const updatedIncome = [...income, ...newIncome].map(normalizeTransactionAmount);
              const newTotalNetIncome = updatedIncome.reduce((sum, val) => sum + val, 0);

              useBudgetStore.getState().updateMonthlyActuals(month, {
                actualFixedIncomeSources: income,
                actualTotalNetIncome: newTotalNetIncome
              });
              
              const newSavings = getUniqueTransactions(
                savings,
                monthRows.filter((tx) => tx.type === "savings"),
                getSavingsKey
              );

              newExpenses.forEach((e) =>
                addActualExpense(month, { ...e, amount: normalizeTransactionAmount(e) })
              );
              newIncome.forEach((i) =>
                addActualIncomeSource(month, { ...i, amount: normalizeTransactionAmount(i) })
              );

              const defaultGoalId = savingsGoals[0]?.id || "default";
              newSavings.forEach((s) =>
                addSavingsLog(month, {
                  goalId: defaultGoalId,
                  date: s.date,
                  amount: normalizeTransactionAmount(s),
                })
              );

              toast({
                title: "Budget updated",
                description: `Applied ${newExpenses.length} expenses, ${newIncome.length} income, ${newSavings.length} savings`,
                status: "success",
                duration: 4000,
              });
            };

            return (
              <>
                <TabPanel key={month}>
                  <Table size="sm" variant="striped">
                    <Thead>
                      <Tr>
                        <Th>Date</Th>
                        <Th>Description</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Type</Th>
                        <Th>Category</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {monthRows.map((tx) => (
                        <Tr key={tx.id}>
                          <Td whiteSpace={'nowrap'}>{formatDate(tx.date)}</Td>
                          <Td>{tx.description}</Td>
                          <Td isNumeric color={tx.amount < 0 ? "red.500" : "green.600"}>
                            ${Math.abs(tx.amount).toFixed(2)}
                          </Td>
                          <Td>
                            <Tag
                              size="sm"
                              colorScheme={
                              tx.type === "income"
                                  ? "green"
                                  : tx.type === "savings"
                                  ? "blue"
                                  : "orange"
                              }
                            >
                              {tx.type}
                            </Tag>
                          </Td>
                          <Td>{tx.category || "—"}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Box my={6} px={4} py={2} borderWidth={1} borderRadius="md" bg="gray.100">
                    <Flex justifyContent="space-between" alignItems="center" wrap="wrap" gap={2}>
                      <Text fontWeight="medium">Income: <span style={{ color: 'green' }}>${totals.income.toFixed(2)}</span></Text>
                      <Text fontWeight="medium">Expenses: <span style={{ color: 'orange' }}>${totals.expenses.toFixed(2)}</span></Text>
                      <Text fontWeight="medium">Savings: <span style={{ color: 'blue' }}>${totals.savings.toFixed(2)}</span></Text>
                      <Text fontWeight="medium">
                        Net:{" "}
                        <span style={{ color: totals.net >= 0 ? 'green' : 'red' }}>
                          ${totals.net.toFixed(2)}
                        </span>
                      </Text>
                    </Flex>
                  </Box>
                  <Center>
                    <Button size="sm" colorScheme="teal" mb={4} onClick={handleApplyToBudget}>
                      ✅ Apply to Budget
                    </Button>
                  </Center>
                </TabPanel>
              </>
            );
          })}
        </TabPanels>
      </Tabs>
    </>
  );
}