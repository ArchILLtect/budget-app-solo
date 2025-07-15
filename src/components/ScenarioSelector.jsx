import { FormControl,
    FormLabel,
    Flex,
    Select,
    Button,
    HStack,
    Heading,
    useDisclosure
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';
import ScenarioModal from './ScenarioModal';

export default function ScenarioSelector() {

    const { scenarios, currentScenario, deleteScenario } = useBudgetStore();
    const selectedScenario = currentScenario || Object.keys(scenarios)[0];
    const loadScenario = useBudgetStore((s) => s.loadScenario)

    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <FormControl mb={4}>
            <FormLabel><Heading size="md" fontWeight={700}>Scenario</Heading></FormLabel>
            <HStack>
                <Select
                    value={selectedScenario}
                    onChange={(e) => loadScenario(e.target.value)}
                >
                    {Object.keys(scenarios).map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </Select>
                {/* Delete Scenario Button */}
                {selectedScenario !== 'Main' && (
                    <Button
                        colorScheme="red"
                        onClick={() => {
                            if (
                                selectedScenario &&
                                confirm(`Delete scenario "${selectedScenario}"? This cannot be undone.`)
                            ) {
                                deleteScenario(selectedScenario);
                            }
                        }}
                        >
                        Delete
                    </Button>
                )}
                {/* Add Scenario Button */}
                <Button align="top" onClick={onOpen}>
                    <Flex as="kbd" fontWeight={900} fontSize={20}>+</Flex>
                </Button>
                <ScenarioModal isOpen={isOpen} onClose={onClose} />
            </HStack>
        </FormControl>
    );
}