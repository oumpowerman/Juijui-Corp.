import Papa from 'papaparse';
import { format, isValid, parse, differenceInCalendarDays } from 'date-fns';
import { Task, Channel, Platform, TaskAsset } from '../types';

/**
 * Official Metricool CSV Bulk Upload Template Columns
 */
export const METRICOOL_CSV_HEADERS = [
    'Text',
    'Date',
    'Time',
    'Draft',
    'Brand Name',
    'Facebook',
    'Twitter/X',
    'LinkedIn',
    'GBP',
    'Instagram',
    'Pinterest',
    'TikTok',
    'YouTube',
    'Threads',
    'Bluesky',
    'Picture Url 1',
    'Picture Url 2',
    'Picture Url 3',
    'Picture Url 4',
    'Picture Url 5',
    'Picture Url 6',
    'Picture Url 7',
    'Picture Url 8',
    'Picture Url 9',
    'Picture Url 10',
    'Alt text picture 1',
    'Alt text picture 2',
    'Alt text picture 3',
    'Alt text picture 4',
    'Alt text picture 5',
    'Alt text picture 6',
    'Alt text picture 7',
    'Alt text picture 8',
    'Alt text picture 9',
    'Alt text picture 10',
    'Document title',
    'Shortener',
    'Video Thumbnail Url',
    'Video Cover Frame',
    'Twitter/X Can reply',
    'Twitter/X Type',
    'Twitter/X Poll Duration minutes',
    'Twitter/X Poll Option 1',
    'Twitter/X Poll Option 2',
    'Twitter/X Poll Option 3',
    'Twitter/X Poll Option 4',
    'Pinterest Board',
    'Pinterest Pin Title',
    'Pinterest Pin Link',
    'Pinterest Pin New Format',
    'Instagram Post Type',
    'Instagram Show Reel On Feed',
    'YouTube Video Title',
    'YouTube Video Type',
    'YouTube Video Privacy',
    'YouTube video for kids',
    'YouTube Video Category',
    'YouTube Video Tags',
    'YouTube Playlist',
    'YouTube Notify Subscribers',
    'GBP Post Type',
    'Facebook Post Type',
    'Facebook Title',
    'TikTok Title',
    'TikTok disable comments',
    'First Comment Text'
] as const;

export interface MetricoolExportOptions {
    defaultTime?: string; // e.g. '18:00:00'
    importAsDraft?: 'AUTO' | 'ALWAYS_DRAFT' | 'ALWAYS_SCHEDULED';
    youtubePrivacy?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
    includeTagsInCaption?: boolean;
}

export interface ParsedMetricoolRow {
    rowIndex: number;
    rawRow: Record<string, string>;
    title: string;
    description: string;
    tags: string[];
    dateStr: string; // YYYY-MM-DD
    parsedDate: Date;
    scheduledTime: string; // HH:mm
    isDraft: boolean;
    brandName: string;
    matchedChannelId?: string;
    targetPlatforms: Platform[];
    contentFormats: string[];
    mediaUrls: string[];
    thumbnailUrl?: string;
    publishedUrl?: string;
    // Matching state
    action: 'UPDATE' | 'CREATE' | 'SKIP';
    matchedTaskId?: string | null;
    matchType?: 'EXACT' | 'THAI_FUZZY' | 'AI_SEMANTIC' | 'MANUAL' | 'NONE';
    matchConfidence?: number; // 0-100
    matchReason?: string;
}

/**
 * Normalizes a caption from Task description + tags (while using Task title as clip title)
 */
