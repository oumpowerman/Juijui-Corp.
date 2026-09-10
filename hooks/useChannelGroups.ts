import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Channel, ChannelGroup } from '../types';
import { useToast } from '../context/ToastContext';

const LOCAL_STORAGE_GROUPS_KEY = 'juijui_channel_groups_v1';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'juijui_channel_group_assignments_v1';

export const DEFAULT_GROUP_COLORS = [
    { id: 'indigo', label: 'Indigo', class: 'bg-indigo-50 text-indigo-700 border-indigo-200 badge-indigo', colorDot: 'bg-indigo-500' },
    { id: 'purple', label: 'Purple', class: 'bg-purple-50 text-purple-700 border-purple-200 badge-purple', colorDot: 'bg-purple-500' },
    { id: 'pink', label: 'Pink', class: 'bg-pink-50 text-pink-700 border-pink-200 badge-pink', colorDot: 'bg-pink-500' },
    { id: 'rose', label: 'Rose', class: 'bg-rose-50 text-rose-700 border-rose-200 badge-rose', colorDot: 'bg-rose-500' },
    { id: 'amber', label: 'Amber', class: 'bg-amber-50 text-amber-700 border-amber-200 badge-amber', colorDot: 'bg-amber-500' },
    { id: 'emerald', label: 'Emerald', class: 'bg-emerald-50 text-emerald-700 border-emerald-200 badge-emerald', colorDot: 'bg-emerald-500' },
    { id: 'teal', label: 'Teal', class: 'bg-teal-50 text-teal-700 border-teal-200 badge-teal', colorDot: 'bg-teal-500' },
    { id: 'blue', label: 'Blue', class: 'bg-blue-50 text-blue-700 border-blue-200 badge-blue', colorDot: 'bg-blue-500' },
];

