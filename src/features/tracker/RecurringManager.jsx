import {
  Box, useToast, Heading, Collapse, Flex, Button
} from "@chakra-ui/react";
import { useState } from "react";
import dayjs from "dayjs";
import { useBudgetStore } from "../../state/budgetStore";
import RecurringPaymentsCard from "../../components/RecurringPaymentsCard";

export default function RecurringManager() {

  const showRecurringTXs = useBudgetStore((s) => s.showRecurringTXs);
  const setShowRecurringTXs = useBudgetStore((s) => s.setShowRecurringTXs);
  const accounts = useBudgetStore((s) => s.accounts);

  return (
    <Box mt={6} p={4} borderWidth="1px" borderRadius="lg" bg="white" boxShadow="md">
      <Flex justifyContent="space-between" alignItems="center" mb={3}>
        <Heading size="md">Recurring Payments Tracker</Heading>
        <Button size="xs" variant="link" colorScheme="blue" ml={2} onClick={() => setShowRecurringTXs(!showRecurringTXs)}>
          {showRecurringTXs ? 'Hide All Transactions' : 'Show All Transactions'}
        </Button>
      </Flex>
      
      <Collapse mb={4} in={showRecurringTXs} animateOpacity>
        {accounts && Object.keys(accounts).length > 0 ? (
          <>
            {Object.values(accounts).map((account) => {
              
              return (
              <Box key={account.label} mt={4} color="gray.600">
                <RecurringPaymentsCard account={account}></RecurringPaymentsCard>
              </Box>
              );
            })}
          </>
        ) : (
          <Box mt={4} color="gray.600">
            No accounts found. Please add an account to manage recurring payments.
          </Box>
        )}
      </Collapse>
    </Box>
  );
}