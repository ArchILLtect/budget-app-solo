import React, { useState } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, Button, VStack, Text, Select
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';

export default function ConfirmModal() {

  const isOpen = useBudgetStore((s) => s.isConfirmModalOpen);
  const setIsOpen = useBudgetStore((s) => s.setConfirmModalOpen);
  const clearQueue = useBudgetStore((s) => s.clearSavingsReviewQueue);
  const resolvePromise = useBudgetStore((s) => s.resolveSavingsPromise);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = () => {
    setIsOpen(false);
    clearQueue();
    resolvePromise();
    useBudgetStore.setState({ resolveSavingsPromise: null });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnOverlayClick={false}
      closeOnEsc={false}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Cancel Process</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text>Exiting this window will cancel all pending actions.</Text>
          <Text>Are you sure you wish to proceed?</Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Confirm
          </Button>
          <Button colorScheme="red" variant={'outline'} onClick={handleClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}