export const useChannelGroups = () => {
    const [groups, setGroups] = useState<ChannelGroup[]>([]);
    const [groupAssignments, setGroupAssignments] = useState<Record<string, { groupId: string | null; groupName?: string | null }>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { showToast } = useToast();

    // 1. Load LocalStorage Fallbacks
    const getLocalGroups = (): ChannelGroup[] => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_GROUPS_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    };

    const saveLocalGroups = (newGroups: ChannelGroup[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_GROUPS_KEY, JSON.stringify(newGroups));
        } catch (e) {
            console.warn('Failed to save groups to localStorage:', e);
        }
    };

    const getLocalAssignments = (): Record<string, { groupId: string | null; groupName?: string | null }> => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const saveLocalAssignments = (assignments: Record<string, { groupId: string | null; groupName?: string | null }>) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(assignments));
        } catch (e) {
            console.warn('Failed to save assignments to localStorage:', e);
        }
    };

    // 2. Fetch Groups from Supabase or LocalStorage
    const fetchGroups = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('channel_groups')
                .select('*')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true });

            if (error || !data) {
                // Table doesn't exist yet or offline: fallback to localStorage
                const local = getLocalGroups();
                setGroups(local);
            } else {
                const mapped: ChannelGroup[] = data.map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    color: g.color || 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    description: g.description || '',
                    sort_order: g.sort_order || 0,
                    created_at: g.created_at,
                }));
                setGroups(mapped);
                saveLocalGroups(mapped);
            }
        } catch (err) {
            console.warn('[useChannelGroups] Fetch groups fallback to local storage', err);
            const local = getLocalGroups();
            setGroups(local);
        } finally {
            // Load assignments
            setGroupAssignments(getLocalAssignments());
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    // 3. Create Group
    const createGroup = async (name: string, color?: string, description?: string): Promise<ChannelGroup | null> => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            showToast('กรุณาระบุชื่อกลุ่ม', 'error');
            return null;
        }

        const newGroup: ChannelGroup = {
            id: crypto.randomUUID(),
            name: trimmedName,
            color: color || DEFAULT_GROUP_COLORS[0].class,
            description: description?.trim() || '',
            sort_order: groups.length + 1,
            created_at: new Date().toISOString(),
        };

        // Optimistic update
        const updated = [...groups, newGroup];
        setGroups(updated);
        saveLocalGroups(updated);

        try {
            const { data, error } = await supabase
                .from('channel_groups')
                .insert({
                    id: newGroup.id,
                    name: newGroup.name,
                    color: newGroup.color,
                    description: newGroup.description,
                    sort_order: newGroup.sort_order,
                })
                .select()
                .single();

            if (!error && data) {
                newGroup.id = data.id;
            }
        } catch (err) {
            console.warn('[useChannelGroups] Insert group to Supabase notice (saved locally):', err);
        }

        showToast(`สร้างกลุ่ม "${trimmedName}" สำเร็จ ✨`, 'success');
        return newGroup;
    };

    // 4. Update Group
    const updateGroup = async (id: string, updates: Partial<ChannelGroup>): Promise<boolean> => {
        const updated = groups.map(g => (g.id === id ? { ...g, ...updates } : g));
        setGroups(updated);
        saveLocalGroups(updated);

        try {
            await supabase
                .from('channel_groups')
                .update({
                    ...(updates.name && { name: updates.name }),
                    ...(updates.color && { color: updates.color }),
                    ...(updates.description !== undefined && { description: updates.description }),
                    ...(updates.sort_order !== undefined && { sort_order: updates.sort_order }),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
        } catch (err) {
            console.warn('[useChannelGroups] Update group notice:', err);
        }

        showToast('อัปเดตกลุ่มสำเร็จ', 'success');
        return true;
    };

    // 5. Delete Group
    const deleteGroup = async (id: string): Promise<boolean> => {
        const targetGroup = groups.find(g => g.id === id);
        const groupName = targetGroup?.name || 'กลุ่ม';

        const updated = groups.filter(g => g.id !== id);
        setGroups(updated);
        saveLocalGroups(updated);

        // Reset assignments for channels that were in this group
        const updatedAssignments = { ...groupAssignments };
        Object.keys(updatedAssignments).forEach(channelId => {
            if (updatedAssignments[channelId]?.groupId === id) {
                delete updatedAssignments[channelId];
            }
        });
        setGroupAssignments(updatedAssignments);
        saveLocalAssignments(updatedAssignments);

        try {
            // Update Supabase channels in this group to null
            await supabase
                .from('channels')
                .update({ group_id: null, group_name: null })
                .eq('group_id', id);

            // Delete from channel_groups table
            await supabase
                .from('channel_groups')
                .delete()
                .eq('id', id);
        } catch (err) {
            console.warn('[useChannelGroups] Delete group notice:', err);
        }

        showToast(`ลบกลุ่ม "${groupName}" แล้ว 🗑️`, 'warning');
        return true;
    };

    // 6. Assign Channel to Group (Single)
    const assignChannelToGroup = async (channelId: string, groupId: string | null, groupName?: string | null): Promise<boolean> => {
        const updatedAssignments = {
            ...groupAssignments,
            [channelId]: { groupId, groupName: groupName ?? (groupId ? groups.find(g => g.id === groupId)?.name : null) }
        };
        setGroupAssignments(updatedAssignments);
        saveLocalAssignments(updatedAssignments);

        try {
            await supabase
                .from('channels')
                .update({
                    group_id: groupId,
                    group_name: groupName ?? (groupId ? groups.find(g => g.id === groupId)?.name : null),
                })
                .eq('id', channelId);
        } catch (err) {
            console.warn('[useChannelGroups] Assign channel notice:', err);
        }

        return true;
    };

    // 7. Batch Assign Channels (used after dragging or organizing in modal)
    const batchAssignChannels = async (
        assignments: { channelId: string; groupId: string | null; groupName?: string | null }[]
    ): Promise<boolean> => {
        const next = { ...groupAssignments };
        assignments.forEach(a => {
            next[a.channelId] = {
                groupId: a.groupId,
                groupName: a.groupName ?? (a.groupId ? groups.find(g => g.id === a.groupId)?.name : null),
            };
        });
        setGroupAssignments(next);
        saveLocalAssignments(next);

        // Async persist to Supabase in parallel
        Promise.all(
            assignments.map(async a => {
                try {
                    await supabase
                        .from('channels')
                        .update({
                            group_id: a.groupId,
                            group_name: a.groupName ?? (a.groupId ? groups.find(g => g.id === a.groupId)?.name : null),
                        })
                        .eq('id', a.channelId);
                } catch {
                    // graceful ignore
                }
            })
        ).catch(() => {});

        return true;
    };

    // Helper: Enrich channels with their active group_id / group_name
    const enrichChannelsWithGroups = useCallback((rawChannels: Channel[]): Channel[] => {
        return rawChannels.map(ch => {
            const assignment = groupAssignments[ch.id];
            const activeGroupId = ch.group_id ?? assignment?.groupId ?? null;
            const matchedGroup = groups.find(g => g.id === activeGroupId);
            const activeGroupName = ch.group_name ?? assignment?.groupName ?? matchedGroup?.name ?? null;

            return {
                ...ch,
                group_id: activeGroupId,
                group_name: activeGroupName,
            };
        });
    }, [groupAssignments, groups]);

    return {
        groups,
        isLoading,
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        assignChannelToGroup,
        batchAssignChannels,
        enrichChannelsWithGroups,
    };
};
