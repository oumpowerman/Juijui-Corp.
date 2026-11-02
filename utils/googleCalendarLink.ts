import { format } from 'date-fns';
import { MeetingPlatform, MeetingType, TaskAsset } from '../types';

export const ONLINE_META_ASSET_ID = '__MEETING_ONLINE_META__';

export interface OnlineMeetingMeta {
    meetingType?: MeetingType;
    meetUrl?: string;
    meetPlatform?: MeetingPlatform;
    googleCalendarEventId?: string;
    googleCalendarLink?: string;
}

export function detectMeetingPlatform(url?: string): MeetingPlatform {
    if (!url || !url.trim()) return 'CUSTOM';
    const lower = url.trim().toLowerCase();
    if (lower.includes('meet.google.com')) return 'GOOGLE_MEET';
    if (lower.includes('zoom.us') || lower.includes('zoom.com')) return 'ZOOM';
    if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'TEAMS';
    if (lower.includes('line.me')) return 'LINE';
    return 'CUSTOM';
}

export function getMeetingPlatformInfo(platform?: MeetingPlatform, url?: string) {
    const resolved = platform || detectMeetingPlatform(url);
    switch (resolved) {
        case 'GOOGLE_MEET':
            return {
                platform: 'GOOGLE_MEET' as MeetingPlatform,
                label: 'Google Meet',
                joinLabel: 'เข้าร่วม Google Meet',
                badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200/60'
            };
        case 'ZOOM':
            return {
                platform: 'ZOOM' as MeetingPlatform,
                label: 'Zoom Meeting',
                joinLabel: 'เข้าร่วม Zoom',
                badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
                btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200/60'
            };
        case 'TEAMS':
            return {
                platform: 'TEAMS' as MeetingPlatform,
                label: 'Microsoft Teams',
                joinLabel: 'เข้าร่วม MS Teams',
                badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/60'
            };
        case 'LINE':
            return {
                platform: 'LINE' as MeetingPlatform,
                label: 'LINE Meeting',
                joinLabel: 'เข้าร่วม LINE Call',
                badgeBg: 'bg-green-50 text-green-700 border-green-200',
                btnBg: 'bg-green-600 hover:bg-green-700 text-white shadow-green-200/60'
            };
        default:
            return {
                platform: 'CUSTOM' as MeetingPlatform,
                label: 'ห้องประชุมออนไลน์',
                joinLabel: 'เข้าห้องประชุมออนไลน์',
                badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
                btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/60'
            };
    }
}

export function buildGoogleCalendarTemplateUrl(params: {
    title: string;
    date: Date;
    startTime?: string;
    endTime?: string;
    description?: string;
    meetUrl?: string;
    attendeeEmails?: string[];
}): string {
    const {
        title,
        date,
        startTime = '09:00',
        endTime = '10:00',
        description = '',
        meetUrl = '',
        attendeeEmails = []
    } = params;

    const datePart = format(date, 'yyyyMMdd');
    const cleanStart = (startTime || '09:00').replace(':', '').padEnd(4, '0').slice(0, 4) + '00';
    let cleanEnd = (endTime || '10:00').replace(':', '').padEnd(4, '0').slice(0, 4) + '00';
    if (cleanEnd <= cleanStart) {
        const startHour = parseInt(cleanStart.slice(0, 2), 10);
        const nextHour = String(Math.min(23, startHour + 1)).padStart(2, '0');
        cleanEnd = `${nextHour}${cleanStart.slice(2)}`;
    }

    const datesParam = `${datePart}T${cleanStart}/${datePart}T${cleanEnd}`;

    const detailLines: string[] = [];
    if (description) {
        detailLines.push(description);
    }
    if (meetUrl) {
        detailLines.push(`\n🔗 ลิงก์เข้าร่วมประชุมออนไลน์:\n${meetUrl}`);
    }

    const query = new URLSearchParams({
        action: 'TEMPLATE',
        text: title || 'การประชุม',
        dates: datesParam,
        details: detailLines.join('\n').trim() || `นัดหมายการประชุม: ${title}`,
    });

    if (meetUrl) {
        query.set('location', meetUrl);
    }

    const validEmails = attendeeEmails
        .map(e => e?.trim())
        .filter((e): e is string => Boolean(e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)));

    if (validEmails.length > 0) {
        query.set('add', validEmails.join(','));
    }

    return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function encodeOnlineMetaIntoAssets(
    assets: TaskAsset[] = [],
    meta: OnlineMeetingMeta
): TaskAsset[] {
    const cleanAssets = (assets || []).filter(a => a.id !== ONLINE_META_ASSET_ID);
    const hasData = Boolean(
        (meta.meetingType && meta.meetingType !== 'ONSITE') ||
        meta.meetUrl ||
        meta.googleCalendarEventId ||
        meta.googleCalendarLink
    );
    if (!hasData) return cleanAssets;

    const metaAsset: TaskAsset = {
        id: ONLINE_META_ASSET_ID,
        name: JSON.stringify({
            meetingType: meta.meetingType || 'ONSITE',
            meetUrl: meta.meetUrl || '',
            meetPlatform: meta.meetPlatform || detectMeetingPlatform(meta.meetUrl),
            googleCalendarEventId: meta.googleCalendarEventId || '',
            googleCalendarLink: meta.googleCalendarLink || ''
        }),
        url: meta.meetUrl || meta.googleCalendarLink || '#online-meta',
        type: 'LINK',
        category: 'LINK',
        createdAt: new Date()
    };

    return [...cleanAssets, metaAsset];
}