export function buildCaptionFromTask(task: Task, includeTags = true): string {
    const baseText = (task.description || '').trim() || (task.title || '').trim();
    if (!includeTags || !Array.isArray(task.tags) || task.tags.length === 0) {
        return baseText;
    }

    const existingLower = baseText.toLowerCase();
    const formattedTags = task.tags
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '_')}`))
        .filter(hashTag => !existingLower.includes(hashTag.toLowerCase()));

    if (formattedTags.length === 0) return baseText;
    return `${baseText}\n\n${formattedTags.join(' ')}`;
}

/**
 * Infers Metricool Instagram/Facebook/YouTube post types from Task.contentFormats
 */
export function resolveMetricoolFormatTypes(contentFormats?: string[]) {
    const formats = (contentFormats || []).map(f => f.toUpperCase());
    const isReelOrShort = formats.some(f =>
        f.includes('SHORT') || f.includes('REEL') || f.includes('TIKTOK') || f.includes('VERTICAL')
    );
    const isStory = formats.some(f => f.includes('STORY'));

    const instagramPostType = isStory ? 'STORY' : isReelOrShort ? 'REEL' : 'POST';
    const facebookPostType = isStory ? 'STORY' : isReelOrShort ? 'REEL' : 'POST';
    const youtubeVideoType = isReelOrShort ? 'SHORT' : 'VIDEO';

    return {
        instagramPostType,
        facebookPostType,
        youtubeVideoType
    };
}

/**
 * Converts an array of CalendarView Tasks into Metricool CSV string (UTF-8 with BOM)
 */
export function generateMetricoolCsvFromTasks(
    tasks: Task[],
    channels: Channel[],
    options: MetricoolExportOptions = {}
): string {
    const {
        defaultTime = '18:00:00',
        importAsDraft = 'AUTO',
        youtubePrivacy = 'PUBLIC',
        includeTagsInCaption = true
    } = options;

    const channelMap = new Map<string, Channel>();
    channels.forEach(ch => channelMap.set(ch.id, ch));

    const rows = tasks.map(task => {
        const channel = task.channelId ? channelMap.get(task.channelId) : undefined;
        const caption = buildCaptionFromTask(task, includeTagsInCaption);

        // Date (YYYY-MM-DD)
        const taskDate = task.endDate instanceof Date && isValid(task.endDate)
            ? task.endDate
            : new Date(task.endDate || Date.now());
        const dateFormatted = format(taskDate, 'yyyy-MM-dd');

        // Time (HH:mm:ss)
        let timeFormatted = defaultTime;
        if (task.scheduledTime && /^\d{1,2}:\d{2}/.test(task.scheduledTime.trim())) {
            const parts = task.scheduledTime.trim().split(':');
            const hh = parts[0].padStart(2, '0');
            const mm = parts[1].padStart(2, '0');
            const ss = parts[2] ? parts[2].padStart(2, '0') : '00';
            timeFormatted = `${hh}:${mm}:${ss}`;
        }

        // Draft boolean
        let isDraft = false;
        if (importAsDraft === 'ALWAYS_DRAFT') {
            isDraft = true;
        } else if (importAsDraft === 'ALWAYS_SCHEDULED') {
            isDraft = false;
        } else {
            const statusUpper = String(task.status || '').toUpperCase();
            isDraft = !['FINAL', 'APPROVE', 'APPROVED', 'DONE', 'COMPLETED'].includes(statusUpper);
        }

        // Target social networks
        const platforms = (task.targetPlatforms || []).map(p => p.toUpperCase());
        const hasAll = platforms.includes('ALL');
        const hasFacebook = hasAll || platforms.includes('FACEBOOK');
        const hasInstagram = hasAll || platforms.includes('INSTAGRAM');
        const hasTikTok = hasAll || platforms.includes('TIKTOK');
        const hasYouTube = hasAll || platforms.includes('YOUTUBE');

        // Media URLs from task.assets
        const assets: TaskAsset[] = Array.isArray(task.assets) ? task.assets : [];
        const mediaAssets = assets.filter(
            a => a.url && (a.category === 'VIDEO_DRAFT' || a.category === 'LINK' || a.category === 'OTHER')
        );
        const thumbnailAsset = assets.find(a => a.url && a.category === 'THUMBNAIL');

        const { instagramPostType, facebookPostType, youtubeVideoType } =
            resolveMetricoolFormatTypes(task.contentFormats);

        const cleanTitle = (task.title || '').trim().slice(0, 100);
        const youtubeTags = Array.isArray(task.tags)
            ? task.tags.map(t => t.replace(/^#/, '').trim()).filter(Boolean).join(', ')
            : '';

        const rowObj: Record<string, string> = {};
        METRICOOL_CSV_HEADERS.forEach(h => {
            rowObj[h] = '';
        });

        rowObj['Text'] = caption;
        rowObj['Date'] = dateFormatted;
        rowObj['Time'] = timeFormatted;
        rowObj['Draft'] = isDraft ? 'true' : 'false';
        rowObj['Brand Name'] = channel?.name || '';

        rowObj['Facebook'] = hasFacebook ? 'TRUE' : 'FALSE';
        rowObj['Twitter/X'] = 'FALSE';
        rowObj['LinkedIn'] = 'FALSE';
        rowObj['GBP'] = 'FALSE';
        rowObj['Instagram'] = hasInstagram ? 'TRUE' : 'FALSE';
        rowObj['Pinterest'] = 'FALSE';
        rowObj['TikTok'] = hasTikTok ? 'TRUE' : 'FALSE';
        rowObj['YouTube'] = hasYouTube ? 'TRUE' : 'FALSE';
        rowObj['Threads'] = 'FALSE';
        rowObj['Bluesky'] = 'FALSE';

        mediaAssets.slice(0, 10).forEach((asset, idx) => {
            rowObj[`Picture Url ${idx + 1}`] = asset.url;
        });

        if (thumbnailAsset?.url) {
            rowObj['Video Thumbnail Url'] = thumbnailAsset.url;
        }

        if (hasInstagram) {
            rowObj['Instagram Post Type'] = instagramPostType;
            rowObj['Instagram Show Reel On Feed'] = 'true';
        }

        if (hasYouTube) {
            rowObj['YouTube Video Title'] = cleanTitle;
            rowObj['YouTube Video Type'] = youtubeVideoType;
            rowObj['YouTube Video Privacy'] = youtubePrivacy;
            rowObj['YouTube video for kids'] = 'false';
            rowObj['YouTube Video Tags'] = youtubeTags;
            rowObj['YouTube Notify Subscribers'] = 'true';
        }

        if (hasFacebook) {
            rowObj['Facebook Post Type'] = facebookPostType;
            rowObj['Facebook Title'] = cleanTitle;
        }

        if (hasTikTok) {
            rowObj['TikTok Title'] = cleanTitle;
            rowObj['TikTok disable comments'] = 'false';
        }

        return rowObj;
    });

    const csvBody = Papa.unparse({
        fields: [...METRICOOL_CSV_HEADERS],
        data: rows
    });

    // Prepend UTF-8 BOM so Thai characters & emojis render properly in Excel and Metricool
    return '\uFEFF' + csvBody;
}

/**
 * Triggers browser download of the generated Metricool CSV file
 */
export function downloadMetricoolCsv(csvContent: string, filename?: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `metricool-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================================================
// THAI FUZZY & SKELETON SIMILARITY ENGINE (Stage 1 Local Matcher)
// ============================================================================

