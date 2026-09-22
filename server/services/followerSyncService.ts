import { serverSupabase } from '../utils/supabase.js';
import { 
    fetchInstagramFollowersWithFallbacks,
    fetchInstagramFollowersViaMetaApi, 
    MetaApiConfig,
    ChannelMetaApiConfig
} from './metaGraphApiService.js';

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
    metaApi?: MetaApiConfig;
}

export const DEFAULT_FOLLOWER_SYNC_CONFIG: FollowerSyncConfig = {
    isEnabled: true,
    syncTime: '08:00',
    platforms: {
        YOUTUBE: true,
        FACEBOOK: true,
        TIKTOK: true, // Default off to save bandwidth / rate limit safety as requested
        INSTAGRAM: true,
    },
    enabledChannelIds: [], // Empty means all channels
    rateLimitDelayMs: 500,
    metaApi: {
        enabled: false,
        accessToken: '',
        businessAccountId: '',
    },
};

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
            metaApi: {
                ...DEFAULT_FOLLOWER_SYNC_CONFIG.metaApi,
                ...(parsed.metaApi || {}),
                enabled: parsed.metaApi?.enabled ?? DEFAULT_FOLLOWER_SYNC_CONFIG.metaApi?.enabled ?? false,
            },
            enabledChannelIds: Array.isArray(parsed.enabledChannelIds) ? parsed.enabledChannelIds : [],
        };
        return cachedConfig;
    } catch {
        return cachedConfig;
    }
}

/**
 * Persist the global follower sync execution summary to master_options (FOLLOWER_SYNC_LAST_RUN)
 */
export async function recordFollowerSyncLastRun(summary: FollowerSyncLastRunSummary): Promise<void> {
    try {
        const { data: existing } = await serverSupabase
            .from('master_options')
            .select('id')
            .eq('type', 'MASTER_DATA_CONFIG')
            .eq('key', 'FOLLOWER_SYNC_LAST_RUN')
            .maybeSingle();

        if (existing?.id) {
            await serverSupabase
                .from('master_options')
                .update({
                    label: JSON.stringify(summary),
                    description: `Follower sync executed at ${summary.last_sync_at} (${summary.triggered_by})`,
                    is_active: true
                })
                .eq('id', existing.id);
        } else {
            await serverSupabase
                .from('master_options')
                .insert({
                    type: 'MASTER_DATA_CONFIG',
                    key: 'FOLLOWER_SYNC_LAST_RUN',
                    label: JSON.stringify(summary),
                    description: `Follower sync executed at ${summary.last_sync_at} (${summary.triggered_by})`,
                    is_active: true,
                    sort_order: 99
                });
        }
    } catch (err) {
        console.error('[FollowerSync] Failed to record FOLLOWER_SYNC_LAST_RUN:', err);
    }
}

/**
 * Retrieve the latest global follower sync execution summary
 */
