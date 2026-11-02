import { supabase } from '../lib/supabase';
import { getActiveOrgIdSync } from '../lib/tenantStorage';
import { NotificationPreferences } from '../types';

export type PushCategory =
    | 'NEW_ASSIGNMENT'
    | 'APPROVAL_REQ'
    | 'QC_REQUEST'
    | 'DEADLINE_REQ'
    | 'UPCOMING_DEADLINE'
    | 'REVIEW'
    | 'TASK_COMPLETE'
    | 'COMMENT_MENTION'
    | 'CHAT_MENTION'
    | 'APPROVAL_SUMMARY'
    | 'SYSTEM';

export interface NotificationInsertRow {
    user_id: string;
    type: string;
    title: string;
    message: string;
    related_id?: string | null;
    link_path?: string | null;
    is_read?: boolean;
    metadata?: Record<string, any> | null;
}

export interface TriggerPushParams {
    userIds: string[];
    title: string;
    message: string;
    linkPath?: string | null;
    relatedId?: string | null;
    category?: PushCategory | string;
    senderId?: string | null;
    metadata?: Record<string, any> | null;
}

/**
 * Resolves an internal view key + relatedId into a browser deep-link URL
 */
export function buildNotificationDeepLink(linkPath?: string | null, relatedId?: string | null): string {
    if (linkPath === 'ATTENDANCE') {
        if (relatedId) {
            return `/?view=ATTENDANCE&tab=APPROVALS&highlightReqId=${encodeURIComponent(relatedId)}`;
        }
        return '/?view=ATTENDANCE';
    }

    const viewKeyMap: Record<string, string> = {
        ContentStock: '/?view=STOCK',
        STOCK: '/?view=STOCK',
        QUALITY_GATE: '/?view=QUALITY_GATE',
        ADMIN_DASHBOARD: '/?view=DASHBOARD',
        DASHBOARD: '/?view=DASHBOARD',
        TEAM_CHAT: '/?view=CHAT',
        CHAT: '/?view=CHAT',
        CALENDAR: '/?view=CALENDAR',
        MEETING: '/?view=MEETINGS',
    };

    if (linkPath && viewKeyMap[linkPath]) {
        let url = viewKeyMap[linkPath];
        if (relatedId && (linkPath === 'ContentStock' || linkPath === 'DASHBOARD')) {
            url += `&openTaskId=${encodeURIComponent(relatedId)}`;
        }
        return url;
    }

    if (relatedId && (!linkPath || linkPath === '/')) {
        return `/?openTaskId=${encodeURIComponent(relatedId)}`;
    }

    if (linkPath && linkPath.startsWith('/')) {
        return linkPath;
    }

    return '/';
}

/**
 * Dispatches a Web Push notification via /api/push/send (Vercel Serverless safe)
 */
export async function triggerPushNotification({
    userIds,
    title,
    message,
    linkPath,
    relatedId,
    category = 'NEW_ASSIGNMENT',
    senderId,
    metadata,
}: TriggerPushParams): Promise<void> {
    const uniqueIds = Array.from(new Set((userIds || []).filter(Boolean)));
    if (uniqueIds.length === 0) return;

    const orgId = getActiveOrgIdSync();
    const deepLinkUrl = buildNotificationDeepLink(linkPath, relatedId);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (orgId) headers['x-org-id'] = orgId;
    if (senderId) headers['x-user-id'] = senderId;

    try {
        await fetch('/api/push/send', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                userIds: uniqueIds,
                senderId: senderId || undefined,
                orgId: orgId || undefined,
                title,
                message,
                url: deepLinkUrl,
                actionLink: linkPath || deepLinkUrl,
                tag: `${category}-${relatedId || Date.now()}`,
                category,
                data: {
                    type: category,
                    taskId: relatedId || undefined,
                    relatedId: relatedId || undefined,
                    url: deepLinkUrl,
                    metadata: metadata || undefined,
                },
            }),
        });
    } catch (err) {
        console.warn('[pushDispatcher] Failed to dispatch Web Push:', err);
    }
}

/**
 * Inserts notification row(s) into public.notifications AND triggers Web Push to all recipients
 */
