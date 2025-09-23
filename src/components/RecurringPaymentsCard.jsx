import React, { useMemo } from "react";
import { Heading, Table, Thead, Tbody, Tr, Th, Td, Button, HStack, Text, Card  } from "@chakra-ui/react";
import { findRecurringTransactions } from "../utils/analysisUtils";
import { useBudgetStore } from "../state/budgetStore";

export default function RecurringPaymentsCard({ account }) {
  const updateRecurring = useBudgetStore(s => s.updateRecurring ?? (() => {}));
  const removeRecurring = useBudgetStore(s => s.removeRecurring ?? (() => {}));

  const currentAccount = account;
  const currentTransactions = useMemo(() => currentAccount.transactions ?? [], [currentAccount]);
  const recurring = useMemo(
    () => findRecurringTransactions(currentTransactions),
    [currentTransactions]
  );
  const totalRecurring = useMemo(
    () => recurring.reduce((sum, r) => sum + (r.status === 'confirmed' ? Number(r.avgAmount) : 0), 0),
    [recurring]
  );

  // debug: recurring analysis results available via recurring variable

  return (
    <Card p={4} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="sm">
      <Heading size='md'>{currentAccount.label}</Heading>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th borderRightWidth="2px" borderRightColor="gray.200">Name</Th>
            <Th>Category</Th>
            <Th>Freq</Th>
            <Th>Day/Week</Th>
            <Th isNumeric>Amount</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {recurring
             .filter((r) => r.status === 'confirmed')
             .map((r) => (
            <Tr key={`${currentAccount.accountNumber}:${r.description}:${r.dayOfMonth ?? r.weekday ?? r.start ?? 'n'}`}>
            <Td borderRightWidth="2px" borderRightColor="gray.200">{r.description}</Td>
            <Td>{r.category || "—"}</Td>
            <Td textTransform="capitalize">{r.frequency}</Td>
            <Td>
              {r.frequency === 'monthly' ? `Day ${r.dayOfMonth || 1}`
                : r.frequency === 'weekly' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][r.weekday ?? 0]
                : r.frequency === 'biweekly' ? `Every 14d from ${r.start}` : '—'}
            </Td>
            <Td isNumeric borderRightWidth="2px" borderRightColor="gray.200">{Number(r.avgAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
            <Td>
              <HStack spacing={2}>
                <Button size="xs" colorScheme="blackAlpha" variant="solid" onClick={() => updateRecurring(r.id, { amount: Number(r.avgAmount) })}>Save</Button>
                <Button size="xs" colorScheme="red" variant="outline" onClick={() => removeRecurring(r.id)}>Delete</Button>
              </HStack>
            </Td>
          </Tr>
          ))}
          {recurring
             .filter((r) => r.status === 'confirmed').length === 0 ? (
            <Tr><Td colSpan={9}><Text color="gray.500">No recurring transactions for this account.</Text></Td></Tr>
          ) : (
            <Tr>
              <Td borderRightWidth="2px" borderRightColor="gray.200"><Text color="gray.700" fontWeight={'bold'}>Total</Text></Td>
              <Td colSpan={3}></Td>
              <Td borderRightWidth="2px" borderRightColor="gray.200"><Text color="gray.700" fontWeight={'bold'}>{totalRecurring.toLocaleString()}</Text></Td>
              <Td><Button size="xs" colorScheme="red" variant="outline" onClick={() => {/* TODO: implement bulk clear in store if desired */}}>Clear All TXs</Button></Td>
            </Tr>
          )
        }
        </Tbody>
      </Table>
    </Card>
  );
}