export async function getFollowerSyncLastRun(): Promise<FollowerSyncLastRunSummary | null> {
    try {
        const { data } = await serverSupabase
            .from('master_options')
            .select('label')
            .eq('type', 'MASTER_DATA_CONFIG')
            .eq('key', 'FOLLOWER_SYNC_LAST_RUN')
            .maybeSingle();

        if (!data?.label) return null;
        return JSON.parse(data.label) as FollowerSyncLastRunSummary;
    } catch (err) {
        console.warn('[FollowerSync] Failed to parse FOLLOWER_SYNC_LAST_RUN:', err);
        return null;
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
    last_sync_followers_at?: string;
}

export interface FollowerSyncLastRunSummary {
    last_sync_at: string;
    triggered_by: 'cron' | 'api' | 'manual';
    total_channels: number;
    updated_channels: number;
    duration_ms: number;
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

// Number parsing from social text (e.g. "12,175 likes", "1.2M Followers", "ผู้ติดตาม 43.9 ล้าน คน", "ถูกใจ 3.5 หมื่น คน")
export function parseFollowerNumber(rawText?: string): number | undefined {
    if (!rawText) return undefined;
    const text = decodeHtmlEntities(rawText)
        .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '') // remove bidirectional control marks
        .replace(/\s+/g, ' ')
        .trim();

    // 1. Thai explicit prefix: "ผู้ติดตาม 43.9 ล้าน คน", "ผู้ติดตาม 1.2M", "ถูกใจ 3.5 หมื่น"
    const thaiPrefixMatch = text.match(/(?:ผู้ติดตาม|ถูกใจ)\s*([\d,]+(?:\.\d+)?)\s*(k|m|b|พัน|หมื่น|แสน|ล้าน)?\s*(?:คน|likes|followers|subscribers)?/i);

    // 2. Standard suffix pattern: "43.9M subscribers", "1.2M Followers", "3.5 หมื่น คน", "150,000 ผู้ติดตาม"
    const standardMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(k|m|b|พัน|หมื่น|แสน|ล้าน)?\s*(?:followers|subscribers|likes|ผู้ติดตาม|คน|subs)/i);

    // 3. Fallback: plain number with unit
    const fallbackMatch = text.match(/([\d,]+(?:\.\d+)?)\s*(k|m|b|พัน|หมื่น|แสน|ล้าน)\b/i);

    const matchToUse = thaiPrefixMatch || standardMatch || fallbackMatch;
    if (matchToUse && matchToUse[1]) {
        const baseNum = parseFloat(matchToUse[1].replace(/,/g, ''));
        if (!isNaN(baseNum) && baseNum > 0) {
            const unit = (matchToUse[2] || '').toLowerCase();
            if (unit === 'k' || unit === 'พัน') return Math.round(baseNum * 1000);
            if (unit === 'หมื่น') return Math.round(baseNum * 10000);
            if (unit === 'แสน') return Math.round(baseNum * 100000);
            if (unit === 'm' || unit === 'ล้าน') return Math.round(baseNum * 1000000);
            if (unit === 'b') return Math.round(baseNum * 1000000000);
            return Math.round(baseNum);
        }
    }

    return undefined;
}

