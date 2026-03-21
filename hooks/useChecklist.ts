
import { useChecklistContext } from '../context/ChecklistContext';

export const useChecklist = () => {
    const context = useChecklistContext();
    
    return {
        checklistPresets: context.checklistPresets,
        activeChecklistItems: context.activeChecklistItems,
        inventoryItems: context.inventoryItems,
        activePresetId: context.activePresetId,
        activePresetName: context.activePresetName,
        
        loadChecklistData: context.loadChecklistData,
        handleToggleChecklist: context.handleToggleChecklist,
        handleAddChecklistItem: context.handleAddChecklistItem,
        handleDeleteChecklistItem: context.handleDeleteChecklistItem,
        handleResetChecklist: context.handleResetChecklist,
        
        handleLoadPreset: context.handleLoadPreset,
        handleAddPreset: context.handleAddPreset,
        handleUpdatePreset: context.handleUpdatePreset,
        handleDeletePreset: context.handleDeletePreset,

        handleAddInventoryItem: context.handleAddInventoryItem,
        handleUpdateInventoryItem: context.handleUpdateInventoryItem,
        handleDeleteInventoryItem: context.handleDeleteInventoryItem
    };
};