/**
 * Normalizes text for exact comparison (lowercase, remove hashtags, emojis, punctuation)
 */
export function normalizeTitleText(input: string): string {
    if (!input) return '';
    return input
        .toLowerCase()
        .replace(/#[^\s#]+/g, '') // strip hashtags
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '') // strip emojis
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '') // keep letters, marks, numbers
        .trim();
}

/**
 * Strips Thai vowels & tone marks (`ั ิ ี ึ ื ุ ู ็ ่ ้ ๊ ๋ ์ ำ ะ า เ แ โ ใ ไ`)
 * so that missing vowels or tone typos still match the consonant skeleton!
 */
export function toThaiConsonantSkeleton(input: string): string {
    const base = normalizeTitleText(input);
    return base.replace(/[\u0E30-\u0E3A\u0E40-\u0E4E]/g, '');
}

/**
 * Computes Sørensen–Dice coefficient on character bigrams (0 to 1)
 */
export function computeBigramSimilarity(a: string, b: string): number {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) {
        return a === b ? 1 : 0;
    }

    const bigramsA = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
        const bg = a.slice(i, i + 2);
        bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bg = b.slice(i, i + 2);
        const count = bigramsA.get(bg) || 0;
        if (count > 0) {
            bigramsA.set(bg, count - 1);
            intersection++;
        }
    }

    return (2.0 * intersection) / (a.length - 1 + (b.length - 1));
}

