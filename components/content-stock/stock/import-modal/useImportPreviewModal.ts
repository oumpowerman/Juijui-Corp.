import { useState, useMemo, useEffect } from 'react';
import { StockCSVValidationResult, ParsedStockItemPreview } from '../../../../services/stockImportValidator';
import { Channel, User, MasterOption } from '../../../../types';
import { revalidateStockItem } from './revalidateItem';

export type ImportViewFilter = 'ALL' | 'VALID' | 'WARNING' | 'ERROR';

interface UseImportPreviewModalProps {
    validationResult: StockCSVValidationResult | null;
    isSubmitting: boolean;
    users?: User[];
    channels?: Channel[];
    masterOptions?: MasterOption[];
}

export const useImportPreviewModal = ({
    validationResult,
    isSubmitting,
    users = [],
    channels = [],
    masterOptions = []
}: UseImportPreviewModalProps) => {
    const [viewFilter, setViewFilter] = useState<ImportViewFilter>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [skipErrorRows, setSkipErrorRows] = useState<boolean>(true);
    const [items, setItems] = useState<ParsedStockItemPreview[]>([]);
    const [editingItem, setEditingItem] = useState<ParsedStockItemPreview | null>(null);

    // Synchronize local items when validationResult changes
    useEffect(() => {
        if (validationResult?.items) {
            setItems(validationResult.items);
        } else {
            setItems([]);
        }
    }, [validationResult]);

    // Handle updating a single item (after quick edit in modal)
    const handleUpdateItem = (updatedItem: ParsedStockItemPreview) => {
        const validated = revalidateStockItem(updatedItem, users, channels, masterOptions);
        setItems(prev =>
            prev.map(it => (it.index === validated.index ? validated : it))
        );
    };

    // Filter items based on current view filter and optional search query
    const filteredItems = useMemo(() => {
        if (items.length === 0) return [];

        let result = items;

        // Status tab filter
        if (viewFilter === 'VALID') {
            result = result.filter(item => item.isValid && item.warnings.length === 0);
        } else if (viewFilter === 'WARNING') {
            result = result.filter(item => item.isValid && item.warnings.length > 0);
        } else if (viewFilter === 'ERROR') {
            result = result.filter(item => !item.isValid);
        }

        // Search filter (if query provided)
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            result = result.filter(item => {
                const titleMatch = (item.title || item.rawTitle || '').toLowerCase().includes(q);
                const ideaMatch = (item.idea || '').toLowerCase().includes(q);
                const channelMatch = (item.channelName || item.rawChannelName || '').toLowerCase().includes(q);
                const formatMatch = (item.format || item.rawFormat || '').toLowerCase().includes(q);
                const pillarMatch = (item.pillar || item.rawPillar || '').toLowerCase().includes(q);
                const ownerMatch = (item.ownerNames || []).some(n => n.toLowerCase().includes(q)) || (item.rawOwner || '').toLowerCase().includes(q);
                const editMatch = (item.editorNames || []).some(n => n.toLowerCase().includes(q)) || (item.rawEdit || '').toLowerCase().includes(q);
                const errMatch = (item.errors || []).some(e => e.toLowerCase().includes(q));
                const warnMatch = (item.warnings || []).some(w => w.toLowerCase().includes(q));

                return titleMatch || ideaMatch || channelMatch || formatMatch || pillarMatch || ownerMatch || editMatch || errMatch || warnMatch;
            });
        }

        return result;
    }, [items, viewFilter, searchQuery]);

    // Real-time counts
    const counts = useMemo(() => {
        const total = items.length;
        let valid = 0;
        let warning = 0;
        let error = 0;

        items.forEach(item => {
            if (!item.isValid) {
                error++;
            } else if (item.warnings.length > 0) {
                warning++;
            } else {
                valid++;
            }
        });

        return { total, valid, warning, error };
    }, [items]);

    // Usable valid items to insert into database
    const importableItems = useMemo(() => {
        if (items.length === 0) return [];
        if (skipErrorRows) {
            return items.filter(item => item.isValid);
        }
        // If not skipping errors, all rows must be strictly valid
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
