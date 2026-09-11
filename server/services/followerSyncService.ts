import cron, { ScheduledTask } from 'node-cron';
import { serverSupabase } from '../utils/supabase.js';

export interface FollowerSyncPlatformSettings {
    YOUTUBE: boolean;
    FACEBOOK: boolean;
    TIKTOK: boolean;
    INSTAGRAM: boolean;
}

export interface FollowerSyncConfig {
    isEnabled: boolean;
    syncTime: string; // e.g. "08:00"
    platforms: FollowerSyncPlatformSettings;
    enabledChannelIds: string[];
    rateLimitDelayMs: number; // e.g. 1200
}

export const DEFAULT_FOLLOWER_SYNC_CONFIG: FollowerSyncConfig = {
    isEnabled: true,
    syncTime: '08:00',
    platforms: {
        YOUTUBE: true,
        FACEBOOK: true,
        TIKTOK: false, // Default off to save bandwidth / rate limit safety as requested
        INSTAGRAM: true,
    },
    enabledChannelIds: [], // Empty means all channels
    rateLimitDelayMs: 1200,
};

let currentCronTask: ScheduledTask | null = null;
let cachedConfig: FollowerSyncConfig = { ...DEFAULT_FOLLOWER_SYNC_CONFIG };

/**
 * Fetch current sync configuration from Supabase master_options table
 */
export async function getFollowerSyncConfig(): Promise<FollowerSyncConfig> {
    try {
        const { data, error } = await serverSupabase
            .from('master_options')
            .select('label')
            .eq('type', 'MASTER_DATA_CONFIG')
            .eq('key', 'FOLLOWER_SYNC_CONFIG')
            .single();

        if (error || !data?.label) {
            return cachedConfig;
        }

        const parsed = JSON.parse(data.label) as Partial<FollowerSyncConfig>;
        cachedConfig = {
            ...DEFAULT_FOLLOWER_SYNC_CONFIG,
            ...parsed,
            platforms: {
                ...DEFAULT_FOLLOWER_SYNC_CONFIG.platforms,
                ...(parsed.platforms || {})
            },
            enabledChannelIds: Array.isArray(parsed.enabledChannelIds) ? parsed.enabledChannelIds : [],
        };
        return cachedConfig;
    } catch {
        return cachedConfig;
    }
}

interface SyncPlatformResult {
    platform: string;
    url: string;
    previousCount?: number;
    newCount?: number;
    success: boolean;
    skipped?: boolean;
    error?: string;
}

export interface ChannelSyncResult {
    channelId: string;
    channelName: string;
    platforms: SyncPlatformResult[];
    totalFollowers: number;
    updated: boolean;
    error?: string;
}

export interface FullSyncSummary {
    timestamp: string;
    triggeredBy: 'cron' | 'api' | 'manual';
    totalChannelsChecked: number;
    totalChannelsUpdated: number;
    results: ChannelSyncResult[];
    durationMs: number;
}

// Helper to decode HTML entities safely
function decodeHtmlEntities(str: string): string {
    if (!str) return '';
    return str
        .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
            try {
                return String.fromCodePoint(parseInt(hex, 16));
            } catch {
                return _;
            }
        })
        .replace(/&#([0-9]+);/g, (_, dec) => {
            try {
                return String.fromCodePoint(parseInt(dec, 10));
            } catch {
                return _;
            }
        })
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// Number parsing from social text (e.g. "12,175 likes", "1.2M Followers", "ถูกใจ 3.5 หมื่น คน")
export function parseFollowerNumber(rawText?: string): number | undefined {
    if (!rawText) return undefined;
    const text = decodeHtmlEntities(rawText);

    // 1. Thai patterns: "ถูกใจ 12,175 คน", "ผู้ติดตาม 1.2 ล้าน คน", "3.5 หมื่น ผู้ติดตาม"
    const thaiMatch = text.match(/(?:ถูกใจ|ผู้ติดตาม)?\s*([\d,]+(?:\.\d+)?)\s*([kKmMพันหมื่นแสนล้าน]?)\s*(?:คน|likes|followers|subscribers|ผู้ติดตาม)?/i);
    
    // Check specific Instagram/Facebook/Twitter pattern: "12.5K Followers", "12,175 likes", "1.2M subscribers"
    const standardMatch = text.match(/([\d,]+(?:\.\d+)?)\s*([kKmMพันหมื่นแสนล้าน]?)\s*(?:followers|subscribers|likes|ผู้ติดตาม|คน|subs)/i);

    const matchToUse = standardMatch || thaiMatch;
    if (matchToUse && matchToUse[1]) {
        const baseNum = parseFloat(matchToUse[1].replace(/,/g, ''));
        if (!isNaN(baseNum) && baseNum > 0) {
            const unit = (matchToUse[2] || '').toLowerCase();
            if (unit === 'k' || unit === 'พัน') return Math.round(baseNum * 1000);
            if (unit === 'หมื่น') return Math.round(baseNum * 10000);
            if (unit === 'แสน') return Math.round(baseNum * 100000);
            if (unit === 'm' || unit === 'ล้าน') return Math.round(baseNum * 1000000);
            return Math.round(baseNum);
        }
    }

    return undefined;
}

