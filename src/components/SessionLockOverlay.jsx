import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  Button,
  Text,
  VStack
} from '@chakra-ui/react';
import { useAuth } from '../hooks/useAuth';
import { useBudgetStore } from '../state/budgetStore';
import { useLocation } from 'react-router-dom';

export default function SessionLockOverlay() {
  const sessionExpired = useBudgetStore((s) => s.sessionExpired);
  const { logoutUser } = useAuth();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const bypassLock = params.get("bypassLock") === "true";

  const openLoginPopup = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    const popup = window.open(
      '/login?bypassLock=true',
      'ReLoginWindow',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes`
    );

    if (!popup) {
      alert("Popup blocked! Please enable popups for this site.");
    }
  };

  if (!sessionExpired || bypassLock) return null;

  return (
    <Modal isOpen={sessionExpired} onClose={() => {}} isCentered closeOnOverlayClick={false} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Session Expired</ModalHeader>
        <ModalBody>
          <VStack spacing={4} align="start">
            <Text>Your session has expired for security reasons.</Text>
            <Text>You can log in again in a new tab without losing your current work.</Text>
          </VStack>
        </ModalBody>
        <ModalFooter justifyContent="space-between">
          <Button colorScheme="red" onClick={logoutUser}>
            Log Out
          </Button>
          <Button colorScheme="blue" onClick={openLoginPopup}>
            Re-Login in New Tab
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}