import {
  Button, Center, Heading, Box,
  useColorModeValue, useDisclosure, HStack
} from '@chakra-ui/react';
import React, { Suspense, lazy } from 'react';
import InlineSpinner from '../../components/InlineSpinner.jsx';
import { useBudgetStore } from "../../state/budgetStore";
import AccountCard from '../../components/AccountCard';
// Dev harness can still be imported manually when needed
// import IngestionDevHarness from '../../dev/IngestionDevHarness.jsx';
const ImportTransactionsModal = lazy(() => import('../../components/ImportTransactionsModal.jsx'));
const preloadImportModal = () => import('../../components/ImportTransactionsModal.jsx');

const SyncAccountsModal = lazy(() => import('../../components/SyncAccountsModal'));
const preloadSyncModal = () => import('../../components/SyncAccountsModal.jsx');

export default function AccountsTracker() {

  const accounts = useBudgetStore((s) => s.accounts);
  const syncModal = useDisclosure();
  const importModal = useDisclosure();
  const bg = useColorModeValue("gray.50", "gray.700");
  

  return (
    <>
      <Center mb={4}>
        <HStack spacing={4}>
          <Button colorScheme="teal" onClick={syncModal.onOpen} onMouseEnter={preloadSyncModal}>
            Sync Accounts
          </Button>
          <Button colorScheme="purple" variant="outline" onClick={importModal.onOpen} onMouseEnter={preloadImportModal} onFocus={preloadImportModal}>
            Import Transactions
          </Button>
        </HStack>
      </Center>
      <Suspense fallback={<InlineSpinner />}>
        <SyncAccountsModal isOpen={syncModal.isOpen} onClose={syncModal.onClose} />
      </Suspense>
      <Suspense fallback={<InlineSpinner />}>
        <ImportTransactionsModal isOpen={importModal.isOpen} onClose={importModal.onClose} />
      </Suspense>
      {/* ...rest of the AccountsTracker UI */}
      {Object.entries(accounts).length > 0 && (
        <Box>
          <Heading size="md" mb={2} mx={4}>Synced Accounts</Heading>

          {Object.entries(accounts).map(([accountNumber, acct]) => {

            return (
              <Box key={accountNumber} borderWidth="1px" borderRadius="lg" p={4} mb={6} mx={4} bg={bg}>
                <AccountCard acct={acct} acctNumber={accountNumber} />
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}