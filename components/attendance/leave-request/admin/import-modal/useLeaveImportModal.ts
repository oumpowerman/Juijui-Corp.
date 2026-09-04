import { useState, useMemo, useEffect } from 'react';
import {
    LeaveImportValidationResult,
    ParsedLeaveItemPreview
} from '../../../../../services/leaveImportValidator';
import { User } from '../../../../../types';
import { revalidateLeaveItem } from './revalidateLeaveItem';

export type LeaveImportViewFilter = 'ALL' | 'VALID' | 'WARNING' | 'ERROR';

interface UseLeaveImportModalProps {
    validationResult: LeaveImportValidationResult | null;
    isSubmitting: boolean;
    allUsers: User[];
}

export const useLeaveImportModal = ({
    validationResult,
    isSubmitting,
    allUsers
}: UseLeaveImportModalProps) => {
    const [viewFilter, setViewFilter] = useState<LeaveImportViewFilter>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [skipErrorRows, setSkipErrorRows] = useState<boolean>(true);
    const [items, setItems] = useState<ParsedLeaveItemPreview[]>([]);
    const [editingItem, setEditingItem] = useState<ParsedLeaveItemPreview | null>(null);

    // Initialize/Sync items from validationResult
    useEffect(() => {
        if (validationResult?.items) {
            setItems(validationResult.items);
        } else {
            setItems([]);
        }
    }, [validationResult]);

    // Handle Quick Fix update
    const handleUpdateItem = (updatedItem: ParsedLeaveItemPreview) => {
        const validated = revalidateLeaveItem(updatedItem, allUsers);
        setItems(prev =>
            prev.map(it => (it.index === validated.index ? validated : it))
        );
    };

    // Filter items based on tab & search
    const filteredItems = useMemo(() => {
        if (items.length === 0) return [];

        let result = items;

        if (viewFilter === 'VALID') {
            result = result.filter(item => item.isValid && item.warnings.length === 0);
        } else if (viewFilter === 'WARNING') {
            result = result.filter(item => item.isValid && item.warnings.length > 0);
        } else if (viewFilter === 'ERROR') {
            result = result.filter(item => !item.isValid);
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(item => {
                const nameMatch = (item.userName || '').toLowerCase().includes(q);
                const emailMatch = (item.userEmail || item.rawEmail || '').toLowerCase().includes(q);
                const typeMatch = (item.leaveTypeLabel || item.leaveType || item.rawLeaveType || '').toLowerCase().includes(q);
                const reasonMatch = (item.reason || item.rawReason || '').toLowerCase().includes(q);
                const dateMatch = (item.startDate || '').includes(q) || (item.endDate || '').includes(q);
                const errMatch = (item.errors || []).some(e => e.toLowerCase().includes(q));
                const warnMatch = (item.warnings || []).some(w => w.toLowerCase().includes(q));

                return nameMatch || emailMatch || typeMatch || reasonMatch || dateMatch || errMatch || warnMatch;
            });
        }

        return result;
    }, [items, viewFilter, searchQuery]);

    // Real-time Summary Counts
    const counts = useMemo(() => {
        const total = items.length;
        let valid = 0;
        let warning = 0;
        let error = 0;
        let totalDays = 0;
        const employeeIds = new Set<string>();

        items.forEach(item => {
            if (!item.isValid) {
                error++;
            } else if (item.warnings.length > 0) {
                warning++;
                totalDays += item.durationDays;
                if (item.userId) employeeIds.add(item.userId);
            } else {
                valid++;
                totalDays += item.durationDays;
                if (item.userId) employeeIds.add(item.userId);
            }
        });

        return {
            total,
            valid,
            warning,
            error,
            totalDays,
            uniqueEmployees: employeeIds.size
        };
    }, [items]);

    // Usable items for database insertion
    const importableItems = useMemo(() => {
        if (items.length === 0) return [];
        if (skipErrorRows) {
            return items.filter(i => i.isValid);
        }
        return items.every(i => i.isValid) ? items : [];
    }, [items, skipErrorRows]);

    const canSubmit = importableItems.length > 0 && !isSubmitting;

    return {
        viewFilter,
        setViewFilter,
        searchQuery,
        setSearchQuery,
        skipErrorRows,
        setSkipErrorRows,
        items,
        filteredItems,
        importableItems,
        canSubmit,
        counts,
        editingItem,
        setEditingItem,
        handleUpdateItem
    };
};
