import React from 'react';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid, Progress, Heading, HStack, Tag, Tooltip } from '@chakra-ui/react';

// Expect an object like metrics = { ingestMs, parseMs, processMs, totalMs, rowsProcessed, rowsPerSec, duplicatesRatio }
// Provide graceful fallback if metrics is missing.
export default function IngestionMetricsPanel({ metrics, sessionId }) {
  if (!metrics) return null;
  const { ingestMs, parseMs, processMs, totalMs, rowsProcessed, rowsPerSec, duplicatesRatio, stageTimings, earlyShortCircuits } = metrics;
  const derivePct = (part) => {
    if (!ingestMs) return 0;
    return Math.min(100, Math.round(((part || 0) / ingestMs) * 100));
  };
  const stages = stageTimings ? [
    ['Normalize', stageTimings.normalizeMs, 'gray'],
    ['Classify', stageTimings.classifyMs, 'blue'],
    ['Infer', stageTimings.inferMs, 'purple'],
    ['Key', stageTimings.keyMs, 'cyan'],
    ['Dedupe', stageTimings.dedupeMs, 'orange'],
    ['Consensus', stageTimings.consensusMs, 'teal'],
  ] : [];
  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.700' }} fontSize="sm">
      <HStack mb={2} justify="space-between">
        <Heading as="h3" size="sm">Ingestion Timing</Heading>
        {sessionId && <Tag size="sm" colorScheme="blue">{sessionId.slice(0,8)}</Tag>}
      </HStack>
  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={3}>
        <Stat>
          <StatLabel>Total (UI)</StatLabel>
          <StatNumber fontSize="md">{totalMs ? totalMs.toFixed(0) : '—'} ms</StatNumber>
          <StatHelpText>Modal open ➜ done</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Parse</StatLabel>
          <StatNumber fontSize="md">{parseMs ? parseMs.toFixed(0) : '—'} ms</StatNumber>
          <StatHelpText>{derivePct(parseMs)}%</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Process</StatLabel>
          <StatNumber fontSize="md">{processMs ? processMs.toFixed(0) : '—'} ms</StatNumber>
          <StatHelpText>{derivePct(processMs)}%</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Ingest End</StatLabel>
          <StatNumber fontSize="md">{ingestMs ? ingestMs.toFixed(0) : '—'} ms</StatNumber>
          <StatHelpText>loop + consensus</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Rows</StatLabel>
          <StatNumber fontSize="md">{rowsProcessed ?? '—'}</StatNumber>
          <StatHelpText>processed</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Throughput</StatLabel>
          <StatNumber fontSize="md">{rowsPerSec ? rowsPerSec.toLocaleString() : '—'}</StatNumber>
          <StatHelpText>rows/sec</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Dupes Ratio</StatLabel>
          <StatNumber fontSize="md">{duplicatesRatio ? duplicatesRatio.toFixed(1) : '0.0'}%</StatNumber>
          <StatHelpText>existing+intra</StatHelpText>
        </Stat>
        {earlyShortCircuits && (
          <Stat>
            <StatLabel>Early Short-C</StatLabel>
            <StatNumber fontSize="md">{earlyShortCircuits.total}</StatNumber>
            <StatHelpText>{earlyShortCircuits.total ? ((earlyShortCircuits.total / (rowsProcessed || 1))*100).toFixed(1) : '0.0'}%</StatHelpText>
          </Stat>
        )}
      </SimpleGrid>
      <Box>
        <Progress size="xs" value={derivePct(parseMs)} colorScheme="purple" mb={1} />
        <Progress size="xs" value={derivePct(processMs)} colorScheme="teal" mb={1} />
        {stages.length > 0 && (
          <Box>
            {stages.map(([label, ms, color]) => (
              <Tooltip key={label} label={`${label}: ${ms?.toFixed?.(2) || ms || 0} ms (${derivePct(ms)}%)`} hasArrow>
                <Box mb={1}>
                  <Progress size="xs" value={derivePct(ms)} colorScheme={color} />
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
