import React, { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import {
    ChecklistItem,
    MasterOption,
    ShootRoundKey,
    ShootRoundSnapshotItem,
    ShootRoundReport,
    ShootTripRecord,
    ActiveShootSessionState,
    User
} from '../../../types';
import { useToast } from '../../ToastContext';
import {
    NIL_UUID,
    SHOOT_ROUND_META,
    buildDefaultShootTitle,
    createDefaultShootSession
} from '../types';
import { resolveCategoryLabel } from './sessionHelpers';

export interface UseShootRoundSubmitParams {
    activeOrgId: string;
    activePresetId: string | null;
    activePresetName: string | null;
    rawChecklistItems: ChecklistItem[];
    setRawChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
    activeChecklistItems: ChecklistItem[];
    masterOptions: MasterOption[];
    currentUserProfile: User | null;
    refetchActive: () => Promise<any>;

    activeShootSession: ActiveShootSessionState;
    setActiveShootSession: React.Dispatch<React.SetStateAction<ActiveShootSessionState>>;
    syncShootSessionToServer: (session: ActiveShootSessionState) => Promise<void>;

    shootTripRecords: ShootTripRecord[];
    setShootTripRecords: React.Dispatch<React.SetStateAction<ShootTripRecord[]>>;
    saveArchiveToLocal: (records: ShootTripRecord[], orgId?: string) => void;
    upsertShootTripRecordToServer: (record: ShootTripRecord) => Promise<void>;
}

export const useShootRoundSubmit = ({
    activeOrgId,
    activePresetId,
    activePresetName,
    rawChecklistItems,
    setRawChecklistItems,
    activeChecklistItems,
    masterOptions,
    currentUserProfile,
    refetchActive,
    activeShootSession,
    setActiveShootSession,
    syncShootSessionToServer,
    shootTripRecords,
    setShootTripRecords,
    saveArchiveToLocal,
    upsertShootTripRecordToServer
}: UseShootRoundSubmitParams) => {
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [isSubmittingRound, setIsSubmittingRound] = useState(false);

    const handleSubmitShootRound = useCallback(
        async (note?: string, customTitle?: string): Promise<ShootTripRecord | null> => {
            if (activeChecklistItems.length === 0) {
                showToast('ไม่มีรายการอุปกรณ์ในกระเป๋าให้ส่งรายงาน', 'warning');
                return null;
            }

            setIsSubmittingRound(true);
            try {
                const nowIso = new Date().toISOString();
                const currentRound = activeShootSession.currentRound || 'PACK_OUT';
                const roundMeta = SHOOT_ROUND_META[currentRound];
                const finalTitle =
                    customTitle?.trim() ||
                    activeShootSession.title?.trim() ||
                    buildDefaultShootTitle(activePresetName);

                const submitterName =
                    currentUserProfile?.nickname || currentUserProfile?.name || 'ทีมงาน';

                const sessionAttrs = activeShootSession.itemAttributions || {};
                const snapshotItems: ShootRoundSnapshotItem[] = activeChecklistItems.map(item => {
                    const attr = sessionAttrs[item.id] || sessionAttrs[`text::${item.text}`];
                    return {
                        itemId: item.id,
                        text: item.text,
                        categoryId: item.categoryId,
                        categoryLabel: resolveCategoryLabel(item.categoryId, masterOptions),
                        isChecked: item.isChecked,
                        checkedBy: item.isChecked
                            ? item.checkedBy || attr?.checkedBy || currentUserProfile?.id || 'user'
                            : undefined,
                        checkedByName: item.isChecked
                            ? item.checkedByName || attr?.checkedByName || submitterName
                            : undefined,
                        checkedByAvatar: item.isChecked
                            ? item.checkedByAvatar ||
                              attr?.checkedByAvatar ||
                              currentUserProfile?.avatarUrl ||
                              ''
                            : undefined,
                        checkedByPosition: item.isChecked
                            ? item.checkedByPosition ||
                              attr?.checkedByPosition ||
                              currentUserProfile?.position ||
                              ''
                            : undefined,
                        checkedAt: item.isChecked
                            ? item.checkedAt || attr?.checkedAt || nowIso
                            : undefined
                    };
                });

                const checkedCount = snapshotItems.filter(i => i.isChecked).length;
                const totalCount = snapshotItems.length;

                const roundReport: ShootRoundReport = {
                    roundKey: currentRound,
                    roundLabel: roundMeta.label,
                    submittedBy: currentUserProfile?.id || 'user',
                    submittedByName: submitterName,
                    submittedByAvatar: currentUserProfile?.avatarUrl || '',
                    submittedByPosition: currentUserProfile?.position || '',
                    submittedAt: nowIso,
                    note: note?.trim() || '',
                    checkedCount,
                    totalCount,
                    items: snapshotItems
                };

                const existingTrip = shootTripRecords.find(
                    r => r.id === activeShootSession.tripId
                );
                const mergedRounds: Partial<Record<ShootRoundKey, ShootRoundReport>> = {
                    ...(existingTrip?.rounds || {}),
                    ...(activeShootSession.completedRounds || {}),
                    [currentRound]: roundReport
                };

                const isAllThreeDone = Boolean(
                    mergedRounds.PACK_OUT && mergedRounds.PACK_BACK && mergedRounds.RETURN_STORAGE
                );
                const nextRound = roundMeta.nextRound;

                const tripRecord: ShootTripRecord = {
                    id: activeShootSession.tripId,
                    title: finalTitle,
                    presetId: activeShootSession.presetId || activePresetId || null,
                    presetName: activeShootSession.presetName || activePresetName || null,
                    createdAt:
                        existingTrip?.createdAt || activeShootSession.startedAt || nowIso,
                    updatedAt: nowIso,
                    status:
                        isAllThreeDone || currentRound === 'RETURN_STORAGE'
                            ? 'COMPLETED'
                            : 'IN_PROGRESS',
                    currentRound: nextRound || 'RETURN_STORAGE',
                    rounds: mergedRounds
                };

                const nextRecords = [
                    tripRecord,
                    ...shootTripRecords.filter(r => r.id !== tripRecord.id)
                ];
                setShootTripRecords(nextRecords);
                saveArchiveToLocal(nextRecords);

                // Auto-reset checkmarks immediately for the next round
                setRawChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));

                let nextSession: ActiveShootSessionState;
                if (nextRound && !isAllThreeDone) {
                    nextSession = {
                        ...activeShootSession,
                        title: finalTitle,
                        currentRound: nextRound,
                        updatedAt: nowIso,
                        itemAttributions: {},
                        completedRounds: mergedRounds
                    };
                } else {
                    nextSession = createDefaultShootSession(activePresetId, activePresetName);
                }

                setActiveShootSession(nextSession);

                await Promise.all([
                    upsertShootTripRecordToServer(tripRecord),
                    supabase
                        .from('active_checklist_items')
                        .update({ is_checked: false })
                        .neq('id', NIL_UUID),
                    syncShootSessionToServer(nextSession)
                ]);

                queryClient.invalidateQueries({ queryKey: ['shoot_trip_paginated', activeOrgId] });
                queryClient.invalidateQueries({ queryKey: ['shoot_trip_archive', activeOrgId] });

                if (nextRound && !isAllThreeDone) {
                    showToast(
                        `บันทึก "${roundMeta.label}" แล้ว • รีเซ็ตติ๊กเพื่อเริ่มรอบ "${SHOOT_ROUND_META[nextRound].label}" ต่อทันที ✅`,
                        'success'
                    );
                } else {
                    showToast(
                        `บันทึกคืนคลังครบทั้ง 3 รอบสำหรับ "${finalTitle}" เรียบร้อย! 🎉`,
                        'success'
                    );
                }

                return tripRecord;
            } catch (err) {
                console.error('Submit shoot round error:', err);
                showToast('บันทึกรายงานไม่สำเร็จ กรุณาลองอีกครั้ง', 'error');
                return null;
            } finally {
                setIsSubmittingRound(false);
            }
        },
        [
            activeOrgId,
            activeChecklistItems,
            activeShootSession,
            activePresetId,
            activePresetName,
            currentUserProfile,
            masterOptions,
            shootTripRecords,
            saveArchiveToLocal,
            setRawChecklistItems,
            setShootTripRecords,
            setActiveShootSession,
            upsertShootTripRecordToServer,
            syncShootSessionToServer,
            queryClient,
            showToast
        ]
    );

    const handleResumeShootTrip = useCallback(
        async (trip: ShootTripRecord) => {
            const nextRound: ShootRoundKey = !trip.rounds.PACK_OUT
                ? 'PACK_OUT'
                : !trip.rounds.PACK_BACK
                  ? 'PACK_BACK'
                  : 'RETURN_STORAGE';

            const resumedSession: ActiveShootSessionState = {
                tripId: trip.id,
                title: trip.title,
                presetId: trip.presetId || null,
                presetName: trip.presetName || null,
                currentRound: nextRound,
                startedAt: trip.createdAt,
                updatedAt: new Date().toISOString(),
                itemAttributions: {},
                completedRounds: trip.rounds
            };

            setActiveShootSession(resumedSession);
            await syncShootSessionToServer(resumedSession);

            if (rawChecklistItems.length === 0) {
                const latestRound =
                    trip.rounds.PACK_BACK || trip.rounds.PACK_OUT || trip.rounds.RETURN_STORAGE;
                if (latestRound && latestRound.items.length > 0) {
                    const itemsToInsert = latestRound.items.map(i => ({
                        text: i.text,
                        category_id: i.categoryId,
                        is_checked: false
                    }));
                    await supabase.from('active_checklist_items').insert(itemsToInsert);
                    await refetchActive();
                }
            } else {
                setRawChecklistItems(prev => prev.map(i => ({ ...i, isChecked: false })));
                await supabase
                    .from('active_checklist_items')
                    .update({ is_checked: false })
                    .neq('id', NIL_UUID);
            }

            showToast(
                `ดึงคิว "${trip.title}" กลับมาทำต่อในรอบ "${SHOOT_ROUND_META[nextRound].label}" แล้ว`,
                'info'
            );
        },
        [
            rawChecklistItems.length,
            refetchActive,
            setActiveShootSession,
            setRawChecklistItems,
            showToast,
            syncShootSessionToServer
        ]
    );

    return {
        isSubmittingRound,
        handleSubmitShootRound,
        handleResumeShootTrip
    };
};
