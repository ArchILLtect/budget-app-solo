import {
    Button, Center, Heading, Box,
    useColorModeValue, useDisclosure
} from '@chakra-ui/react';
import SyncAccountsModal from '../../components/SyncAccountsModal';
import { useBudgetStore } from "../../state/budgetStore";
import AccountCard from '../../components/AccountCard';

export default function AccountsTracker() {

  const accounts = useBudgetStore((s) => s.accounts);
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