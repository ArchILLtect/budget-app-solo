import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, RadioGroup, Radio, Stack, useToast, Input, Text
} from "@chakra-ui/react";
import { useState } from "react";
import Papa from "papaparse";
import { useBudgetStore } from "../state/budgetStore";
import dayjs from "dayjs";
import { extractVendorDescription } from "../utils/accountUtils";

//TODO: Add functionality for blocking changes to actuals after applying to budget unless user confirms.
//TODO: When income applied via account integration, set Plan to 0 and grey it out.

export default function SyncAccountsModal({ isOpen, onClose }) {

  const accountMappings = useBudgetStore((s) => s.accountMappings);
  const setAccountMapping = useBudgetStore((s) => s.setAccountMapping);
  const addSyncedAccount = useBudgetStore((s) => s.addSyncedAccount);
  const [sourceType, setSourceType] = useState("csv");
  const [csvFile, setCsvFile] = useState(null);
  const [ofxFile, setOfxFile] = useState(null);
  const [step, setStep] = useState("import"); // 'import' | 'mapping'
  const [pendingMappings, setPendingMappings] = useState([]); // array of account numbers
  const [pendingData, setPendingData] = useState([]); // raw parsed CSV
  const [accountInputs, setAccountInputs] = useState({}); // { accountNum: { label, institution } }
  const toast = useToast();

  const fileTypes = ["csv", "ofx"];

  const handleFileChange = (e) => {
    if (sourceType === "csv") {
      setCsvFile(e.target.files[0]);
      setOfxFile(null);
    } else if (sourceType === "ofx") {
      setOfxFile(e.target.files[0]);
      setCsvFile(null);
    }
  };

  const handleImport = () => {
    if (!csvFile && !ofxFile) {
      toast({
        title: `Please select a ${sourceType.toUpperCase()} file`,
        status: "warning",
        duration: 3000
      });
      return;
    }

    if (sourceType === "csv") {
      
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data;

          // Step 1: Collect all unique account numbers from the file
          const accountNumbers = new Set(
            data.map((row) => row.AccountNumber?.trim()).filter(Boolean)
          );

          const unmapped = Array.from(accountNumbers).filter(
            (num) => !accountMappings[num]
          );

          // Step 2: If any account is unmapped, open mapping modal
          if (unmapped.length > 0) {
            setPendingMappings(unmapped);
            setPendingData(data); // store full data for use after mapping
            setStep("mapping");   // <- switch modal view or show mapping form
            return;
          }

          // Step 3: If all accounts are already mapped, continue parsing
          importCsvData(data);

          setPendingData([]);
          setPendingMappings([]);
          setAccountInputs({});
          onClose();
        },
        error: (err) => {
          toast({ title: "CSV Parse Failed", description: err.message, status: "error", duration: 4000 });
        },
      });
    } else if (sourceType === "ofx") {
      // parse with an OFX parser (later)
      toast({
        title: `OFX File Import Coming Soon, please use CSV for now.`,
        status: "warning",
        duration: 3000
      });
    }
  };

  const importCsvData = (data) => {
    const accountGroups = {};

    data.forEach((row) => {
      const accountNumber = row.AccountNumber?.trim();
      const accountType = row.AccountType?.trim() || "Unknown";

      // Skip if account number is missing
      if (!accountNumber) return;

      // Normalize date to yyyy-mm-dd
      const rawDate = row["Posted Date"] || row["Date"];
      const formattedDate = rawDate
        ? dayjs(rawDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

      // Convert amount (e.g., "($6.50)" → -6.50)
      let rawAmount = row.Amount || row["amount"];
      if (typeof rawAmount === "string") {
        rawAmount = rawAmount.replace(/[$,()]/g, "");
        if (row.Amount?.includes("(")) rawAmount = "-" + rawAmount;
      }

      const amount = parseFloat(rawAmount);
      if (isNaN(amount)) return;

      const transaction = {
        id: crypto.randomUUID(),
        date: formattedDate,
        name: extractVendorDescription(row.Description),
        description: row.Description || "Unnamed",
        amount: amount,
        type: amount > 0 ? "income" : "expense",
        category: row.Category || undefined,
        accountNumber: row.AccountNumber.trim(),
        institution:
            accountMappings?.[row['AccountNumber']?.trim()]?.institution || undefined,
      };

      if (!accountGroups[accountNumber]) {
        accountGroups[accountNumber] = {
          id: crypto.randomUUID(),
          name: `${accountType} - ${accountNumber}`,
          source: "csv",
          fileName: csvFile.name,
          accountNumber,
          accountType,
          transactions: [],
          importedAt: new Date().toISOString(),
        };
      }

      accountGroups[accountNumber].transactions.push(transaction);
    });

    const accounts = Object.values(accountGroups);
    accounts.forEach((acct) => addSyncedAccount(acct));

    toast({
      title: `Imported ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`,
      description: `${accounts.reduce((sum, a) => sum + a.transactions.length, 0)} transactions parsed`,
      status: "success",
      duration: 4000,
    });

    onClose();
    setCsvFile(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sync Your Accounts</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <RadioGroup value={sourceType} onChange={setSourceType}>
                <Stack direction="column">
                  <Radio value="csv">CSV File</Radio>
                  <Radio value="ofx">OFX File (Coming Soon)</Radio>
                  <Radio value="plaid" isDisabled>Bank Account (Coming Soon)</Radio>
                </Stack>
              </RadioGroup>

              {fileTypes.includes(sourceType) && (
                <>
                  <Input type="file" accept={`.${sourceType}`} onChange={handleFileChange} />
                  {((sourceType === "csv" && csvFile) || (sourceType === "ofx" && ofxFile)) && (
                    <Text fontSize="sm" color="gray.500">
                      Selected: {(sourceType === "csv" ? csvFile?.name : ofxFile?.name)}
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
            <Button onClick={handleImport} colorScheme="teal" isDisabled={sourceType !== "csv" && sourceType !== "ofx"}>
              Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={step === "mapping"} onClose={() => setStep("import")} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Map Account Numbers</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>We found account numbers that aren't yet mapped. Please assign a label and institution.</Text>
            <Stack spacing={4}>
              {pendingMappings.map((num) => (
                <Stack key={num} spacing={2}>
                  <Text fontWeight="bold">Account #: {num}</Text>
                  <Input
                    placeholder="Label (e.g., Jr's Checking)"
                    onChange={(e) =>
                      setAccountInputs((prev) => ({
                        ...prev,
                        [num]: {
                          ...prev[num],
                          label: e.target.value,
                        },
                      }))
                    }
                  />
                  <Input
                    placeholder="Institution (e.g., UWCU)"
                    onChange={(e) =>
                      setAccountInputs((prev) => ({
                        ...prev,
                        [num]: {
                          ...prev[num],
                          institution: e.target.value,
                        },
                      }))
                    }
                  />
                </Stack>
              ))}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="teal"
              onClick={() => {
                // Save new mappings to store
                pendingMappings.forEach((num) => {
                  const info = accountInputs[num] || {};
                  setAccountMapping(num, {
                    label: info.label || num,
                    institution: info.institution || "Unknown",
                  });
                });

                importCsvData(pendingData);
              }}
            >
              Save & Continue Import
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}