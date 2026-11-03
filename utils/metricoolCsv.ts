import Papa from 'papaparse';
import { format, isValid, parse, differenceInCalendarDays } from 'date-fns';
import { Task, Channel, Platform, TaskAsset } from '../types';
import {
    normalizeSpaces,
    cleanMetricoolTitle,
    normalizeTitleText,
    toThaiConsonantSkeleton,
    computeBigramSimilarity,
    computeLevenshteinSimilarity,
    scoreThaiTaskMatch
} from './metricool/thaiFuzzyMatcher';
import {
    classifyGoogleDriveUrl,
    toMetricoolDirectMediaUrl,
    inspectTaskMetricoolMedia,
    isMediaEligibleCategory,
    type GoogleDriveUrlClassification,
    type MetricoolMediaInspection,
    type MetricoolMediaReadinessStatus
} from './metricool/googleDriveMediaResolver';

export {
    normalizeSpaces,
    cleanMetricoolTitle,
    normalizeTitleText,
    toThaiConsonantSkeleton,
    computeBigramSimilarity,
    computeLevenshteinSimilarity,
    scoreThaiTaskMatch,
    classifyGoogleDriveUrl,
    toMetricoolDirectMediaUrl,
    inspectTaskMetricoolMedia,
    isMediaEligibleCategory,
    type GoogleDriveUrlClassification,
    type MetricoolMediaInspection,
    type MetricoolMediaReadinessStatus
};

/**
 * Official 97-Column Metricool CSV Bulk Upload Template Schema (`Mtr_calendar_template.csv`)
 * Also 100% compatible with Metricool Planner CSV export (`csv_data.csv`)
 */
export const METRICOOL_CSV_HEADERS = [
    'Text',
    'Date',
    'Time',
    'Draft',
    'Facebook',
    'Twitter/X',
    'LinkedIn',
    'GBP',
    'Instagram',
    'Pinterest',
    'TikTok',
    'Youtube',
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
    'Pinterest AI generated content',
    'Pinterest AI generated person',
    'Instagram Post Type',
    'Instagram Show Reel On Feed',
    'Instagram Trial Reel Share Automatically',
    'Youtube Video Title',
    'Youtube Video Type',
    'Youtube Video Privacy',
    'Youtube video for kids',
    'Youtube AI generated content',
    'Youtube notify subscribers',
    'Youtube Video Category',
    'Youtube Video Tags',
    'Youtube playlist',
    'GBP Post Type',
    'Facebook Post Type',
    'Facebook Title',
    'First Comment Text',
    'TikTok Title',
    'TikTok disable comments',
    'TikTok disable duet',
    'TikTok disable stitch',
    'TikTok Post Privacy',
    'TikTok Branded Content',
    'TikTok Your Brand',
    'TikTok Auto Add Music',
    'TikTok Photo Cover Index',
    'TikTok musicId',
    'TikTok music title',
    'TikTok music author',
    'TikTok music previewUrl',
    'TikTok music thumbnailUrl',
    'TikTok music soundVolume',
    'TikTok music originalVolume',
    'TikTok music startMillis',
    'TikTok music endMillis',
    'TikTok Ai generated content',
    'LinkedIn Type',
    'LinkedIn Poll Question',
    'LinkedIn Poll Option 1',
    'LinkedIn Poll Option 2',
    'LinkedIn Poll Option 3',
    'LinkedIn Poll Option 4',
    'LinkedIn Poll Duration',
    'LinkedIn Show link preview',
    'LinkedIn Images as Carousel',
    'Threads Reply Control',
    'Threads Is Spoiler',
    'Threads Post Type',
    'Brand name'
] as const;

export interface MetricoolExportOptions {
    defaultTime?: string; // e.g. '18:00'
    importAsDraft?: 'AUTO' | 'ALWAYS_DRAFT' | 'ALWAYS_SCHEDULED';
    youtubePrivacy?: 'PUBLIC' | 'UNLISTED' | 'PRIVATE';
    includeTagsInCaption?: boolean;
    metricoolBrandName?: string; // Optional exact brand name in Metricool
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
    const baseText = normalizeSpaces((task.description || '').trim() || (task.title || '').trim());
    if (!includeTags || !Array.isArray(task.tags) || task.tags.length === 0) {
        return baseText;
    }

