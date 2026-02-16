
import { useState } from 'react';
import { PresentationAsset } from '../../../../types/assets-ui';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext';

interface UseAssetSelectionProps {
    batchGroupAssets: (ids: string[], label: string) => Promise<boolean>;
    batchUngroupAssets: (ids: string[]) => Promise<boolean>;
}

export const useAssetSelection = ({ batchGroupAssets, batchUngroupAssets }: UseAssetSelectionProps) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const { showConfirm } = useGlobalDialog();

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const newSelection = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            return newSelection;
        });
    };

    const handleSelectAll = (displayAssets: PresentationAsset[]) => {
        if (selectedIds.length === displayAssets.length) {
            setSelectedIds([]); // Deselect all
        } else {
            // Select only REAL assets (not stacks)
            const realIds = displayAssets.filter(a => !a.isStack).map(a => a.id);
            setSelectedIds(realIds);
        }
    };

    const handleBatchGroup = async () => {
        if (selectedIds.length === 0) return;
        
        const groupName = prompt("ตั้งชื่อกลุ่มใหม่ (เช่น จานชุดงานแต่ง):");
        if (groupName && groupName.trim()) {
            const success = await batchGroupAssets(selectedIds, groupName.trim());
            if (success) {
                setSelectedIds([]);
                setIsSelectionMode(false);
            }
        }
    };

    const handleBatchUngroup = async () => {
        if (selectedIds.length === 0) return;
        
        const confirmed = await showConfirm(`ต้องการยกเลิกกลุ่มของ ${selectedIds.length} รายการที่เลือก ใช่หรือไม่?`, 'Ungroup Items');
        if (confirmed) {
            const success = await batchUngroupAssets(selectedIds);
            if (success) {
                setSelectedIds([]);
                setIsSelectionMode(false);
            }
        }
    };

    const clearSelection = () => {
        setSelectedIds([]);
        setIsSelectionMode(false);
    };

    return {
        selectedIds,
        isSelectionMode,
        setIsSelectionMode,
        toggleSelection,
        handleSelectAll,
        handleBatchGroup,
        handleBatchUngroup,
        clearSelection
    };
};