/**
 * Computes Levenshtein edit distance between two strings
 */
export function computeLevenshteinSimilarity(a: string, b: string): number {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    if (a === b) return 1;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = i - 1;
        dp[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const temp = dp[j];
            if (a[i - 1] === b[j - 1]) {
                dp[j] = prev;
            } else {
                dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
            }
            prev = temp;
        }
    }

    return Math.max(0, 1 - dp[b.length] / maxLen);
}

/**
 * Calculates overall Thai-aware similarity score (0 to 100) between a CSV row title/caption
 * and an existing CalendarView Task.
 */
export function scoreThaiTaskMatch(
    csvTitle: string,
    csvCaption: string,
    csvDate: Date,
    task: Task
): { score: number; matchType: 'EXACT' | 'THAI_FUZZY' | 'NONE'; reason: string } {
    const taskDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    const dayDiff = Math.abs(differenceInCalendarDays(csvDate, taskDate));

    // Only consider tasks within +/- 5 days
    if (dayDiff > 5) {
        return { score: 0, matchType: 'NONE', reason: '' };
    }

    const normCsvTitle = normalizeTitleText(csvTitle);
    const normTaskTitle = normalizeTitleText(task.title);

    if (!normCsvTitle || !normTaskTitle) {
        return { score: 0, matchType: 'NONE', reason: '' };
    }

    // 1. Exact normalized match on same day (or +/- 2 days)
    if (normCsvTitle === normTaskTitle && dayDiff <= 2) {
        return {
            score: dayDiff === 0 ? 100 : 96,
            matchType: 'EXACT',
            reason: dayDiff === 0 ? 'ชื่อคลิปและวันที่ตรงกัน 100%' : `ชื่อคลิปตรงกัน 100% (ขยับวัน ${dayDiff} วัน)`
        };
    }

    // 2. Thai Consonant Skeleton Match (handles missing vowels/tone marks!)
    const skelCsv = toThaiConsonantSkeleton(csvTitle);
    const skelTask = toThaiConsonantSkeleton(task.title);

    if (skelCsv.length >= 4 && skelCsv === skelTask && dayDiff <= 3) {
        return {
            score: dayDiff === 0 ? 95 : 90,
            matchType: 'THAI_FUZZY',
            reason: 'โครงพยัญชนะไทยตรงกัน (ตรวจพบสระหรือวรรณยุกต์ตกหล่นเล็กน้อย)'
        };
    }

    // 3. Substring containment (e.g. Task title is inside CSV caption or vice versa)
    const normCaption = normalizeTitleText(csvCaption);
    if (normTaskTitle.length >= 6 && (normCsvTitle.includes(normTaskTitle) || normTaskTitle.includes(normCsvTitle) || normCaption.includes(normTaskTitle))) {
        if (dayDiff <= 2) {
            return {
                score: dayDiff === 0 ? 89 : 84,
                matchType: 'THAI_FUZZY',
                reason: 'ชื่อการ์ดงานปรากฏอยู่ในพาดหัว/แคปชันของ Metricool ในช่วงวันเดียวกัน'
            };
        }
    }

    // 4. Combined Levenshtein + Skeleton similarity
    const fullLev = computeLevenshteinSimilarity(normCsvTitle, normTaskTitle);
    const skelLev = skelCsv && skelTask ? computeLevenshteinSimilarity(skelCsv, skelTask) : 0;
    const bigramSim = computeBigramSimilarity(normCsvTitle, normTaskTitle);

    const bestTextSim = Math.max(fullLev, skelLev * 0.97, bigramSim);
    const datePenalty = dayDiff * 0.05; // -5% per day difference
    const finalScore = Math.round(Math.max(0, (bestTextSim - datePenalty) * 100));

    if (finalScore >= 75) {
        return {
            score: finalScore,
            matchType: 'THAI_FUZZY',
            reason: `ชื่อคล้ายคลึงกัน ${finalScore}%${dayDiff === 0 ? ' (วันเดียวกัน)' : ` (ห่างกัน ${dayDiff} วัน)`}`
        };
    }

    return { score: finalScore, matchType: 'NONE', reason: '' };
}

