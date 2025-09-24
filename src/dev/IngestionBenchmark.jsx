import React, { useState, useEffect } from 'react';
import {
  Box, Flex, SimpleGrid, Input, Button, Checkbox, Text, Heading,
  HStack, VStack, Divider, Badge, IconButton, Collapse, useToast, Tooltip
} from '@chakra-ui/react';
import { DownloadIcon, RepeatIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon } from '@chakra-ui/icons';
import { runIngestion } from '../ingest/runIngestion.js';
// (Store import removed for this standalone dev helper)

/**
 * IngestionBenchmark (Dev Helper)
 *
 * Goals:
 *  - Generate synthetic CSV data at various sizes (e.g. 1k / 5k / 10k rows)
 *  - Control intra-file duplicate fraction and pre-existing duplicate fraction
 *  - Run ingestion (parse + process) and capture timing + per-stage timings + throughput + dup ratios
 *  - Repeat N times to approximate warm/cold variability and compute simple stats (avg / min / max)
 *  - Export results JSON for historical comparisons
 *
 * Not mounted by default; import in a dev-only route or temporary panel when needed.
 */
export default function IngestionBenchmark({ onRequestClose }) {
  const [sizesInput, setSizesInput] = useState('1000,5000,10000');
  const [intraDupFrac, setIntraDupFrac] = useState(0.1); // 10% duplicates inside file
  const [existingDupFrac, setExistingDupFrac] = useState(0.05); // 5% appear as existing
  const [iterations, setIterations] = useState(2);
  const [seedLabel, setSeedLabel] = useState('BENCH');
  const [results, setResults] = useState([]); // each: { size, iteration, metrics }
  const [running, setRunning] = useState(false);
  const [streamSim, setStreamSim] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [baselineSnapshots, setBaselineSnapshots] = useState([]); // stored exported baselines (in-memory + persisted)
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [diffResult, setDiffResult] = useState(null); // { size: { metric: { a, b, deltaPct } } }
  const BASELINE_STORAGE_KEY = 'ingestionBaselineSnapshots';

  // Load persisted baselines once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setBaselineSnapshots(parsed);
      }
    } catch {/* ignore */}
  }, []);

  // Helper to persist baselines whenever they change
  function persistBaselines(next) {
    try {
      localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(next));
    } catch {/* ignore */}
  }

  function computeDiff() {
    try {
      const a = baselineSnapshots.find(s => s.at === compareA);
      const b = baselineSnapshots.find(s => s.at === compareB);
      if (!a || !b) { setDiffResult(null); return; }
      const sizes = new Set([...Object.keys(a.sizes||{}), ...Object.keys(b.sizes||{})]);
      const metrics = ['wallMs','ingestMs','processMs','rowsPerSec','duplicatesRatio'];
      const diff = {};
      sizes.forEach(sz => {
        diff[sz] = {};
        metrics.forEach(m => {
          const va = a.sizes[sz]?.[m];
          const vb = b.sizes[sz]?.[m];
          if (va === undefined && vb === undefined) return;
            const deltaPct = (va !== undefined && vb !== undefined && va !== 0)
              ? +(((vb - va)/va)*100).toFixed(2)
              : null;
          diff[sz][m] = { a: va, b: vb, deltaPct };
        });
      });
      setDiffResult(diff);
    } catch { setDiffResult(null); }
  }
  const toast = useToast();

  // Reset all benchmark configuration & results
  function resetAll() {
    if (running) return;
    setSizesInput('1000,5000,10000');
    setIntraDupFrac(0.1);
    setExistingDupFrac(0.05);
    setIterations(2);
    setSeedLabel('BENCH');
    setResults([]);
    setStreamSim(false);
    toast({ title: 'Benchmark settings reset', status: 'info', duration: 1800 });
  }

  // --- NEW: container styles & layout helpers ---
  const PanelHeader = (
    <Flex
      px={4}
      py={2}
      align="center"
      justify="space-between"
      bg="gray.400"
      borderBottom="1px solid"
      borderColor="gray.800"
    >
      <HStack spacing={3}>
        <Heading size="xs" letterSpacing="wider" color="gray.800">Ingestion Benchmark (Dev)</Heading>
        {running && <Badge colorScheme="purple">RUNNING</Badge>}
        {!running && results.length > 0 && <Badge colorScheme="teal">DONE</Badge>}
      </HStack>
      <HStack spacing={1}>
        <Tooltip label={collapsed ? 'Expand panel' : 'Collapse panel'}>
          <IconButton
            aria-label="collapse"
            size="xs"
            variant="ghost"
            colorScheme="purple"
            icon={collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={() => setCollapsed(c => !c)}
          />
        </Tooltip>
        <Tooltip label="Close benchmark panel">
          <IconButton
            aria-label="close"
            size="xs"
            variant="ghost"
            colorScheme="red"
            icon={<CloseIcon boxSize={2} />}
            onClick={() => {
              onRequestClose?.();
            }}
          />
        </Tooltip>
      </HStack>
    </Flex>
  );

  function generateCsv(size, intraDupFrac) {
    const uniqueCount = Math.max(1, Math.floor(size * (1 - intraDupFrac)));
    const dupCount = size - uniqueCount;
    const header = 'date,description,amount';
    const baseLines = [];
    for (let i = 0; i < uniqueCount; i++) {
      const day = ((i % 28) + 1).toString().padStart(2, '0');
      const date = `2025-01-${day}`;
      // Keep some descriptions repeating to exercise consensus & potential future vendor grouping
      const desc = `Test Vendor ${(i % 200).toString().padStart(3,'0')}`;
      // Ensure some values repeat exactly to produce duplicates when sampled later
      const amountBase = (i % 500) + 1; // 1..500
      const signed = (i % 2 === 0 ? 1 : -1) * amountBase;
      baseLines.push(`${date},${desc},${signed.toFixed(2)}`);
    }
    // Duplicate lines sampled uniformly from base
    const dupLines = [];
    for (let d = 0; d < dupCount; d++) {
      const ref = baseLines[d % baseLines.length];
      dupLines.push(ref); // exact duplicate (intra-file)
    }
    const all = baseLines.concat(dupLines);
    // Shuffle lightly so duplicates not strictly grouped
    for (let i = all.length - 1; i > 0; i--) {
      const j = (i * 9301 + 49297) % 233280 % (i + 1); // deterministic-ish pseudo
      [all[i], all[j]] = [all[j], all[i]];
    }
    return header + '\n' + all.join('\n');
  }

  function buildExistingTxns(csvText, existingFraction) {
    if (existingFraction <= 0) return [];
    const lines = csvText.split(/\n/).slice(1); // drop header
    const existingCount = Math.floor(lines.length * existingFraction);
    const subset = lines.slice(0, existingCount);
    // Minimal normalization mimic (we only need enough fields for buildTxKey in runIngestion duplicate detection)
    return subset.map((line, idx) => {
      const [date, description, amountStr] = line.split(',');
      const amount = Math.abs(Number(amountStr));
      const rawAmount = Number(amountStr);
      return {
        id: `existing-${idx}-${date}-${description}`,
        date,
        description,
        amount,
        rawAmount,
        type: rawAmount >= 0 ? 'income' : 'expense',
        category: undefined,
      };
    });
  }

  async function runBenchmark() {
    if (running) return;
    setResults([]);
    setRunning(true);
    try {
      const sizes = sizesInput.split(',').map(s => parseInt(s.trim(), 10)).filter(n => n > 0);
      const newResults = [];
      for (const size of sizes) {
        // Generate once per size; reuse csv text per iteration for determinism
        const csv = generateCsv(size, intraDupFrac);
        const existingTxns = buildExistingTxns(csv, existingDupFrac);
        for (let iter = 1; iter <= iterations; iter++) {
          const wallStart = performance.now();
          let ingestionResult;
          if (streamSim) {
            // Simulate streaming by pre-parsing rows quickly (simple parse) to bypass internal parse cost
            const rows = csv.split(/\n/).slice(1).map((l, i) => {
              const [date, description, amountStr] = l.split(',');
              return { date, description, amount: amountStr, __line: i + 2 };
            });
            ingestionResult = await runIngestion({
              parsedRows: { rows, errors: [] },
              accountNumber: seedLabel,
              existingTxns,
              registerManifest: () => {},
            });
          } else {
            ingestionResult = await runIngestion({
              fileText: csv,
              accountNumber: seedLabel,
              existingTxns,
              registerManifest: () => {},
            });
          }
          const wallEnd = performance.now();
          newResults.push({
            id: `${size}-${iter}-${Date.now()}`,
            size,
            iteration: iter,
            wallMs: +(wallEnd - wallStart).toFixed(2),
            ingestMs: ingestionResult.stats.ingestMs,        // <--- added
            processMs: ingestionResult.stats.processMs,      // <--- added
            rowsPerSec: ingestionResult.stats.rowsPerSec,
            duplicatesRatio: ingestionResult.stats.duplicatesRatio,
            dupesExisting: ingestionResult.stats.dupesExisting,
            dupesIntraFile: ingestionResult.stats.dupesIntraFile,
            errors: ingestionResult.errors.length,
            streamSim,
            stageTimings: ingestionResult.stats.stageTimings // optional if you want to inspect later
          });
          setResults(r => [...r, ...newResults.slice(-1)]); // incremental update
        }
      }
      toast({ title: 'Benchmark complete', status: 'success', duration: 3000 });
    } catch (e) {
      toast({ title: 'Benchmark failed', description: e.message, status: 'error' });
    } finally {
      setRunning(false);
    }
  }


  function exportJson() {
    try {
      const blob = new Blob([JSON.stringify({
        at: new Date().toISOString(),
        config: { sizesInput, intraDupFrac, existingDupFrac, iterations, streamSim },
        results,
      }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ingestion-benchmark-${Date.now()}.json`;
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
    } catch {/* ignore */}
  }

  // Baseline capture for canonical sizes 5k / 10k / 60k / 100k with current duplicate fractions.
  async function captureBaseline() {
    if (running) return;
    setRunning(true);
    const targetSizes = [5000, 10000, 60000, 100000];
    const snap = { at: new Date().toISOString(), sizes: {}, config: { intraDupFrac, existingDupFrac, streamSim } };
    try {
      for (const size of targetSizes) {
        const csv = generateCsv(size, intraDupFrac);
        const existingTxns = buildExistingTxns(csv, existingDupFrac);
        const wallStart = performance.now();
        const ingestionResult = await runIngestion({
          fileText: csv,
          accountNumber: 'BASELINE',
          existingTxns,
          registerManifest: () => {},
        });
        const wallEnd = performance.now();
        snap.sizes[size] = {
          wallMs: +(wallEnd - wallStart).toFixed(2),
          ingestMs: ingestionResult.stats.ingestMs,
            processMs: ingestionResult.stats.processMs,
          rowsPerSec: ingestionResult.stats.rowsPerSec,
          duplicatesRatio: ingestionResult.stats.duplicatesRatio,
          newCount: ingestionResult.stats.newCount,
          dupesExisting: ingestionResult.stats.dupesExisting,
          dupesIntraFile: ingestionResult.stats.dupesIntraFile,
          earlyShortCircuits: ingestionResult.stats.earlyShortCircuits || null,
        };
      }
      setBaselineSnapshots(prev => {
        const next = [...prev, snap];
        persistBaselines(next);
        return next;
      });
      // auto-download snapshot JSON
      try {
        const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ingestion-baseline-${Date.now()}.json`;
        document.body.appendChild(a); a.click();
        setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
      } catch {/* ignore */}
      toast({ title: 'Baseline captured', status: 'success', duration: 2500 });
    } catch (e) {
      toast({ title: 'Baseline failed', description: e.message, status: 'error' });
    } finally {
      setRunning(false);
    }
  }


  return (
    <Box>
      {PanelHeader}
      <Collapse in={!collapsed} animateOpacity>
        <Box maxH="50vh" overflow="auto" p={4}>
          <VStack align="stretch" spacing={4}>
            {/* Controls */}
            <Box>
              <SimpleGrid
                columns={[1, 2, 3, 6]}
                spacing={3}
                alignItems="flex-start"
                mb={3}
                minChildWidth="150px"
              >
                <Box>
                  <Text fontSize="xs" mb={1} color="gray.900">Sizes (rows CSV)</Text>
                  <Input
                    size="sm"
                    value={sizesInput}
                    onChange={e => setSizesInput(e.target.value)}
                    placeholder="1000,5000,10000"
                    bg="gray.100"
                    _hover={{ bg: 'gray.600' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" mb={1} color="gray.900">Intra Dup Fraction</Text>
                  <Input
                    size="sm"
                    value={intraDupFrac}
                    onChange={e => setIntraDupFrac(e.target.value)}
                    bg="gray.100"
                    _hover={{ bg: 'gray.600' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" mb={1} color="gray.900">Existing Dup Fraction</Text>
                  <Input
                    size="sm"
                    value={existingDupFrac}
                    onChange={e => setExistingDupFrac(e.target.value)}
                    bg="gray.100"
                    _hover={{ bg: 'gray.600' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" mb={1} color="gray.900">Iterations</Text>
                  <Input
                    size="sm"
                    value={iterations}
                    onChange={e => setIterations(e.target.value)}
                    bg="gray.100"
                    _hover={{ bg: 'gray.600' }}
                  />
                </Box>
                <Box>
                  <Text fontSize="xs" mb={1} color="gray.900">Seed Label</Text>
                  <Input
                    size="sm"
                    value={seedLabel}
                    onChange={e => setSeedLabel(e.target.value)}
                    placeholder="BENCH"
                    bg="gray.100"
                    _hover={{ bg: 'gray.600' }}
                  />
                </Box>
                <Flex align="center" pt={5}>
                  <Checkbox
                    isChecked={streamSim}
                    onChange={e => setStreamSim(e.target.checked)}
                    color={streamSim ? 'purple.500' : 'gray.900'}
                    colorScheme="purple"
                    size="md"
                  >
                    Stream Sim
                  </Checkbox>
                </Flex>
              </SimpleGrid>

              <HStack spacing={3} flexWrap="wrap">
                <Button
                  size="sm"
                  colorScheme="purple"
                  onClick={runBenchmark}
                  isDisabled={running}
                >
                  Run
                </Button>
                <Button
                  size="sm"
                  leftIcon={<RepeatIcon />}
                  variant="outline"
                  borderColor={'gray.900'}
                  onClick={resetAll}
                  isDisabled={running}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  leftIcon={<DownloadIcon />}
                  variant="outline"
                  borderColor={'gray.900'}
                  onClick={exportJson}
                  isDisabled={!results.length || running}
                >
                  Export JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor={'gray.900'}
                  onClick={captureBaseline}
                  isDisabled={running}
                >
                  Capture Baseline
                </Button>
                {baselineSnapshots.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor={'gray.900'}
                    onClick={() => {
                      setBaselineSnapshots([]);
                      persistBaselines([]);
                      toast({ title: 'Baselines cleared', status: 'info', duration: 1500 });
                    }}
                    isDisabled={running}
                  >
                    Clear Baselines
                  </Button>
                )}
                <Text fontSize="xs" color="gray.800">
                  Configure and Run synthetic benchmark; results aggregate below.
                </Text>
              </HStack>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Results */}
            <Box>
              <Heading size="xs" mb={2} color="gray.800">Results</Heading>
              {!results.length && !running && (
                <Text fontSize="xs" color="gray.500">No results yet.</Text>
              )}
              <VStack spacing={2} align="stretch">
        {results.map(r => {
          // duplicatesRatio is already percentage (0-100) from ingestion stats
          const dupPct = Math.round(r.duplicatesRatio);
                    return (
                        <Box
                            key={r.id}
                            p={2}
                            bg="gray.700"
                            borderRadius="md"
                            border="1px solid"
                            borderColor="gray.600"
                        >
                            <Flex justify="space-between" flexWrap="wrap" gap={2}>
                            <HStack spacing={2}>
                                <Badge colorScheme="purple">{r.size} rows</Badge>
                                <Badge colorScheme={r.streamSim ? 'yellow' : 'blue'}>
                                {r.streamSim ? 'STREAM-SIM' : 'SYNC'}
                                </Badge>
                                <Badge colorScheme="teal">
                                {r.rowsPerSec.toFixed(1)} r/s
                                </Badge>
                                <Badge colorScheme="pink">
                                    dup {dupPct}%
                                </Badge>
                            </HStack>
                            <HStack spacing={3} fontSize="xs" color="gray.300">
                                <Text>wall {r.wallMs}ms</Text>
                                <Text>ingest {r.ingestMs}ms</Text>
                                <Text>proc {r.processMs}ms</Text>
                                {r.stageTimings?.normalizeMs !== undefined && (
                                  <Tooltip label={`early short-circuits: ${r.earlyShortCircuits?.total || 0}`}> 
                                    <Text>norm {r.stageTimings.normalizeMs.toFixed(1)}ms</Text>
                                  </Tooltip>
                                )}
                            </HStack>
                            </Flex>
                        </Box>
                    );
                } )}
                {baselineSnapshots.length > 0 && (
                  <Box mt={4} p={2} border="1px solid" borderColor="gray.600" borderRadius="md" bg="gray.800">
                    <Heading size="xs" mb={2} color="gray.200">Baselines ({baselineSnapshots.length})</Heading>
                    <VStack spacing={2} align="stretch" maxH="150px" overflow="auto">
                      {baselineSnapshots.map((b,i)=>(
                        <Box key={i} p={2} bg="gray.700" borderRadius="sm">
                          <Text fontSize="xs" color="gray.300">{b.at}</Text>
                          <HStack spacing={2} wrap="wrap" mt={1}>
                            {Object.entries(b.sizes).map(([sz, val]) => (
                              <Tooltip key={sz} label={`dup ${val.duplicatesRatio}% rows/s ${val.rowsPerSec}`}> 
                                <Badge colorScheme="purple">{sz}r {val.wallMs}ms</Badge>
                              </Tooltip>
                            ))}
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                    {baselineSnapshots.length >= 2 && (
                      <Box mt={3} p={2} border="1px solid" borderColor="gray.600" borderRadius="sm" bg="gray.700">
                        <HStack spacing={2} mb={2} align="flex-end" wrap="wrap">
                          <Box>
                            <Text fontSize="8px" color="gray.300" mb={1}>Snapshot A</Text>
                            <select value={compareA} onChange={e=>setCompareA(e.target.value)} style={{ fontSize:'0.65rem' }}>
                              <option value="">--</option>
                              {baselineSnapshots.map(b=> <option key={b.at} value={b.at}>{b.at}</option>)}
                            </select>
                          </Box>
                          <Box>
                            <Text fontSize="8px" color="gray.300" mb={1}>Snapshot B</Text>
                            <select value={compareB} onChange={e=>setCompareB(e.target.value)} style={{ fontSize:'0.65rem' }}>
                              <option value="">--</option>
                              {baselineSnapshots.map(b=> <option key={b.at} value={b.at}>{b.at}</option>)}
                            </select>
                          </Box>
                          <Button size="xs" variant="outline" colorScheme="purple" onClick={computeDiff} isDisabled={!compareA || !compareB}>Diff</Button>
                        </HStack>
                        {diffResult && (
                          <Box maxH="140px" overflow="auto" fontFamily="mono" fontSize="9px">
                            {Object.entries(diffResult).sort((a,b)=>Number(a[0])-Number(b[0])).map(([sz, metrics]) => (
                              <Box key={sz} mb={2}>
                                <Text fontWeight="bold" color="purple.200">{sz} rows</Text>
                                {Object.entries(metrics).map(([m, vals]) => {
                                  if (!vals) return null;
                                  return (
                                    <Text key={m} color={vals.deltaPct!=null ? (vals.deltaPct < 0 ? 'green.300':'red.300') : 'gray.300'}>
                                      {m}: {vals.a ?? '—'} → {vals.b ?? '—'} {vals.deltaPct!=null ? `(${vals.deltaPct > 0 ? '+' : ''}${vals.deltaPct}%)` : ''}
                                    </Text>
                                  );
                                })}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}
