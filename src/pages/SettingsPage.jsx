import React, { useState, useEffect } from 'react';
import { useBudgetStore } from '../state/budgetStore';
import { Box, Heading, FormControl, FormLabel, NumberInput, NumberInputField, HStack, Button, VStack, Text, useToast, Badge, StackDivider, Flex, Switch } from '@chakra-ui/react';

export default function SettingsPage() {
  // Subscribe to primitives individually to avoid new object identity every render
  const importUndoWindowMinutes = useBudgetStore(s => s.importUndoWindowMinutes);
  const importHistoryMaxEntries = useBudgetStore(s => s.importHistoryMaxEntries);
  const importHistoryMaxAgeDays = useBudgetStore(s => s.importHistoryMaxAgeDays);
  const stagedAutoExpireDays = useBudgetStore(s => s.stagedAutoExpireDays);
  const streamingAutoLineThreshold = useBudgetStore(s => s.streamingAutoLineThreshold);
  const streamingAutoByteThreshold = useBudgetStore(s => s.streamingAutoByteThreshold);
  const showIngestionBenchmark = useBudgetStore(s => s.showIngestionBenchmark);
  const setShowIngestionBenchmark = useBudgetStore(s => s.setShowIngestionBenchmark);
  const updateImportSettings = useBudgetStore(s => s.updateImportSettings);
  const pruneImportHistory = useBudgetStore(s => s.pruneImportHistory);
  const expireOldStagedTransactions = useBudgetStore(s => s.expireOldStagedTransactions);
  const toast = useToast();
  const [local, setLocal] = useState({
    importUndoWindowMinutes: importUndoWindowMinutes ?? 30,
    importHistoryMaxEntries: importHistoryMaxEntries ?? 30,
    importHistoryMaxAgeDays: importHistoryMaxAgeDays ?? 30,
    stagedAutoExpireDays: stagedAutoExpireDays ?? 30,
    streamingAutoLineThreshold: streamingAutoLineThreshold ?? 3000,
    streamingAutoByteThreshold: streamingAutoByteThreshold ?? 500000,
  });

  // Sync from store if external changes occur (e.g., another tab or reset) without causing loops
  useEffect(() => {
    setLocal(prev => {
      const next = {
        importUndoWindowMinutes: importUndoWindowMinutes ?? prev.importUndoWindowMinutes,
        importHistoryMaxEntries: importHistoryMaxEntries ?? prev.importHistoryMaxEntries,
        importHistoryMaxAgeDays: importHistoryMaxAgeDays ?? prev.importHistoryMaxAgeDays,
        stagedAutoExpireDays: stagedAutoExpireDays ?? prev.stagedAutoExpireDays,
        streamingAutoLineThreshold: streamingAutoLineThreshold ?? prev.streamingAutoLineThreshold,
        streamingAutoByteThreshold: streamingAutoByteThreshold ?? prev.streamingAutoByteThreshold,
      };
      // shallow compare
      const same = Object.keys(next).every(k => next[k] === prev[k]);
      return same ? prev : next;
    });
  }, [importUndoWindowMinutes, importHistoryMaxEntries, importHistoryMaxAgeDays, stagedAutoExpireDays, streamingAutoLineThreshold, streamingAutoByteThreshold]);

  const onChange = (field, _valueString, valueNumber) => {
    if (Number.isNaN(valueNumber)) return;
    setLocal(l => ({ ...l, [field]: valueNumber }));
  };

  const save = () => {
    if (!hasChanges) {
      toast({ title: 'No changes', status: 'info', duration: 1500 });
      return;
    }
    updateImportSettings({ ...local });
    if (importHistoryMaxEntries !== local.importHistoryMaxEntries || importHistoryMaxAgeDays !== local.importHistoryMaxAgeDays) {
      pruneImportHistory();
    }
    if (stagedAutoExpireDays !== local.stagedAutoExpireDays) {
      expireOldStagedTransactions();
    }
    toast({ title: 'Settings saved', status: 'success', duration: 2500 });
  };

  const hasChanges = (
    importUndoWindowMinutes !== local.importUndoWindowMinutes ||
    importHistoryMaxEntries !== local.importHistoryMaxEntries ||
    importHistoryMaxAgeDays !== local.importHistoryMaxAgeDays ||
    stagedAutoExpireDays !== local.stagedAutoExpireDays ||
    streamingAutoLineThreshold !== local.streamingAutoLineThreshold ||
    streamingAutoByteThreshold !== local.streamingAutoByteThreshold
  );

  const policySummary = `Keeps up to ${local.importHistoryMaxEntries} sessions for ${local.importHistoryMaxAgeDays} days (whichever is stricter). Staged transactions auto-apply after ${local.stagedAutoExpireDays} day(s). Undo window: ${local.importUndoWindowMinutes} minute(s).`;
  const streamingSummary = `Auto-stream when > ${local.streamingAutoLineThreshold.toLocaleString()} lines or > ${(local.streamingAutoByteThreshold/1024).toFixed(0)} KB.`;

  return (
    <Box p={6} maxW="700px" mb={20}>
      <Heading size='md' mb={4}>Import & Staging Settings</Heading>
      <Box mb={6} p={3} borderWidth={1} borderRadius='md' bg='gray.50'>
        <Flex wrap='wrap' gap={2} mb={1}>
          <Badge colorScheme='teal'>Undo {local.importUndoWindowMinutes}m</Badge>
          <Badge colorScheme='purple'>History {local.importHistoryMaxEntries} max</Badge>
          <Badge colorScheme='purple'>History {local.importHistoryMaxAgeDays}d age</Badge>
          <Badge colorScheme='orange'>Auto-expire {local.stagedAutoExpireDays}d</Badge>
        </Flex>
        <Text fontSize='xs' color='gray.600'>{policySummary}</Text>
      </Box>
      <VStack align='stretch' spacing={5} divider={<StackDivider />}>
        <FormControl>
          <FormLabel>Undo Window (minutes)</FormLabel>
          <NumberInput min={1} max={720} value={local.importUndoWindowMinutes} onChange={(vs,vn)=>onChange('importUndoWindowMinutes', vs, vn)}>
            <NumberInputField />
          </NumberInput>
          <Text fontSize='xs' color='gray.500'>How long after import sessions can be undone.</Text>
        </FormControl>
        <FormControl>
          <FormLabel>Streaming Auto Line Threshold</FormLabel>
            <NumberInput min={500} max={200000} step={100} value={local.streamingAutoLineThreshold} onChange={(vs,vn)=>onChange('streamingAutoLineThreshold', vs, vn)}>
              <NumberInputField />
            </NumberInput>
            <Text fontSize='xs' color='gray.500'>If a CSV exceeds this many lines, streaming parser auto-enables.</Text>
        </FormControl>
        <FormControl>
          <FormLabel>Streaming Auto Size Threshold (KB)</FormLabel>
            <NumberInput min={50} max={20480} step={50} value={Math.round(local.streamingAutoByteThreshold/1024)} onChange={(vs,vn)=> onChange('streamingAutoByteThreshold', vs, vn*1024)}>
              <NumberInputField />
            </NumberInput>
            <Text fontSize='xs' color='gray.500'>If file size exceeds this value, streaming parser auto-enables.</Text>
        </FormControl>
        <FormControl>
          <FormLabel>Import History Max Entries</FormLabel>
            <NumberInput min={5} max={500} value={local.importHistoryMaxEntries} onChange={(vs,vn)=>onChange('importHistoryMaxEntries', vs, vn)}>
              <NumberInputField />
            </NumberInput>
            <Text fontSize='xs' color='gray.500'>Newest sessions kept; older pruned beyond this count.</Text>
        </FormControl>
        <FormControl>
          <FormLabel>Import History Max Age (days)</FormLabel>
            <NumberInput min={1} max={365} value={local.importHistoryMaxAgeDays} onChange={(vs,vn)=>onChange('importHistoryMaxAgeDays', vs, vn)}>
              <NumberInputField />
            </NumberInput>
            <Text fontSize='xs' color='gray.500'>Sessions older than this may be pruned.</Text>
        </FormControl>
        <FormControl>
          <FormLabel>Auto-Expire Staged Sessions (days)</FormLabel>
            <NumberInput min={1} max={120} value={local.stagedAutoExpireDays} onChange={(vs,vn)=>onChange('stagedAutoExpireDays', vs, vn)}>
              <NumberInputField />
            </NumberInput>
            <Text fontSize='xs' color='gray.500'>Staged transactions auto-applied after this age.</Text>
        </FormControl>
        <HStack spacing={3} flexWrap='wrap'>
          <Button colorScheme='teal' onClick={save} isDisabled={!hasChanges}>Save</Button>
          <Button variant='outline' onClick={()=> setLocal({
            importUndoWindowMinutes: importUndoWindowMinutes ?? 30,
            importHistoryMaxEntries: importHistoryMaxEntries ?? 30,
            importHistoryMaxAgeDays: importHistoryMaxAgeDays ?? 30,
            stagedAutoExpireDays: stagedAutoExpireDays ?? 30,
            streamingAutoLineThreshold: streamingAutoLineThreshold ?? 3000,
            streamingAutoByteThreshold: streamingAutoByteThreshold ?? 500000,
          })}>Reset</Button>
          <Button size='sm' variant='ghost' onClick={() => { pruneImportHistory(); toast({ title: 'History pruned', status: 'success', duration: 1500 }); }}>Prune Now</Button>
          <Button size='sm' variant='ghost' onClick={() => { expireOldStagedTransactions(); toast({ title: 'Expired staged processed', status: 'success', duration: 1500 }); }}>Force Expire</Button>
        </HStack>
      </VStack>
      <Box mt={6} p={3} borderWidth={1} borderRadius='md' bg='purple.50'>
        <Heading size='sm' mb={2}>Streaming Auto-Toggle</Heading>
        <Text fontSize='xs' color='gray.700'>{streamingSummary}</Text>
      </Box>
      {import.meta.env.DEV && (
        <Box mt={6} p={3} borderWidth={1} borderRadius='md' bg='gray.50'>
          <Heading size='sm' mb={2}>Developer / Debug</Heading>
          <HStack justify='space-between'>
            <Text fontSize='sm'>Show Ingestion Benchmark Panel</Text>
            <Switch size='md' isChecked={showIngestionBenchmark} onChange={e=> setShowIngestionBenchmark(e.target.checked)} />
          </HStack>
          <Text fontSize='xs' mt={2} color='gray.500'>Dev-only synthetic ingestion performance harness. Not persisted.</Text>
        </Box>
      )}
    </Box>
  );
}
