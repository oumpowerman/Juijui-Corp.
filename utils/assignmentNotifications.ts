import { format, isValid } from 'date-fns';
import { supabase } from '../lib/supabase';
import { insertAndDispatchNotifications, NotificationInsertRow } from './pushDispatcher';

export type AssignmentRoleKey = 'IDEA_OWNER' | 'EDITOR' | 'SUPPORT' | 'ASSIGNEE';

const ROLE_ORDER: AssignmentRoleKey[] = ['IDEA_OWNER', 'EDITOR', 'SUPPORT', 'ASSIGNEE'];

const ROLE_LABELS: Record<AssignmentRoleKey, string> = {
    IDEA_OWNER: 'เจ้าของไอเดีย',
    EDITOR: 'คนตัดต่อ',
    SUPPORT: 'ซัพพอร์ต',
    ASSIGNEE: 'ผู้รับผิดชอบ',
};

const INDIVIDUAL_IMPORT_THRESHOLD = 3;

export interface AssignmentTaskInput {
    id: string;
    title: string;
    type?: string | null;
    endDate?: Date | string | null;
    assigneeIds?: string[] | null;
    ideaOwnerIds?: string[] | null;
    editorIds?: string[] | null;
}

export interface AssignmentPreviousTaskInput {
    assigneeIds?: string[] | null;
    ideaOwnerIds?: string[] | null;
    editorIds?: string[] | null;
}

export interface BulkImportedContentItem {
    id: string;
    title: string;
    endDate?: Date | string | null;
    ideaOwnerIds?: string[] | null;
    editorIds?: string[] | null;
    assigneeIds?: string[] | null;
}

function normalizeIdArray(ids?: string[] | null): string[] {
    if (!Array.isArray(ids)) return [];
    return Array.from(new Set(ids.map((id) => String(id || '').trim()).filter(Boolean)));
}

function formatDueDateSuffix(endDate?: Date | string | null): string {
    if (!endDate) return '';
    const d = endDate instanceof Date ? endDate : new Date(endDate);
    if (!isValid(d)) return '';
    return ` กำหนดส่ง ${format(d, 'dd/MM/yyyy')}`;
}

function sortRoles(roleSet: Iterable<AssignmentRoleKey>): AssignmentRoleKey[] {
    const unique = new Set(roleSet);
    return ROLE_ORDER.filter((r) => unique.has(r));
}

function formatRoleText(roles: AssignmentRoleKey[]): string {
    return roles.map((r) => ROLE_LABELS[r]).join(', ');
}

async function resolveActorUserId(explicitActorId?: string | null): Promise<string | null> {
    if (explicitActorId) return explicitActorId;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch {
        return null;
    }
}

function addNewRoleRecipients(
    recipientRoles: Map<string, Set<AssignmentRoleKey>>,
    nextIds: string[] | null | undefined,
    prevIds: string[] | null | undefined,
    role: AssignmentRoleKey,
    actorId: string | null
) {
    const cleanNext = normalizeIdArray(nextIds);
    const prevSet = new Set(normalizeIdArray(prevIds));

    for (const uid of cleanNext) {
        if (actorId && uid === actorId) continue; // Skip self-notification
        if (prevSet.has(uid)) continue; // Already assigned in this role previously
        let roles = recipientRoles.get(uid);
        if (!roles) {
            roles = new Set<AssignmentRoleKey>();
            recipientRoles.set(uid, roles);
        }
        roles.add(role);
    }
}

/**
 * Unified assignment notification dispatcher for both Tasks and Contents.
 * - Supports Content crew roles: Idea Owner, Editor, and Support (assigneeIds)
 * - Diffs against `previousTask` when updating so only newly assigned roles are notified
 * - Filters out `actorUserId` (no self-notification)
 * - Merges multiple roles for the same user into a single notification + Web Push
 */
export async function dispatchTaskAssignmentNotifications(params: {
    task: AssignmentTaskInput;
    previousTask?: AssignmentPreviousTaskInput | null;
    actorUserId?: string | null;
    sourceLabel?: string;
}): Promise<number> {
    const { task, previousTask, actorUserId, sourceLabel } = params;
    if (!task?.id) return 0;

    const actorId = await resolveActorUserId(actorUserId);
    const isContent = String(task.type || '').toUpperCase() === 'CONTENT';
    const recipientRoles = new Map<string, Set<AssignmentRoleKey>>();

    if (isContent) {
        addNewRoleRecipients(recipientRoles, task.ideaOwnerIds, previousTask?.ideaOwnerIds, 'IDEA_OWNER', actorId);
        addNewRoleRecipients(recipientRoles, task.editorIds, previousTask?.editorIds, 'EDITOR', actorId);
        addNewRoleRecipients(recipientRoles, task.assigneeIds, previousTask?.assigneeIds, 'SUPPORT', actorId);
    } else {
        addNewRoleRecipients(recipientRoles, task.assigneeIds, previousTask?.assigneeIds, 'ASSIGNEE', actorId);
    }

    if (recipientRoles.size === 0) return 0;

    const dueSuffix = formatDueDateSuffix(task.endDate);
    const linkPath = isContent ? 'ContentStock' : 'DASHBOARD';
    const titlePrefix = isContent ? '🎬 คอนเทนต์ใหม่' : '⚡ งานใหม่';

    const rows: NotificationInsertRow[] = [];
    for (const [uid, roleSet] of recipientRoles.entries()) {
        const orderedRoles = sortRoles(roleSet);
        const roleText = formatRoleText(orderedRoles);
        const isPureTaskAssignee = !isContent && orderedRoles.length === 1 && orderedRoles[0] === 'ASSIGNEE';

        const message = isPureTaskAssignee
            ? `คุณได้รับมอบหมายงานใหม่: "${task.title}"${dueSuffix}`
            : `คุณได้รับมอบหมายในคอนเทนต์ (${roleText}): "${task.title}"${dueSuffix}`;

        rows.push({
            user_id: uid,
            type: 'NEW_ASSIGNMENT',
            title: `${titlePrefix}: ${task.title}`,
            message,
            related_id: task.id,
            link_path: linkPath,
            is_read: false,
            metadata: {
                roles: orderedRoles,
                taskType: isContent ? 'CONTENT' : 'TASK',
                ...(sourceLabel ? { source: sourceLabel } : {}),
            },
        });
    }

    await insertAndDispatchNotifications(rows, {
        category: 'NEW_ASSIGNMENT',
        senderId: actorId,
    });

    return rows.length;
}

