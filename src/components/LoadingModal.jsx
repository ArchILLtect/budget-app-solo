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

export default function LoadingModal() {
  const isLoadingOpen = useBudgetStore(s => s.isLoadingModalOpen);
  const header = useBudgetStore(s => s.loadingHeader);

  return (
    <Modal isOpen={isLoadingOpen} onClose={() => {}} isCentered size="md" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay />
      <ModalContent p={4}>
        <ModalHeader>{header}</ModalHeader>
        <ModalBody>
          <VStack spacing={4}>
            <Spinner size="lg" />
          </VStack>
        </ModalBody>
        <ModalFooter>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}