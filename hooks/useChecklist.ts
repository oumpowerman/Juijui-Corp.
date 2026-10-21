import { useChecklistContext } from '../context/ChecklistContext';

export const useChecklist = () => {
    const context = useChecklistContext();

    return {
        checklistPresets: context.checklistPresets,
        activeChecklistItems: context.activeChecklistItems,
        inventoryItems: context.inventoryItems,
        activePresetId: context.activePresetId,
        activePresetName: context.activePresetName,

        activeShootSession: context.activeShootSession,
        shootTripRecords: context.shootTripRecords,
        isSubmittingRound: context.isSubmittingRound,

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
        handleDeleteInventoryItem: context.handleDeleteInventoryItem,

        handleUpdateShootSessionTitle: context.handleUpdateShootSessionTitle,
        handleSetShootRound: context.handleSetShootRound,
        handleSubmitShootRound: context.handleSubmitShootRound,
        handleStartNewShootSession: context.handleStartNewShootSession,
        handleResumeShootTrip: context.handleResumeShootTrip,
        handleDeleteShootTripRecord: context.handleDeleteShootTripRecord,
        fetchPaginatedShootTrips: context.fetchPaginatedShootTrips
    };
};
