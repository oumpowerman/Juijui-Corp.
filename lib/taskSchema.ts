import { Task, ReviewStatus, Platform } from '../types';

/**
 * 🔹 Single Source of Truth for Supabase Queries
 * 
 * Level 1: SUMMARY_FIELDS - Ultra-lightweight payload for List / Calendar / SidePanel cards.
 * Excludes heavy description, shoot_notes, remark, task_reviews, and sponsorship_details.
 * 
 * Level 2: FULL_SELECT_FIELDS - Complete dataset for detail modals, edit forms, and paginated full inventory tables.
 */

export const CONTENT_SUMMARY_FIELDS = `
    id, title, status, channel_id, pillar, category, content_formats, tags,
    start_date, end_date, created_at, updated_at, is_unscheduled, scheduled_time,
    target_platform, assignee_ids, idea_owner_ids, editor_ids, shoot_trip_id,
    shoot_date, shoot_location, is_in_shoot_queue, is_soft_finished, sla_revert_count,
    local_path, drive_label, sub_checklist_progress
`.replace(/\s+/g, ' ').trim();

export const TASK_SUMMARY_FIELDS = `
    id, title, type, status, priority, start_date, end_date, created_at, updated_at, 
    assignee_ids, content_id, show_on_board, target_position, roadmap_id, 
    sla_revert_count, difficulty, assignee_type, estimated_hours, scheduled_time,
    caution, importance, script_id, contents(title)
`.replace(/\s+/g, ' ').trim();

export const CONTENT_FULL_SELECT_FIELDS = `
    id, title, description, status, pillar, category, content_formats, tags,
    start_date, end_date, channel_id, created_at, updated_at, is_unscheduled, remark, scheduled_time,
    target_platform, assignee_ids, idea_owner_ids, editor_ids, shoot_trip_id,
    shoot_date, shoot_location, shoot_time_start, shoot_time_end, shoot_notes,
    is_in_shoot_queue, is_soft_finished, sla_revert_count, local_path, drive_label,
    published_links, sub_checklist_progress, assets, is_penalized, last_penalized_at,
    task_reviews(id, round, status, is_completed, scheduled_at, reviewer_id, feedback, content_id),
    content_analytics(id, platform),
    sponsorship_details(is_sponsored, deal_value, requirements, payment_status, is_paid, invoice_url, client_id)
`.replace(/\s+/g, ' ').trim();

export const TASK_FULL_SELECT_FIELDS = `
    id, title, description, type, status, priority, start_date, end_date, created_at, updated_at, 
    assignee_ids, content_id, show_on_board, target_position, roadmap_id, 
    sla_revert_count, difficulty, assignee_type, estimated_hours, scheduled_time,
    caution, importance, assets, script_id, tags, is_penalized, last_penalized_at,
    contents(title), task_reviews(id, round, status, is_completed, scheduled_at, reviewer_id, feedback, task_id)
`.replace(/\s+/g, ' ').trim();

/**
 * Maps a raw Supabase `contents` row into a strongly-typed `Task` object.
 */
