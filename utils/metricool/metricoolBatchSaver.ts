import React from 'react';
import { supabase } from '../../lib/supabase';
import { Task, TaskAsset } from '../../types';
import { ParsedMetricoolRow } from '../metricoolCsv';

export interface BatchSaveProgress {
    current: number;
    total: number;
    label: string;
}

interface BatchSaveMetricoolParams {
    activeRows: ParsedMetricoolRow[];
    existingTasks: Task[];
    importDefaultChannelId: string;
    importDefaultStatus: string;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    onProgress?: (progress: BatchSaveProgress) => void;
}

/**
 * Converts a Task (type === 'CONTENT') into the Supabase `contents` table row payload.
 * Note: `org_id` is automatically populated by PostgreSQL `DEFAULT public.get_active_org_id()`
 * on INSERT, and enforced by RLS on UPDATE.
 */
function buildContentDbPayload(task: Task) {
    const startDate =
        task.startDate instanceof Date ? task.startDate : new Date(task.startDate || Date.now());
    const endDate =
        task.endDate instanceof Date ? task.endDate : new Date(task.endDate || Date.now());

    return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        tags: task.tags || [],
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        assignee_ids: task.assigneeIds || [],
        scheduled_time: task.scheduledTime || null,
        assets: task.assets || [],
        pillar: task.pillar || null,
        content_formats: task.contentFormats || ['SHORT_FORM'],
        category: task.category || null,
        remark: task.remark || null,
        channel_id: task.channelId || null,
        target_platform: task.targetPlatforms || [],
        is_unscheduled: Boolean(task.isUnscheduled),
        idea_owner_ids: task.ideaOwnerIds || [],
        editor_ids: task.editorIds || [],
        published_links: task.publishedLinks || null,
        shoot_date: task.shootDate ? new Date(task.shootDate).toISOString() : null,
        shoot_location: task.shootLocation || null,
        shoot_trip_id: task.shootTripId || null,
        shoot_time_start: task.shootTimeStart || null,
        shoot_time_end: task.shootTimeEnd || null,
        shoot_notes: task.shootNotes || null,
        is_in_shoot_queue: Boolean(task.isInShootQueue),
        local_path: task.localPath || null,
        drive_label: task.driveLabel || null,
        storage_hub_id: task.storageHubId || null,
        sub_checklist_progress: task.subChecklistProgress || {}
    };
}

/**
 * Merges incoming Metricool media/thumbnail URLs with existing TaskAssets without duplicates.
 */
export function buildMergedMetricoolAssets(
    row: ParsedMetricoolRow,
    existingAssetsInput?: TaskAsset[]
): TaskAsset[] {
    const existingAssets: TaskAsset[] = existingAssetsInput ? [...existingAssetsInput] : [];
    const existingUrls = new Set(existingAssets.map(a => a.url));

    row.mediaUrls.forEach((url, idx) => {
        if (!url) return;
        const existingIdx = existingAssets.findIndex(a => a.url === url);
        if (existingIdx >= 0) {
            existingAssets[existingIdx] = {
                ...existingAssets[existingIdx],
                isMetricoolReady: true
            };
        } else if (!existingUrls.has(url)) {
            const isVideoUrl = /\.(mp4|mov|webm)(\?|$)/i.test(url) || url.includes('/video/');
            existingAssets.push({
                id: `mc-media-${Date.now()}-${row.rowIndex}-${idx}`,
                name: isVideoUrl
                    ? `วิดีโอจาก Metricool #${idx + 1}`
                    : `ไฟล์มีเดีย Metricool #${idx + 1}`,
                url,
                type: 'LINK',
                category: 'VIDEO_DRAFT',
                createdAt: new Date(),
                isMetricoolReady: true
            });
            existingUrls.add(url);
        }
    });

    if (row.thumbnailUrl && !existingUrls.has(row.thumbnailUrl)) {
        existingAssets.push({
            id: `mc-thumb-${Date.now()}-${row.rowIndex}`,
            name: 'ปกคลิป (Metricool Thumbnail)',
            url: row.thumbnailUrl,
            type: 'LINK',
            category: 'THUMBNAIL',
            createdAt: new Date()
        });
        existingUrls.add(row.thumbnailUrl);
    }

    return existingAssets;
}

/**
 * High-speed Chunked Batch Saver for 200-300+ Metricool CSV rows.
 * - Groups CREATE rows into chunks of 50 for single-roundtrip `.insert(chunk)`
 * - Groups UPDATE rows into chunks of 20 for concurrent `Promise.all` updates
 * - Updates React `setTasks` state once at the end to prevent 300 sequential re-renders
 */
