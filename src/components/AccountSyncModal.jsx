import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, Text
} from '@chakra-ui/react';

export default function ScenarioModal({ isOpen, onClose }) {

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sync Accounts</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4}>
            COMING SOON: Syncing accounts will update your current account balances and transactions.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="teal" mr={3}>
            Sync
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}