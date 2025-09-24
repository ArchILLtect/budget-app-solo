// DEV ONLY: IngestionDevHarness
// Lightweight UI to exercise the Phase 1 ingestion pipeline.
// NOT bundled into production pages unless you explicitly import it.
// Usage: Temporarily mount <IngestionDevHarness /> in a page (e.g. AccountsTrackerPage) while refining the pipeline.

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Code,
  Divider,
  useToast,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  FormControl,
  FormLabel,
  FormHelperText,
  SimpleGrid
} from '@chakra-ui/react';
import { runIngestion } from '../ingest/runIngestion.js';
import { useBudgetStore } from '../state/budgetStore.js';
import { parseCsv } from '../ingest/parseCsv.js';

export default function IngestionDevHarness() {
  const toast = useToast();
  const accounts = useBudgetStore(s => s.accounts);
  const importManifests = useBudgetStore(s => s.importManifests || {});
  const registerImportManifest = useBudgetStore(s => s.registerImportManifest);
  const setState = useBudgetStore.setState; // direct for patch

  const [accountNumber, setAccountNumber] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState(null); // { patch, stats, errors, savingsQueue }
  const [applied, setApplied] = useState(false);
  const [detectedAccounts, setDetectedAccounts] = useState([]); // multiple detected
  const [autoDetected, setAutoDetected] = useState(false);

  const existingTxns = accounts[accountNumber]?.transactions || [];

  const detectAccountNumbers = useCallback((csvText) => {
    try {
      const rows = parseCsv(csvText);
      if (!rows.length) return [];
      const setVals = new Set();
      for (let i = 0; i < rows.length && i < 500; i++) {
        const r = rows[i];
        const val = (r.AccountNumber || r.accountNumber || '').toString().trim();
        if (val) setVals.add(val);
      }
      return [...setVals];
    } catch {
      return [];
    }
  }, []);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setApplied(false);
    setResult(null);
    setDetectedAccounts([]);
    setAutoDetected(false);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result || '';
      setFileText(text);
      const accountsFound = detectAccountNumbers(text);
      if (accountsFound.length === 1) {
        // Only set if user hasn't already chosen something
        setAccountNumber((prev) => prev || accountsFound[0]);
        setAutoDetected(true);
      } else if (accountsFound.length > 1) {
        setDetectedAccounts(accountsFound);
      }
    };
    reader.readAsText(file);
  }, [detectAccountNumbers]);

  const runPipeline = async () => {
    if (!fileText) {
      toast({ title: 'No file content', status: 'warning', duration: 2000 });
      return;
    }
    if (!accountNumber) {
      toast({ title: 'Account number required (none detected)', status: 'warning', duration: 2500 });
      return;
    }
    setIngesting(true);
    try {
      const r = await runIngestion({
        fileText,
        accountNumber,
        existingTxns,
        registerManifest: registerImportManifest
      });
      setResult(r);
      setApplied(false);
      toast({
        title: 'Ingestion complete (dry run)',
        description: `New: ${r.stats.newCount} | Existing dupes: ${r.stats.dupesExisting} | Intra-file dupes: ${r.stats.dupesIntraFile}`,
        status: 'info',
        duration: 3000
      });
    } catch (e) {
      toast({ title: 'Ingestion failed', description: e.message, status: 'error' });
    } finally {
      setIngesting(false);
    }
  };

  const applyPatch = () => {
    if (!result?.patch) return;
    setState(result.patch);
    setApplied(true);
    toast({
      title: 'Patch applied',
      description: `Added ${result.stats.newCount} transactions to ${accountNumber}`,
      status: 'success',
      duration: 3000
    });
  };


  return (
    <Box borderWidth={1} borderRadius="lg" p={4} mt={6} bg="gray.50">
      <Heading size="sm" mb={2}>Ingestion Dev Harness</Heading>
      <Text fontSize="xs" color="gray.600" mb={3}>
        Pure pipeline tester. Select / type an account, choose a CSV file, run dry-run ingestion, optionally apply the patch. <br />
        Now includes Phase 2 file hash + manifest logging. Remove this component for production builds.
      </Text>

      <VStack align="stretch" spacing={4}>
        <VStack align="stretch" spacing={4}>
          <FormControl>
            <FormLabel fontSize="xs">CSV File</FormLabel>
            <Input type="file" size="sm" accept=".csv,text/csv" onChange={handleFile} />
            {fileName && <Text fontSize="xs" mt={1}>{fileName}</Text>}
            <FormHelperText fontSize="xs">Select a CSV to auto-detect account number if present.</FormHelperText>
          </FormControl>

          {detectedAccounts.length > 1 && (
            <FormControl>
              <FormLabel fontSize="xs">Detected Multiple Account Numbers</FormLabel>
              <Select
                size="sm"
                placeholder="Select account"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              >
                {detectedAccounts.map(a => <option key={a} value={a}>{a}</option>)}
              </Select>
              <FormHelperText fontSize="xs">File contains multiple AccountNumber values.</FormHelperText>
            </FormControl>
          )}

            {detectedAccounts.length === 0 && (
              <FormControl>
                <FormLabel fontSize="xs">Account Number {autoDetected && '(Auto-detected)'}</FormLabel>
                <Input
                  size="sm"
                  placeholder="Enter account number"
                  value={accountNumber}
                  isDisabled={autoDetected}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    setAutoDetected(false);
                  }}
                />
                {autoDetected && <FormHelperText fontSize="xs">Derived from AccountNumber column.</FormHelperText>}
              </FormControl>
            )}

          <HStack>
            <Button
              size="sm"
              colorScheme="teal"
              onClick={runPipeline}
              isLoading={ingesting}
              isDisabled={!fileText}
            >Run Ingestion (Dry Run)</Button>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={applyPatch}
              isDisabled={!result?.patch || applied}
            >Apply Patch</Button>
          </HStack>
        </VStack>

        {result && (
          <Box borderWidth={1} borderRadius="md" p={3} bg="white">
            <Heading size="xs" mb={2}>Results</Heading>
            <HStack spacing={6} mb={3}>
              <Stat>
                <StatLabel>New</StatLabel>
                <StatNumber>{result.stats.newCount}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Total Dupes</StatLabel>
                <StatNumber>{result.stats.dupesTotal}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Existing</StatLabel>
                <StatNumber>{result.stats.dupesExisting}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Intra-file</StatLabel>
                <StatNumber>{result.stats.dupesIntraFile}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Savings (placeholder)</StatLabel>
                <StatNumber>{result.savingsQueue.length}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Hash</StatLabel>
                <StatNumber fontSize="sm">{result.hash}</StatNumber>
              </Stat>
            </HStack>
            {/* Manifest lookup / duplicate warning */}
            {(() => {
              const manifest = importManifests[result.hash];
              const seen = manifest?.accounts?.[accountNumber];
              if (!manifest || !seen) return null;
              return (
                <Alert status="warning" borderRadius="md" mb={3}>
                  <AlertIcon />
                  <AlertTitle mr={2}>Previously Imported</AlertTitle>
                  <AlertDescription fontSize="xs">
                    This file hash was imported for this account at {seen.importedAt}. Re-applying may duplicate semantic data if source mutated.
                  </AlertDescription>
                </Alert>
              );
            })()}
            {applied ? <Badge colorScheme="green">Patch Applied</Badge> : <Badge>Dry Run</Badge>}
            <Divider my={3} />
            {result.errors.length > 0 ? (
              <Alert status="warning" borderRadius="md" mb={2}>
                <AlertIcon />
                <AlertTitle mr={2}>Row Errors</AlertTitle>
                <AlertDescription>{result.errors.length} skipped (showing first 5)</AlertDescription>
              </Alert>
            ) : (
              <Text fontSize="xs" color="gray.500">No row-level errors.</Text>
            )}
            {result.errors.slice(0,5).map((err, idx) => (
              <Code key={idx} display="block" whiteSpace="pre-wrap" my={1} fontSize="xs">
                {err.message}
              </Code>
            ))}
            <Divider my={3} />
            <Text fontSize="xs" color="gray.500">Accepted preview (first 5):</Text>
            <Box mt={1} maxH="160px" overflowY="auto" fontFamily="mono" fontSize="xs" p={2} borderWidth={1} borderRadius="md" bg="gray.800" color="green.200">
              {result.patch && (() => {
                // Derive preview transactions by applying patch function to a mock state subset.
                const mockState = { accounts: { [accountNumber]: { transactions: existingTxns } } };
                const partial = result.patch(mockState);
                const merged = partial.accounts[accountNumber].transactions || [];
                return merged.slice(0,5).map(t => (
                  <Text key={t.id}>{t.date} | {t.amount.toFixed(2)} | {t.type} | {t.description.slice(0,40)}</Text>
                ));
              })()}
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