// Scrape single platform follower count (supports Meta Graph API for Instagram)
async function extractFollowersFromUrl(
    platformKey: string, 
    rawUrl: string, 
    metaConfig?: MetaApiConfig,
    channelMeta?: ChannelMetaApiConfig
): Promise<number | undefined> {
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) return undefined;

    let targetUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = `https://${targetUrl}`;
    }

    const normKey = platformKey.toUpperCase();

    // 0. Instagram via Meta Graph API (Supports Per-Channel Override, Token Pool & Master Fallback)
    if (normKey === 'INSTAGRAM' || targetUrl.includes('instagram.com')) {
        const hasChannelToken = Boolean(channelMeta?.enabled !== false && channelMeta?.accessToken?.trim());
        const hasPoolToken = Boolean(metaConfig?.tokenPool?.some(t => t.enabled !== false && t.accessToken?.trim()));
        const hasGlobalToken = Boolean((metaConfig?.accessToken || '').trim() || process.env.META_ACCESS_TOKEN);
        const isMetaActive = hasChannelToken || (metaConfig?.enabled !== false && (hasPoolToken || hasGlobalToken));

        if (isMetaActive) {
            try {
                const metaCount = await fetchInstagramFollowersWithFallbacks(targetUrl, channelMeta, metaConfig);
                if (typeof metaCount === 'number' && metaCount > 0) {
                    return metaCount;
                }
            } catch (metaErr) {
                console.warn('[FollowerSync] Meta API fetch failed, falling back to open-graph scrape:', metaErr);
            }
        }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const browserUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    try {
        const normKey = platformKey.toUpperCase();
        
        // 1. YouTube
        if (normKey === 'YOUTUBE' || targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
            const htmlRes = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': browserUA,
                    'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                
                // Pattern A: Subtitle with • and subscribers count (e.g. "@channel • 43.9M subscribers" or "• ผู้ติดตาม 43.9 ล้าน คน")
                const subtitleMatch = html.match(/"subtitle":\{"content":"[^"]*•\s*([^"]*(?:subscribers?|ผู้ติดตาม)[^"]*)"/i);
                if (subtitleMatch && subtitleMatch[1]) {
                    const parsed = parseFollowerNumber(subtitleMatch[1]);
                    if (parsed) return parsed;
                }

                // Pattern B: Content containing subscriber count
                const contentMatch = html.match(/"content":"([^"]*(?:subscribers?|ผู้ติดตาม)[^"]*)"/i);
                if (contentMatch && contentMatch[1]) {
                    const parsed = parseFollowerNumber(contentMatch[1]);
                    if (parsed) return parsed;
                }

                // Pattern C: Standard subscriberCountText
                const subMatch = html.match(/"subscriberCountText":\{[^\}]*"(?:label|simpleText)":"([^"]+)"/i);
                if (subMatch && subMatch[1]) {
                    const parsed = parseFollowerNumber(subMatch[1]);
                    if (parsed) return parsed;
                }

                // Pattern D: AccessibilityLabel
                const accessMatch = html.match(/"accessibilityLabel":"(ผู้ติดตาม\s*[\d,.]+[^\"]*|[^"]*subscribers?)"/i);
                if (accessMatch && accessMatch[1]) {
                    const parsed = parseFollowerNumber(accessMatch[1]);
                    if (parsed) return parsed;
                }

                // Pattern E: metadataParts in header renderer
                const metaPartsMatch = html.match(/"metadataParts":\[[^\]]*"(?:label|simpleText|content)":"([^"]*(?:subscribers?|ผู้ติดตาม)[^"]*)"/i);
                if (metaPartsMatch && metaPartsMatch[1]) {
                    const parsed = parseFollowerNumber(metaPartsMatch[1]);
                    if (parsed) return parsed;
                }

                // Pattern F: Broad regex pattern
                const broadMatch = html.match(/([0-9,.]+\s*(?:k|m|b|พัน|หมื่น|แสน|ล้าน)?\s*(?:subscribers|ผู้ติดตาม)|ผู้ติดตาม\s*[0-9,.]+\s*(?:k|m|b|พัน|หมื่น|แสน|ล้าน)?(?:\s*คน)?)/i);
                if (broadMatch && broadMatch[1]) {
                    const parsed = parseFollowerNumber(broadMatch[1]);
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
                    'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
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

        // 3. Instagram (attempt scrape, Meta may block server IP)
        if (normKey === 'INSTAGRAM' || targetUrl.includes('instagram.com')) {
            const htmlRes = await fetch(targetUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': browserUA,
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                const ogDescMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["'][^>]*content=["']([^"']*)["']/i) ||
                                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["']/i);
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
                    'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
                }
            });
            if (htmlRes.ok) {
                const html = await htmlRes.text();
                const descMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["'][^>]*content=["']([^"']*)["']/i) ||
                                  html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["']/i);
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
                'User-Agent': browserUA,
                'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
            }
        });
        if (fallbackRes.ok) {
            const html = await fallbackRes.text();
            const ogDescMatch = html.match(/<meta[^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["'][^>]*content=["']([^"']*)["']/i) ||
                                html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["'](?:og:description|twitter:description|description)["']/i);
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

        // Channel Batching (Process 3-4 channels concurrently)
        const BATCH_SIZE = 3;
        const delayBetweenBatchesMs = Math.min(config.rateLimitDelayMs || 500, 600);
        let completedChannelsCount = 0;

        for (let bIdx = 0; bIdx < channels.length; bIdx += BATCH_SIZE) {
            const currentBatch = channels.slice(bIdx, bIdx + BATCH_SIZE);

            await Promise.allSettled(
                currentBatch.map(async (channel, batchInnerIdx) => {
                    const overallIndex = bIdx + batchInnerIdx;
                    const socialLinks = (channel.social_links || {}) as Record<string, string>;
                    const existingFollowers = (channel.followers || {}) as Record<string, any>;
                    const newFollowersMap: Record<string, any> = { ...existingFollowers };

                    const platformResults: SyncPlatformResult[] = [];
                    let hasChanges = false;

                    const platformEntries = Object.entries(socialLinks).filter(([_, url]) => !!url && typeof url === 'string' && url.trim().length > 0);

                    // Emit Channel Start Event
                    onProgress?.({
                        type: 'channel_start',
                        currentIndex: completedChannelsCount,
                        totalChannels: channels.length,
                        percentage: Math.round((completedChannelsCount / channels.length) * 100),
                        channelId: channel.id,
                        channelName: channel.name,
                        message: `กำลังเชื่อมต่อและดึงข้อมูลช่อง "${channel.name}" (${overallIndex + 1}/${channels.length})...`,
                        timestamp: new Date().toISOString(),
                    });

                    // Platform Concurrency: Parallelize all platform requests for this channel
                    await Promise.allSettled(
                        platformEntries.map(async ([platformKey, rawUrl]) => {
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
                                return;
                            }

                            try {
                                const channelMeta = ((channel as any).meta_api || (channel.social_links as any)?._meta_api) as ChannelMetaApiConfig | undefined;
                                const fetchedCount = await extractFollowersFromUrl(platformKey, url, config.metaApi, channelMeta);
                                
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
                                    const isInstagram = platformKey.toUpperCase() === 'INSTAGRAM' || url.includes('instagram.com');
                                    platformResults.push({
                                        platform: platformKey,
                                        url,
                                        previousCount: prevCount,
                                        newCount: prevCount,
                                        success: false,
                                        error: isInstagram 
                                            ? 'Instagram ปิดกั้นการดึงข้อมูลอัตโนมัติ (สามารถแก้ไขตัวเลขเองได้)' 
                                            : 'ไม่พบตัวเลขยอดผู้ติดตามในหน้าโปรไฟล์',
                                    });
                                }
                            } catch (err: any) {
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
                                currentIndex: completedChannelsCount,
                                totalChannels: channels.length,
                                percentage: Math.min(99, Math.round(((completedChannelsCount + 0.5) / channels.length) * 100)),
                                channelId: channel.id,
                                channelName: channel.name,
                                platform: platformKey,
                                message: `ดึงข้อมูลแพลตฟอร์ม ${platformKey} ของ "${channel.name}" สำเร็จ`,
                                timestamp: new Date().toISOString(),
                            });
                        })
                    );

                    // Calculate total followers for this channel
                    const totalFollowers = Object.values(newFollowersMap).reduce((sum, count) => sum + (Number(count) || 0), 0);
                    const syncTimestamp = new Date().toISOString();
                    newFollowersMap._last_synced_at = syncTimestamp;

                    let channelSyncResult: ChannelSyncResult;

                    // Always persist latest sync timestamp and followers
                    const updatePayload: Record<string, any> = {
                        followers: newFollowersMap,
                        last_sync_followers_at: syncTimestamp,
                    };
                    if (hasChanges) {
                        updatePayload.updated_at = syncTimestamp;
                    }

                    let { error: updateError } = await serverSupabase
                        .from('channels')
                        .update(updatePayload)
                        .eq('id', channel.id);

                    // Dual-compatible fallback if column last_sync_followers_at is not created yet
                    if (updateError && (updateError.message?.includes('last_sync_followers_at') || (updateError as any).code === '42703')) {
                        delete updatePayload.last_sync_followers_at;
                        const retryRes = await serverSupabase
                            .from('channels')
                            .update(updatePayload)
                            .eq('id', channel.id);
                        updateError = retryRes.error;
                    }

                    if (updateError) {
                        console.error(`[FollowerSync] Error updating channel ${channel.name} (${channel.id}):`, updateError);
                        channelSyncResult = {
                            channelId: channel.id,
                            channelName: channel.name,
                            platforms: platformResults,
                            totalFollowers,
                            updated: false,
                            error: updateError.message,
                            last_sync_followers_at: syncTimestamp,
                        };
                    } else {
                        if (hasChanges) {
                            updatedCount++;
                        }
                        channelSyncResult = {
                            channelId: channel.id,
                            channelName: channel.name,
                            platforms: platformResults,
                            totalFollowers,
                            updated: hasChanges,
                            last_sync_followers_at: syncTimestamp,
                        };
                    }

                    results.push(channelSyncResult);
                    completedChannelsCount++;

                    // Emit Channel Done Event
                    onProgress?.({
                        type: 'channel_done',
                        currentIndex: completedChannelsCount,
                        totalChannels: channels.length,
                        percentage: Math.round((completedChannelsCount / channels.length) * 100),
                        channelId: channel.id,
                        channelName: channel.name,
                        channelResult: channelSyncResult,
                        message: channelSyncResult.updated 
                            ? `✨ อัปเดตยอดผู้ติดตามช่อง "${channel.name}" ใหม่เรียบร้อย (รวม ${totalFollowers.toLocaleString()} followers)`
                            : `ช่อง "${channel.name}" ตรวจสอบแล้ว ยอดตรงกับปัจจุบัน (${totalFollowers.toLocaleString()} followers)`,
                        timestamp: new Date().toISOString(),
                    });
                })
            );

            // Delay between batches to protect server IP from rate limits
            if (bIdx + BATCH_SIZE < channels.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatchesMs));
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

    // Save global last run summary to master_options table
    await recordFollowerSyncLastRun({
        last_sync_at: finalSummary.timestamp,
        triggered_by: triggeredBy,
        total_channels: results.length,
        updated_channels: updatedCount,
        duration_ms: durationMs,
    });

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
 * Synchronize follower count for a single channel immediately.
 * Executes all platforms concurrently (takes only ~1-2 seconds).
 */
export async function syncSingleChannelFollowers(channelId: string): Promise<ChannelSyncResult & { newFollowers?: Record<string, number> }> {
    const config = await getFollowerSyncConfig();

    const { data: channel, error: fetchErr } = await serverSupabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

    if (fetchErr || !channel) {
        throw new Error(fetchErr?.message || `Channel with ID ${channelId} not found`);
    }

    const socialLinks = (channel.social_links || {}) as Record<string, string>;
    const existingFollowers = (channel.followers || {}) as Record<string, any>;
    const newFollowersMap: Record<string, any> = { ...existingFollowers };

    const platformResults: SyncPlatformResult[] = [];
    let hasChanges = false;

    const platformEntries = Object.entries(socialLinks).filter(([_, url]) => !!url && typeof url === 'string' && url.trim().length > 0);

    // Parallel platform execution
    await Promise.allSettled(
        platformEntries.map(async ([platformKey, rawUrl]) => {
            const url = rawUrl.trim();
            const prevCount = existingFollowers[platformKey];
            const normKey = platformKey.toUpperCase() as keyof FollowerSyncPlatformSettings;

            if (config.platforms && config.platforms[normKey] === false) {
                platformResults.push({
                    platform: platformKey,
                    url,
                    previousCount: prevCount,
                    newCount: prevCount,
                    success: true,
                    skipped: true,
                });
                return;
            }

            try {
                const channelMeta = ((channel as any).meta_api || (channel.social_links as any)?._meta_api) as ChannelMetaApiConfig | undefined;
                const fetchedCount = await extractFollowersFromUrl(platformKey, url, config.metaApi, channelMeta);
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
                    const isInstagram = platformKey.toUpperCase() === 'INSTAGRAM' || url.includes('instagram.com');
                    const hasMetaConfig = Boolean(config.metaApi?.enabled && config.metaApi?.accessToken);
                    platformResults.push({
                        platform: platformKey,
                        url,
                        previousCount: prevCount,
                        newCount: prevCount,
                        success: false,
                        error: isInstagram 
                            ? (hasMetaConfig 
                                ? 'ไม่พบบัญชีนี้ในสิทธิ์ Meta Token หรือยังไม่ได้ผูกกับ Facebook Page (สามารถแก้ไขตัวเลขเองได้)' 
                                : 'Instagram ปิดกั้นการดึงข้อมูลอัตโนมัติ (ใส่ Meta Access Token ในตั้งค่าระบบ หรือแก้ไขตัวเลขเองได้)')
                            : 'ไม่พบตัวเลขยอดผู้ติดตามในหน้าโปรไฟล์',
                    });
                }
            } catch (err: any) {
                platformResults.push({
                    platform: platformKey,
                    url,
                    previousCount: prevCount,
                    newCount: prevCount,
                    success: false,
                    error: err?.message || 'Scrape failed',
                });
            }
        })
    );

    const totalFollowers = Object.values(newFollowersMap).reduce((sum, count) => sum + (Number(count) || 0), 0);
    const syncTimestamp = new Date().toISOString();
    newFollowersMap._last_synced_at = syncTimestamp;

    // Always persist latest sync timestamp and followers
    const updatePayload: Record<string, any> = {
        followers: newFollowersMap,
        last_sync_followers_at: syncTimestamp,
    };
    if (hasChanges) {
        updatePayload.updated_at = syncTimestamp;
    }

    let { error: updateError } = await serverSupabase
        .from('channels')
        .update(updatePayload)
        .eq('id', channel.id);

    // Dual-compatible fallback if column last_sync_followers_at is not created yet
    if (updateError && (updateError.message?.includes('last_sync_followers_at') || (updateError as any).code === '42703')) {
        delete updatePayload.last_sync_followers_at;
        const retryRes = await serverSupabase
            .from('channels')
            .update(updatePayload)
            .eq('id', channel.id);
        updateError = retryRes.error;
    }

    if (updateError) {
        return {
            channelId: channel.id,
            channelName: channel.name,
            platforms: platformResults,
            totalFollowers,
            updated: false,
            error: updateError.message,
            newFollowers: newFollowersMap,
            last_sync_followers_at: syncTimestamp,
        };
    }

    return {
        channelId: channel.id,
        channelName: channel.name,
        platforms: platformResults,
        totalFollowers,
        updated: hasChanges,
        newFollowers: newFollowersMap,
        last_sync_followers_at: syncTimestamp,
    };
}

/**
 * Helper to build cron expression from time "HH:mm" (e.g. "08:30" -> "30 8 * * *")
 */
export function buildCronExpression(timeStr: string): string {
    const [hourStr, minStr] = (timeStr || '08:00').split(':');
    const hour = parseInt(hourStr, 10);
    const min = parseInt(minStr, 10);
    const safeHour = isNaN(hour) || hour < 0 || hour > 23 ? 8 : hour;
    const safeMin = isNaN(min) || min < 0 || min > 59 ? 0 : min;
    return `${safeMin} ${safeHour} * * *`;
}

/**
 * Converts Bangkok time (UTC+7) to UTC cron expression for Supabase pg_cron
 * e.g. "08:00" Bangkok (GMT+7) = 01:00 UTC -> "0 1 * * *"
 */
export function buildUtcCronExpression(bangkokTimeStr: string): { cronUtc: string; utcHour: number; utcMin: number } {
    const [hourStr, minStr] = (bangkokTimeStr || '08:00').split(':');
    const bkkHour = parseInt(hourStr, 10);
    const bkkMin = parseInt(minStr, 10);
    const safeHour = isNaN(bkkHour) || bkkHour < 0 || bkkHour > 23 ? 8 : bkkHour;
    const safeMin = isNaN(bkkMin) || bkkMin < 0 || bkkMin > 59 ? 0 : bkkMin;

    // Convert BKK (UTC+7) to UTC (-7 hours)
    let utcHour = safeHour - 7;
    if (utcHour < 0) {
        utcHour += 24;
    }
    return {
        cronUtc: `${safeMin} ${utcHour} * * *`,
        utcHour,
        utcMin: safeMin
    };
}

/**
 * Kept for backwards compatibility if called by frontend /api/cron/reschedule
 */
export async function rescheduleFollowerCronJob(customConfig?: FollowerSyncConfig) {
    const config = customConfig || await getFollowerSyncConfig();
    console.log(`[FollowerSync] Configuration updated. Scheduled via Supabase pg_cron at ${config.syncTime} Asia/Bangkok (Active: ${config.isEnabled})`);
}
