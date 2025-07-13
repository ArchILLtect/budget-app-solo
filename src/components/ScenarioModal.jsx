import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, Input, RadioGroup, Radio, Stack, useDisclosure
} from '@chakra-ui/react';
import { useState } from 'react';
import { useBudgetStore } from '../state/budgetStore';

export default function ScenarioModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('copy'); // 'copy' or 'blank'

  const saveScenario = useBudgetStore((s) => s.saveScenario);
  const reset = useBudgetStore((s) => s.resetScenario);

  const handleSave = () => {
    if (!name) return;
    if (mode === 'blank') reset(); // optional: clear form
    saveScenario(name);
    onClose();
    setName('');
    setMode('copy');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Scenario</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Input
            placeholder="Scenario Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            mb={4}
          />
          <RadioGroup onChange={setMode} value={mode}>
            <Stack>
              <Radio value="copy">Use Current Plan</Radio>
              <Radio value="blank">Start Blank</Radio>
            </Stack>
          </RadioGroup>
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleSave} colorScheme="teal" mr={3}>
            Create
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}