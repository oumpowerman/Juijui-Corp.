import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChecklistItem } from '../types';
import { useMasterData } from '../hooks/useMasterData';
import { useUserSession } from './UserSessionContext';
import { getActiveOrgIdSync } from '../lib/tenantStorage';
import {
    ChecklistContextType,
    SHOOT_SESSION_MASTER_TYPE,
    SHOOT_SESSION_MASTER_KEY,
    SHOOT_ARCHIVE_MASTER_TYPE,
    SHOOT_ROUND_META,
    ShootDateFilterPreset,
    ShootTripQueryParams,
    ShootTripPaginatedResult,
    formatThaiShortDate,
    buildDefaultShootTitle,
    createDefaultShootSession
} from './checklist/types';
import { useChecklistItemsDomain } from './checklist/useChecklistItemsDomain';
import { useShootSessionDomain } from './checklist/useShootSessionDomain';
import { useChecklistPresetsDomain } from './checklist/useChecklistPresetsDomain';
import { useChecklistInventoryActions } from './checklist/useChecklistInventoryActions';

export type {
    ChecklistContextType,
    ShootDateFilterPreset,
    ShootTripQueryParams,
    ShootTripPaginatedResult
};
export {
    SHOOT_SESSION_MASTER_TYPE,
    SHOOT_SESSION_MASTER_KEY,
    SHOOT_ARCHIVE_MASTER_TYPE,
    SHOOT_ROUND_META,
    formatThaiShortDate,
    buildDefaultShootTitle,
    createDefaultShootSession
};

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { masterOptions, inventoryItems } = useMasterData();
    const { currentUserProfile } = useUserSession();
    const queryClient = useQueryClient();

    const [activeOrgId, setActiveOrgId] = useState<string>(() => getActiveOrgIdSync());

    // 1. Active Bag Items Domain
    const {
        rawChecklistItems,
        setRawChecklistItems,
        isActiveLoading,
        refetchActive,
        createChecklistItemActions
    } = useChecklistItemsDomain({
        activeOrgId,
        currentUserProfile
    });

    // 2. Presets Domain (initializes activePresetId / activePresetName)
    // Note: We also pass shoot session handlers via ref/state below
    const [activePresetMeta, setActivePresetMeta] = useState<{
        id: string | null;
        name: string | null;
    }>({ id: null, name: null });

    // Enrich activeChecklistItems with per-item checker attribution from activeShootSession
    const [sessionAttrs, setSessionAttrs] = useState<Record<string, any>>({});

    const activeChecklistItems = useMemo<ChecklistItem[]>(() => {
        const attrs = sessionAttrs || {};
        return rawChecklistItems.map(item => {
            if (!item.isChecked) {
                return item;
            }
            const attr = attrs[item.id] || attrs[`text::${item.text}`];
            if (!attr) return item;
            return {
                ...item,
                checkedBy: attr.checkedBy,
                checkedByName: attr.checkedByName,
                checkedByAvatar: attr.checkedByAvatar,
                checkedByPosition: attr.checkedByPosition,
                checkedAt: attr.checkedAt
            };
        });
    }, [rawChecklistItems, sessionAttrs]);

    // 3. 3-Round Shoot Session & Historical Trip Archive Domain
    const {
        activeShootSession,
        setActiveShootSession,
        shootTripRecords,
        setShootTripRecords,
        isSubmittingRound,
        syncShootSessionToServer,
        refetchSession,
        refetchArchive,
        handleUpdateShootSessionTitle,
        handleSetShootRound,
        handleStartNewShootSession,
        handleSubmitShootRound,
        handleResumeShootTrip,
        handleDeleteShootTripRecord,
        fetchPaginatedShootTrips
    } = useShootSessionDomain({
        activeOrgId,
        activePresetId: activePresetMeta.id,
        activePresetName: activePresetMeta.name,
        rawChecklistItems,
        setRawChecklistItems,
        activeChecklistItems,
        masterOptions,
        currentUserProfile,
        refetchActive
    });

    useEffect(() => {
        setSessionAttrs(activeShootSession?.itemAttributions || {});
    }, [activeShootSession?.itemAttributions]);

    // 4. Checklist Presets Domain
    const {
        checklistPresets,
        setChecklistPresets,
        activePresetId,
        activePresetName,
        isPresetsLoading,
        refetchPresets,
        handleLoadPreset,
        handleAddPreset,
        handleUpdatePreset,
        handleDeletePreset
    } = useChecklistPresetsDomain({
        activeOrgId,
        masterOptions,
        inventoryItems,
        rawChecklistItems,
        setRawChecklistItems,
        activeShootSession,
        setActiveShootSession,
        syncShootSessionToServer,
        refetchActive
    });

    useEffect(() => {
        setActivePresetMeta({ id: activePresetId, name: activePresetName });
    }, [activePresetId, activePresetName]);

    // 5. Inventory CRUD Actions Domain
    const {
        handleAddInventoryItem,
        handleUpdateInventoryItem,
        handleDeleteInventoryItem
    } = useChecklistInventoryActions();

    // 6. Bind Item Actions to Current Shoot Session
    const {
        handleToggleChecklist,
        handleAddChecklistItem,
        handleDeleteChecklistItem,
        handleResetChecklist
    } = useMemo(
        () =>
            createChecklistItemActions(
                activeShootSession,
                setActiveShootSession,
                syncShootSessionToServer
            ),
        [
            createChecklistItemActions,
            activeShootSession,
            setActiveShootSession,
            syncShootSessionToServer
        ]
    );

    // 7. Workspace Switch Listener (Multi-Tenant Isolation)
    useEffect(() => {
        const handleWorkspaceSwitch = (e: Event) => {
            const customEvent = e as CustomEvent<{ orgId?: string }>;
            const nextOrgId = customEvent.detail?.orgId || getActiveOrgIdSync();
            setActiveOrgId(nextOrgId);
            setRawChecklistItems([]);
            setChecklistPresets([]);
            setActiveShootSession(createDefaultShootSession());
            setShootTripRecords([]);
            queryClient.invalidateQueries({ queryKey: ['active_checklist_items'] });
            queryClient.invalidateQueries({ queryKey: ['checklist_presets_db'] });
            queryClient.invalidateQueries({ queryKey: ['shoot_checklist_session'] });
            queryClient.invalidateQueries({ queryKey: ['shoot_trip_archive'] });
            queryClient.invalidateQueries({ queryKey: ['shoot_trip_paginated'] });
        };
        window.addEventListener('org-workspace-switched', handleWorkspaceSwitch);
        return () => window.removeEventListener('org-workspace-switched', handleWorkspaceSwitch);
    }, [
        queryClient,
        setActiveShootSession,
        setChecklistPresets,
        setRawChecklistItems,
        setShootTripRecords
    ]);

    const isLoading = isActiveLoading || isPresetsLoading;

    const loadChecklistData = useCallback(async () => {
        await Promise.all([
            refetchActive(),
            refetchPresets(),
            refetchSession(),
            refetchArchive()
        ]);
    }, [refetchActive, refetchPresets, refetchSession, refetchArchive]);

    const value = useMemo<ChecklistContextType>(
        () => ({
            activeChecklistItems,
            checklistPresets,
            activePresetId,
            activePresetName,
            inventoryItems,
            isLoading,
            activeShootSession,
            shootTripRecords,
            isSubmittingRound,
            loadChecklistData,
            handleToggleChecklist,
            handleAddChecklistItem,
            handleDeleteChecklistItem,
            handleResetChecklist,
            handleLoadPreset,
            handleAddPreset,
            handleUpdatePreset,
            handleDeletePreset,
            handleAddInventoryItem,
            handleUpdateInventoryItem,
            handleDeleteInventoryItem,
            handleUpdateShootSessionTitle,
            handleSetShootRound,
            handleSubmitShootRound,
            handleStartNewShootSession,
            handleResumeShootTrip,
            handleDeleteShootTripRecord,
            fetchPaginatedShootTrips
        }),
        [
            activeChecklistItems,
            checklistPresets,
            activePresetId,
            activePresetName,
            inventoryItems,
            isLoading,
            activeShootSession,
            shootTripRecords,
            isSubmittingRound,
            loadChecklistData,
            handleToggleChecklist,
            handleAddChecklistItem,
            handleDeleteChecklistItem,
            handleResetChecklist,
            handleLoadPreset,
            handleAddPreset,
            handleUpdatePreset,
            handleDeletePreset,
            handleAddInventoryItem,
            handleUpdateInventoryItem,
            handleDeleteInventoryItem,
            handleUpdateShootSessionTitle,
            handleSetShootRound,
            handleSubmitShootRound,
            handleStartNewShootSession,
            handleResumeShootTrip,
            handleDeleteShootTripRecord,
            fetchPaginatedShootTrips
        ]
    );

    return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
};

export const useChecklistContext = () => {
    const context = useContext(ChecklistContext);
    if (context === undefined) {
        throw new Error('useChecklistContext must be used within a ChecklistProvider');
    }
    return context;
};
