import React, { useMemo, useState, useEffect } from 'react';
import { useBudgetStore } from '../state/budgetStore';
import {
  Box, Heading, Table, Thead, Tr, Th, Tbody, Td, Badge, HStack, Text, Tooltip,
  Button, Checkbox, Flex, Input, Select, IconButton, useToast, Divider, Spacer
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { DownloadIcon, RepeatIcon } from '@chakra-ui/icons';
// Runtime computation centralized in store (getImportSessionRuntime)

function StatusBadge({ status }) {
  switch (status) {
    case 'active': return <Badge colorScheme='yellow'>Active</Badge>;
    case 'expired': return <Badge colorScheme='gray'>Expired</Badge>;
    case 'applied': return <Badge colorScheme='teal'>Applied</Badge>;
    case 'partial-applied': return <Badge colorScheme='purple'>Partial Applied</Badge>;
    case 'undone': return <Badge colorScheme='red'>Undone</Badge>;
    case 'partial-undone': return <Badge colorScheme='orange'>Partial Undone</Badge>;
    default: return <Badge>?</Badge>;
  }
}

export default function ImportHistoryPage() {
  const importHistory = useBudgetStore(s => s.importHistory);
  const accounts = useBudgetStore(s => s.accounts);
  // undo window minutes available if needed, but not directly used here
  const getImportSessionRuntime = useBudgetStore(s => s.getImportSessionRuntime);
  const undoStagedImport = useBudgetStore(s => s.undoStagedImport);
  const markTransactionsBudgetApplied = useBudgetStore(s => s.markTransactionsBudgetApplied);
  const processPendingSavingsForAccount = useBudgetStore(s => s.processPendingSavingsForAccount);
  const toast = useToast();

  const [filterAccount, setFilterAccount] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState({}); // sessionId -> bool
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // We intentionally include nowTick to force a periodic refresh (every minute) of runtime-derived fields
  // like status (active -> expired) without extra logic; it's used as a time invalidation key.
  const rows = useMemo(() => {
    return importHistory.map(entry => {
      const runtime = getImportSessionRuntime(entry.accountNumber, entry.sessionId) || { stagedNow:0, appliedCount:0, removed:0, status:'?', canUndo:false };
      return { entry, runtime };
    }).filter(r => {
      if (filterAccount && r.entry.accountNumber !== filterAccount) return false;
      if (filterStatus && r.runtime.status !== filterStatus) return false;
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- nowTick is a deliberate time invalidation key
  }, [importHistory, filterAccount, filterStatus, nowTick, getImportSessionRuntime]);

  const anySelected = Object.values(selected).some(v => v);
  const selectedEntries = rows.filter(r => selected[r.entry.sessionId]);

  const selectByStatus = (status) => {
    const next = { ...selected };
    rows.forEach(r => { if (r.runtime.status === status) next[r.entry.sessionId] = true; });
    setSelected(next);
  };

  const clearSelection = () => setSelected({});

  const toggleAllVisible = (checked) => {
    const next = { ...selected };
    rows.forEach(r => { next[r.entry.sessionId] = checked; });
    setSelected(next);
  };

  const doUndoSelected = () => {
    const undone = [];
    selectedEntries.forEach(({ entry, runtime }) => {
      if (runtime.canUndo) {
        undoStagedImport(entry.accountNumber, entry.sessionId);
        undone.push(entry.sessionId);
      }
    });
    toast({ title: 'Undo complete', description: `${undone.length} session(s) undone`, status: 'info', duration: 3000 });
  };

  const doApplySelected = () => {
    let appliedSessions = 0;
    selectedEntries.forEach(({ entry, runtime }) => {
      if (runtime.status === 'active' && runtime.stagedNow > 0) {
        const acct = accounts[entry.accountNumber];
        if (!acct?.transactions) return;
        const months = new Set();
        acct.transactions.forEach(tx => {
          if (tx.importSessionId === entry.sessionId && tx.staged) {
            months.add(tx.date.slice(0,7));
          }
        });
        if (months.size) {
          markTransactionsBudgetApplied(entry.accountNumber, [...months]);
          processPendingSavingsForAccount(entry.accountNumber, [...months]);
          appliedSessions++;
        }
      }
    });
    toast({ title: 'Apply complete', description: `${appliedSessions} session(s) applied`, status: 'success', duration: 3000 });
  };

  const exportSelected = () => {
    const lines = ['sessionId,account,newCount,staged,applied,removed,savingsCount,importedAt'];
    selectedEntries.forEach(({ entry, runtime }) => {
      lines.push([entry.sessionId, entry.accountNumber, entry.newCount, runtime.stagedNow, runtime.appliedCount, runtime.removed||0, entry.savingsCount||0, entry.importedAt].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-sessions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const accountsList = useMemo(() => Object.keys(accounts), [accounts]);

  return (
    <Box p={6}>
      <Flex mb={4} align="center" gap={4} wrap="wrap">
        <Heading size='md'>Import History</Heading>
        <Spacer />
        <HStack>
          <Select size='sm' placeholder='Account' value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
            {accountsList.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select size='sm' placeholder='Status' value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value='active'>Active</option>
            <option value='expired'>Expired</option>
            <option value='applied'>Applied</option>
            <option value='partial-applied'>Partial Applied</option>
            <option value='undone'>Undone</option>
            <option value='partial-undone'>Partial Undone</option>
          </Select>
          <IconButton size='sm' aria-label='Refresh' icon={<RepeatIcon />} onClick={() => setNowTick(Date.now())} />
        </HStack>
      </Flex>

      <Flex mb={3} gap={2} wrap='wrap' align='center'>
        {anySelected ? (
          <>
            <Text fontSize='sm'>{selectedEntries.length} selected</Text>
            <Button size='xs' onClick={doUndoSelected} colorScheme='red' variant='outline'>Undo</Button>
            <Button size='xs' onClick={doApplySelected} colorScheme='teal' variant='outline'>Apply</Button>
            <Button size='xs' onClick={() => { doUndoSelected(); doApplySelected(); }} variant='outline'>Smart Resolve</Button>
            <Button size='xs' onClick={exportSelected} leftIcon={<DownloadIcon />} variant='outline'>Export CSV</Button>
            <Button size='xs' onClick={clearSelection}>Clear</Button>
          </>
        ) : (
          <HStack spacing={2}>
            <Text fontSize='xs' color='gray.500'>Quick Select:</Text>
            <Button size='xs' variant='ghost' onClick={() => selectByStatus('active')}>Active</Button>
            <Button size='xs' variant='ghost' onClick={() => selectByStatus('expired')}>Expired</Button>
            <Button size='xs' variant='ghost' onClick={() => selectByStatus('undone')}>Undone</Button>
            <Button size='xs' variant='ghost' onClick={() => selectByStatus('partial-applied')}>Partial Applied</Button>
            <Button size='xs' variant='ghost' onClick={() => selectByStatus('partial-undone')}>Partial Undone</Button>
          </HStack>
        )}
      </Flex>

      <Box borderWidth={1} borderRadius='md' overflowX='auto'>
        <Table size='sm' variant='striped'>
          <Thead>
            <Tr>
              <Th><Checkbox isChecked={rows.length>0 && rows.every(r => selected[r.entry.sessionId])} onChange={e => toggleAllVisible(e.target.checked)} /></Th>
              <Th>Session</Th>
              <Th>Account</Th>
              <Th>Imported</Th>
              <Th>New</Th>
              <Th>Staged</Th>
              <Th>Applied</Th>
              <Th>Removed</Th>
              <Th>Savings</Th>
              <Th>Status</Th>
              <Th>Undo In</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rows.map(({ entry, runtime }) => {
              const minutesLeft = runtime.expiresAt ? Math.max(0, Math.ceil((runtime.expiresAt - Date.now())/60000)) : 0;
              return (
                <Tr key={entry.sessionId}>
                  <Td><Checkbox isChecked={!!selected[entry.sessionId]} onChange={e => setSelected(s => ({ ...s, [entry.sessionId]: e.target.checked }))} /></Td>
                  <Td title={entry.hash}>{entry.sessionId.slice(0,8)}</Td>
                  <Td>{entry.accountNumber}</Td>
                  <Td><Tooltip label={entry.importedAt}>{dayjs(entry.importedAt).fromNow?.() || dayjs(entry.importedAt).format('MMM D HH:mm')}</Tooltip></Td>
                  <Td>{entry.newCount}</Td>
                  <Td>{runtime.stagedNow}</Td>
                  <Td>{runtime.appliedCount}</Td>
                  <Td>{runtime.removed || 0}</Td>
                  <Td>{entry.savingsCount || 0}</Td>
                  <Td><StatusBadge status={runtime.status} /></Td>
                  <Td>{runtime.status==='active' ? (minutesLeft + 'm') : '-'}</Td>
                  <Td>
                    <HStack spacing={1}>
                      <Button size='xs' variant='outline' isDisabled={!runtime.canUndo} onClick={() => { if(runtime.canUndo){ undoStagedImport(entry.accountNumber, entry.sessionId); toast({ title: 'Session undone', status: 'info'});} }}>Undo</Button>
                      <Button size='xs' variant='outline' isDisabled={!(runtime.status==='active' && runtime.stagedNow>0)} onClick={() => {
                        // apply
                        const acct = accounts[entry.accountNumber];
                        if (!acct?.transactions) return;
                        const months = new Set();
                        acct.transactions.forEach(tx => { if(tx.importSessionId===entry.sessionId && tx.staged){ months.add(tx.date.slice(0,7)); }});
                        markTransactionsBudgetApplied(entry.accountNumber, [...months]);
                        processPendingSavingsForAccount(entry.accountNumber, [...months]);
                        toast({ title: 'Session applied', status: 'success'});
                      }}>Apply</Button>
                    </HStack>
                  </Td>
                </Tr>
              );
            })}
            {rows.length === 0 && (
              <Tr><Td colSpan={12}><Text fontSize='sm' color='gray.500' textAlign='center' py={6}>No import sessions match filters.</Text></Td></Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
