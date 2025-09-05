import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, RadioGroup, Radio, Stack, useToast, Input, Text
} from "@chakra-ui/react";
import { useState } from "react";
import Papa from "papaparse";
import { useBudgetStore } from "../state/budgetStore";
import dayjs from "dayjs";
import { extractVendorDescription } from "../utils/accountUtils";
import { getTransactionKey, normalizeTransactionAmount } from "../utils/storeHelpers";

export default function SyncAccountsModal({ isOpen, onClose }) {
  const accountMappings = useBudgetStore((s) => s.accountMappings);
  const setAccountMapping = useBudgetStore((s) => s.setAccountMapping);
  const addOrUpdateAccount = useBudgetStore((s) => s.addOrUpdateAccount);

  const [sourceType, setSourceType] = useState("csv");
  const [csvFile, setCsvFile] = useState(null);
  const [ofxFile, setOfxFile] = useState(null);
  const [step, setStep] = useState("import"); // "import" | "mapping"
  const [pendingMappings, setPendingMappings] = useState([]);
  const [pendingData, setPendingData] = useState([]);
  const [accountInputs, setAccountInputs] = useState({});

  const toast = useToast();
  const fileTypes = ["csv", "ofx"];
  const isDemo = useBudgetStore((s) => s.isDemoUser);

  const resetState = () => {
    setSourceType("csv");
    setCsvFile(null);
    setOfxFile(null);
    setStep("import");
    setPendingMappings([]);
    setPendingData([]);
    setAccountInputs({});
  };

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

          const accountNumbers = new Set(
            data.map((row) => row.AccountNumber?.trim()).filter(Boolean)
          );

          const unmapped = Array.from(accountNumbers).filter(
            (num) => !accountMappings[num]
          );

          if (unmapped.length > 0) {
            setPendingMappings(unmapped);
            setPendingData(data);
            setStep("mapping"); // switch view instead of opening new modal
            return;
          }

          const mappings = useBudgetStore.getState().accountMappings;
          importCsvData(data, mappings);
        },
        error: (err) => {
          toast({
            title: "CSV Parse Failed",
            description: err.message,
            status: "error",
            duration: 4000
          });
        },
      });
    } else if (sourceType === "ofx") {
      toast({
        title: `OFX File Import Coming Soon, please use CSV for now.`,
        status: "warning",
        duration: 3000
      });
    }
  };

  const importCsvData = (data, accountMappings) => {
    const KNOWN_SAVINGS_TRANSFERS = [
      "Web Branch:TFR TO SV 457397801",
      "Online Transfer to Savings",
      "Auto-Save Transfer",
      "Mobile Transfer to SV",
    ];

    const accountGroups = {};

    data.forEach((row) => {
      const accountNumber = row.AccountNumber?.trim();
      const accountType = row.AccountType?.trim() || "Unknown";
      const isSavingsTransfer =
        row.Category?.toLowerCase() === "transfer" &&
        KNOWN_SAVINGS_TRANSFERS.includes(row.Description?.trim());

      if (!accountNumber) return;

      const rawDate = row["Posted Date"] || row["Date"];
      const formattedDate = rawDate
        ? dayjs(rawDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD");

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
        origin: 'CSV',
        name: isSavingsTransfer
          ? "Transfer to Savings"
          : extractVendorDescription(row.Description),
        description: row.Description || "Unnamed",
        amount: isSavingsTransfer ? normalizeTransactionAmount(amount, true) : amount,
        type: isSavingsTransfer
          ? "savings"
          : amount > 0
            ? "income"
            : "expense",
        category: row.Category || undefined,
        accountNumber,
        institution:
          accountMappings?.[row['AccountNumber']?.trim()]?.institution || undefined,
      };

      if (!accountGroups[accountNumber]) {
        accountGroups[accountNumber] = {
          id: crypto.randomUUID(),
          name: `${accountType} - ${accountNumber}`,
          source: "csv",
          fileName: csvFile?.name,
          accountNumber,
          accountType,
          transactions: [],
          importedAt: new Date().toISOString(),
        };
      }

      accountGroups[accountNumber].transactions.push(transaction);
    });

    const accounts = Object.values(accountGroups);
    let totalAdded = 0;

    accounts.forEach((acct) => {
      const accountNumber = acct.accountNumber;

      addOrUpdateAccount(accountNumber, {
        accountNumber: accountNumber,
        id: crypto.randomUUID(),
        label: accountMappings?.[accountNumber]?.label || accountNumber,
        institution: accountMappings?.[accountNumber]?.institution || "Unknown",
        lastSync: new Date().toISOString(),
      });

      const store = useBudgetStore.getState();
      const existing = store.accounts[accountNumber]?.transactions || [];
      const seen = new Set(existing.map(getTransactionKey));

      const newTxs = acct.transactions.filter(
        (tx) => !seen.has(getTransactionKey(tx))
      );
      totalAdded += newTxs.length;

      store.addTransactionsToAccount(accountNumber, newTxs);
    });

    toast({
      title: `Import complete`,
      description:
        totalAdded > 0
          ? `${totalAdded} new transaction${totalAdded !== 1 ? "s" : ""} added across ${accounts.length} account${accounts.length !== 1 ? "s" : ""}`
          : 'However, no new transactions were added because the import only contained duplicate transactions.',
      status: totalAdded > 0 ? "success" : "warning",
      duration: 4000,
    });

    onClose();
    resetState();
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); resetState(); }} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {step === "import" ? "Sync Your Accounts" : "Map Account Numbers"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {step === "import" && (
            <Stack spacing={4}>
              {isDemo && (
                <>
                  <Button size="sm" variant="outline" onClick={() => {
                    // 1) synthesize rows in-memory
                    const sample = [
                      { AccountNumber:'1234', AccountType:'Checking', 'Posted Date':'2025-08-03', Description:'Woodmans Grocery', Category:'groceries', Amount:'-89.12' },
                      { AccountNumber:'1234', AccountType:'Checking', 'Posted Date':'2025-08-05', Description:'Direct Deposit',   Category:'income',    Amount:'1200.00' },
                      { AccountNumber:'1234', AccountType:'Checking', 'Posted Date':'2025-08-09', Description:'Web Branch:TFR TO SV 457397801', Category:'transfer', Amount:'-100.00' },
                    ];
                    // 2) use current mapping state; if unmapped, jump to mapping step
                    const accountNumbers = [...new Set(sample.map(r => r.AccountNumber?.trim()).filter(Boolean))];
                    const mappings = useBudgetStore.getState().accountMappings;
                    const unmapped = accountNumbers.filter(n => !mappings[n]);
                    if (unmapped.length) {
                      setPendingMappings(unmapped);
                      setPendingData(sample);
                      setStep("mapping");
                    } else {
                      importCsvData(sample, mappings);   // reuse your existing pipeline
                    }
                  }}>
                    Load Sample CSV (Demo)
                  </Button>
                  <Text fontSize="sm" color="gray.500" align={'center'}>-- OR --</Text>
                </>
              )}
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
          )}

          {step === "mapping" && (
            <Stack spacing={4}>
              <Text mb={2}>We found account numbers that aren't yet mapped. Please assign a label and institution.</Text>
              {pendingMappings.map((num) => (
                <Stack key={num} spacing={2}>
                  <Text fontWeight="bold">Account #: {num}</Text>
                  <Input
                    placeholder="Label (e.g., Jr's Checking)"
                    onChange={(e) =>
                      setAccountInputs((prev) => ({
                        ...prev,
                        [num]: { ...prev[num], label: e.target.value },
                      }))
                    }
                  />
                  <Input
                    placeholder="Institution (e.g., UWCU)"
                    onChange={(e) =>
                      setAccountInputs((prev) => ({
                        ...prev,
                        [num]: { ...prev[num], institution: e.target.value },
                      }))
                    }
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </ModalBody>
        <ModalFooter>
          {step === "import" ? (
            <>
              <Button onClick={() => { onClose(); resetState(); }} variant="ghost" mr={3}>
                Cancel
              </Button>
              <Button onClick={handleImport} colorScheme="teal" isDisabled={!fileTypes.includes(sourceType)}>
                Import
              </Button>
            </>
          ) : (
            <Button
              colorScheme="teal"
              onClick={() => {
              // Save new mappings
              pendingMappings.forEach((num) => {
                const info = accountInputs[num] || {};
                setAccountMapping(num, {
                  label: info.label || num,
                  institution: info.institution || "Unknown",
                });
              });

              // Immediately grab the fresh state
              const updatedMappings = useBudgetStore.getState().accountMappings;

              // Pass it to importCsvData
              importCsvData(pendingData, updatedMappings);
            }}
            >
              Save & Continue Import
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
