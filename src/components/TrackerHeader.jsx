import { Box,
    Center,
    Flex,
    Text,
    Button,
    IconButton,
    useColorModeValue,
    useDisclosure
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons';
import { useBudgetStore } from '../state/budgetStore';
import ScenarioPlanModal from '../components/ScenarioPlanModal';
import dayjs from 'dayjs';

// TODO: Create an edit plan modal
// TODO: Switch to using a modal for plan removal confirmation
// TODO: ?Add an undo for plan removal?

export default function TrackerHeader() {
    const selectedMonth = useBudgetStore((s) => s.selectedMonth);
    const setSelectedMonth = useBudgetStore((s) => s.setSelectedMonth);
    const monthlyPlans = useBudgetStore((s) => s.monthlyPlans);
    const removeMonthlyPlan = useBudgetStore((s) => s.removeMonthlyPlan);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const plan = monthlyPlans[selectedMonth];
    const formatted = dayjs(selectedMonth).format('MMMM YYYY');

    const shiftMonth = (direction) => {
        const newDate = dayjs(selectedMonth).add(direction, 'month');
        setSelectedMonth(newDate.format('YYYY-MM'));
    };

    const handleRemove = () => {
        const confirm = window.confirm(
            `Are you sure you want to remove the plan for ${formatted}?`
        );
        if (confirm) {
            removeMonthlyPlan(selectedMonth);
        }
    };

    return (
        <Box p={2} borderTopRadius="lg" boxShadow="md" bg={useColorModeValue('gray.50', 'gray.700')}>
            <Center my={1}>
                <Flex bg={'white'}>
                    <IconButton
                        icon={<ArrowLeftIcon />}
                        size="sm"
                        onClick={() => shiftMonth(-1)}
                        aria-label="Previous Month"
                    />

                    <Text fontSize="lg" fontWeight="bold" mx={4} >{formatted}</Text>

                    <IconButton
                        icon={<ArrowRightIcon />}
                        size="sm"
                        onClick={() => shiftMonth(1)}
                        aria-label="Next Month"
                    />
                </Flex>

            </Center>

            {!plan ? (
                <Center mt={1}>
                    <Button colorScheme="teal" size="xs" onClick={onOpen}>
                        Set Plan
                    </Button>
                </Center>
            ) : (
                <Center align="center" gap={3}>
                    <Text fontSize="sm" color="gray.500">
                        Plan: {plan.scenarioName || 'Unnamed'}
                    </Text>
                    <Button size="xs" variant="outline" colorScheme="blue">
                        Edit Plan
                    </Button>
                    <Button size="xs" variant="outline" colorScheme="red" onClick={handleRemove}>
                        Remove Plan
                    </Button>
                </Center>
            )}
        <ScenarioPlanModal isOpen={isOpen} onClose={onClose} />
        </Box>
    );
}