export async function batchSaveMetricoolRows({
    activeRows,
    existingTasks,
    importDefaultChannelId,
    importDefaultStatus,
    setTasks,
    onProgress
}: BatchSaveMetricoolParams): Promise<{ updatedCount: number; createdCount: number }> {
    const total = activeRows.length;
    let completed = 0;

    const cumulativeTaskMap = new Map<string, Task>();
    existingTasks.forEach(t => cumulativeTaskMap.set(t.id, t));

    const tasksToUpdateMap = new Map<string, Task>();
    const tasksToCreate: Task[] = [];

    for (const row of activeRows) {
        const existingTask =
            row.action === 'UPDATE' && row.matchedTaskId
                ? cumulativeTaskMap.get(row.matchedTaskId)
                : undefined;

        const mergedAssets = buildMergedMetricoolAssets(row, existingTask?.assets);

        if (existingTask) {
            const mergedTags = Array.from(new Set([...(existingTask.tags || []), ...row.tags]));
            const mergedPlatforms =
                row.targetPlatforms.length > 0
                    ? Array.from(
                          new Set([
                              ...(existingTask.targetPlatforms || []),
                              ...row.targetPlatforms
                          ])
                      )
                    : existingTask.targetPlatforms;

            const updatedTask: Task = {
                ...existingTask,
                title: existingTask.title || row.title,
                description: row.description || existingTask.description,
                startDate: row.parsedDate,
                endDate: row.parsedDate,
                scheduledTime: row.scheduledTime || existingTask.scheduledTime,
                channelId:
                    existingTask.channelId ||
                    row.matchedChannelId ||
                    importDefaultChannelId ||
                    undefined,
                targetPlatforms: mergedPlatforms,
                contentFormats:
                    row.contentFormats.length > 0
                        ? row.contentFormats
                        : existingTask.contentFormats,
                tags: mergedTags,
                assets: mergedAssets,
                isUnscheduled: false
            };

            cumulativeTaskMap.set(updatedTask.id, updatedTask);
            tasksToUpdateMap.set(updatedTask.id, updatedTask);
        } else {
            const newTask: Task = {
                id: crypto.randomUUID
                    ? crypto.randomUUID()
                    : `mc-${Date.now()}-${row.rowIndex}-${Math.random().toString(36).slice(2, 7)}`,
                type: 'CONTENT',
                title: row.title,
                description: row.description,
                status: row.isDraft ? 'IDEA' : importDefaultStatus,
                tags: row.tags,
                startDate: row.parsedDate,
                endDate: row.parsedDate,
                scheduledTime: row.scheduledTime,
                channelId: row.matchedChannelId || importDefaultChannelId || undefined,
                targetPlatforms:
                    row.targetPlatforms.length > 0
                        ? row.targetPlatforms
                        : ['TIKTOK', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE'],
                contentFormats:
                    row.contentFormats.length > 0 ? row.contentFormats : ['SHORT_FORM'],
                assigneeIds: [],
                ideaOwnerIds: [],
                editorIds: [],
                assets: mergedAssets,
                isUnscheduled: false
            };
            tasksToCreate.push(newTask);
        }
    }

    const tasksToUpdate = Array.from(tasksToUpdateMap.values());
    const CREATE_CHUNK_SIZE = 50;
    const UPDATE_CHUNK_SIZE = 20;

    onProgress?.({
        current: 0,
        total,
        label: 'กำลังเตรียมบันทึกข้อมูลแบบกลุ่ม (Batch Sync)...'
    });

    // 1. Batch INSERT new tasks in chunks of 50
    for (let i = 0; i < tasksToCreate.length; i += CREATE_CHUNK_SIZE) {
        const chunk = tasksToCreate.slice(i, i + CREATE_CHUNK_SIZE);
        const payloads = chunk.map(buildContentDbPayload);

        const { error } = await (supabase.from('contents') as any).insert(payloads);
        if (error) {
            throw new Error(`บันทึกการ์ดใหม่ไม่สำเร็จ: ${error.message}`);
        }

        completed = Math.min(total, completed + chunk.length);
        onProgress?.({
            current: completed,
            total,
            label: `กำลังสร้างการ์ดใหม่ (${Math.min(i + chunk.length, tasksToCreate.length)}/${tasksToCreate.length})...`
        });
    }

    // 2. Concurrent chunked UPDATE for existing tasks in chunks of 20
    for (let i = 0; i < tasksToUpdate.length; i += UPDATE_CHUNK_SIZE) {
        const chunk = tasksToUpdate.slice(i, i + UPDATE_CHUNK_SIZE);

        await Promise.all(
            chunk.map(async task => {
                const { id, ...updatePayload } = buildContentDbPayload(task);
                const { error } = await (supabase.from('contents') as any)
                    .update(updatePayload)
                    .eq('id', id);
                if (error) {
                    throw new Error(`อัปเดตการ์ด "${task.title}" ไม่สำเร็จ: ${error.message}`);
                }
            })
        );

        completed = Math.min(total, completed + chunk.length);
        onProgress?.({
            current: completed,
            total,
            label: `กำลังอัปเดตการ์ดเดิม (${Math.min(i + chunk.length, tasksToUpdate.length)}/${tasksToUpdate.length})...`
        });
    }

    // 3. Non-blocking Audit Log for batch sync
    try {
        const {
            data: { user }
        } = await supabase.auth.getUser();
        if (user) {
            const logEntries = [
                ...tasksToCreate.slice(0, 50).map(t => ({
                    task_id: null,
                    content_id: t.id,
                    user_id: user.id,
                    action: 'CREATED',
                    details: 'นำเข้าตารางคอนเทนต์จาก Metricool CSV',
                    metadata: { source: 'METRICOOL_CSV_BATCH' }
                })),
                ...tasksToUpdate.slice(0, 50).map(t => ({
                    task_id: null,
                    content_id: t.id,
                    user_id: user.id,
                    action: 'UPDATED',
                    details: 'ซิงค์วัน-เวลาและข้อมูลจาก Metricool CSV',
                    metadata: { source: 'METRICOOL_CSV_BATCH' }
                }))
            ];
            if (logEntries.length > 0) {
                await supabase.from('task_logs').insert(logEntries);
            }
        }
    } catch {
        // Ignore non-critical audit log failure
    }

    // 4. Single atomic React state update to prevent 300 re-renders
    setTasks(prev => {
        const updatedById = new Map(tasksToUpdate.map(t => [t.id, t]));
        const nextList = prev.map(item => updatedById.get(item.id) || item);
        return [...nextList, ...tasksToCreate];
    });

    onProgress?.({
        current: total,
        total,
        label: 'ซิงค์ข้อมูลเสร็จสมบูรณ์!'
    });

    return {
        updatedCount: tasksToUpdate.length,
        createdCount: tasksToCreate.length
    };
}
