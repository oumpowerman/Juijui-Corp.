import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
    ChecklistItem,
    ChecklistPreset,
    InventoryItem,
    MasterOption,
    ActiveShootSessionState
} from '../../types';
import { useToast } from '../ToastContext';
import { useGlobalDialog } from '../GlobalDialogContext';
import { NIL_UUID, buildDefaultShootTitle, createDefaultShootSession } from './types';

interface UseChecklistPresetsDomainParams {
    activeOrgId: string;
    masterOptions: MasterOption[];
    inventoryItems: InventoryItem[];
    rawChecklistItems: ChecklistItem[];
    setRawChecklistItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
    activeShootSession: ActiveShootSessionState;
    setActiveShootSession: React.Dispatch<React.SetStateAction<ActiveShootSessionState>>;
    syncShootSessionToServer: (session: ActiveShootSessionState) => Promise<void>;
    refetchActive: () => Promise<any>;
}

export const useChecklistPresetsDomain = ({
    activeOrgId,
    masterOptions,
    inventoryItems,
    rawChecklistItems,
    setRawChecklistItems,
    activeShootSession,
    setActiveShootSession,
    syncShootSessionToServer,
    refetchActive
}: UseChecklistPresetsDomainParams) => {
    const { showToast } = useToast();
    const { showConfirm } = useGlobalDialog();

    const [checklistPresets, setChecklistPresets] = useState<ChecklistPreset[]>([]);
    const [activePresetId, setActivePresetId] = useState<string | null>(null);
    const [activePresetName, setActivePresetName] = useState<string | null>(null);

    const {
        data: presetData,
        isLoading: isPresetsLoading,
        refetch: refetchPresets
    } = useQuery({
        queryKey: ['checklist_presets_db', activeOrgId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('checklist_presets_db')
                .select('*')
                .order('name', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        staleTime: 1000 * 60 * 5
    });

    useEffect(() => {
        if (presetData) {
            setChecklistPresets(
                presetData.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    items: p.items || []
                }))
            );
        }
    }, [presetData]);

    useEffect(() => {
        const configData = masterOptions.find(
            o => o.type === 'CHECKLIST_CONFIG' && o.key === 'ACTIVE_PRESET_ID'
        );
        if (configData) {
            const pId = configData.label;
            setActivePresetId(pId);
            const activeP = checklistPresets.find(p => p.id === pId);
            setActivePresetName(activeP ? activeP.name : null);
        } else {
            setActivePresetId(null);
            setActivePresetName(null);
        }
    }, [masterOptions, checklistPresets]);

    const updateGlobalActivePreset = useCallback(
        async (presetId: string | null) => {
            try {
                const existing = masterOptions.find(
                    o => o.type === 'CHECKLIST_CONFIG' && o.key === 'ACTIVE_PRESET_ID'
                );
                if (existing) {
                    await supabase
                        .from('master_options')
                        .update({ label: presetId || '' })
                        .eq('id', existing.id);
                } else {
                    await supabase.from('master_options').insert({
                        type: 'CHECKLIST_CONFIG',
                        key: 'ACTIVE_PRESET_ID',
                        label: presetId || '',
                        sort_order: 999
                    });
                }
            } catch (err) {
                console.error('Update Global Preset Error:', err);
            }
        },
        [masterOptions]
    );

    const handleLoadPreset = useCallback(
        async (presetId: string, clearFirst: boolean = false) => {
            if (presetId === 'CLEAR') {
                setRawChecklistItems([]);
                const clearedSession = createDefaultShootSession(null, null);
                setActiveShootSession(clearedSession);
                await Promise.all([
                    supabase.from('active_checklist_items').delete().neq('id', NIL_UUID),
                    updateGlobalActivePreset(null),
                    syncShootSessionToServer(clearedSession)
                ]);
                showToast('ล้างกระเป๋าเรียบร้อย', 'warning');
                return;
            }

            const preset = checklistPresets.find(p => p.id === presetId);
            if (preset) {
                const tempItems: ChecklistItem[] = preset.items.map((i, idx) => ({
                    id: `temp-${Date.now()}-${idx}`,
                    text: i.text,
                    categoryId: i.categoryId,
                    isChecked: false
                }));

                if (clearFirst) {
                    setRawChecklistItems(tempItems);
                } else {
                    setRawChecklistItems(prev => [...prev, ...tempItems]);
                }

                const hasSavedRoundsInCurrentSession =
                    Object.keys(activeShootSession.completedRounds || {}).length > 0;
                const nextSession: ActiveShootSessionState =
                    clearFirst && !hasSavedRoundsInCurrentSession
                        ? {
                              ...activeShootSession,
                              title: buildDefaultShootTitle(preset.name),
                              presetId: preset.id,
                              presetName: preset.name,
                              currentRound: 'PACK_OUT',
                              updatedAt: new Date().toISOString(),
                              itemAttributions: {}
                          }
                        : clearFirst
                          ? createDefaultShootSession(preset.id, preset.name)
                          : {
                                ...activeShootSession,
                                presetId: preset.id,
                                presetName: preset.name,
                                updatedAt: new Date().toISOString()
                            };

                setActiveShootSession(nextSession);

                try {
                    if (clearFirst) {
                        await supabase
                            .from('active_checklist_items')
                            .delete()
                            .neq('id', NIL_UUID);
                        await updateGlobalActivePreset(presetId);
                    }

                    const itemsToInsert = preset.items.map(i => ({
                        text: i.text,
                        category_id: i.categoryId,
                        is_checked: false
                    }));

                    await Promise.all([
                        itemsToInsert.length > 0
                            ? supabase.from('active_checklist_items').insert(itemsToInsert)
                            : Promise.resolve(),
                        syncShootSessionToServer(nextSession)
                    ]);

                    if (itemsToInsert.length > 0) {
                        await refetchActive();
                        showToast(
                            `โหลดชุด "${preset.name}" พร้อมตั้งชื่อคิวออกกองอัตโนมัติแล้ว`,
                            'success'
                        );
                    }
                } catch (err) {
                    console.error('Load Preset DB Error', err);
                }
            }
        },
        [
            activeShootSession,
            checklistPresets,
            refetchActive,
            setActiveShootSession,
            setRawChecklistItems,
            showToast,
            syncShootSessionToServer,
            updateGlobalActivePreset
        ]
    );

    const handleAddPreset = useCallback(
        async (name: string, selectedInventoryIds?: string[]) => {
            try {
                let itemsToSave: { text: string; categoryId: string }[] = [];
                if (selectedInventoryIds && selectedInventoryIds.length > 0) {
                    itemsToSave = inventoryItems
                        .filter(i => selectedInventoryIds.includes(i.id))
                        .map(i => ({ text: i.name, categoryId: i.categoryId }));
                } else {
                    if (rawChecklistItems.length === 0) {
                        showToast('ไม่มีรายการให้บันทึกครับ', 'warning');
                        return;
                    }
                    itemsToSave = rawChecklistItems.map(i => ({
                        text: i.text,
                        categoryId: i.categoryId
                    }));
                }

                const { error } = await supabase.from('checklist_presets_db').insert({
                    name,
                    items: itemsToSave
                });
                if (error) throw error;
                showToast(`บันทึก Preset "${name}" แล้ว`, 'success');
            } catch (err) {
                console.error(err);
                showToast('บันทึก Preset ไม่สำเร็จ', 'error');
            }
        },
        [inventoryItems, rawChecklistItems, showToast]
    );

    const handleUpdatePreset = useCallback(
        async (id: string, name: string, items: { text: string; categoryId: string }[]) => {
            try {
                const { error } = await supabase
                    .from('checklist_presets_db')
                    .update({
                        name,
                        items
                    })
                    .eq('id', id);
                if (error) throw error;
                showToast('อัปเดต Preset เรียบร้อย ✅', 'success');
            } catch (err) {
                console.error(err);
                showToast('อัปเดตไม่สำเร็จ', 'error');
            }
        },
        [showToast]
    );

    const handleDeletePreset = useCallback(
        async (id: string) => {
            const confirmed = await showConfirm('ยืนยันลบ Preset นี้?', 'ลบ Preset');
            if (confirmed) {
                try {
                    await supabase.from('checklist_presets_db').delete().eq('id', id);
                    showToast('ลบ Preset เรียบร้อย', 'info');
                } catch (err) {
                    console.error(err);
                }
            }
        },
        [showConfirm, showToast]
    );

    return {
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
    };
};
