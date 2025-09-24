import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Button, RadioGroup, Radio, Stack, useToast, Input, Text, Box, Stat, StatLabel, StatNumber, SimpleGrid, Tag
} from "@chakra-ui/react";
import { useState } from "react";
import Papa from "papaparse";
import { useBudgetStore } from "../state/budgetStore";
import { runIngestion } from "../ingest/runIngestion.js";
import IngestionMetricsPanel from "./IngestionMetricsPanel.jsx";

// Migration Notes:
// This modal now leverages the ingestion pipeline (runIngestion) for each account present in the CSV.
// Workflow:
// 1) Parse CSV (Papa) -> group rows by AccountNumber.
// 2) For each account group: build a minimal CSV string (header + rows) consumed by runIngestion OR pass parsed rows directly.
//    We pass parsedRows directly to avoid re-stringifying; we adapt row keys to expected normalizeRow fields.
// 3) Collect ingestion results (staged transactions + stats) and aggregate telemetry.
// 4) User confirms -> apply patches sequentially; record history entries & pending savings; show telemetry summary.
// 5) Undo & staging semantics then handled by existing store logic.

export default function SyncAccountsModal({ isOpen, onClose }) {
  const accountMappings = useBudgetStore((s) => s.accountMappings);
  const setAccountMapping = useBudgetStore((s) => s.setAccountMapping);
  // addOrUpdateAccount retained via direct getState usage in applyAllPatches

  const [sourceType, setSourceType] = useState("csv");
  const [csvFile, setCsvFile] = useState(null);
  const [ofxFile, setOfxFile] = useState(null);
  const [step, setStep] = useState("import"); // "import" | "mapping"
  const [pendingMappings, setPendingMappings] = useState([]);
  const [pendingData, setPendingData] = useState([]); // original parsed rows awaiting mapping
  const [accountInputs, setAccountInputs] = useState({});
  const [ingesting, setIngesting] = useState(false);
  const [ingestionResults, setIngestionResults] = useState([]); // [{ accountNumber, result }]
  const [telemetry, setTelemetry] = useState(null); // aggregate
  const [metricsAccount, setMetricsAccount] = useState('');
  const setLastIngestionTelemetry = useBudgetStore(s => s.setLastIngestionTelemetry);
  const recordImportHistory = useBudgetStore(s => s.recordImportHistory);
  const addPendingSavingsQueue = useBudgetStore(s => s.addPendingSavingsQueue);
  const setState = useBudgetStore.setState;

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

  // Ingestion migration implementation
  const importCsvData = async (data) => {
    setIngesting(true);
    setIngestionResults([]);
    setTelemetry(null);
    try {
      // Group raw rows by AccountNumber
      const groups = data.reduce((acc, row) => {
        const acct = (row.AccountNumber || row.accountNumber || '').trim();
        if (!acct) return acc;
        if (!acc[acct]) acc[acct] = [];
        acc[acct].push(row);
        return acc;
      }, {});

      const results = [];
      let aggregate = {
        accounts: 0,
        rows: 0,
        newCount: 0,
        dupesExisting: 0,
        dupesIntraFile: 0,
        savings: 0,
      };

  for (const acctNumber of Object.keys(groups)) {
        const rows = groups[acctNumber];
        aggregate.accounts++;
        aggregate.rows += rows.length;
        // Build a parsedRows structure that runIngestion understands: each row mapped to expected keys
        const adaptedRows = rows.map((r, idx) => ({
          date: r['Posted Date'] || r['Date'] || r.date,
          Description: r.Description || r.description || r.Memo,
          Amount: r.Amount ?? r.amount ?? r.Amt ?? r.amt,
          Category: r.Category || r.category,
          __line: idx + 1,
        }));
        const existing = useBudgetStore.getState().accounts[acctNumber]?.transactions || [];
        const r = await runIngestion({
          parsedRows: { rows: adaptedRows, errors: [] },
          accountNumber: acctNumber,
          existingTxns: existing,
          registerManifest: useBudgetStore.getState().registerImportManifest,
        });
        results.push({ accountNumber: acctNumber, result: r });
        aggregate.newCount += r.stats.newCount;
        aggregate.dupesExisting += r.stats.dupesExisting;
        aggregate.dupesIntraFile += r.stats.dupesIntraFile;
        aggregate.savings += r.savingsQueue?.length || 0;
      }
  setIngestionResults(results);
  if (results.length && !metricsAccount) setMetricsAccount(results[0].accountNumber);
      setTelemetry(aggregate);
      toast({ title: 'Dry run complete', description: `Accounts: ${aggregate.accounts} New: ${aggregate.newCount} DupEx: ${aggregate.dupesExisting} DupIntra: ${aggregate.dupesIntraFile}`, status: 'info', duration: 4000 });
    } catch (e) {
      toast({ title: 'Ingestion failed', description: e.message, status: 'error' });
    } finally {
      setIngesting(false);
    }
  };

  const applyAllPatches = () => {
    if (!ingestionResults.length) return;
    try {
  ingestionResults.forEach(({ accountNumber, result }) => {
        if (!result?.patch) return;
        setState(result.patch);
        // Record per-account history
        recordImportHistory({
          sessionId: result.stats.importSessionId,
          accountNumber,
          importedAt: new Date().toISOString(),
            newCount: result.stats.newCount,
            dupesExisting: result.stats.dupesExisting,
            dupesIntraFile: result.stats.dupesIntraFile,
            savingsCount: result.savingsQueue?.length || 0,
            hash: result.stats.hash,
        });
        if (result.savingsQueue?.length) {
          addPendingSavingsQueue(accountNumber, result.savingsQueue);
        }
        // Update account metadata (label/institution) if newly mapped
  const mapping = useBudgetStore.getState().accountMappings?.[accountNumber];
        if (mapping) {
          useBudgetStore.getState().addOrUpdateAccount(accountNumber, {
            accountNumber,
            id: useBudgetStore.getState().accounts[accountNumber]?.id || crypto.randomUUID(),
            label: mapping.label || accountNumber,
            institution: mapping.institution || 'Unknown',
            lastSync: new Date().toISOString(),
          });
        }
        // Per-account undo toast (quick action)
        const sessionId = result.stats.importSessionId;
        toast({
          position: 'bottom-right',
          duration: 6000,
          render: ({ onClose }) => (
            <Box p={3} bg='gray.800' color='white' borderRadius='md' boxShadow='md'>
              <Text fontSize='sm' mb={1}>Imported {result.stats.newCount} new tx in {accountNumber}</Text>
              <Button size='xs' colorScheme='red' variant='outline' onClick={() => { useBudgetStore.getState().undoStagedImport(accountNumber, sessionId); onClose(); }}>Undo</Button>
            </Box>
          )
        });
      });
      if (telemetry) {
        setLastIngestionTelemetry({
          at: new Date().toISOString(),
          accountNumber: telemetry.accounts > 1 ? `${telemetry.accounts} accounts` : ingestionResults[0]?.accountNumber,
          newCount: telemetry.newCount,
          dupesExisting: telemetry.dupesExisting,
          dupesIntraFile: telemetry.dupesIntraFile,
          categorySources: null,
        });
      }
      toast({ title: 'Import applied (staged)', description: 'Transactions are staged until you Apply to Budget.', status: 'success', duration: 3500 });
      onClose();
      resetState();
    } catch (e) {
      toast({ title: 'Apply failed', description: e.message, status: 'error' });
    }
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
              <Button onClick={handleImport} colorScheme="teal" isLoading={ingesting} isDisabled={!fileTypes.includes(sourceType)}>
                {ingestionResults.length ? 'Re-Import' : 'Import'}
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
          {step === 'import' && ingestionResults.length > 0 && !ingesting && (
            <Button ml={3} colorScheme='purple' onClick={applyAllPatches}>Apply All ({telemetry?.newCount || 0} new)</Button>
          )}
        </ModalFooter>
        {step === 'import' && ingestionResults.length > 0 && (
          <Box px={6} pb={4}>
            <Text fontSize='sm' fontWeight='bold' mb={2}>Dry Run Summary</Text>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={3} fontSize='xs'>
              <Stat><StatLabel>Accounts</StatLabel><StatNumber fontSize='md'>{telemetry?.accounts}</StatNumber></Stat>
              <Stat><StatLabel>Rows</StatLabel><StatNumber fontSize='md'>{telemetry?.rows}</StatNumber></Stat>
              <Stat><StatLabel>New</StatLabel><StatNumber fontSize='md'>{telemetry?.newCount}</StatNumber></Stat>
              <Stat><StatLabel>DupEx</StatLabel><StatNumber fontSize='md'>{telemetry?.dupesExisting}</StatNumber></Stat>
              <Stat><StatLabel>DupIntra</StatLabel><StatNumber fontSize='md'>{telemetry?.dupesIntraFile}</StatNumber></Stat>
              <Stat><StatLabel>Savings</StatLabel><StatNumber fontSize='md'>{telemetry?.savings}</StatNumber></Stat>
            </SimpleGrid>
            <Box maxH='140px' overflow='auto' borderWidth='1px' borderRadius='md' p={2} fontSize='11px'>
              {ingestionResults.map(({ accountNumber, result }) => (
                <Box key={accountNumber} mb={2}>
                  <Text fontWeight='bold'>{accountNumber}</Text>
                  <Text>New: {result.stats.newCount} | DupEx: {result.stats.dupesExisting} | DupIntra: {result.stats.dupesIntraFile} | EarlySC: {result.stats.earlyShortCircuits?.total}</Text>
                </Box>
              ))}
            </Box>
            {/* Metrics panel (select account) */}
            <Box mt={4}>
              <Stack direction='row' align='center' mb={2} spacing={2}>
                <Text fontSize='sm'>Metrics:</Text>
                <select value={metricsAccount} onChange={e=>setMetricsAccount(e.target.value)} style={{ fontSize:'0.75rem' }}>
                  {ingestionResults.map(ir => <option key={ir.accountNumber} value={ir.accountNumber}>{ir.accountNumber}</option>)}
                </select>
                {metricsAccount && <Tag size='sm'>{metricsAccount.slice(0,12)}</Tag>}
              </Stack>
              {(() => {
                const sel = ingestionResults.find(r => r.accountNumber === metricsAccount) || ingestionResults[0];
                if (!sel) return null;
                const s = sel.result.stats;
                const metrics = {
                  ingestMs: s.ingestMs,
                  parseMs: null,
                  processMs: s.processMs,
                  totalMs: s.ingestMs,
                  rowsProcessed: s.rowsProcessed,
                  rowsPerSec: s.rowsPerSec,
                  duplicatesRatio: s.duplicatesRatio,
                  stageTimings: s.stageTimings,
                  earlyShortCircuits: s.earlyShortCircuits,
                };
                return <IngestionMetricsPanel metrics={metrics} sessionId={s.importSessionId} />;
              })()}
            </Box>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
}
