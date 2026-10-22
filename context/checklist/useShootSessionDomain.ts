import React from 'react';
import {
    ChecklistItem,
    MasterOption,
    ShootRoundKey,
    ShootTripRecord,
    ActiveShootSessionState,
    User
} from '../../types';
import {
    useActiveShootSession,
    UseActiveShootSessionParams
} from './session/useActiveShootSession';
import {
    useShootTripArchive,
    UseShootTripArchiveParams
} from './session/useShootTripArchive';
import {
    useShootRoundSubmit,
    UseShootRoundSubmitParams
} from './session/useShootRoundSubmit';

export interface UseShootSessionDomainParams {
    activeOrgId: string;
    activePresetId: string | null;
    activePresetName: string | null;
    rawChecklistItems: ChecklistItem[];
    setRawChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
    activeChecklistItems: ChecklistItem[];
    masterOptions: MasterOption[];
    currentUserProfile: User | null;
    refetchActive: () => Promise<any>;
}

/**
 * Facade domain hook for Shoot Checklist session management:
 * - Active shoot round session & local storage sync (`useActiveShootSession`)
 * - Historical shoot trip archive & server-side pagination (`useShootTripArchive`)
 * - 3-round snapshot submission & trip resumption (`useShootRoundSubmit`)
 */
export const useShootSessionDomain = ({
    activeOrgId,
    activePresetId,
    activePresetName,
    rawChecklistItems,
    setRawChecklistItems,
    activeChecklistItems,
    masterOptions,
    currentUserProfile,
    refetchActive
}: UseShootSessionDomainParams) => {
    // 1. Archive Domain (historical records, paginated search, deletion)
    const archive = useShootTripArchive({ activeOrgId });

    // 2. Active Session Domain (current round, title, local persistence, server sync)
    const session = useActiveShootSession({
        activeOrgId,
        activePresetId,
        activePresetName,
        setRawChecklistItems,
        onUpdateArchiveTripTitle: archive.handleUpdateArchiveTripTitle
    });

    // 3. Round Submission & Resumption Domain (snapshots, attribution enrichment, multi-round merging)
    const roundSubmit = useShootRoundSubmit({
        activeOrgId,
        activePresetId,
        activePresetName,
        rawChecklistItems,
        setRawChecklistItems,
        activeChecklistItems,
        masterOptions,
        currentUserProfile,
        refetchActive,

        activeShootSession: session.activeShootSession,
        setActiveShootSession: session.setActiveShootSession,
        syncShootSessionToServer: session.syncShootSessionToServer,

        shootTripRecords: archive.shootTripRecords,
        setShootTripRecords: archive.setShootTripRecords,
        saveArchiveToLocal: archive.saveArchiveToLocal,
        upsertShootTripRecordToServer: archive.upsertShootTripRecordToServer
    });

    return {
        activeShootSession: session.activeShootSession,
        setActiveShootSession: session.setActiveShootSession,
        shootTripRecords: archive.shootTripRecords,
        setShootTripRecords: archive.setShootTripRecords,
        isSubmittingRound: roundSubmit.isSubmittingRound,
        syncShootSessionToServer: session.syncShootSessionToServer,
        refetchSession: session.refetchSession,
        refetchArchive: archive.refetchArchive,
        handleUpdateShootSessionTitle: session.handleUpdateShootSessionTitle,
        handleSetShootRound: session.handleSetShootRound,
        handleStartNewShootSession: session.handleStartNewShootSession,
        handleSubmitShootRound: roundSubmit.handleSubmitShootRound,
        handleResumeShootTrip: roundSubmit.handleResumeShootTrip,
        handleDeleteShootTripRecord: archive.handleDeleteShootTripRecord,
        fetchPaginatedShootTrips: archive.fetchPaginatedShootTrips
    };
};

export * from './session/sessionHelpers';
export * from './session/useActiveShootSession';
export * from './session/useShootTripArchive';
export * from './session/useShootRoundSubmit';