// Scrape single platform follower count
async function extractFollowersFromUrl(platformKey: string, targetUrl: string): Promise<number | undefined> {
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) return undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const normKey = platformKey.toUpperCase();
        
        // 1. YouTube
        if (normKey === 'YOUTUBE' || targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
            // Priority: oEmbed for basic details
            try {
                const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (oembedRes.ok) {
                    // oEmbed does not provide subscriber counts directly, so we attempt scraping metadata
                }
            } catch {
                // Ignore oembed error and proceed to metadata
            }

            const htmlRes = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Twitterbot/1.0',
                    'Accept-Language': 'th,en-US,en;q=0.9',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                // Check subscriber count in page content or meta
                const subMatch = html.match(/"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\}/i) ||
                                 html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/i) ||
                                 html.match(/([\d,.]+[kKmM]?)\s*(?:subscribers|ผู้ติดตาม)/i);
                if (subMatch && subMatch[1]) {
                    const parsed = parseFollowerNumber(subMatch[1]);
                    if (parsed) return parsed;
                }
            }
        }

        // 2. Facebook
        if (normKey === 'FACEBOOK' || targetUrl.includes('facebook.com') || targetUrl.includes('fb.com')) {
            const htmlRes = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Twitterbot/1.0',
                    'Accept-Language': 'th,en-US,en;q=0.9',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                const ogDescMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description)["'][^>]*content=["']([^"']*)["']/i) ||
                                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:description|twitter:description)["']/i);
                if (ogDescMatch && ogDescMatch[1]) {
                    const parsed = parseFollowerNumber(ogDescMatch[1]);
                    if (parsed) return parsed;
                }
            }
        }

        // 3. Instagram
        if (normKey === 'INSTAGRAM' || targetUrl.includes('instagram.com')) {
            const htmlRes = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Twitterbot/1.0',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                const ogDescMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description)["'][^>]*content=["']([^"']*)["']/i) ||
                                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:description|twitter:description)["']/i);
                if (ogDescMatch && ogDescMatch[1]) {
                    const parsed = parseFollowerNumber(ogDescMatch[1]);
                    if (parsed) return parsed;
                }
            }
        }

        // 4. TikTok
        if (normKey === 'TIKTOK' || targetUrl.includes('tiktok.com')) {
            const htmlRes = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Twitterbot/1.0',
                    'Accept-Language': 'th,en-US,en;q=0.9',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                const descMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description)["'][^>]*content=["']([^"']*)["']/i) ||
                                  html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:description|twitter:description)["']/i);
                if (descMatch && descMatch[1]) {
                    const parsed = parseFollowerNumber(descMatch[1]);
                    if (parsed) return parsed;
                }
            }
        }

        // 5. Generic fallback metadata extraction
        const fallbackRes = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'th,en-US,en;q=0.9',
            }
        });
        if (fallbackRes.ok) {
            const html = await fallbackRes.text();
            const ogDescMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["'][^>]*content=["']([^"']*)["']/i);
            if (ogDescMatch && ogDescMatch[1]) {
                return parseFollowerNumber(ogDescMatch[1]);
            }
        }
    } catch (err) {
        // Platform fetch failed gracefully
    } finally {
        clearTimeout(timeoutId);
    }

    return undefined;
}

