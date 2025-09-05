import React, { useMemo } from "react";
import { Heading, Table, Thead, Tbody, Tr, Th, Td, Button, HStack, Text, Card  } from "@chakra-ui/react";
import { findRecurringTransactions } from "../utils/analysisUtils";

export default function RecurringPaymentsCard({ account }) {

  const currentAccount = account;
  const currentTransactions = currentAccount.transactions ?? [];
  const recurring = useMemo(
    () => findRecurringTransactions(currentTransactions),
    [currentTransactions]
  );

  return (
    <Card p={4} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="sm">
      <Heading size='md'>{currentAccount.label}</Heading>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th isNumeric>Amount</Th>
            <Th>Category</Th>
            <Th>Freq</Th>
            <Th>Day/Week</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {recurring
             .filter((r) => r.status === 'confirmed')
             .map((r) => (
            <Tr key={`${currentAccount.accountNumber}:${r.description}:${r.dayOfMonth ?? r.weekday ?? r.start ?? 'n'}`}>
            <Td>{r.description}</Td>
            <Td isNumeric>{Number(r.avgAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Td>
            <Td>{r.category || "—"}</Td>
            <Td textTransform="capitalize">{r.frequency}</Td>
            <Td>
              {r.frequency === 'monthly' ? `Day ${r.dayOfMonth || 1}`
                : r.frequency === 'weekly' ? ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][r.weekday ?? 0]
                : r.frequency === 'biweekly' ? `Every 14d from ${r.start}` : '—'}
            </Td>
            <Td>
              <HStack spacing={2}>
                <Button size="xs" onClick={() => updateRecurring(r.id, { amount: Number(r.avgAmount) })}>Save</Button>
                <Button size="xs" colorScheme="red" variant="outline" onClick={() => removeRecurring(r.id)}>Delete</Button>
              </HStack>
            </Td>
          </Tr>
          ))}
          {recurring.length === 0 && (
            <Tr><Td colSpan={9}><Text color="gray.500">No recurring transactions for this account.</Text></Td></Tr>
          )}
        </Tbody>
      </Table>
    </Card>
  );
}