/**
 * Smart Hybrid notification dispatcher for Bulk CSV/Excel Content Import.
 * - Filters out `actorUserId` (importer does not get notified about their own import)
 * - Merges multiple roles on the same item per user
 * - <= 3 items per recipient: sends individual notifications with direct item deep-links
 * - >= 4 items per recipient: sends 1 summary notification per recipient pointing to ContentStock
 */
export async function dispatchBulkContentImportNotifications(
    items: BulkImportedContentItem[],
    actorUserId?: string | null
): Promise<number> {
    if (!Array.isArray(items) || items.length === 0) return 0;

    const actorId = await resolveActorUserId(actorUserId);

    // Map<userId, Array<{ id, title, endDate, roles }>>
    const itemsByUser = new Map<
        string,
        Array<{ id: string; title: string; endDate?: Date | string | null; roles: AssignmentRoleKey[] }>
    >();

    for (const item of items) {
        if (!item?.id) continue;

        const itemRoleMap = new Map<string, Set<AssignmentRoleKey>>();
        addNewRoleRecipients(itemRoleMap, item.ideaOwnerIds, null, 'IDEA_OWNER', actorId);
        addNewRoleRecipients(itemRoleMap, item.editorIds, null, 'EDITOR', actorId);
        addNewRoleRecipients(itemRoleMap, item.assigneeIds, null, 'SUPPORT', actorId);

        for (const [uid, roleSet] of itemRoleMap.entries()) {
            const orderedRoles = sortRoles(roleSet);
            const list = itemsByUser.get(uid) || [];
            list.push({
                id: item.id,
                title: item.title || 'คอนเทนต์ใหม่',
                endDate: item.endDate,
                roles: orderedRoles,
            });
            itemsByUser.set(uid, list);
        }
    }

    if (itemsByUser.size === 0) return 0;

    const rows: NotificationInsertRow[] = [];

    for (const [uid, userItems] of itemsByUser.entries()) {
        if (userItems.length <= INDIVIDUAL_IMPORT_THRESHOLD) {
            for (const entry of userItems) {
                const roleText = formatRoleText(entry.roles);
                const dueSuffix = formatDueDateSuffix(entry.endDate);
                rows.push({
                    user_id: uid,
                    type: 'NEW_ASSIGNMENT',
                    title: `🎬 คอนเทนต์ใหม่: ${entry.title}`,
                    message: `คุณได้รับมอบหมายในคอนเทนต์นำเข้าใหม่ (${roleText}): "${entry.title}"${dueSuffix}`,
                    related_id: entry.id,
                    link_path: 'ContentStock',
                    is_read: false,
                    metadata: {
                        roles: entry.roles,
                        taskType: 'CONTENT',
                        source: 'BULK_IMPORT',
                    },
                });
            }
        } else {
            const allRoles = sortRoles(userItems.flatMap((entry) => entry.roles));
            const roleText = formatRoleText(allRoles);
            const sampleTitles = userItems
                .slice(0, 3)
                .map((entry) => `"${entry.title}"`)
                .join(', ');
            const remainderSuffix = userItems.length > 3 ? ` และอีก ${userItems.length - 3} รายการ` : '';

            rows.push({
                user_id: uid,
                type: 'NEW_ASSIGNMENT',
                title: `📥 นำเข้าคอนเทนต์ใหม่ ${userItems.length} รายการ`,
                message: `คุณได้รับมอบหมายในคอนเทนต์นำเข้าใหม่ ${userItems.length} รายการ (${roleText}): ${sampleTitles}${remainderSuffix}`,
                related_id: null,
                link_path: 'ContentStock',
                is_read: false,
                metadata: {
                    roles: allRoles,
                    count: userItems.length,
                    taskType: 'CONTENT',
                    source: 'BULK_IMPORT_SUMMARY',
                },
            });
        }
    }

    if (rows.length === 0) return 0;

    await insertAndDispatchNotifications(rows, {
        category: 'NEW_ASSIGNMENT',
        senderId: actorId,
    });

    return rows.length;
}