// Main function to sync all channel followers
export async function syncAllChannelFollowers(
    triggeredBy: 'cron' | 'api' | 'manual' = 'manual',
    overrideConfigOrProgress?: Partial<FollowerSyncConfig> | ((event: any) => void),
    maybeProgress?: (event: any) => void
): Promise<FullSyncSummary> {
    const startTime = Date.now();

    const overrideConfig = typeof overrideConfigOrProgress === 'object' ? overrideConfigOrProgress : undefined;
    const onProgress = typeof overrideConfigOrProgress === 'function' ? overrideConfigOrProgress : maybeProgress;
    
    // 1. Fetch current sync config
    const currentConfig = await getFollowerSyncConfig();
    const config: FollowerSyncConfig = {
        ...currentConfig,
        ...(overrideConfig || {}),
        platforms: {
            ...currentConfig.platforms,
            ...(overrideConfig?.platforms || {}),
        }
    };

    // If triggered by automatic cron and system is toggled off, skip
    if (triggeredBy === 'cron' && !config.isEnabled) {
        console.log('[FollowerSync] Auto-Sync is disabled in Master Data settings. Skipping cron run.');
        const emptySummary: FullSyncSummary = {
            timestamp: new Date().toISOString(),
            triggeredBy,
            totalChannelsChecked: 0,
            totalChannelsUpdated: 0,
            results: [],
            durationMs: Date.now() - startTime,
        };
        onProgress?.({
            type: 'finish',
            currentIndex: 0,
            totalChannels: 0,
            percentage: 100,
            message: 'Auto-Sync is disabled in settings.',
            timestamp: new Date().toISOString(),
            summary: emptySummary,
        });
        return emptySummary;
    }

    console.log(`[FollowerSync] Starting channel follower sync (${triggeredBy}) at ${new Date().toISOString()}`);
    console.log(`[FollowerSync] Enabled platforms:`, config.platforms);

    const results: ChannelSyncResult[] = [];
    let updatedCount = 0;

    try {
        // Fetch all channels from Supabase
        const { data: rawChannels, error: fetchError } = await serverSupabase
            .from('channels')
            .select('id, name, social_links, followers, logo_url')
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('[FollowerSync] Failed to fetch channels from DB:', fetchError);
            onProgress?.({
                type: 'error',
                currentIndex: 0,
                totalChannels: 0,
                percentage: 0,
                message: `Failed to fetch channels: ${fetchError.message}`,
                timestamp: new Date().toISOString(),
            });
            throw fetchError;
        }

        interface ChannelDbRow {
            id: string;
            name: string;
            social_links?: Record<string, string> | null;
            followers?: Record<string, number> | null;
            logo_url?: string;
        }

        // Filter by enabledChannelIds if user selected specific channels
        const channels: ChannelDbRow[] = (rawChannels || []).filter((ch: ChannelDbRow) => {
            if (!config.enabledChannelIds || config.enabledChannelIds.length === 0) {
                return true; // if empty, sync all
            }
            return config.enabledChannelIds.includes(ch.id);
        });

        if (!channels || channels.length === 0) {
            console.log('[FollowerSync] No matching channels found to sync.');
            const emptySummary: FullSyncSummary = {
                timestamp: new Date().toISOString(),
                triggeredBy,
                totalChannelsChecked: 0,
                totalChannelsUpdated: 0,
                results: [],
                durationMs: Date.now() - startTime,
            };
            onProgress?.({
                type: 'finish',
                currentIndex: 0,
                totalChannels: 0,
                percentage: 100,
                message: 'ไม่พบช่องรายการที่เปิดใช้งานสำหรับการซิงค์',
                timestamp: new Date().toISOString(),
                summary: emptySummary,
            });
            return emptySummary;
        }

        // Emit Initial Event with channel list
        onProgress?.({
            type: 'init',
            currentIndex: 0,
            totalChannels: channels.length,
            percentage: 0,
            message: `เริ่มต้นการซิงค์ข้อมูลผู้ติดตามทั้งหมด ${channels.length} ช่อง...`,
            timestamp: new Date().toISOString(),
            channelsList: channels.map((c: ChannelDbRow) => ({
                id: c.id,
                name: c.name,
                logoUrl: c.logo_url
            }))
        });

        const delayMs = config.rateLimitDelayMs || 1200;

        // Iterate through each channel with throttling
        for (let i = 0; i < channels.length; i++) {
            const channel = channels[i];
            const socialLinks = (channel.social_links || {}) as Record<string, string>;
            const existingFollowers = (channel.followers || {}) as Record<string, number>;
            const newFollowersMap: Record<string, number> = { ...existingFollowers };

            const platformResults: SyncPlatformResult[] = [];
            let hasChanges = false;

            const platformEntries = Object.entries(socialLinks).filter(([_, url]) => !!url && typeof url === 'string' && url.trim().length > 0);

            // Emit Channel Start Event
            onProgress?.({
                type: 'channel_start',
                currentIndex: i,
                totalChannels: channels.length,
                percentage: Math.round((i / channels.length) * 100),
                channelId: channel.id,
                channelName: channel.name,
                message: `กำลังเชื่อมต่อและดึงข้อมูลช่อง "${channel.name}" (${i + 1}/${channels.length})...`,
                timestamp: new Date().toISOString(),
            });

            for (let pIdx = 0; pIdx < platformEntries.length; pIdx++) {
                const [platformKey, rawUrl] = platformEntries[pIdx];
                const url = rawUrl.trim();
                const prevCount = existingFollowers[platformKey];
                const normKey = platformKey.toUpperCase() as keyof FollowerSyncPlatformSettings;

                // Check if this platform is enabled in config
                if (config.platforms && config.platforms[normKey] === false) {
                    platformResults.push({
                        platform: platformKey,
                        url,
                        previousCount: prevCount,
                        newCount: prevCount,
                        success: true,
                        skipped: true,
                    });
                    continue;
                }

                try {
                    const fetchedCount = await extractFollowersFromUrl(platformKey, url);
                    
                    if (typeof fetchedCount === 'number' && fetchedCount > 0) {
                        newFollowersMap[platformKey] = fetchedCount;
                        if (fetchedCount !== prevCount) {
                            hasChanges = true;
                        }
                        platformResults.push({
                            platform: platformKey,
                            url,
                            previousCount: prevCount,
                            newCount: fetchedCount,
                            success: true,
                        });
                    } else {
                        // Keep previous count if fetch returned nothing
                        platformResults.push({
                            platform: platformKey,
                            url,
                            previousCount: prevCount,
                            newCount: prevCount,
                            success: false,
                            error: 'Could not extract follower number',
                        });
                    }
                } catch (err: any) {
                    // Gracefully catch individual platform errors
                    platformResults.push({
                        platform: platformKey,
                        url,
                        previousCount: prevCount,
                        newCount: prevCount,
                        success: false,
                        error: err?.message || 'Scrape failed',
                    });
                }

                // Emit Platform Done Event
                onProgress?.({
                    type: 'platform_done',
                    currentIndex: i,
                    totalChannels: channels.length,
                    percentage: Math.min(99, Math.round(((i + (pIdx + 1) / Math.max(1, platformEntries.length)) / channels.length) * 100)),
                    channelId: channel.id,
                    channelName: channel.name,
                    platform: platformKey,
                    message: `ดึงข้อมูลแพลตฟอร์ม ${platformKey} ของ "${channel.name}" สำเร็จ`,
                    timestamp: new Date().toISOString(),
                });
            }

            // Calculate total followers for this channel
            const totalFollowers = Object.values(newFollowersMap).reduce((sum, count) => sum + (Number(count) || 0), 0);

            let channelSyncResult: ChannelSyncResult;

            // If changes detected, update Supabase
            if (hasChanges) {
                const { error: updateError } = await serverSupabase
                    .from('channels')
                    .update({ 
                        followers: newFollowersMap,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', channel.id);

                if (updateError) {
                    console.error(`[FollowerSync] Error updating channel ${channel.name} (${channel.id}):`, updateError);
                    channelSyncResult = {
                        channelId: channel.id,
                        channelName: channel.name,
                        platforms: platformResults,
                        totalFollowers,
                        updated: false,
                        error: updateError.message,
                    };
                } else {
                    updatedCount++;
                    channelSyncResult = {
                        channelId: channel.id,
                        channelName: channel.name,
                        platforms: platformResults,
                        totalFollowers,
                        updated: true,
                    };
                }
            } else {
                channelSyncResult = {
                    channelId: channel.id,
                    channelName: channel.name,
                    platforms: platformResults,
                    totalFollowers,
                    updated: false,
                };
            }

            results.push(channelSyncResult);

            // Emit Channel Done Event
            onProgress?.({
                type: 'channel_done',
                currentIndex: i + 1,
                totalChannels: channels.length,
                percentage: Math.round(((i + 1) / channels.length) * 100),
                channelId: channel.id,
                channelName: channel.name,
                channelResult: channelSyncResult,
                message: channelSyncResult.updated 
                    ? `✨ อัปเดตยอดผู้ติดตามช่อง "${channel.name}" ใหม่เรียบร้อย (รวม ${totalFollowers.toLocaleString()} followers)`
                    : `ช่อง "${channel.name}" ตรวจสอบแล้ว ยอดตรงกับปัจจุบัน (${totalFollowers.toLocaleString()} followers)`,
                timestamp: new Date().toISOString(),
            });

            // Delay between channels to protect server IP from rate limits
            if (i < channels.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    } catch (globalErr: any) {
        console.error('[FollowerSync] Global error during follower sync:', globalErr);
        onProgress?.({
            type: 'error',
            currentIndex: results.length,
            totalChannels: results.length,
            percentage: 0,
            message: `เกิดข้อผิดพลาดในการประมวลผล: ${globalErr?.message || 'Unknown error'}`,
            timestamp: new Date().toISOString(),
        });
    }

    const durationMs = Date.now() - startTime;
    console.log(`[FollowerSync] Sync finished in ${durationMs}ms. Updated ${updatedCount} channels.`);

    const finalSummary: FullSyncSummary = {
        timestamp: new Date().toISOString(),
        triggeredBy,
        totalChannelsChecked: results.length,
        totalChannelsUpdated: updatedCount,
        results,
        durationMs,
    };

    onProgress?.({
        type: 'finish',
        currentIndex: results.length,
        totalChannels: results.length,
        percentage: 100,
        message: `ซิงค์ยอดผู้ติดตามครบทุกช่องเรียบร้อย (${results.length} ช่อง / อัปเดต ${updatedCount} ช่อง)`,
        timestamp: new Date().toISOString(),
        summary: finalSummary,
    });

    return finalSummary;
}

/**
 * Helper to build cron expression from time "HH:mm" (e.g. "08:30" -> "30 8 * * *")
 */
function buildCronExpression(timeStr: string): string {
    const [hourStr, minStr] = (timeStr || '08:00').split(':');
    const hour = parseInt(hourStr, 10);
    const min = parseInt(minStr, 10);
    const safeHour = isNaN(hour) || hour < 0 || hour > 23 ? 8 : hour;
    const safeMin = isNaN(min) || min < 0 || min > 59 ? 0 : min;
    return `${safeMin} ${safeHour} * * *`;
}

/**
 * Reschedule or update cron job dynamically
 */
export async function rescheduleFollowerCronJob(customConfig?: FollowerSyncConfig) {
    const config = customConfig || await getFollowerSyncConfig();
    
    if (currentCronTask) {
        currentCronTask.stop();
        currentCronTask = null;
    }

    if (!config.isEnabled) {
        console.log('[FollowerSync] Follower Sync Cron is disabled in settings.');
        return;
    }

    const cronSchedule = buildCronExpression(config.syncTime);
    console.log(`[FollowerSync] Scheduling Daily Cron at ${cronSchedule} (${config.syncTime} Asia/Bangkok)`);

    currentCronTask = cron.schedule(
        cronSchedule,
        async () => {
            console.log(`[FollowerSync] Triggered scheduled ${config.syncTime} Cronjob for channel followers`);
            try {
                await syncAllChannelFollowers('cron');
            } catch (err) {
                console.error('[FollowerSync] Cron execution error:', err);
            }
        },
        {
            timezone: 'Asia/Bangkok',
        }
    );
}

// Initialize node-cron schedule on server start
export async function initFollowerCronJob() {
    // Auto-save APP_URL and CRON_SECRET to master_options so Supabase pg_cron can trigger the endpoint
    try {
        const appUrl = process.env.APP_URL || process.env.CLIENT_URL;
        if (appUrl) {
            const { data: existingAppUrl } = await serverSupabase
                .from('master_options')
                .select('id')
                .eq('type', 'MASTER_DATA_CONFIG')
                .eq('key', 'APP_URL')
                .maybeSingle();

            if (existingAppUrl) {
                await serverSupabase
                    .from('master_options')
                    .update({ label: appUrl })
                    .eq('id', existingAppUrl.id);
            } else {
                await serverSupabase
                    .from('master_options')
                    .insert({
                        type: 'MASTER_DATA_CONFIG',
                        key: 'APP_URL',
                        label: appUrl,
                        is_active: true,
                        sort_order: 100,
                    });
            }
            console.log('[FollowerSync] Saved APP_URL to master_options:', appUrl);
        }

        const cronSecret = process.env.CRON_SECRET || 'juijui-cron-secret-key-2026';
        const { data: existingSecret } = await serverSupabase
            .from('master_options')
            .select('id')
            .eq('type', 'MASTER_DATA_CONFIG')
            .eq('key', 'CRON_SECRET')
            .maybeSingle();

        if (existingSecret) {
            await serverSupabase
                .from('master_options')
                .update({ label: cronSecret })
                .eq('id', existingSecret.id);
        } else {
            await serverSupabase
                .from('master_options')
                .insert({
                    type: 'MASTER_DATA_CONFIG',
                    key: 'CRON_SECRET',
                    label: cronSecret,
                    is_active: true,
                    sort_order: 101,
                });
        }
    } catch (err) {
        console.error('[FollowerSync] Failed to save app environment settings to database:', err);
    }

    await rescheduleFollowerCronJob();
}
