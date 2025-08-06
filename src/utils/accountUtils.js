import React, { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useBudgetStore } from '../state/budgetStore';

export function importCsvData(data) {
    const addSyncedAccount = useBudgetStore((s) => s.addSyncedAccount);
    const accountMappings = useBudgetStore((s) => s.accountMappings);
    const toast = useToast();

    const rows = data.map((row) => ({
        id: crypto.randomUUID(),
        date: row['Posted Date'] || new Date().toISOString().slice(0, 10),
        name: row['Description'] || 'Unnamed',
        description: row['Description'] || 'Unnamed',
        amount: parseFloat(row['Amount'] || 0),
        type: parseFloat(row['Amount']) >= 0 ? 'income' : 'expense',
        category: row['Category'] || undefined,
        accountNumber: row['AccountNumber']?.trim(),
        institution:
            accountMappings?.[row['AccountNumber']?.trim()]?.institution || undefined,
    }));

    addSyncedAccount({
        name: csvFile.name.replace('.csv', ''),
        source: 'csv',
        fileName: csvFile.name,
        transactions: rows,
    });

    toast({
        title: `Imported ${rows.length} transactions from CSV`,
        status: 'success',
        duration: 4000,
    });
    onClose();
    setCsvFile(null); // reset
}

export function formatDate(dateString, format = 'shortMonth') {
    let newDate;

    if (format === 'shortMonth') {
        const [year, month, day] = dateString.split('-');
        const date = new Date(+year, +month - 1, +day);
        newDate = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: '2-digit',
        })
            .format(date)
            .replace(',', '-');
    } else if (format === 'longMonth') {
        const [year, month] = dateString.split('-');
        const date = new Date(`${year}-${month}-01T12:00:00`);
        newDate = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
    } else if (format === 'year') {
        const [year, month] = dateString.split('-');
        const date = new Date(`${year}-${month}-01T12:00:00`);
        newDate = new Intl.DateTimeFormat('en-US', { year: 'numeric' }).format(date);
    }
    return newDate;
}

export function extractVendorDescription(raw) {
    if (!raw) return 'Unknown';

    // Match date in MM/DD/YY or MM-DD-YY format (with optional spaces)
    const regex = /(\d{2}[\/\-]\d{2}[\/\-]\d{2})\s+(.+)/;
    const match = raw.match(regex);

    if (match && match[2]) {
        return match[2].trim(); // Everything after the date
    }

    // Still couldn't find a match — fallback: just return original
    return raw.trim();
}
