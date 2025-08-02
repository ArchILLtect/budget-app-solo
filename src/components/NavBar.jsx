import { Box,
  Flex,
  HStack,
  Link,
  Heading,
  Button,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import { NavLink as RouterLink } from 'react-router-dom';
import { useBudgetStore } from '../state/budgetStore';
import AccountSyncModal from './accountSyncModal';

// TODO: Add for mobile: import { HamburgerIcon } from '@chakra-ui/icons';

export default function NavBar() {

  const currentPage = useBudgetStore((s) => s.currentPage);
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box position="sticky" top="0" zIndex="1000" bg={useColorModeValue('teal.500', 'teal.700')} px={4} py={3} shadow="md">
      <Flex h={8} alignItems={'center'} justifyContent={'space-between'}>
        <Heading size="md" color="white">Budgeteer</Heading>

        <HStack as="nav" spacing={6}>
          <Link
            as={RouterLink}
            to="/planner"
            px={3}
            py={2}
            rounded="md"
            _hover={{ bg: 'teal.600', color: 'white' }}
            _activeLink={{ bg: 'teal.700', fontWeight: 'bold', color: 'white' }}
            color="white"
          >
            Planner
          </Link>
          <Link
            as={RouterLink}
            to="/accounts"
            px={3}
            py={2}
            rounded="md"
            _hover={{ bg: 'teal.600', color: 'white' }}
            _activeLink={{ bg: 'teal.700', fontWeight: 'bold', color: 'white' }}
            color="white"
          >
            Accounts
          </Link>
          <Link
            as={RouterLink}
            to="/tracker"
            px={3}
            py={2}
            rounded="md"
            _hover={{ bg: 'teal.600', color: 'white' }}
            _activeLink={{ bg: 'teal.700', fontWeight: 'bold', color: 'white' }}
            color="white"
          >
            Tracker
          </Link>
        </HStack>
      </Flex>
    </Box>
  );
}