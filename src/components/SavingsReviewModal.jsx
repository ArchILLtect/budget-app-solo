import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, Button, VStack, Text, Select,
  Input
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';

export default function SavingsReviewModal() {
  const savingsGoals = useBudgetStore((s) => s.savingsGoals);
  const addSavingsGoal = useBudgetStore((s) => s.addSavingsGoal);
  const queue = useBudgetStore((s) => s.savingsReviewQueue);
  const addSavingsLog = useBudgetStore((s) => s.addSavingsLog);
  const clearQueue = useBudgetStore((s) => s.clearSavingsReviewQueue);
  const isOpen = useBudgetStore((s) => s.isSavingsModalOpen);
  const setIsOpen = useBudgetStore((s) => s.setSavingsModalOpen);
  const setConfirm = useBudgetStore((s) => s.setConfirmModalOpen);
  const resolvePromise = useBudgetStore((s) => s.resolveSavingsPromise);

  // Track which goal is selected for each entry
  const [selectedGoals, setSelectedGoals] = useState({});
  // Track which entries are creating a new goal
  const [isCreating, setIsCreating] = useState({});
  const isAnyCreating = Object.values(isCreating).some(Boolean);
  // Track the text input for new goal names
  const [newGoalNames, setNewGoalNames] = useState({});

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
    if (goalId === '__newGoal') {
      // Switch to create mode for this entry
      setIsCreating(prev => ({ ...prev, [id]: true }));
      setSelectedGoals(prev => ({ ...prev, [id]: '' }));
    } else {
      // Normal selection
      setIsCreating(prev => ({ ...prev, [id]: false }));
      setSelectedGoals(prev => ({ ...prev, [id]: goalId }));
    }
  };

  const handleSaveGoal = (entryId) => {
    const goalData = newGoalNames[entryId];
    const name = goalData?.name?.trim();
    const target = parseFloat(goalData?.target) || 0;
    if (!name) return;
    const newGoalId = crypto.randomUUID();
    addSavingsGoal({ id: newGoalId, name, target }); // adjust if your goal object has more fields
    // Assign the new goal to this entry
    setSelectedGoals(prev => ({ ...prev, [entryId]: newGoalId }));
    // Clear creation state
    setIsCreating(prev => ({ ...prev, [entryId]: false }));
    setNewGoalNames(prev => ({ ...prev, [entryId]: {} }));
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
                  <option value="__newGoal">+ Create new goal…</option>
                </Select>

                {isCreating[entry.id] && (
                  <VStack mt={2} align="stretch" spacing={2}>
                    <Input
                      placeholder="New goal name"
                      value={newGoalNames[entry.id]?.name || ''}
                      onChange={(e) =>
                        setNewGoalNames(prev => ({
                          ...prev,
                          [entry.id]: { ...prev[entry.id], name: e.target.value }
                        }))
                      }
                    />
                    <Input
                      placeholder="Target amount"
                      type="number"
                      value={newGoalNames[entry.id]?.target || ''}
                      onChange={(e) =>
                        setNewGoalNames(prev => ({
                          ...prev,
                          [entry.id]: { ...prev[entry.id], target: e.target.value }
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      colorScheme="teal"
                      onClick={() => handleSaveGoal(entry.id)}
                    >
                      Save
                    </Button>
                  </VStack>
                )}

                <Text fontSize="sm" color="gray.500">
                  Goal: {selectedGoals[entry.id] ? savingsGoals.find(g => g.id === selectedGoals[entry.id])?.name : "None"}
                </Text>
              </div>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSubmit} isDisabled={isAnyCreating}>Confirm</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}