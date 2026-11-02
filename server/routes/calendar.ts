import express from 'express';
import { google } from 'googleapis';
import { getGoogleOAuthClient } from '../utils/google-client.js';
import { BRAND_CONFIG } from '../../config/brand.js';

const router = express.Router();

function resolveAuthClient(req: express.Request) {
    const authClient = getGoogleOAuthClient(req);
    const sessionTokens = (req.session as any)?.tokens;
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (sessionTokens && (sessionTokens.access_token || sessionTokens.refresh_token)) {
        authClient.setCredentials(sessionTokens);
        return authClient;
    }

    if (bearerToken) {
        authClient.setCredentials({ access_token: bearerToken });
        return authClient;
    }

    return null;
}

function normalizeTime(timeStr: string | undefined, fallback: string): string {
    if (!timeStr || typeof timeStr !== 'string') return fallback;
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return fallback;
    const hh = String(Math.min(23, Math.max(0, parseInt(match[1], 10)))).padStart(2, '0');
    const mm = String(Math.min(59, Math.max(0, parseInt(match[2], 10)))).padStart(2, '0');
    return `${hh}:${mm}`;
}

function computeEndTime(startTime: string, endTime?: string): string {
    const normStart = normalizeTime(startTime, '09:00');
    const normEnd = normalizeTime(endTime, '');
    if (normEnd && normEnd > normStart) {
        return normEnd;
    }
    const [h, m] = normStart.split(':').map(Number);
    const nextHour = Math.min(23, h + 1);
    const nextMin = nextHour === h ? 59 : m;
    return `${String(nextHour).padStart(2, '0')}:${String(nextMin).padStart(2, '0')}`;
}

function sanitizeEmails(emails: unknown): { email: string }[] {
    if (!Array.isArray(emails)) return [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const unique = new Set<string>();
    for (const raw of emails) {
        if (typeof raw === 'string') {
            const clean = raw.trim().toLowerCase();
            if (emailRegex.test(clean)) {
                unique.add(clean);
            }
        }
    }
    return Array.from(unique).map(email => ({ email }));
}

// 1. Create Google Calendar Event (with optional Google Meet generation)
router.post('/api/calendar/events', async (req, res) => {
    const authClient = resolveAuthClient(req);
    if (!authClient) {
        return res.status(401).json({
            error: 'ยังไม่ได้เชื่อมต่อบัญชี Google กรุณาเชื่อมต่อบัญชีก่อนสร้างนัดหมายอัตโนมัติ'
        });
    }

    try {
        const {
            title,
            description,
            date,
            startTime,
            endTime,
            attendeeEmails,
            createMeet = true,
            customMeetUrl,
            sendInviteEmails = true,
            timeZone = 'Asia/Bangkok'
        } = req.body || {};

        if (!title || !date) {
            return res.status(400).json({ error: 'กรุณาระบุหัวข้อการประชุมและวันที่' });
        }

        const cleanDate = String(date).slice(0, 10);
        const normStart = normalizeTime(startTime, '09:00');
        const normEnd = computeEndTime(normStart, endTime);

        const startDateTime = `${cleanDate}T${normStart}:00+07:00`;
        const endDateTime = `${cleanDate}T${normEnd}:00+07:00`;

        const attendees = sanitizeEmails(attendeeEmails);

        const descLines = [
            description || `นัดหมายการประชุมจาก ${BRAND_CONFIG.name}`,
        ];
        if (!createMeet && customMeetUrl) {
            descLines.push(`\n🔗 ลิงก์เข้าร่วมประชุมออนไลน์: ${customMeetUrl}`);
        }

        const requestBody: any = {
            summary: title,
            description: descLines.join('\n'),
            start: {
                dateTime: startDateTime,
                timeZone
            },
            end: {
                dateTime: endDateTime,
                timeZone
            },
            attendees,
            guestsCanModify: false,
            guestsCanInviteOthers: true,
            guestsCanSeeOtherGuests: true
        };

        if (!createMeet && customMeetUrl) {
            requestBody.location = customMeetUrl;
        }

        if (createMeet) {
            requestBody.conferenceData = {
                createRequest: {
                    requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            };
        }

        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const response = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: createMeet ? 1 : 0,
            sendUpdates: sendInviteEmails && attendees.length > 0 ? 'all' : 'none',
            requestBody
        });

        const eventData = response.data;
        const videoEntry = eventData.conferenceData?.entryPoints?.find(
            (ep: any) => ep.entryPointType === 'video'
        );
        const generatedMeetUrl = eventData.hangoutLink || videoEntry?.uri || customMeetUrl || '';

        return res.json({
            eventId: eventData.id,
            htmlLink: eventData.htmlLink,
            meetUrl: generatedMeetUrl,
            status: eventData.status
        });
    } catch (error: any) {
        console.error('Google Calendar create event error:', error);
        const googleMsg = error?.response?.data?.error?.message || error?.message || 'สร้างนัดหมายใน Google Calendar ไม่สำเร็จ';
        const status = error?.code === 401 || error?.response?.status === 401 ? 401 : 500;
        return res.status(status).json({
            error: googleMsg
        });
    }
});