// ============================================================================
// FLEXIBLE METRICOOL CSV PARSER (Handles Template & Planner/History Exports)
// ============================================================================

function findHeaderValue(row: Record<string, any>, candidateKeys: string[]): string {
    const rowKeys = Object.keys(row);
    for (const candidate of candidateKeys) {
        const exact = row[candidate];
        if (exact !== undefined && exact !== null && String(exact).trim() !== '') {
            return String(exact).trim();
        }
        const foundKey = rowKeys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
            return String(row[foundKey]).trim();
        }
    }
    return '';
}

function parseFlexibleDateAndTime(dateRaw: string, timeRaw: string): { parsedDate: Date; dateStr: string; scheduledTime: string } {
    let parsedDate = new Date();
    let scheduledTime = '18:00';

    const cleanDateRaw = (dateRaw || '').trim();
    const cleanTimeRaw = (timeRaw || '').trim();

    // If Date column already contains both Date and Time (e.g. "2026-11-05 18:30:00" or "05/11/2026 18:30")
    let datePart = cleanDateRaw;
    let embeddedTimePart = '';
    if (cleanDateRaw.includes(' ') || cleanDateRaw.includes('T')) {
        const splitParts = cleanDateRaw.split(/[ T]+/);
        datePart = splitParts[0];
        embeddedTimePart = splitParts.slice(1).join(' ');
    }

    const patterns = [
        'yyyy-MM-dd',
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'yyyy/MM/dd',
        'd/M/yyyy',
        'dd-MM-yyyy'
    ];

    let foundValidDate = false;
    for (const pattern of patterns) {
        const d = parse(datePart, pattern, new Date());
        if (isValid(d) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
            parsedDate = d;
            foundValidDate = true;
            break;
        }
    }

    if (!foundValidDate) {
        const fallback = new Date(cleanDateRaw);
        if (isValid(fallback)) {
            parsedDate = fallback;
        }
    }

    // Normalize Buddhist Era year (e.g. 2569 -> 2026) if present
    if (parsedDate.getFullYear() >= 2500) {
        parsedDate.setFullYear(parsedDate.getFullYear() - 543);
    }

    const effectiveTimeRaw = cleanTimeRaw || embeddedTimePart;
    if (effectiveTimeRaw) {
        const amPmMatch = effectiveTimeRaw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
        if (amPmMatch) {
            let hh = parseInt(amPmMatch[1], 10);
            const mm = amPmMatch[2];
            const period = amPmMatch[3].toUpperCase();
            if (period === 'PM' && hh < 12) hh += 12;
            if (period === 'AM' && hh === 12) hh = 0;
            scheduledTime = `${String(hh).padStart(2, '0')}:${mm}`;
        } else {
            const timeMatch = effectiveTimeRaw.match(/(\d{1,2}):(\d{2})/);
            if (timeMatch) {
                scheduledTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
            }
        }
    }

    return {
        parsedDate,
        dateStr: format(parsedDate, 'yyyy-MM-dd'),
        scheduledTime
    };
}

