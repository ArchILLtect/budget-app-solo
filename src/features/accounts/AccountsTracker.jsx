
import {
    Button, Center, Heading, Box,
    useColorModeValue, useDisclosure, useToast
} from '@chakra-ui/react';
import SyncAccountsModal from '../../components/SyncAccountsModal';
import { useBudgetStore } from "../../state/budgetStore";
import { getAvailableMonths } from '../../utils/storeHelpers';
import AccountCard from '../../components/AccountCard';

export default function AccountsTracker() {

  const syncedAccounts = useBudgetStore((s) => s.syncedAccounts);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bg = useColorModeValue("gray.50", "gray.700");

  return (
    <>
      <Center mb={4}>
          <Button colorScheme="teal" onClick={onOpen}>
              Sync Accounts
          </Button>
      </Center>
      <SyncAccountsModal isOpen={isOpen} onClose={onClose} />
      {/* ...rest of the AccountsTracker UI */}
      {syncedAccounts.length > 0 && (
        <Box mt={8}>
          <Heading size="md" mb={3}>Synced Accounts</Heading>

          {syncedAccounts.map((acct) => {
            const months = getAvailableMonths(acct);

            return (
              <Box key={acct.id} borderWidth="1px" borderRadius="lg" p={4} mb={6} bg={bg}>
                <AccountCard acct={acct} months={months} />
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}