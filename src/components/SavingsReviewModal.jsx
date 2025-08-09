import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, Button, VStack, Text, Select
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';

export default function SavingsReviewModal() {
  const savingsGoals = useBudgetStore((s) => s.savingsGoals);
  const queue = useBudgetStore((s) => s.savingsReviewQueue);
  const addSavingsLog = useBudgetStore((s) => s.addSavingsLog);
  const clearQueue = useBudgetStore((s) => s.clearSavingsReviewQueue);
  const isOpen = useBudgetStore((s) => s.isSavingsModalOpen);
  const setIsOpen = useBudgetStore((s) => s.setSavingsModalOpen);
  const setConfirm = useBudgetStore((s) => s.setConfirmModalOpen);
  const resolvePromise = useBudgetStore((s) => s.resolveSavingsPromise);
  const [selectedGoals, setSelectedGoals] = useState({});

  useEffect(() => {
    const autoSelections = {};
    queue.forEach(entry => {
      if (entry.name.toLowerCase().includes('yearly')) {
        const match = savingsGoals.find(g => g.name.toLowerCase().includes('yearly'));
        if (match) autoSelections[entry.id] = match.id;
      }
    });
    setSelectedGoals(autoSelections);
  }, [queue, savingsGoals]);

  const handleChange = (id, goalId) => {
    setSelectedGoals((prev) => ({ ...prev, [id]: goalId }));
  };

  const closeConfirm = () => {
    setConfirm(true);
  }

  const handleSubmit = () => {
    queue.forEach((entry) => {
      const goalId = selectedGoals[entry.id] || null; // allow null
      addSavingsLog(entry.month, {
        goalId,
        date: entry.date,
        amount: entry.amount,
        name: entry.name,
      });
    });

    clearQueue();
    setIsOpen(false);
    resolvePromise();
    useBudgetStore.setState({ resolveSavingsPromise: null });
  
  };

  if (!queue.length) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeConfirm}
      closeOnOverlayClick={true}
      closeOnEsc={true}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Review Savings Transfers</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            {queue.map((entry) => (
              <div key={entry.id}>
                <Text>
                  {entry.date} — ${entry.amount.toFixed(2)} — {entry.name}
                </Text>
                <Select
                  placeholder="Don't add to goal"
                  value={selectedGoals[entry.id] || ''}
                  onChange={(e) => handleChange(entry.id, e.target.value)}
                >
                  {savingsGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </Select>
                <Text fontSize="sm" color="gray.500">
                  Goal: {selectedGoals[entry.id] ? savingsGoals.find(g => g.id === selectedGoals[entry.id])?.name : "None"}
                </Text>
              </div>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSubmit}>Confirm</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}