    const existingLower = baseText.toLowerCase();
    const formattedTags = task.tags
        .map(tag => normalizeSpaces(tag))
        .filter(Boolean)
        .map(tag => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '_')}`))
        .filter(hashTag => !existingLower.includes(hashTag.toLowerCase()));

    if (formattedTags.length === 0) return baseText;
    return `${baseText} ${formattedTags.join(' ')}`.trim();
}

/**
 * Infers Metricool Instagram/Facebook/YouTube post types from Task.contentFormats
 */
export function resolveMetricoolFormatTypes(contentFormats?: string[]) {
    const formats = (contentFormats || []).map(f => f.toUpperCase());
    const isReelOrShort =
        formats.length === 0 ||
        formats.some(f =>
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
 * Converts an array of CalendarView Tasks into Official 97-Column Metricool CSV string (`Mtr_calendar_template.csv` format, UTF-8 with BOM)
 */
export function generateMetricoolCsvFromTasks(
    tasks: Task[],
    _channels: Channel[],
    options: MetricoolExportOptions = {}
): string {
    const {
        defaultTime = '18:00',
        importAsDraft = 'AUTO',
        youtubePrivacy = 'PUBLIC',
        includeTagsInCaption = true,
        metricoolBrandName = ''
    } = options;

    const rows = tasks.map(task => {
        const caption = buildCaptionFromTask(task, includeTagsInCaption);

        const taskDate =
            task.endDate instanceof Date && isValid(task.endDate)
                ? task.endDate
                : new Date(task.endDate || Date.now());
        const dateFormatted = format(taskDate, 'yyyy-MM-dd');

        // Time in HH:mm:ss format per Mtr_calendar_template.csv ("14:30:00")
        let timeFormatted = '18:00:00';
        const rawTimeSource =
            task.scheduledTime && /^\d{1,2}:\d{2}/.test(task.scheduledTime.trim())
                ? task.scheduledTime.trim()
                : defaultTime.trim();
        if (/^\d{1,2}:\d{2}/.test(rawTimeSource)) {
            const parts = rawTimeSource.split(':');
            const hh = parts[0].padStart(2, '0');
            const mm = parts[1].padStart(2, '0');
            const ss = (parts[2] || '00').slice(0, 2).padStart(2, '0');
            timeFormatted = `${hh}:${mm}:${ss}`;
        }

        let isDraft = false;
        if (importAsDraft === 'ALWAYS_DRAFT') {
            isDraft = true;
        } else if (importAsDraft === 'ALWAYS_SCHEDULED') {
            isDraft = false;
        } else {
            const statusUpper = String(task.status || '').toUpperCase();
            isDraft = !['FINAL', 'APPROVE', 'APPROVED', 'DONE', 'COMPLETED'].includes(statusUpper);
        }

        const platforms = (task.targetPlatforms || []).map(p => p.toUpperCase());
        const hasAll = platforms.includes('ALL');
        const hasFacebook = hasAll || platforms.includes('FACEBOOK');
        const hasInstagram = hasAll || platforms.includes('INSTAGRAM');
        const hasTikTok = hasAll || platforms.includes('TIKTOK');
        const hasYouTube = hasAll || platforms.includes('YOUTUBE');

        const mediaInspection = inspectTaskMetricoolMedia(task);

        const { instagramPostType, facebookPostType, youtubeVideoType } =
            resolveMetricoolFormatTypes(task.contentFormats);

        const cleanTitle = (task.title || '').trim().slice(0, 100);
        const youtubeTags = Array.isArray(task.tags)
            ? task.tags.map(t => t.replace(/^#/, '').trim()).filter(Boolean).join(',')
            : '';

        const rowObj: Record<string, string> = {};
        METRICOOL_CSV_HEADERS.forEach(h => {
            rowObj[h] = '';
        });

        rowObj['Text'] = caption;
        rowObj['Date'] = dateFormatted;
        rowObj['Time'] = timeFormatted;
        rowObj['Draft'] = isDraft ? 'true' : 'false';

        rowObj['Facebook'] = hasFacebook ? 'true' : 'false';
        rowObj['Twitter/X'] = 'false';
        rowObj['LinkedIn'] = 'false';
        rowObj['GBP'] = 'false';
        rowObj['Instagram'] = hasInstagram ? 'true' : 'false';
        rowObj['Pinterest'] = 'false';
        rowObj['TikTok'] = hasTikTok ? 'true' : 'false';
        rowObj['Youtube'] = hasYouTube ? 'true' : 'false';
        rowObj['Threads'] = 'false';
        rowObj['Bluesky'] = 'false';
        rowObj['Shortener'] = 'false';

        mediaInspection.resolvedMediaUrls.slice(0, 10).forEach((resolvedUrl, idx) => {
            rowObj[`Picture Url ${idx + 1}`] = resolvedUrl;
        });

        if (mediaInspection.resolvedThumbnailUrl) {
            rowObj['Video Thumbnail Url'] = mediaInspection.resolvedThumbnailUrl;
        }

        if (hasInstagram) {
            rowObj['Instagram Post Type'] = instagramPostType;
            rowObj['Instagram Show Reel On Feed'] = 'true';
        }

        if (hasYouTube) {
            rowObj['Youtube Video Title'] = cleanTitle || caption.slice(0, 100);
            rowObj['Youtube Video Type'] = youtubeVideoType;
            rowObj['Youtube Video Privacy'] = youtubePrivacy;
            rowObj['Youtube video for kids'] = 'false';
            rowObj['Youtube AI generated content'] = 'false';
            rowObj['Youtube notify subscribers'] = 'true';
            rowObj['Youtube Video Tags'] = youtubeTags;
        }

        if (hasFacebook) {
            rowObj['Facebook Post Type'] = facebookPostType;
            // Per Mtr_calendar_template.csv: "Facebook Title. Only for Facebook video posts and reels (no stories)"
            rowObj['Facebook Title'] = facebookPostType !== 'STORY' ? cleanTitle : '';
        }

        if (hasTikTok) {
            rowObj['TikTok disable comments'] = 'false';
            rowObj['TikTok disable duet'] = 'false';
            rowObj['TikTok disable stitch'] = 'false';
            rowObj['TikTok Post Privacy'] = 'PUBLIC_TO_EVERYONE';
            rowObj['TikTok Branded Content'] = 'false';
            rowObj['TikTok Your Brand'] = 'false';
            rowObj['TikTok Auto Add Music'] = 'false';
            rowObj['TikTok Photo Cover Index'] = '0';
            rowObj['TikTok Ai generated content'] = 'false';
        }

        if (metricoolBrandName.trim()) {
            rowObj['Brand name'] = metricoolBrandName.trim();
        }

        return rowObj;
    });

    const csvBody = Papa.unparse({
        fields: [...METRICOOL_CSV_HEADERS],
        data: rows
    });

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
// FLEXIBLE METRICOOL CSV PARSER (Handles Official 96-Col & Custom Exports)
// ============================================================================

function findHeaderValue(row: Record<string, any>, candidateKeys: string[]): string {
    const rowKeys = Object.keys(row);
    for (const candidate of candidateKeys) {
        const exact = row[candidate];
        if (exact !== undefined && exact !== null && String(exact).trim() !== '') {
            return normalizeSpaces(String(exact));
        }
        const foundKey = rowKeys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
        if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && String(row[foundKey]).trim() !== '') {
            return normalizeSpaces(String(row[foundKey]));
        }
    }
    return '';
}

function parseFlexibleDateAndTime(
    dateRaw: string,
    timeRaw: string
): { parsedDate: Date; dateStr: string; scheduledTime: string } {
    let parsedDate = new Date();
    let scheduledTime = '18:00';

    const cleanDateRaw = (dateRaw || '').trim();
    const cleanTimeRaw = (timeRaw || '').trim();

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
    const normalized = normalizeSpaces(text);
    const matches = normalized.match(/#([^\s#.,!?;:()[\]{}"']+)/g) || [];
    return Array.from(new Set(matches.map(m => m.replace(/^#/, '').trim()).filter(Boolean)));
}

/**
 * Parses a Metricool CSV file and performs:
 * 1. Clean title vs caption/hashtag separation (handling \u00A0 non-breaking spaces)
 * 2. Intra-CSV same-day duplicate merging (e.g., separate IG retry row on the same day)
 * 3. Stage 1 Local Thai Fuzzy Matching against existing Tasks
 */
export function parseMetricoolCsvText(
    csvText: string,
    existingTasks: Task[],
    channels: Channel[],
    _defaultChannelId?: string
): { headers: string[]; rows: ParsedMetricoolRow[] } {
    const parsed = Papa.parse<Record<string, any>>(csvText, {
        header: true,
        skipEmptyLines: true
    });

    const headers = parsed.meta.fields || [];
    const contentTasks = existingTasks.filter(t => t.type === 'CONTENT');

    const initialRows: ParsedMetricoolRow[] = (parsed.data || [])
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
                'Youtube Video Title',
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

            if (!caption && !explicitTitle && !dateRaw) {
                return null;
            }

            // Automatically skip Metricool's official template instruction/example row ("Text Example" / "2000-12-25")
            if (
                caption.toLowerCase() === 'text example' ||
                dateRaw === '2000-12-25' ||
                explicitTitle.includes('Youtube Video Title (100 characters length)')
            ) {
                return null;
            }

            let derivedTitle = cleanMetricoolTitle(explicitTitle || caption);
            if (!derivedTitle) {
                derivedTitle = `คอนเทนต์จาก Metricool #${idx + 1}`;
            }

            const { parsedDate, dateStr, scheduledTime } = parseFlexibleDateAndTime(dateRaw, timeRaw);

            const brandName = findHeaderValue(rawRow, ['Brand Name', 'Brand', 'Channel', 'Account', 'ช่อง']);
            let matchedChannelId = '';
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

            const targetPlatforms: Platform[] = [];
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['Facebook']))) targetPlatforms.push('FACEBOOK');
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['Instagram']))) targetPlatforms.push('INSTAGRAM');
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['TikTok', 'Tiktok']))) targetPlatforms.push('TIKTOK');
            if (isTruthyCsvFlag(findHeaderValue(rawRow, ['Youtube', 'YouTube']))) targetPlatforms.push('YOUTUBE');

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

            const contentFormats: string[] = [];
            const igType = findHeaderValue(rawRow, ['Instagram Post Type']).toUpperCase();
            const fbType = findHeaderValue(rawRow, ['Facebook Post Type']).toUpperCase();
            const ytType = findHeaderValue(rawRow, ['Youtube Video Type', 'YouTube Video Type']).toUpperCase();
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

            const ytTagsRaw = findHeaderValue(rawRow, ['Youtube Video Tags', 'YouTube Video Tags', 'Tags']);
            const ytTags = ytTagsRaw
                ? ytTagsRaw.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
                : [];
            const captionTags = extractHashtags(`${caption} ${explicitTitle}`);
            const mergedTags = Array.from(new Set([...ytTags, ...captionTags]));

            const isDraft = isTruthyCsvFlag(findHeaderValue(rawRow, ['Draft']));

            // Stage 1: Local Thai Fuzzy Matching against existing contentTasks
            let bestTask: Task | null = null;
            let bestScore = 0;
            let bestMatchType: 'EXACT' | 'THAI_FUZZY' | 'NONE' = 'NONE';
            let bestReason = '';

            for (const candidate of contentTasks) {
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
                description: caption || explicitTitle || derivedTitle,
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

    // Stage 1.5: Intra-CSV Same-Day Deduplication & Platform Merging
    const primaryRowByDayAndKey = new Map<string, ParsedMetricoolRow>();
    const primaryRowByTitleOnly = new Map<string, ParsedMetricoolRow>();

    for (const row of initialRows) {
        const normTitle = normalizeTitleText(row.title);
        const primaryMedia = row.mediaUrls[0] || '';
        const sameDayKey = `${row.dateStr}::${normTitle || primaryMedia}`;

        const existingSameDay = primaryRowByDayAndKey.get(sameDayKey);
        if (existingSameDay && (normTitle.length >= 3 || primaryMedia)) {
            existingSameDay.targetPlatforms = Array.from(
                new Set([...existingSameDay.targetPlatforms, ...row.targetPlatforms])
            );
            existingSameDay.mediaUrls = Array.from(
                new Set([...existingSameDay.mediaUrls, ...row.mediaUrls])
            );
            existingSameDay.tags = Array.from(
                new Set([...existingSameDay.tags, ...row.tags])
            );
            if (!existingSameDay.thumbnailUrl && row.thumbnailUrl) {
                existingSameDay.thumbnailUrl = row.thumbnailUrl;
            }

            row.action = 'SKIP';
            row.matchReason = `ซ้ำกับแถวเวลา ${existingSameDay.scheduledTime} น. ในวันเดียวกัน (รวมแพลตฟอร์มให้แล้ว)`;
            continue;
        }

        primaryRowByDayAndKey.set(sameDayKey, row);

        if (normTitle.length >= 5) {
            const earlierRow = primaryRowByTitleOnly.get(normTitle);
            if (earlierRow && earlierRow.dateStr !== row.dateStr && !row.matchReason) {
                row.matchReason = `ชื่อคลิปเดียวกับวันที่ ${format(earlierRow.parsedDate, 'dd/MM/yyyy')} (คนละวัน/แยกแพลตฟอร์ม)`;
            } else if (!earlierRow) {
                primaryRowByTitleOnly.set(normTitle, row);
            }
        }
    }

    return { headers, rows: initialRows };
}

