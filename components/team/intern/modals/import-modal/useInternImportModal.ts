import { useState, useMemo, useEffect } from 'react';
import { 
    InternImportValidationResult, 
    ParsedInternItemPreview 
} from '../../../../../services/internImportValidator';
import { revalidateInternItem } from './revalidateInternItem';

export type ImportViewFilter = 'ALL' | 'VALID' | 'WARNING' | 'ERROR';

interface UseInternImportModalProps {
    validationResult: InternImportValidationResult | null;
    isSubmitting: boolean;
    baseYear?: number;
}

export const useInternImportModal = ({
    validationResult,
    isSubmitting,
    baseYear = new Date().getFullYear()
}: UseInternImportModalProps) => {
    const [viewFilter, setViewFilter] = useState<ImportViewFilter>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [skipErrorRows, setSkipErrorRows] = useState(true);
    const [items, setItems] = useState<ParsedInternItemPreview[]>([]);
    const [editingItem, setEditingItem] = useState<ParsedInternItemPreview | null>(null);

    // Synchronize local items when new validationResult arrives
    useEffect(() => {
        if (validationResult?.items) {
            setItems(validationResult.items);
            // Default skipErrorRows to true if errors exist, false otherwise
            setSkipErrorRows(validationResult.errorRowsCount > 0);
        } else {
            setItems([]);
        }
    }, [validationResult]);

    // Recalculate dynamic counts
    const counts = useMemo(() => {
        let valid = 0;
        let warning = 0;
        let error = 0;

        for (const item of items) {
            if (!item.isValid) {
                error++;
            } else if (item.warnings.length > 0) {
                warning++;
            } else {
                valid++;
            }
        }

        return {
            total: items.length,
            valid,
            warning,
            error
        };
    }, [items]);

    // Filter items based on active filter and search query
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            // Filter by Status Tab
            if (viewFilter === 'VALID' && (!item.isValid || item.warnings.length > 0)) return false;
            if (viewFilter === 'WARNING' && (!item.isValid || item.warnings.length === 0)) return false;
            if (viewFilter === 'ERROR' && item.isValid) return false;

            // Search Filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = item.fullName.toLowerCase().includes(q);
                const matchNick = item.nickname.toLowerCase().includes(q);
                const matchPos = item.position.toLowerCase().includes(q);
                const matchUni = item.university.toLowerCase().includes(q);
                const matchEmail = item.email.toLowerCase().includes(q);
                const matchPhone = item.phoneNumber.includes(q);
                return matchName || matchNick || matchPos || matchUni || matchEmail || matchPhone;
            }

            return true;
        });
    }, [items, viewFilter, searchQuery]);

    // Eligible items to import
    const importableItems = useMemo(() => {
        if (skipErrorRows) {
            return items.filter(item => item.isValid);
        }
        // If not skipping errors, all items must be valid
        return items.every(item => item.isValid) ? items : [];
    }, [items, skipErrorRows]);

    const canSubmit = useMemo(() => {
        if (isSubmitting || items.length === 0) return false;
        if (skipErrorRows) {
            return importableItems.length > 0;
        }
        return counts.error === 0 && items.length > 0;
    }, [isSubmitting, items, skipErrorRows, importableItems.length, counts.error]);

    // Update single item on-the-fly and revalidate
    const handleUpdateItem = (updated: ParsedInternItemPreview) => {
        const revalidated = revalidateInternItem(updated, updated, baseYear);
        setItems(prev => prev.map(item => (item.index === updated.index ? revalidated : item)));
        setEditingItem(null);
    };

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
        counts,
        canSubmit,
        editingItem,
        setEditingItem,
        handleUpdateItem
    };
};
