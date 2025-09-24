import {
  Box, Tabs, TabList, TabPanels, Tab, TabPanel, Text, Flex,
  HStack, VStack, Tag, Button, Table, Thead, Th, Tr, Td, Tbody,
  Center, Tooltip, ButtonGroup, useDisclosure
} from "@chakra-ui/react";
import React, { useMemo, Suspense, lazy } from "react";
import InlineSpinner from './InlineSpinner.jsx';
import dayjs from "dayjs";
import { formatDate, getUniqueOrigins } from "../utils/accountUtils";
import { getMonthlyTotals, getAvailableMonths } from '../utils/storeHelpers';
import { useBudgetStore } from "../state/budgetStore";
// Used for DEV only:
// import { findRecurringTransactions } from "../utils/analysisUtils";
// import { assessRecurring } from "../dev/analysisDevTools";
const ApplyToBudgetModal = lazy(() => import('./ApplyToBudgetModal'));
const SavingsReviewModal = lazy(() => import('./SavingsReviewModal'));
const ConfirmModal = lazy(() => import('./ConfirmModal'));
import { YearPill } from "./YearPill";
import { Menu, MenuButton, MenuList, MenuItem, IconButton, Badge } from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

export default function AccountCard({ acct, acctNumber }) {
  const ORIGIN_COLOR_MAP = useBudgetStore((s) => s.ORIGIN_COLOR_MAP);
  const accounts = useBudgetStore((s) => s.accounts);
  const removeAccount = useBudgetStore((s) => s.removeAccount); 
  const selectedMonth = useBudgetStore((s) => s.selectedMonth);
  const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
  const currentAccount = accounts[acctNumber];
  const currentTransactions = currentAccount.transactions;
  const getAccountStagedSessionSummaries = useBudgetStore(s => s.getAccountStagedSessionSummaries);
  const undoStagedImport = useBudgetStore(s => s.undoStagedImport);
  const sessionEntries = getAccountStagedSessionSummaries(acct.accountNumber);
  const stagedCount = sessionEntries.reduce((sum, s) => sum + (s.stagedNow || s.count || 0), 0);
  const institution = acct.institution || "Institution Unknown";

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Add safe fallbacks where label is read.
  const account = currentAccount;
  const displayLabel = account?.label || account?.accountNumber || 'Account';

  // All available months for THIS account: ["2025-07","2025-06",...]
  const months = useMemo(() => getAvailableMonths(acct), [acct]);
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
          <Text fontWeight="bold">{displayLabel}</Text>
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
            {stagedCount > 0 && (
              <Menu placement="bottom-start" closeOnSelect={false}>
                <Tooltip label={`${stagedCount} staged (click for details / undo)`} hasArrow>
                  <MenuButton as={Tag} size="sm" cursor="pointer" colorScheme="yellow" display="flex" alignItems="center" gap={1}>
                    {stagedCount} STAGED <ChevronDownIcon />
                  </MenuButton>
                </Tooltip>
                <MenuList fontSize="xs" maxW="320px">
                  {sessionEntries.map(se => {
                    const minutesLeft = se.status === 'active' && se.expiresAt ? Math.max(0, Math.ceil((se.expiresAt - Date.now())/60000)) : null;
                    const statusColor = {
                      active: 'yellow',
                      expired: 'gray',
                      applied: 'teal',
                      'partial-applied': 'purple',
                      undone: 'red',
                      'partial-undone': 'orange'
                    }[se.status] || 'blue';
                    const progressPct = se.newCount ? Math.round(((se.appliedCount || 0) / se.newCount) * 100) : 0;
                    return (
                      <MenuItem as={Box} key={se.sessionId} closeOnSelect={false} _focus={{ outline: 'none', bg: 'transparent' }} _hover={{ bg: 'gray.50' }}>
                        <Flex direction="column" w="100%" gap={1}>
                          <Flex justify="space-between" align="center" gap={2}>
                            <HStack spacing={1} align="center">
                              <Text fontSize="xs" fontWeight="bold" isTruncated title={se.sessionId}>{se.sessionId.slice(0,8)}</Text>
                              <Badge colorScheme={statusColor} fontSize="0.55rem" px={1}>{se.status?.replace('-', ' ') || '—'}</Badge>
                              {se.status && se.status.startsWith('partial') && (
                                <Badge colorScheme='pink' fontSize='0.5rem'>{progressPct}%</Badge>
                              )}
                            </HStack>
                            <HStack spacing={1}>
                              {minutesLeft !== null && <Text fontSize="8px" color="orange.600">{minutesLeft}m</Text>}
                              <Button size="xs" variant="outline" colorScheme="red" isDisabled={!se.canUndo} onClick={() => se.canUndo && undoStagedImport(acct.accountNumber, se.sessionId)}>Undo</Button>
                            </HStack>
                          </Flex>
                          <Text fontSize="9px" color="gray.600">Staged: {se.stagedNow || se.count} / New: {se.newCount ?? '—'}{se.removed ? ` | Removed: ${se.removed}` : ''}</Text>
                          {se.status === 'partial-applied' && (
                            <Box h='4px' bg='purple.100' borderRadius='sm'>
                              <Box h='100%' w={`${progressPct}%`} bg='purple.400' borderRadius='sm'></Box>
                            </Box>
                          )}
                          {se.status === 'partial-undone' && (
                            <Box h='4px' bg='orange.100' borderRadius='sm'>
                              <Box h='100%' w={`${progressPct}%`} bg='orange.400' borderRadius='sm'></Box>
                            </Box>
                          )}
                          {se.savingsCount !== undefined && (
                            <Text fontSize="9px" color="gray.600">Savings: {se.savingsCount} | Hash: {se.hash?.slice(0,8)}</Text>
                          )}
                          {se.importedAt && (
                            <Text fontSize="8px" color="gray.500">{dayjs(se.importedAt).format('MMM D HH:mm')} • {se.status}</Text>
                          )}
                        </Flex>
                      </MenuItem>
                    );
                  })}
                  {sessionEntries.length === 0 && <MenuItem disabled>No staged sessions</MenuItem>}
                </MenuList>
              </Menu>
            )}
          </HStack>
          <Button size="xs" colorScheme="red" onClick={() => removeAccount(acctNumber)}>
              Remove
          </Button>
        </Flex>
      </Flex>

      <ButtonGroup isAttached={false} spacing={2}>
          <YearPill months={months} />
      </ButtonGroup>

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
                        {monthRows.map((tx) => {
                          const appliedFromSession = tx.importSessionId && !tx.staged && tx.budgetApplied;
                          return (
                          <Tr key={tx.id} bg={tx.staged ? 'yellow.50' : (appliedFromSession ? 'teal.50' : undefined)} opacity={tx.staged ? 0.85 : 1}>
                            <Td whiteSpace={'nowrap'}>{formatDate(tx.date)}</Td>
                            <Td>{tx.description}</Td>
                            <Td isNumeric color={(tx.rawAmount ?? 0) < 0 ? "red.500" : "green.600"}>
                              ${Math.abs(tx.rawAmount ?? tx.amount).toFixed(2)}
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
                                {tx.type}{tx.staged ? '*' : (appliedFromSession ? '' : '')}
                              </Tag>
                            </Td>
                            <Td>{tx.category || "—"}</Td>
                          </Tr>
                          );
                        })}
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
                  <Suspense fallback={<InlineSpinner />}>
                    <ApplyToBudgetModal
                      isOpen={isOpen}
                      onClose={onClose}
                      acct={acct}
                      months={months}
                    />
                    <SavingsReviewModal />
                    <ConfirmModal />
                  </Suspense>
                </TabPanel>
              </>
            );
          })}
        </TabPanels>
      </Tabs>
    </>
  );
}