export async function insertAndDispatchNotifications(
    rows: NotificationInsertRow | NotificationInsertRow[],
    options?: {
        category?: PushCategory | string;
        senderId?: string | null;
    }
): Promise<void> {
    const rowList = (Array.isArray(rows) ? rows : [rows]).filter(r => r && r.user_id);
    if (rowList.length === 0) return;

    try {
        await supabase.from('notifications').insert(
            rowList.map(r => ({
                user_id: r.user_id,
                type: r.type,
                title: r.title,
                message: r.message,
                related_id: r.related_id || null,
                link_path: r.link_path || null,
                is_read: r.is_read ?? false,
                ...(r.metadata ? { metadata: r.metadata } : {}),
            }))
        );
    } catch (dbErr) {
        console.warn('[pushDispatcher] Failed to insert DB notifications:', dbErr);
    }

    // Group rows by identical title + message + link_path so we can batch push requests
    const first = rowList[0];
    const allSameMessage = rowList.every(
        r => r.title === first.title && r.message === first.message && r.link_path === first.link_path
    );

    if (allSameMessage) {
        void triggerPushNotification({
            userIds: rowList.map(r => r.user_id),
            title: first.title,
            message: first.message,
            linkPath: first.link_path,
            relatedId: first.related_id,
            category: options?.category || first.type,
            senderId: options?.senderId,
            metadata: first.metadata,
        });
    } else {
        for (const row of rowList) {
            void triggerPushNotification({
                userIds: [row.user_id],
                title: row.title,
                message: row.message,
                linkPath: row.link_path,
                relatedId: row.related_id,
                category: options?.category || row.type,
                senderId: options?.senderId,
                metadata: row.metadata,
            });
        }
    }
}

/**
 * Fetches all active ADMIN user IDs scoped to the active organization (Multi-Tenant safe)
 */
export async function fetchOrgAdminIds(excludeUserId?: string | null): Promise<string[]> {
    const activeOrgId = getActiveOrgIdSync();

    try {
        if (activeOrgId) {
            // Check organization_members + profiles in active organization
            const { data: orgMembers } = await supabase
                .from('organization_members')
                .select('user_id, role, status')
                .eq('org_id', activeOrgId)
                .eq('status', 'ACTIVE');

            if (orgMembers && orgMembers.length > 0) {
                const memberIds = orgMembers.map((m: any) => m.user_id);
                const { data: adminProfiles } = await supabase
                    .from('profiles')
                    .select('id, role, is_active')
                    .in('id', memberIds)
                    .eq('role', 'ADMIN');

                const combinedAdminIds = new Set<string>();
                orgMembers.forEach((m: any) => {
                    if (m.role === 'OWNER' || m.role === 'ADMIN') {
                        combinedAdminIds.add(m.user_id);
                    }
                });
                (adminProfiles || []).forEach((p: any) => {
                    if (p.is_active !== false) {
                        combinedAdminIds.add(p.id);
                    }
                });

                if (excludeUserId) combinedAdminIds.delete(excludeUserId);
                if (combinedAdminIds.size > 0) {
                    return Array.from(combinedAdminIds);
                }
            }
        }

        // Fallback: query profiles with role = 'ADMIN' (RLS filters by org automatically)
        const { data: admins } = await supabase
            .from('profiles')
            .select('id, current_org_id, is_active')
            .eq('role', 'ADMIN');

        if (!admins || admins.length === 0) return [];

        return admins
            .filter((a: any) => {
                if (a.is_active === false) return false;
                if (excludeUserId && a.id === excludeUserId) return false;
                if (activeOrgId && a.current_org_id && a.current_org_id !== activeOrgId) return false;
                return true;
            })
            .map((a: any) => a.id);
    } catch (err) {
        console.warn('[pushDispatcher] Failed to fetch organization admins:', err);
        return [];
    }
}

/**
 * Extracts user IDs that were mentioned with @Name in a comment or chat message
 */
export async function extractMentionedUserIds(
    content: string,
    knownUsers?: Array<{ id: string; name?: string; full_name?: string }>
): Promise<string[]> {
    if (!content || !content.includes('@')) return [];

    let userPool = knownUsers;
    if (!userPool || userPool.length === 0) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('is_active', true);
            userPool = data || [];
        } catch {
            userPool = [];
        }
    }

    const lowerContent = content.toLowerCase();
    const matchedIds = new Set<string>();

    for (const u of userPool) {
        const displayName = (u.name || u.full_name || '').trim();
        if (!displayName) continue;

        const lowerName = displayName.toLowerCase();
        const firstToken = lowerName.split(/\s+/)[0];

        if (
            lowerContent.includes(`@${lowerName}`) ||
            (firstToken.length >= 2 && lowerContent.includes(`@${firstToken}`))
        ) {
            matchedIds.add(u.id);
        }
    }

    return Array.from(matchedIds);
}

/**
 * Syncs NotificationPreferences to the backend so Web Push respects per-category toggles
 */
export async function syncNotificationPreferencesToServer(
    userId: string | undefined,
    preferences: NotificationPreferences
): Promise<void> {
    if (!userId) return;
    const orgId = getActiveOrgIdSync();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': userId,
    };
    if (orgId) headers['x-org-id'] = orgId;

    try {
        await fetch('/api/push/preferences', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                userId,
                orgId,
                preferences,
            }),
        });
    } catch (err) {
        console.warn('[pushDispatcher] Failed to sync preferences to server:', err);
    }
}