function isTruthyCsvFlag(val: string): boolean {
    const v = (val || '').trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes' || v === 'y' || v === 'checked';
}

function extractHashtags(text: string): string[] {
    if (!text) return [];
    const matches = text.match(/#([^\s#.,!?;:()[\]{}"']+)/g) || [];
    return Array.from(new Set(matches.map(m => m.replace(/^#/, '').trim()).filter(Boolean)));
}

/**
 * Parses a Metricool CSV file and performs Stage 1 Local Thai Fuzzy Matching against existing Tasks
 */
export function parseMetricoolCsvText(
    csvText: string,
    existingTasks: Task[],
    channels: Channel[],
    defaultChannelId?: string
): { headers: string[]; rows: ParsedMetricoolRow[] } {
    const parsed = Papa.parse<Record<string, any>>(csvText, {
        header: true,
        skipEmptyLines: true
    });

    const headers = parsed.meta.fields || [];
    const contentTasks = existingTasks.filter(t => t.type === 'CONTENT');

    const rows: ParsedMetricoolRow[] = (parsed.data || [])
        .map((rawRow, idx): ParsedMetricoolRow | null => {
            const caption = findHeaderValue(rawRow, [
                'Text',
                'Caption',
                'Content',
                'Message',
                'Description',
                'Post Text',
                'รายละเอียด',
                'แคปชัน'
            ]);

            const explicitTitle = findHeaderValue(rawRow, [
                'YouTube Video Title',
                'Facebook Title',
                'TikTok Title',
                'Title',
                'Post Title',
                'Video Title',
                'ชื่อคลิป',
                'หัวข้อ'
            ]);

            const dateRaw = findHeaderValue(rawRow, [
                'Date',
                'Publication Date',
                'Scheduled Date',
                'Publish Date',
                'Created',
                'วันที่'
            ]);

            const timeRaw = findHeaderValue(rawRow, [
                'Time',
                'Publication Time',
                'Scheduled Time',
                'เวลา'
            ]);

            // Skip completely blank or instruction/example header rows
            if (!caption && !explicitTitle && !dateRaw) {
                return null;
            }

            // Derive concise title from explicitTitle or first non-empty line of caption
            let derivedTitle = explicitTitle;
            if (!derivedTitle && caption) {
                const firstLine = caption
                    .split(/\r?\n/)
                    .map(l => l.replace(/#[^\s#]+/g, '').trim())
                    .find(Boolean) || caption.trim();
                derivedTitle = firstLine.length > 85 ? firstLine.slice(0, 85).trim() + '...' : firstLine;
            }
            if (!derivedTitle) {
                derivedTitle = `คอนเทนต์จาก Metricool #${idx + 1}`;
            }

            const { parsedDate, dateStr, scheduledTime } = parseFlexibleDateAndTime(dateRaw, timeRaw);

            // Detect Brand / Channel
            const brandName = findHeaderValue(rawRow, ['Brand Name', 'Brand', 'Channel', 'Account', 'ช่อง']);
            let matchedChannelId = defaultChannelId || '';
            if (brandName) {
                const normBrand = brandName.toLowerCase().trim();
                const matchedCh = channels.find(
                    c =>
                        c.name.toLowerCase().trim() === normBrand ||
                        (c.code && c.code.toLowerCase().trim() === normBrand) ||
                        c.name.toLowerCase().includes(normBrand) ||
                        normBrand.includes(c.name.toLowerCase())
                );
                if (matchedCh) {
                    matchedChannelId = matchedCh.id;
                }
            }

            // Detect Target Platforms
            const targetPlatforms: Platform[] = [];
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['Facebook']))) targetPlatforms.push('FACEBOOK');
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['Instagram']))) targetPlatforms.push('INSTAGRAM');
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['TikTok', 'Tiktok']))) targetPlatforms.push('TIKTOK');
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['YouTube', 'Youtube']))) targetPlatforms.push('YOUTUBE');

            // Also support single "Network" / "Platform" column from Metricool History/Analytics exports
            const networkCol = findHeaderValue(rawRow, ['Network', 'Networks', 'Platform', 'Social Network']).toUpperCase();
            if (networkCol) {
                if (networkCol.includes('FACEBOOK') || networkCol.includes('FB')) {
                    if (!targetPlatforms.includes('FACEBOOK')) targetPlatforms.push('FACEBOOK');
                }
                if (networkCol.includes('INSTAGRAM') || networkCol.includes('IG')) {
                    if (!targetPlatforms.includes('INSTAGRAM')) targetPlatforms.push('INSTAGRAM');
                }
                if (networkCol.includes('TIKTOK')) {
                    if (!targetPlatforms.includes('TIKTOK')) targetPlatforms.push('TIKTOK');
                }
                if (networkCol.includes('YOUTUBE') || networkCol.includes('YT')) {
                    if (!targetPlatforms.includes('YOUTUBE')) targetPlatforms.push('YOUTUBE');
                }
            }

            // Detect Content Formats
            const contentFormats: string[] = [];
            const igType = findHeaderValue(rawRow, ['Instagram Post Type']).toUpperCase();
            const fbType = findHeaderValue(rawRow, ['Facebook Post Type']).toUpperCase();
            const ytType = findHeaderValue(rawRow, ['YouTube Video Type']).toUpperCase();
            const postTypeGeneric = findHeaderValue(rawRow, ['Type', 'Post Type', 'Format']).toUpperCase();

            if ([igType, fbType, ytType, postTypeGeneric].some(t => t.includes('REEL') || t.includes('SHORT'))) {
                contentFormats.push('SHORT_FORM');
            } else if ([igType, fbType, postTypeGeneric].some(t => t.includes('STORY'))) {
                contentFormats.push('STORY');
            } else if ([igType, fbType, postTypeGeneric].some(t => t.includes('CAROUSEL') || t.includes('ALBUM'))) {
                contentFormats.push('ALBUM');
            } else if (ytType === 'VIDEO') {
                contentFormats.push('LONG_FORM');
            }

            // Extract Media URLs
            const mediaUrls: string[] = [];
            for (let i = 1; i <= 10; i++) {
                const picUrl = findHeaderValue(rawRow, [`Picture Url ${i}`, `Media Url ${i}`, `Image ${i}`]);
                if (picUrl) mediaUrls.push(picUrl);
            }
            const singleMediaUrl = findHeaderValue(rawRow, ['Media', 'Media URL', 'Video URL', 'Image URL']);
            if (singleMediaUrl && !mediaUrls.includes(singleMediaUrl)) {
                mediaUrls.push(singleMediaUrl);
            }

            const thumbnailUrl = findHeaderValue(rawRow, ['Video Thumbnail Url', 'Thumbnail', 'Cover URL']);
            const publishedUrl = findHeaderValue(rawRow, ['Link', 'Permalink', 'Post URL', 'URL']);

            // Extract Tags from Caption + YouTube Video Tags
            const ytTagsRaw = findHeaderValue(rawRow, ['YouTube Video Tags', 'Tags']);
            const ytTags = ytTagsRaw
                ? ytTagsRaw.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
                : [];
            const captionTags = extractHashtags(caption);
            const mergedTags = Array.from(new Set([...ytTags, ...captionTags]));

            const isDraft = isTruthyCsvFlag(findHeaderValue(rawRow, ['Draft']));

            // Stage 1: Local Thai Fuzzy Matching against existing contentTasks
            let bestTask: Task | null = null;
            let bestScore = 0;
            let bestMatchType: 'EXACT' | 'THAI_FUZZY' | 'NONE' = 'NONE';
            let bestReason = '';

            for (const candidate of contentTasks) {
                // If channel is specified on both and they differ, apply small penalty but still check
                const channelMatches = !matchedChannelId || !candidate.channelId || matchedChannelId === candidate.channelId;
                const result = scoreThaiTaskMatch(derivedTitle, caption, parsedDate, candidate);
                const adjustedScore = channelMatches ? result.score : Math.max(0, result.score - 8);

                if (adjustedScore > bestScore && result.matchType !== 'NONE') {
                    bestScore = adjustedScore;
                    bestTask = candidate;
                    bestMatchType = result.matchType;
                    bestReason = result.reason;
                }
            }

            const shouldAutoMatch = bestTask && bestScore >= 78;

            return {
                rowIndex: idx,
                rawRow,
                title: derivedTitle,
                description: caption || derivedTitle,
                tags: mergedTags,
                dateStr,
                parsedDate,
                scheduledTime,
                isDraft,
                brandName,
                matchedChannelId: matchedChannelId || (bestTask?.channelId ?? ''),
                targetPlatforms: targetPlatforms.length > 0 ? targetPlatforms : (bestTask?.targetPlatforms || []),
                contentFormats: contentFormats.length > 0 ? contentFormats : (bestTask?.contentFormats || ['SHORT_FORM']),
                mediaUrls,
                thumbnailUrl: thumbnailUrl || undefined,
                publishedUrl: publishedUrl || undefined,
                action: shouldAutoMatch ? 'UPDATE' : 'CREATE',
                matchedTaskId: shouldAutoMatch && bestTask ? bestTask.id : null,
                matchType: shouldAutoMatch ? bestMatchType : 'NONE',
                matchConfidence: shouldAutoMatch ? bestScore : 0,
                matchReason: shouldAutoMatch ? bestReason : undefined
            };
        })
        .filter((r): r is ParsedMetricoolRow => r !== null);

    return { headers, rows };
}

