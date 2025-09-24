import React, { useState } from 'react';
import { Box, Button, Progress, Text, VStack, HStack, Code } from '@chakra-ui/react';
import { streamParseCsv } from '../ingest/parseCsvStreaming.js';
import { runIngestion } from '../ingest/runIngestion.js';
import { useBudgetStore } from '../state/budgetStore.js';

// Phase 5: Dev harness to exercise streaming parse + ingestion.
export default function IngestionStreamingHarness() {
  const accounts = useBudgetStore(s => s.accounts);
  const registerImportManifest = useBudgetStore(s => s.registerImportManifest);
  const setState = useBudgetStore.setState;

  const [file, setFile] = useState(null);
  const [progressRows, setProgressRows] = useState(0);
  const [rows, setRows] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [result, setResult] = useState(null);
  const [accountNumber] = useState('stream-dev');

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setRows([]);
    setProgressRows(0);
    setResult(null);
  };

  const startStreaming = () => {
    if (!file) return;
    setParsing(true);
    streamParseCsv(file, {
      onRow: () => {
        return true; // continue
      },
      onProgress: ({ rows }) => {
        setProgressRows(rows);
      },
      onComplete: ({ rows: allRows }) => {
        setRows(allRows);
        setParsing(false);
      },
    });
  };

  const runPipeline = async () => {
    setIngesting(true);
    try {
      const existingTxns = accounts[accountNumber]?.transactions || [];
      const r = await runIngestion({
        parsedRows: rows,
        accountNumber,
        existingTxns,
        registerManifest: registerImportManifest,
      });
      setResult(r);
    } catch (e) {
      console.error(e);
    } finally {
      setIngesting(false);
    }
  };

  const apply = () => {
    if (!result) return;
    setState(result.patch);
  };

  return (
    <Box borderWidth={1} p={3} borderRadius="md" mt={4}>
      <VStack align="stretch" spacing={3}>
        <HStack>
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          <Button size="sm" onClick={startStreaming} isDisabled={!file || parsing}>Stream Parse</Button>
          <Button size="sm" onClick={runPipeline} isDisabled={!rows.length || ingesting}>Ingest Parsed</Button>
          <Button size="sm" colorScheme="green" onClick={apply} isDisabled={!result}>Apply Patch</Button>
        </HStack>
        {parsing && <Progress size="sm" isIndeterminate />}
        <Text fontSize="xs">Rows parsed: {progressRows}</Text>
        {result && (
          <Box fontSize="xs" bg="gray.800" color="green.200" p={2} borderRadius="sm" maxH="160px" overflowY="auto" fontFamily="mono">
            <Text>New: {result.stats.newCount} | DupEx: {result.stats.dupesExisting} | DupIntra: {result.stats.dupesIntraFile}</Text>
            {result.acceptedTxns.slice(0,5).map(t => (
              <Text key={t.id}>{t.date} | {t.type} | {t.category || '—'} | {t.description.slice(0,40)}</Text>
            ))}
          </Box>
        )}
        {!result && rows.length > 0 && (
          <Code fontSize="10px">Preview first header keys: {Object.keys(rows[0]||{}).slice(0,6).join(', ')}</Code>
        )}
      </VStack>
    </Box>
  );
}