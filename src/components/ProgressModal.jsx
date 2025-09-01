import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';

export default function ProgressModal() {
  const isProgressOpen = useBudgetStore(s => s.isProgressOpen);
  const header = useBudgetStore(s => s.progressHeader);
  const progressCount = useBudgetStore(s => s.progressCount);
  const progressTotal = useBudgetStore(s => s.progressTotal);

  const percent = progressTotal > 0 ? (progressCount / progressTotal) * 100 : 0;

  return (
    <Modal isOpen={isProgressOpen} onClose={() => {}} isCentered size="md" zIndex={1000}>
      <ModalOverlay />
      <ModalContent p={4}>
        <ModalHeader>{header}</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Spinner size="lg" />
              <Text>
                {progressCount} / {progressTotal} processed
              </Text>
              <Progress
                value={percent}
                size="lg"
                colorScheme="blue"
                hasStripe
                isAnimated
                w="100%"
                borderRadius="md"
              />
          </VStack>
        </ModalBody>
        <ModalFooter>
          {percent >= 100 && (
            <Text color="green.500" fontWeight="bold">
              Done!
            </Text>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}