/**
 * Stage 2: Requests Gemini AI Semantic Matching for rows that were not 100% matched locally
 * or where Thai vowels/tones/hooks differed significantly.
 */
export async function requestAiMetricoolMatch(
    rows: ParsedMetricoolRow[],
    existingTasks: Task[]
): Promise<{
    rowIndex: number;
    matchedTaskId: string | null;
    confidence: number;
    reason: string;
}[]> {
    const contentTasks = existingTasks.filter(t => t.type === 'CONTENT');
    if (rows.length === 0 || contentTasks.length === 0) return [];

    // Filter candidate tasks within +/- 10 days of any CSV row date to keep payload lean and fast
    const csvDates = rows.map(r => r.parsedDate);
    const relevantCandidates = contentTasks.filter(task => {
        const tDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
        return csvDates.some(cd => Math.abs(differenceInCalendarDays(cd, tDate)) <= 10);
    });

    if (relevantCandidates.length === 0) return [];

    const response = await fetch('/api/metricool/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            rows: rows.map(r => ({
                rowIndex: r.rowIndex,
                title: r.title,
                caption: r.description,
                date: r.dateStr,
                time: r.scheduledTime,
                platforms: r.targetPlatforms
            })),
            candidates: relevantCandidates.map(c => {
                const cDate = c.endDate instanceof Date ? c.endDate : new Date(c.endDate);
                return {
                    id: c.id,
                    title: c.title,
                    description: c.description || '',
                    date: isValid(cDate) ? format(cDate, 'yyyy-MM-dd') : '',
                    scheduledTime: c.scheduledTime || '',
                    channelId: c.channelId,
                    status: String(c.status || '')
                };
            })
        })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.error || 'ไม่สามารถเรียกใช้ AI จับคู่รายการได้');
    }

    return data.matches || [];
}
