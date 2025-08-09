import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, RadioGroup, Stack, Radio, Flex,
  Text, useToast
} from "@chakra-ui/react";
import { useState } from "react";
import { applyOneMonth } from "../utils/accountUtils";
import { useBudgetStore } from "../state/budgetStore";
import LoadingSpinner from '../components/LoadingSpinner';
import dayjs from "dayjs";

export default function ApplyToBudgetModal({ isOpen, onClose, acct, months }) {
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("month");
  const selectedMonth = useBudgetStore(s => s.selectedMonth);
  const selectedYearFromStore = dayjs(selectedMonth).year().toString();
  const yearFromSelected = (selectedMonth || '').slice(0, 4);
  const transactionsThisMonth = acct.transactions.filter((tx) => tx.date?.startsWith(selectedMonth));
  const transactionsThisYear = acct.transactions.filter((tx) => tx.date?.startsWith(selectedYearFromStore));
  const monthsForYear = months?.filter(m => m.startsWith(yearFromSelected)) || [];
  const { openProgress, updateProgress, closeProgress } = useBudgetStore.getState();
  const toast = useToast();

  const runScopedApply = async () => {
    setLoading(true);
    
    let targets = [];
    let total = { e:0, i:0, s:0 };

    try {
      if (scope === 'month' && selectedMonth) { targets = [selectedMonth] }
      else if (scope === 'year') { targets = monthsForYear }
      else if (scope === 'all') { targets = months || [] }

      openProgress(targets.length);
      let processed = 0;

      for (const m of targets) {
        const counts = await applyOneMonth(m, acct, /*showToast*/ false);
        total.e += counts.e;
        total.i += counts.i;
        total.s += counts.s;

        processed++;
        updateProgress(processed);
         await new Promise(requestAnimationFrame);
      }
    } catch (err) {
      toast({
        title: "Error applying budget",
        description: err.message || err,
        status: "error",
        duration: 4000
      });
    }
    finally {
      setLoading(false);
      toast({
        title: "Budget updated",
        description: `Applied ${targets.length} month(s): ${total.e} expenses, ${total.i} income, ${total.s} savings.`,
        status: "success",
        duration: 4000,
      });
      closeProgress();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        {loading && (
            <Flex
              pos="fixed"
              top={0}
              left={0}
              w="100vw"
              h="100vh"
              zIndex="modal"
              bg="rgba(0,0,0,0.4)"
              justify="center"
              align="center"
            >
              <LoadingSpinner />
            </Flex>
          )}
          <ModalHeader>Apply to Budget</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <RadioGroup value={scope} onChange={setScope}>
              <Stack spacing={3}>
                <Text color={'GrayText'} fontSize={'sm'}>Make sure you have selected desired month or year before proceeding</Text>
                <Radio value="month" isDisabled={!selectedMonth || transactionsThisMonth?.length <= 0}>Current Month ({dayjs(selectedMonth).format("MMMM YYYY") || 'n/a'}) = ({transactionsThisMonth?.length.toLocaleString('en-US')})</Radio>
                <Radio value="year" isDisabled={!selectedYearFromStore || transactionsThisYear.length <= 0}>Current Year ({selectedYearFromStore || 'year not set'}) = ({transactionsThisYear?.length.toLocaleString('en-US') || 0})</Radio>                
                <Radio value="all" isDisabled={!months || months?.length <= 0}>All Transactions ({acct?.transactions?.length.toLocaleString('en-US') || 0})</Radio>
              </Stack>
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>Cancel</Button>
            {/* onClick replaced from "apply" */}
            <Button colorScheme="teal" onClick={runScopedApply} isLoading={loading}>Apply</Button>
          </ModalFooter>
      </ModalContent>
    </Modal>
  );
}