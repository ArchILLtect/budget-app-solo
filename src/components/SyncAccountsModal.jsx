import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, RadioGroup, Radio, Stack, useToast, Input, Text
} from "@chakra-ui/react";
import { useState } from "react";
import Papa from "papaparse";
import { useBudgetStore } from "../state/budgetStore";

//TODO: Add functionality for blocking changes to actuals after applying to budget unless user confirms.
//TODO: When income applied via account integration, set Plan to 0 and grey it out.

export default function SyncAccountsModal({ isOpen, onClose }) {
  const [sourceType, setSourceType] = useState("csv");
  const [csvFile, setCsvFile] = useState(null);
  const addSyncedAccount = useBudgetStore((s) => s.addSyncedAccount);
  const toast = useToast();

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (!csvFile) {
      toast({ title: "Please select a CSV file", status: "warning", duration: 3000 });
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((row) => ({
          id: crypto.randomUUID(),
          date: row.date || new Date().toISOString().slice(0, 10),
          name: row.name || row.description || "Unnamed",
          description: row.description || row.name || "Unnamed",
          amount: parseFloat(row.amount || row.Amount || 0),
          type: (row.type || "expense").toLowerCase(),
          category: row.category || undefined,
        }));

        addSyncedAccount({
          name: csvFile.name.replace('.csv', ''),
          source: 'csv',
          fileName: csvFile.name,
          transactions: rows,
        });

        toast({ title: `Imported ${rows.length} rows from CSV`, status: "success", duration: 4000 });
        onClose();
        setCsvFile(null); // reset
      },
      error: (err) => {
        toast({ title: "CSV Parse Failed", description: err.message, status: "error", duration: 4000 });
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Sync Your Accounts</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <RadioGroup value={sourceType} onChange={setSourceType}>
              <Stack direction="row">
                <Radio value="csv">CSV File</Radio>
                <Radio value="plaid" isDisabled>Bank Account (Coming Soon)</Radio>
              </Stack>
            </RadioGroup>

            {sourceType === "csv" && (
              <>
                <Input type="file" accept=".csv" onChange={handleFileChange} />
                {csvFile && (
                  <Text fontSize="sm" color="gray.500">
                    Selected: {csvFile.name}
                  </Text>
                )}
              </>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} variant="ghost" mr={3}>
            Cancel
          </Button>
          <Button onClick={handleImport} colorScheme="teal" isDisabled={sourceType !== "csv"}>
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}