// 2. Update Google Calendar Event
router.patch('/api/calendar/events/:eventId', async (req, res) => {
    const authClient = resolveAuthClient(req);
    if (!authClient) {
        return res.status(401).json({
            error: 'ยังไม่ได้เชื่อมต่อบัญชี Google กรุณาเชื่อมต่อบัญชีก่อนซิงค์การแก้ไข'
        });
    }

    const { eventId } = req.params;
    if (!eventId) {
        return res.status(400).json({ error: 'ไม่พบรหัสอีเวนต์ Google Calendar' });
    }

    try {
        const {
            title,
            description,
            date,
            startTime,
            endTime,
            attendeeEmails,
            createMeet = false,
            customMeetUrl,
            sendInviteEmails = true,
            timeZone = 'Asia/Bangkok'
        } = req.body || {};

        const requestBody: any = {};

        if (title !== undefined) {
            requestBody.summary = title;
        }

        if (description !== undefined || customMeetUrl !== undefined) {
            const descLines = [description || `นัดหมายการประชุมจาก ${BRAND_CONFIG.name}`];
            if (customMeetUrl && !createMeet) {
                descLines.push(`\n🔗 ลิงก์เข้าร่วมประชุมออนไลน์: ${customMeetUrl}`);
                requestBody.location = customMeetUrl;
            }
            requestBody.description = descLines.join('\n');
        }

        if (date) {
            const cleanDate = String(date).slice(0, 10);
            const normStart = normalizeTime(startTime, '09:00');
            const normEnd = computeEndTime(normStart, endTime);
            requestBody.start = {
                dateTime: `${cleanDate}T${normStart}:00+07:00`,
                timeZone
            };
            requestBody.end = {
                dateTime: `${cleanDate}T${normEnd}:00+07:00`,
                timeZone
            };
        }

        if (attendeeEmails !== undefined) {
            requestBody.attendees = sanitizeEmails(attendeeEmails);
        }

        if (createMeet) {
            requestBody.conferenceData = {
                createRequest: {
                    requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            };
        }

        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId,
            conferenceDataVersion: createMeet ? 1 : 0,
            sendUpdates: sendInviteEmails ? 'all' : 'none',
            requestBody
        });

        const eventData = response.data;
        const videoEntry = eventData.conferenceData?.entryPoints?.find(
            (ep: any) => ep.entryPointType === 'video'
        );
        const meetUrl = eventData.hangoutLink || videoEntry?.uri || customMeetUrl || '';

        return res.json({
            eventId: eventData.id,
            htmlLink: eventData.htmlLink,
            meetUrl,
            status: eventData.status
        });
    } catch (error: any) {
        console.error('Google Calendar update event error:', error);
        const googleMsg = error?.response?.data?.error?.message || error?.message || 'อัปเดตนัดหมายใน Google Calendar ไม่สำเร็จ';
        const status = error?.code === 401 || error?.response?.status === 401 ? 401 : 500;
        return res.status(status).json({
            error: googleMsg
        });
    }
});

// 3. Delete Google Calendar Event
router.delete('/api/calendar/events/:eventId', async (req, res) => {
    const authClient = resolveAuthClient(req);
    if (!authClient) {
        return res.status(401).json({
            error: 'ยังไม่ได้เชื่อมต่อบัญชี Google'
        });
    }

    const { eventId } = req.params;
    if (!eventId) {
        return res.status(400).json({ error: 'ไม่พบรหัสอีเวนต์ Google Calendar' });
    }

    try {
        const sendInviteEmails = req.query.sendUpdates !== 'none';
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        await calendar.events.delete({
            calendarId: 'primary',
            eventId,
            sendUpdates: sendInviteEmails ? 'all' : 'none'
        });

        return res.json({ success: true });
    } catch (error: any) {
        // If already deleted on Google Calendar (404 / 410), treat as success
        const code = error?.code || error?.response?.status;
        if (code === 404 || code === 410) {
            return res.json({ success: true, alreadyDeleted: true });
        }
        console.error('Google Calendar delete event error:', error);
        const googleMsg = error?.response?.data?.error?.message || error?.message || 'ลบนัดหมายใน Google Calendar ไม่สำเร็จ';
        return res.status(code === 401 ? 401 : 500).json({
            error: googleMsg
        });
    }
});

export default router;
