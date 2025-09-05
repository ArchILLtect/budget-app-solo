import {
  Box, Tabs, TabList, TabPanels, Tab, TabPanel, Text, Flex,
  HStack, VStack, Tag, Button, Table, Thead, Th, Tr, Td, Tbody,
  Center, Tooltip, ButtonGroup, useDisclosure
} from "@chakra-ui/react";
import { useMemo } from "react";
import dayjs from "dayjs";
import { formatDate, getUniqueOrigins } from "../utils/accountUtils";
import { getMonthlyTotals, getAvailableMonths } from '../utils/storeHelpers';
import { useBudgetStore } from "../state/budgetStore";
// Used for DEV only:
import { findRecurringTransactions } from "../utils/analysisUtils";
import { assessRecurring } from "../dev/analysisDevTools";
import ApplyToBudgetModal from "./ApplyToBudgetModal";
import SavingsReviewModal from "./SavingsReviewModal";
import ConfirmModal from "./ConfirmModal";
import { YearPill } from "./YearPill";

export default function AccountCard({ acct, acctNumber }) {
  const ORIGIN_COLOR_MAP = useBudgetStore((s) => s.ORIGIN_COLOR_MAP);
  const accounts = useBudgetStore((s) => s.accounts);
  const removeAccount = useBudgetStore((s) => s.removeAccount); 
  const accountMappings = useBudgetStore(s => s.accountMappings);
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
  const currentAccount = accounts[acctNumber];
  const currentTransactions = currentAccount.transactions;
  const institution = acct.institution || "Institution Unknown";
  const accountLabel = accountMappings[acctNumber].label || acct.name;
  const { isOpen, onOpen, onClose } = useDisclosure();

  // All available months for THIS account: ["2025-07","2025-06",...]
  const months = useMemo(() => getAvailableMonths(acct), [acct.transactions]);
  // Years present in this account’s data (ascending for nice left→right buttons)
  const years = useMemo(
    () => Array.from(new Set(months.map(m => m.slice(0,4)))).sort(),
    [months]
  );

  // The year that should be visible is whatever year the global selectedMonth is in.
  // If the account doesn’t have that year, fallback to the most recent account year.
  const selectedYearFromStore = dayjs(selectedMonth).year().toString();
  const hasYear = years.includes(selectedYearFromStore);
  const currentYear = hasYear ? selectedYearFromStore : years.at(-1);

  // Months just for currentYear, oldest→newest for tabs (or reverse if you prefer)
  const monthsForYear = useMemo(
    () => months.filter(m => m.startsWith(currentYear)).sort(),
    [months, currentYear]
  );

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
          <HStack spacing={1}>
            {getUniqueOrigins(currentTransactions).map((origin) => (
              <Tooltip key={origin} label={`Imported via ${origin}`} hasArrow>
                <Tag size="sm" colorScheme={ORIGIN_COLOR_MAP[origin.toLowerCase()] || 'gray'}>
                  {origin?.toUpperCase() || 'manual'}
                </Tag>
              </Tooltip>
            ))}
          </HStack>
          <Button size="xs" colorScheme="red" onClick={() => removeAccount(acctNumber)}>
              Remove
          </Button>
        </Flex>
      </Flex>

      <ButtonGroup isAttached={false} spacing={2}>
          <YearPill months={months} />
      </ButtonGroup>

      {/*
      <Flex key={acct.id} direction={'row'} alignItems="center" mb={3} bg={'gray.100'} rounded={'lg'}>
        {years.map((y) => {
          const isActive = y === currentYear;
          return (
            <Box key={y} p={3}>
              <Button
                onClick={() => {
                  const currentMonthNum = dayjs(selectedMonth).format('MM');
                  const sameMonthKey = `${y}-${currentMonthNum}`;
                  // Prefer the same month index if it exists in this year; else pick latest available in that year
                  const target =
                    months.includes(sameMonthKey)
                      ? sameMonthKey
                      : months.filter(m => m.startsWith(y)).sort().at(-1);
                  if (target) setSelectedMonth(target);
                }}
                colorScheme={isActive ? 'teal' : 'gray'}
                variant={isActive ? 'solid' : 'ghost'}
                fontWeight={isActive ? 'bold' : 'normal'}
                size="md"
              >
                {y}
              </Button>
            </Box>
          );
        })}
      </Flex>
      */}

      {/* ✅ Monthly Tabbed View Here */}
      <Tabs
        isLazy
        variant="enclosed"
        colorScheme="teal"
        mt={4}
        index={Math.max(0, monthsForYear.indexOf(selectedMonth))}
        onChange={(i) => {
          const target = monthsForYear[i];
          if (target) setSelectedMonth(target);
        }}
      >
        <TabList>
          {monthsForYear.map((m) => (
            <Tab key={m} minWidth={1} fontWeight="bold" fontSize={22}>
              {dayjs(m).format('MMM')}
            </Tab>
          ))}
        </TabList>

        <TabPanels>
          {monthsForYear.map((monthRaw) => {
            const monthRows = acct.transactions.filter(tx => tx.date?.startsWith(monthRaw));
            const totals = getMonthlyTotals(acct, monthRaw);

            return (
              <>
                <TabPanel key={monthRaw} p={0} m={2}>
                  <Box maxHeight={'md'} overflowY={'scroll'}>
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
                  </Box>

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
                    <Button size="sm" colorScheme="teal" onClick={onOpen}>
                      ✅ Apply to Budget
                    </Button>
                  </Center>
                  <ApplyToBudgetModal
                    isOpen={isOpen}
                    onClose={onClose}
                    acct={acct}
                    months={months}
                  />
                  <SavingsReviewModal />
                  <ConfirmModal />
                </TabPanel>
              </>
            );
          })}
        </TabPanels>
      </Tabs>
    </>
  );
}