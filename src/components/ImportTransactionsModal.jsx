import React, { useState, useCallback, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, Box, VStack, HStack, FormControl, FormLabel, Input, Select, Text, Stat, StatLabel,
  StatNumber, Alert, AlertIcon, AlertTitle, AlertDescription, Code, Divider, useToast,
  Spinner, Badge
} from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore.js';
import { runIngestion } from '../ingest/runIngestion.js';
import { parseCsv } from '../ingest/parseCsv.js';
import { streamParseCsv } from '../ingest/parseCsvStreaming.js';
import IngestionMetricsPanel from './IngestionMetricsPanel.jsx';

/** Phase 3: Production Import Preview Modal
 * Provides dry-run ingestion, duplicate breakdown, manifest warning, preview & patch apply.
 */
export default function ImportTransactionsModal({ isOpen, onClose }) {
  const toast = useToast();
  const accounts = useBudgetStore(s => s.accounts);
  const importManifests = useBudgetStore(s => s.importManifests || {});
  const registerImportManifest = useBudgetStore(s => s.registerImportManifest);
  const setLastIngestionTelemetry = useBudgetStore(s => s.setLastIngestionTelemetry);
  const lastIngestionTelemetry = useBudgetStore(s => s.lastIngestionTelemetry);
  const setState = useBudgetStore.setState;
  const streamingAutoLineThreshold = useBudgetStore(s => s.streamingAutoLineThreshold);
  const streamingAutoByteThreshold = useBudgetStore(s => s.streamingAutoByteThreshold);

  const [fileName, setFileName] = useState('');
  const [fileText, setFileText] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [detectedAccounts, setDetectedAccounts] = useState([]);
  const [autoDetected, setAutoDetected] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [useStreaming, setUseStreaming] = useState(false);
  const [streamRows, setStreamRows] = useState(0);
  const [streamFinished, setStreamFinished] = useState(false);
  const [autoStreaming, setAutoStreaming] = useState(false);
  const [autoStreamingReason, setAutoStreamingReason] = useState('');
  const [streamAborted, setStreamAborted] = useState(false);
  const [streamController, setStreamController] = useState(null);
  const [result, setResult] = useState(null); // { patch, stats, errors, ... }
  const [applied, setApplied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [totalLines, setTotalLines] = useState(null); // for progress % estimation
  const [showErrors, setShowErrors] = useState(false);
  const [errorFilter, setErrorFilter] = useState('all'); // all | parse | normalize | duplicate
  const [timing, setTiming] = useState({ parseMs: null, ingestMs: null, totalMs: null });
  const exportLockRef = useRef(false);

  const resetState = () => {
    setFileName('');
    setFileText('');
    setAccountNumber('');
    setDetectedAccounts([]);
    setAutoDetected(false);
    setIngesting(false);
    setResult(null);
    setApplied(false);
    setStreaming(false);
    setUseStreaming(false);
    setStreamRows(0);
    setStreamFinished(false);
    setAutoStreaming(false);
    setAutoStreamingReason('');
    setStreamAborted(false);
    setStreamController(null);
  };

  const existingTxns = accounts[accountNumber]?.transactions || [];

  const detectAccountNumbers = useCallback((csvText) => {
    try {
      const parsed = parseCsv(csvText);
      const rows = Array.isArray(parsed) ? parsed : parsed.rows; // backward compatibility
      if (!rows.length) return [];
      const setVals = new Set();
      for (let i = 0; i < rows.length && i < 800; i++) {
        const r = rows[i];
        const val = (r.AccountNumber || r.accountNumber || '').toString().trim();
        if (val) setVals.add(val);
      }
      return [...setVals];
    } catch {
      return [];
    }
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setApplied(false);
    setDetectedAccounts([]);
    setAutoDetected(false);
    setUseStreaming(false);
    setAutoStreaming(false);
    setAutoStreamingReason('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result || '';
      setFileText(text);
      // Pre-compute total line count once for percentage estimation (cheap O(n) scan)
      try { setTotalLines(((text.match(/\n/g) || []).length + 1) || null); } catch { setTotalLines(null); }
      const accountsFound = detectAccountNumbers(text);
      // Adaptive streaming heuristic
      try {
        const lineCount = (text.match(/\n/g) || []).length + 1;
        const bytes = file.size || text.length; // fallback to char length
        const lineThresh = streamingAutoLineThreshold || 3000;
        const byteThresh = streamingAutoByteThreshold || 500_000;
        if (!useStreaming && (lineCount > lineThresh || bytes > byteThresh)) {
          setUseStreaming(true);
          setAutoStreaming(true);
          const reasonParts = [];
            if (lineCount > lineThresh) reasonParts.push(`${lineCount.toLocaleString()} lines`);
            if (bytes > byteThresh) reasonParts.push(`${(bytes/1024).toFixed(1)} KB`);
          setAutoStreamingReason(`Large file: ${reasonParts.join(', ')}`);
        }
      } catch {/* heuristic failure ignored */}
      if (accountsFound.length === 1) {
        setAccountNumber((prev) => prev || accountsFound[0]);
        setAutoDetected(true);
      } else if (accountsFound.length > 1) {
        setDetectedAccounts(accountsFound);
      }
    };
    reader.readAsText(file);
  };

  // Run dry-run ingestion pipeline (sync or streaming path)
  const runPipeline = async () => {
    if (!fileText) {
      toast({ title: 'No file selected', status: 'warning', duration: 2200 });
      return;
    }
    if (!accountNumber) {
      toast({ title: 'Account number required', status: 'warning', duration: 2500 });
      return;
    }
    setIngesting(true);
    setStreaming(false);
    try {
      const wallStart = (performance && performance.now) ? performance.now() : Date.now();
      let ingestionInput = { fileText };
      // Streaming path: parse rows first, then hand to ingestion (skip internal parse)
      if (useStreaming) {
        setStreaming(true);
        setStreamRows(0);
        setStreamFinished(false);
        setStreamAborted(false);
        const parseStart = (performance && performance.now) ? performance.now() : Date.now();
        const parsedRowsContainer = await new Promise((resolve, reject) => {
          try {
            const controller = streamParseCsv(fileText, {
              onRow: () => true,
              onProgress: ({ rows, finished }) => {
                setStreamRows(rows);
                if (finished) setStreamFinished(true);
              },
              onComplete: ({ rows, meta, error }) => {
                setStreamController(null);
                if (error) reject(error); else {
                  if (streamAborted) resolve({ rows: [], errors: meta?.parseErrors || [] });
                  else resolve({ rows, errors: meta?.parseErrors || [] });
                }
              },
            });
            setStreamController(controller);
          } catch (err) { reject(err); }
        });
        const parseEnd = (performance && performance.now) ? performance.now() : Date.now();
        if (streamAborted) {
          toast({ title: 'Streaming aborted', description: `${streamRows} rows parsed (ignored).`, status: 'warning', duration: 3000 });
          setIngesting(false);
          return; // do not proceed to ingestion
        }
        ingestionInput = { parsedRows: parsedRowsContainer };
        setTiming(t => ({ ...t, parseMs: +(parseEnd - parseStart).toFixed(2) }));
      }
      const r = await runIngestion({
        ...ingestionInput,
        accountNumber,
        existingTxns,
        registerManifest: registerImportManifest,
      });
      setResult(r);
      setApplied(false);
      // Persist telemetry
      try {
        setLastIngestionTelemetry({
          at: new Date().toISOString(),
          accountNumber,
            hash: r.stats.hash,
            newCount: r.stats.newCount,
            dupesExisting: r.stats.dupesExisting,
            dupesIntraFile: r.stats.dupesIntraFile,
            categorySources: r.stats.categorySources,
        });
      } catch {/* noop */}
      const wallEnd = (performance && performance.now) ? performance.now() : Date.now();
      setTiming(t => ({ ...t, ingestMs: r.stats.ingestMs, totalMs: +(wallEnd - wallStart).toFixed(2) }));
      toast({
        title: 'Dry run complete',
        description: `New: ${r.stats.newCount} | DupEx: ${r.stats.dupesExisting} | DupIntra: ${r.stats.dupesIntraFile} | Ingest: ${r.stats.ingestMs}ms` + (timing.parseMs ? ` | Parse: ${timing.parseMs}ms` : ''),
        status: 'info',
        duration: 3500,
      });
    } catch (e) {
      toast({ title: 'Ingestion failed', description: e.message, status: 'error' });
    } finally {
      setIngesting(false);
    }
  };

  const cancelStreaming = () => {
    if (streamController) {
      setStreamAborted(true);
      try { streamController.abort(); } catch {/* ignore */}
    }
  };
  
  const addPendingSavingsQueue = useBudgetStore(s => s.addPendingSavingsQueue);
  const recordImportHistory = useBudgetStore(s => s.recordImportHistory);

  const applyPatch = () => {
    if (!result?.patch) return;
    try {
      setState(result.patch);
      setApplied(true);
      setShowConfirm(false);
      const sessionId = result.stats.importSessionId || result.importSessionId;
      toast({ title: 'Import applied (staged)', description: 'Transactions are staged until you Apply to Budget.', status: 'success', duration: 3000 });
      // Record audit entry
      recordImportHistory({
        sessionId,
        accountNumber,
        importedAt: new Date().toISOString(),
        newCount: result.stats.newCount,
        dupesExisting: result.stats.dupesExisting,
        dupesIntraFile: result.stats.dupesIntraFile,
        savingsCount: result.savingsQueue?.length || 0,
        hash: result.stats.hash,
      });
      if (result.savingsQueue && result.savingsQueue.length) {
        addPendingSavingsQueue(accountNumber, result.savingsQueue);
        toast({ title: 'Savings deferred', description: `${result.savingsQueue.length} potential savings transactions will be reviewed after budget apply.`, status: 'info', duration: 4000 });
      }
    } catch (e) {
      toast({ title: 'Apply failed', description: e.message, status: 'error' });
    }
  };

  const closeAndReset = () => {
    onClose();
    setTimeout(resetState, 200); // allow modal exit animation
  };

  const manifestWarning = result ? (() => {
    const manifest = importManifests[result.stats.hash];
    const seen = manifest?.accounts?.[accountNumber];
    if (!manifest || !seen) return null;
    return (
      <Alert status="warning" borderRadius="md" mb={3}>
        <AlertIcon />
        <AlertTitle fontSize="sm" mr={2}>Previously Imported</AlertTitle>
        <AlertDescription fontSize="xs">This file hash was imported for this account at {seen.importedAt}. Re-importing may be redundant.</AlertDescription>
      </Alert>
    );
  })() : null;

  return (
    <Modal isOpen={isOpen} onClose={closeAndReset} size="4xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import Transactions</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">CSV File</FormLabel>
              <Input type="file" size="sm" accept=".csv,text/csv" onChange={handleFile} />
              {fileName && <Text fontSize="xs" mt={1}>{fileName}</Text>}
            </FormControl>

            {detectedAccounts.length > 1 && (
              <FormControl>
                <FormLabel fontSize="sm">Detected Accounts</FormLabel>
                <Select size="sm" value={accountNumber} placeholder="Select account" onChange={(e) => setAccountNumber(e.target.value)}>
                  {detectedAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                </Select>
                <Text fontSize="xs" mt={1}>Multiple AccountNumber values found in file.</Text>
              </FormControl>
            )}

            {detectedAccounts.length === 0 && (
              <FormControl>
                <FormLabel fontSize="sm">Account Number {autoDetected && '(Auto-detected)'}</FormLabel>
                <Input size="sm" value={accountNumber} placeholder="Enter or auto-detected" isDisabled={autoDetected} onChange={(e) => { setAccountNumber(e.target.value); setAutoDetected(false); }} />
                {autoDetected && <Text fontSize="xs" mt={1}>Derived from AccountNumber column.</Text>}
              </FormControl>
            )}

            <HStack>
              <Button size="sm" colorScheme="teal" onClick={runPipeline} isLoading={ingesting} isDisabled={!fileText}>Run Dry Run</Button>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant={useStreaming ? 'solid' : 'outline'}
                  colorScheme={useStreaming ? 'purple' : 'gray'}
                  onClick={() => setUseStreaming(s => {
                    const next = !s;
                    if (!next) { setAutoStreaming(false); setAutoStreamingReason(''); }
                    else { /* user manually enabled overrides auto flag */ setAutoStreaming(false); }
                    return next;
                  })}
                  disabled={ingesting}
                  title={autoStreaming ? `Auto-enabled: ${autoStreamingReason}` : 'Toggle streaming parser'}
                >
                  {useStreaming ? (autoStreaming ? 'Streaming AUTO' : 'Streaming ON') : 'Streaming OFF'}
                </Button>
                {autoStreaming && (
                  <Badge colorScheme="purple" variant="subtle" fontSize="0.6rem">auto</Badge>
                )}
              </HStack>
              {!showConfirm && (
                <Button size="sm" variant="outline" onClick={() => setShowConfirm(true)} isDisabled={!result?.patch || applied}>Review & Apply</Button>
              )}
              {showConfirm && (
                <Button size="sm" colorScheme="green" onClick={applyPatch} isDisabled={applied}>Confirm Apply</Button>
              )}
              {showConfirm && (
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)} isDisabled={applied}>Cancel</Button>
              )}
              {applied && <Badge colorScheme="green">Applied</Badge>}
              {ingesting && streaming && !streamFinished && !streamAborted && (
                <Button size="sm" colorScheme="red" variant="outline" onClick={cancelStreaming}>Abort</Button>
              )}
            </HStack>

            {ingesting && useStreaming && (
              <Box w="100%" borderWidth={1} borderRadius="md" p={2} bg="gray.50">
                <HStack justify="space-between" fontSize="xs">
                  <Text>Streaming parse...</Text>
                  <HStack spacing={3}>
                    <Text>{streamRows} rows{totalLines ? ` / ${totalLines.toLocaleString()}` : ''}</Text>
                    {totalLines && (
                      <Badge colorScheme={streamAborted ? 'red' : (streamFinished ? 'green' : 'purple')}>
                        {Math.min(100, ((streamRows / totalLines) * 100) || 0).toFixed(1)}%
                      </Badge>
                    )}
                    {streamAborted && <Badge colorScheme='red'>aborted</Badge>}
                  </HStack>
                </HStack>
                <Box mt={1} h="4px" bg="gray.200" borderRadius="sm" overflow="hidden">
                  {(() => {
                    let pct = 0;
                    if (totalLines && totalLines > 0) pct = Math.min(100, (streamRows / totalLines) * 100);
                    else if (streamFinished) pct = 100; else pct = 10 + Math.min(50, streamRows / 50); // fallback heuristic
                    return (
                      <Box h="100%" width={`${streamFinished || streamAborted ? 100 : pct}%`} transition="width 0.4s ease" bg={streamAborted ? 'red.400' : (streamFinished ? 'green.400' : 'purple.400')}></Box>
                    );
                  })()}
                </Box>
              </Box>
            )}
            {autoStreaming && !ingesting && !result && (
              <Text fontSize="10px" color="purple.600">Streaming auto-enabled ({autoStreamingReason}). You can toggle it off.</Text>
            )}

            {result && (
              <Box borderWidth={1} borderRadius="md" p={3} bg="gray.50">
                <HStack spacing={6} flexWrap="wrap">
                  <Stat><StatLabel>New</StatLabel><StatNumber>{result.stats.newCount}</StatNumber></Stat>
                  <Stat><StatLabel>Total Dupes</StatLabel><StatNumber>{result.stats.dupesExisting + result.stats.dupesIntraFile}</StatNumber></Stat>
                  <Stat><StatLabel>Existing</StatLabel><StatNumber>{result.stats.dupesExisting}</StatNumber></Stat>
                  <Stat><StatLabel>Intra-file</StatLabel><StatNumber>{result.stats.dupesIntraFile}</StatNumber></Stat>
                  <Stat><StatLabel>Errors</StatLabel><StatNumber>{result.errors.length}</StatNumber></Stat>
                  <Stat><StatLabel>Hash</StatLabel><StatNumber fontSize="sm">{result.stats.hash}</StatNumber></Stat>
                </HStack>
                <Divider my={3} />
                {/* Ingestion metrics panel */}
                <IngestionMetricsPanel
                  metrics={(() => {
                    if (!result?.stats) return null;
                    return {
                      ingestMs: result.stats.ingestMs,
                      parseMs: timing.parseMs,
                      processMs: result.stats.processMs,
                      totalMs: timing.totalMs,
                      rowsProcessed: result.stats.rowsProcessed,
                      rowsPerSec: result.stats.rowsPerSec,
                      duplicatesRatio: result.stats.duplicatesRatio,
                      stageTimings: result.stats.stageTimings,
                      earlyShortCircuits: result.stats.earlyShortCircuits,
                    };
                  })()}
                  sessionId={result?.stats?.importSessionId}
                />
                <Divider my={3} />
                {showConfirm && (
                  <Box mb={3} p={3} borderWidth={1} borderRadius="md" bg="yellow.50">
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>Confirmation Summary</Text>
                    <Text fontSize="xs" mb={1}>You are about to apply <strong>{result.stats.newCount}</strong> new transactions to account <strong>{accountNumber}</strong>.</Text>
                    <Text fontSize="xs" mb={1}>Existing duplicates skipped: {result.stats.dupesExisting} | Intra-file skipped: {result.stats.dupesIntraFile}</Text>
                    {result.stats.categorySources && (
                      <Box mt={2} mb={2}>
                        <Text fontSize="xs" fontWeight="semibold">Category Inference Sources</Text>
                        {(() => {
                          const total = Object.values(result.stats.categorySources).reduce((a,b)=>a+b,0) || 1;
                          const tooltipMap = {
                            provided: 'Category supplied in CSV (non-uncategorized).',
                            keyword: 'Matched a configured keyword substring.',
                            regex: 'Matched a regex rule pattern.',
                            consensus: 'Assigned via vendor consensus (dominant category among labeled samples).',
                            none: 'No category inferred (remains unlabeled).'
                          };
                          return (
                            <HStack spacing={3} mt={1} wrap="wrap">
                              {Object.entries(result.stats.categorySources).map(([k,v]) => {
                                const pct = ((v/total)*100).toFixed(1);
                                return (
                                  <Badge key={k} title={tooltipMap[k] || k} colorScheme={k === 'none' ? 'gray' : (k === 'consensus' ? 'purple' : 'blue')} fontSize="0.6rem">
                                    {k}: {v} ({pct}%)
                                  </Badge>
                                );
                              })}
                            </HStack>
                          );
                        })()}
                      </Box>
                    )}
                    <Text fontSize="xs" mb={2}>First 5 new transactions:</Text>
                    <Box fontFamily="mono" fontSize="10px" maxH="120px" overflowY="auto" bg="gray.800" color="green.200" p={2} borderRadius="sm">
                      {result.acceptedTxns.slice(0,5).map(t => (
                        <Text key={t.id}>{t.date} | {(t.rawAmount ?? t.amount).toFixed(2)} | {t.type} | {t.category || '—'} | {t.description.slice(0,60)}</Text>
                      ))}
                    </Box>
                  </Box>
                )}
                {manifestWarning}
                {result.errors.length > 0 && (
                  <Box mb={2}>
                    <Alert status="warning" borderRadius="md" mb={2}>
                      <AlertIcon />
                      <AlertTitle fontSize="sm" mr={2}>Row Errors</AlertTitle>
                      <AlertDescription fontSize="xs">{result.errors.length} rows skipped.</AlertDescription>
                    </Alert>
                    {(() => {
                      const counts = {
                        all: result.errors.length,
                        parse: result.errors.filter(e=>e.type==='parse').length,
                        normalize: result.errors.filter(e=>e.type==='normalize').length,
                        duplicate: result.errors.filter(e=>e.type==='duplicate').length,
                      };
                      return (
                        <HStack spacing={2} mb={1} wrap='wrap'>
                          <Button size='xs' variant={errorFilter==='all'?'solid':'outline'} onClick={()=>setErrorFilter('all')}>All ({counts.all})</Button>
                          <Button size='xs' variant={errorFilter==='parse'?'solid':'outline'} onClick={()=>setErrorFilter('parse')}>Parse ({counts.parse})</Button>
                          <Button size='xs' variant={errorFilter==='normalize'?'solid':'outline'} onClick={()=>setErrorFilter('normalize')}>Normalize ({counts.normalize})</Button>
                          <Button size='xs' variant={errorFilter==='duplicate'?'solid':'outline'} onClick={()=>setErrorFilter('duplicate')}>Duplicate ({counts.duplicate})</Button>
                          <Button size='xs' onClick={()=>setShowErrors(s=>!s)}>{showErrors? 'Hide':'Show'}</Button>
                          <Button size='xs' variant='ghost' title='Download errors as CSV' onClick={() => {
                            if (exportLockRef.current) return; // simple debounce to avoid rapid double clicks
                            exportLockRef.current = true;
                            setTimeout(()=>{ exportLockRef.current = false; }, 1500);
                            try {
                              const header = 'line,type,reason,message';
                              const rows = result.errors.map(e => [e.line, e.type, e.reason || '', (e.message||'').replace(/"/g,'""')]);
                              const csv = [header, ...rows.map(r=>r.map(f=>`"${(f??'').toString().replace(/"/g,'""')}"`).join(','))].join('\n');
                              // Light safeguard: large files warn
                              if (csv.length > 2_000_000) {
                                toast({ title: 'Large CSV', description: 'Generating large error export...', status: 'info', duration: 2000 });
                              }
                              const blob = new Blob([csv], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `ingestion-errors-${result.stats.hash}.csv`;
                              document.body.appendChild(a);
                              a.click();
                              setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
                            } catch {/* ignore */}
                          }}>Download CSV</Button>
                          <Button size='xs' variant='ghost' title='Legend: duplicate=yellow, normalize=red, parse=orange' disabled>Legend</Button>
                        </HStack>
                      );
                    })()}
                    {showErrors && (
                      <Box maxH='160px' overflowY='auto' borderWidth={1} borderRadius='md' p={2} bg='gray.900' color='red.200' fontFamily='mono' fontSize='10px'>
                        {(() => {
                          const filtered = result.errors.filter(e => errorFilter==='all' || e.type===errorFilter);
                          return filtered.slice(0,200).map((err, idx) => {
                            let color;
                            if (err.type === 'duplicate') color = 'yellow.300';
                            else if (err.type === 'normalize') color = 'red.200';
                            else if (err.type === 'parse') color = 'orange.300';
                            else color = 'red.200';
                            return (
                              <Text key={idx} color={color}>L{err.line || '?'} [{err.type || 'unknown'}] {err.message}</Text>
                            );
                          });
                        })()}
                      </Box>
                    )}
                  </Box>
                )}
                {/* Legacy brief error preview removed in favor of panel */}
                <Divider my={3} />
                {lastIngestionTelemetry && !showConfirm && (
                  <Box mb={3} p={2} borderWidth={1} borderRadius="md" bg="blue.50">
                    <Text fontSize="xs" fontWeight="semibold" mb={1}>Last Import Telemetry</Text>
                    <Text fontSize="10px" mb={1}>At: {lastIngestionTelemetry.at} | Account: {lastIngestionTelemetry.accountNumber} | New: {lastIngestionTelemetry.newCount} | DupEx: {lastIngestionTelemetry.dupesExisting} | DupIntra: {lastIngestionTelemetry.dupesIntraFile}</Text>
                    {lastIngestionTelemetry.categorySources && (
                      <HStack spacing={2} wrap="wrap">
                        {Object.entries(lastIngestionTelemetry.categorySources).map(([k,v]) => {
                          const totalPrev = Object.values(lastIngestionTelemetry.categorySources).reduce((a,b)=>a+b,0)||1;
                          const pctPrev = ((v/totalPrev)*100).toFixed(1);
                          return <Badge key={k} fontSize="0.55rem" colorScheme={k==='none'?'gray':(k==='consensus'?'purple':'blue')}>{k}:{v} ({pctPrev}%)</Badge>;
                        })}
                      </HStack>
                    )}
                  </Box>
                )}
                <Text fontSize="xs" color="gray.600">Preview of accepted (first 10)</Text>
                <Box mt={1} maxH="180px" overflowY="auto" fontFamily="mono" fontSize="xs" p={2} borderWidth={1} borderRadius="md" bg="gray.800" color="green.200">
                  {(() => {
                    const mockState = { accounts: { [accountNumber]: { transactions: existingTxns } } };
                    const partial = result.patch(mockState);
                    const merged = partial.accounts[accountNumber].transactions || [];
                    return merged.slice(0,10).map(t => (
                      <Text key={t.id}>{t.date} | {(t.rawAmount ?? t.amount).toFixed(2)} | {t.type} | {t.category || '—'} | {t.description.slice(0,50)}</Text>
                    ));
                  })()}
                </Box>
              </Box>
            )}
            {result && useStreaming && !ingesting && (
              <Badge colorScheme={streamAborted ? 'red' : 'purple'} alignSelf='flex-start'>
                {streamAborted ? `Aborted after ${streamRows}` : `Streamed ${streamRows} rows`}
              </Badge>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={closeAndReset}>Close</Button>
          {!showConfirm && <Button colorScheme="blue" onClick={() => setShowConfirm(true)} isDisabled={!result?.patch || applied}>Review & Apply</Button>}
          {showConfirm && <Button colorScheme="green" onClick={applyPatch} isDisabled={applied}>Confirm Apply</Button>}
          {showConfirm && <Button variant="ghost" onClick={() => setShowConfirm(false)} isDisabled={applied}>Cancel</Button>}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