export const mapContentRowToTask = (data: any, isPartial = false): Task => {
    const startDateVal = data.start_date || data.created_at || new Date().toISOString();
    const endDateVal = data.end_date || data.created_at || new Date().toISOString();

    let platforms: Platform[] = [];
    if (Array.isArray(data.target_platform)) {
        platforms = data.target_platform;
    } else if (data.target_platform) {
        platforms = [data.target_platform];
    }

    const reviews = Array.isArray(data.task_reviews)
        ? data.task_reviews.map((r: any) => ({
            id: r.id,
            taskId: r.content_id || data.id,
            round: r.round,
            scheduledAt: new Date(r.scheduled_at || data.created_at),
            status: r.status as ReviewStatus,
            reviewerId: r.reviewer_id,
            feedback: r.feedback,
            isCompleted: r.is_completed || false,
        }))
        : [];

    return {
        id: data.id,
        title: data.title || '',
        description: data.description || '',
        type: 'CONTENT',
        status: data.status || 'IDEA',
        priority: undefined,
        tags: Array.isArray(data.tags) ? data.tags : [],
        pillar: data.pillar,
        contentFormats: Array.isArray(data.content_formats) ? data.content_formats : [],
        category: data.category,
        remark: data.remark,
        startDate: new Date(startDateVal),
        endDate: new Date(endDateVal),
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        channelId: data.channel_id || data.channelId,
        targetPlatforms: platforms,
        scheduledTime: data.scheduled_time || data.scheduledTime,
        isUnscheduled: data.is_unscheduled ?? data.isUnscheduled ?? false,
        assigneeIds: Array.isArray(data.assignee_ids) ? data.assignee_ids : [],
        ideaOwnerIds: Array.isArray(data.idea_owner_ids) ? data.idea_owner_ids : [],
        editorIds: Array.isArray(data.editor_ids) ? data.editor_ids : [],
        assets: Array.isArray(data.assets) ? data.assets : [],
        reviews: reviews.sort((a: any, b: any) => (a.round || 0) - (b.round || 0)),
        logs: [],
        performance: data.performance || undefined,
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        assigneeType: data.assignee_type || 'TEAM',
        targetPosition: data.target_position || undefined,
        caution: data.caution || undefined,
        importance: data.importance || undefined,
        publishedLinks: data.published_links || {},
        shootDate: data.shoot_date ? new Date(data.shoot_date) : undefined,
        shootLocation: data.shoot_location || undefined,
        shootTripId: data.shoot_trip_id || undefined,
        shootTimeStart: data.shoot_time_start || undefined,
        shootTimeEnd: data.shoot_time_end || undefined,
        shootNotes: data.shoot_notes || undefined,
        localPath: data.local_path || undefined,
        driveLabel: data.drive_label || undefined,
        isInShootQueue: data.is_in_shoot_queue || data.isInShootQueue || false,
        isSoftFinished: data.is_soft_finished || data.isSoftFinished || false,
        subChecklistProgress: data.sub_checklist_progress || data.subChecklistProgress || {},
        contentId: data.content_id,
        showOnBoard: data.show_on_board,
        parentContentTitle: data.contents?.title,
        roadmapId: data.roadmap_id,
        scriptId: data.script_id,
        sla_revert_count: data.sla_revert_count,
        is_penalized: data.is_penalized,
        last_penalized_at: data.last_penalized_at ? new Date(data.last_penalized_at) : undefined,
        hasAnalytics: !!data.content_analytics && (Array.isArray(data.content_analytics) ? data.content_analytics.length > 0 : !!data.content_analytics.id),
        analyticsStatus: (() => {
            if (!data.content_analytics) return 'NONE';
            const rows = Array.isArray(data.content_analytics) ? data.content_analytics : [data.content_analytics];
            const filledPlatforms = rows.map((r: any) => r.platform).filter(Boolean);
            if (filledPlatforms.length === 0) return 'NONE';
            if (platforms.length === 0) return 'COMPLETE';
            const allMatched = platforms.every((p: string) => filledPlatforms.includes(p));
            return allMatched ? 'COMPLETE' : 'PARTIAL';
        })(),
        sponsorship: data.sponsorship_details ? (() => {
            const s = Array.isArray(data.sponsorship_details) ? data.sponsorship_details[0] : data.sponsorship_details;
            if (!s) return undefined;
            return {
                taskId: data.id,
                isSponsored: s.is_sponsored,
                dealValue: s.deal_value || 0,
                requirements: s.requirements,
                paymentStatus: s.payment_status,
                isPaid: s.is_paid,
                invoiceUrl: s.invoice_url,
                clientId: s.client_id
            };
        })() : undefined,
        _isPartial: isPartial
    } as any;
};

/**
 * Maps a raw Supabase `tasks` row into a strongly-typed `Task` object.
 */
export const mapTaskRowToTask = (data: any, isPartial = false): Task => {
    const startDateVal = data.start_date || data.created_at || new Date().toISOString();
    const endDateVal = data.end_date || data.created_at || new Date().toISOString();

    const reviews = Array.isArray(data.task_reviews)
        ? data.task_reviews.map((r: any) => ({
            id: r.id,
            taskId: r.task_id || data.id,
            round: r.round,
            scheduledAt: new Date(r.scheduled_at || data.created_at),
            status: r.status as ReviewStatus,
            reviewerId: r.reviewer_id,
            feedback: r.feedback,
            isCompleted: r.is_completed || false,
        }))
        : [];

    return {
        id: data.id,
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'TASK',
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        tags: Array.isArray(data.tags) ? data.tags : [],
        startDate: new Date(startDateVal),
        endDate: new Date(endDateVal),
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        scheduledTime: data.scheduled_time,
        isUnscheduled: false,
        assigneeIds: Array.isArray(data.assignee_ids) ? data.assignee_ids : [],
        ideaOwnerIds: [],
        editorIds: [],
        assets: Array.isArray(data.assets) ? data.assets : [],
        reviews: reviews.sort((a: any, b: any) => (a.round || 0) - (b.round || 0)),
        logs: [],
        difficulty: data.difficulty || 'MEDIUM',
        estimatedHours: data.estimated_hours || 0,
        assigneeType: data.assignee_type || 'TEAM',
        targetPosition: data.target_position,
        caution: data.caution,
        importance: data.importance,
        contentId: data.content_id,
        showOnBoard: data.show_on_board,
        parentContentTitle: data.contents?.title,
        roadmapId: data.roadmap_id,
        scriptId: data.script_id,
        sla_revert_count: data.sla_revert_count,
        is_penalized: data.is_penalized,
        last_penalized_at: data.last_penalized_at ? new Date(data.last_penalized_at) : undefined,
        _isPartial: isPartial
    } as any;
};