/**
 * Stage 2: Date-Scoped & Chunked Gemini AI Semantic Matching for 200-300+ rows.
 * - Filters rows to ONLY those whose date is within +/- 5 days of an existing CONTENT card
 *   and whose title did not match 100% locally.
 * - Processes candidate rows in chunks of 25 rows per request so large files never timeout.
 */
export async function requestAiMetricoolMatch(
    rows: ParsedMetricoolRow[],
    existingTasks: Task[],
    onProgress?: (currentChunk: number, totalChunks: number) => void
): Promise<{
    rowIndex: number;
    matchedTaskId: string | null;
    confidence: number;
    reason: string;
}[]> {
    const contentTasks = existingTasks.filter(t => t.type === 'CONTENT');
    if (rows.length === 0 || contentTasks.length === 0) return [];

    // Pre-parse valid dates on existing content tasks
    const tasksWithDate = contentTasks
        .map(task => {
            const tDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
            return { task, tDate };
        })
        .filter(item => isValid(item.tDate));

    if (tasksWithDate.length === 0) return [];

    // Filter rows to ONLY non-skipped, non-100% exact rows that have at least one existing task within +/- 5 days
    const dateScopedRows = rows.filter(row => {
        if (row.action === 'SKIP' || row.matchType === 'EXACT') return false;
        return tasksWithDate.some(
            ({ tDate }) => Math.abs(differenceInCalendarDays(row.parsedDate, tDate)) <= 5
        );
    });

    if (dateScopedRows.length === 0) return [];

    const AI_CHUNK_SIZE = 25;
    const totalChunks = Math.ceil(dateScopedRows.length / AI_CHUNK_SIZE);
    const allMatches: {
        rowIndex: number;
        matchedTaskId: string | null;
        confidence: number;
        reason: string;
    }[] = [];

    for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
        onProgress?.(chunkIdx + 1, totalChunks);

        const rowChunk = dateScopedRows.slice(
            chunkIdx * AI_CHUNK_SIZE,
            (chunkIdx + 1) * AI_CHUNK_SIZE
        );

        const chunkDates = rowChunk.map(r => r.parsedDate);
        const chunkCandidates = tasksWithDate
            .filter(({ tDate }) =>
                chunkDates.some(cd => Math.abs(differenceInCalendarDays(cd, tDate)) <= 5)
            )
            .map(({ task, tDate }) => ({
                id: task.id,
                title: task.title,
                description: task.description || '',
                date: format(tDate, 'yyyy-MM-dd'),
                scheduledTime: task.scheduledTime || '',
                channelId: task.channelId,
                status: String(task.status || '')
            }));

        if (chunkCandidates.length === 0) continue;

        const response = await fetch('/api/metricool/ai-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rows: rowChunk.map(r => ({
                    rowIndex: r.rowIndex,
                    title: r.title,
                    caption: r.description,
                    date: r.dateStr,
                    time: r.scheduledTime,
                    platforms: r.targetPlatforms
                })),
                candidates: chunkCandidates
            })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'ไม่สามารถเรียกใช้ AI จับคู่รายการได้');
        }

        if (Array.isArray(data.matches)) {
            allMatches.push(...data.matches);
        }
    }

    return allMatches;
}