export function extractOnlineMetaFromAssets(assets?: TaskAsset[]): {
    cleanAssets: TaskAsset[];
    meta: OnlineMeetingMeta;
} {
    if (!Array.isArray(assets)) {
        return { cleanAssets: [], meta: {} };
    }
    const metaItem = assets.find(a => a.id === ONLINE_META_ASSET_ID);
    const cleanAssets = assets.filter(a => a.id !== ONLINE_META_ASSET_ID);

    if (!metaItem || !metaItem.name) {
        return { cleanAssets, meta: {} };
    }

    try {
        const parsed = JSON.parse(metaItem.name) as OnlineMeetingMeta;
        return { cleanAssets, meta: parsed || {} };
    } catch {
        return { cleanAssets, meta: {} };
    }
}

export async function createGoogleCalendarEventApi(
    payload: {
        title: string;
        description?: string;
        date: string; // yyyy-MM-dd
        startTime?: string;
        endTime?: string;
        attendeeEmails?: string[];
        createMeet?: boolean;
        customMeetUrl?: string;
        sendInviteEmails?: boolean;
    },
    accessToken?: string | null
): Promise<{
    eventId: string;
    htmlLink: string;
    meetUrl: string;
    status?: string;
}> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch('/api/calendar/events', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถสร้างนัดหมายใน Google Calendar ได้');
    }
    return data;
}

export async function updateGoogleCalendarEventApi(
    eventId: string,
    payload: {
        title?: string;
        description?: string;
        date?: string; // yyyy-MM-dd
        startTime?: string;
        endTime?: string;
        attendeeEmails?: string[];
        createMeet?: boolean;
        customMeetUrl?: string;
        sendInviteEmails?: boolean;
    },
    accessToken?: string | null
): Promise<{
    eventId: string;
    htmlLink: string;
    meetUrl: string;
    status?: string;
}> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(`/api/calendar/events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'ไม่สามารถอัปเดตนัดหมายใน Google Calendar ได้');
    }
    return data;
}

export async function deleteGoogleCalendarEventApi(
    eventId: string,
    sendInviteEmails: boolean = true,
    accessToken?: string | null
): Promise<boolean> {
    const headers: Record<string, string> = {};
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const res = await fetch(
        `/api/calendar/events/${encodeURIComponent(eventId)}?sendUpdates=${sendInviteEmails ? 'all' : 'none'}`,
        {
            method: 'DELETE',
            credentials: 'same-origin',
            headers
        }
    );

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'ไม่สามารถลบนัดหมายจาก Google Calendar ได้');
    }
    return true;
}
