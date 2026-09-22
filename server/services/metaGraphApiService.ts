/**
 * Meta Graph API Integration Service for Instagram Follower Sync
 * 
 * Supports:
 * 1. Meta User Access Token / Page Access Token with linked Instagram Business Accounts
 * 2. Instagram Business Account ID direct queries
 * 3. Instagram Business Discovery API for public creator accounts
 * 4. Token validation and account discovery
 */

export interface MetaTokenItem {
    id: string;
    label: string;
    accessToken: string;
    businessAccountId?: string;
    enabled: boolean;
    note?: string;
    createdAt?: string;
}

export interface MetaApiConfig {
    enabled?: boolean;
    accessToken?: string;
    businessAccountId?: string;
    tokenPool?: MetaTokenItem[];
}

export interface ChannelMetaApiConfig {
    enabled?: boolean;
    accessToken?: string;
    businessAccountId?: string;
}

export interface DiscoveredInstagramAccount {
    id: string;
    username: string;
    name?: string;
    followersCount: number;
    source: 'page_linked' | 'direct_id' | 'instagram_login';
    pageName?: string;
    profilePictureUrl?: string;
}

export interface MetaTokenValidationResult {
    isValid: boolean;
    error?: string;
    user?: {
        id: string;
        name: string;
    };
    accounts: DiscoveredInstagramAccount[];
}

/**
 * Extract clean Instagram username from a URL, handle, or string.
 * Examples:
 * - https://www.instagram.com/workpoint/ -> workpoint
 * - https://instagram.com/workpoint?igsh=123 -> workpoint
 * - @workpoint -> workpoint
 * - workpoint -> workpoint
 */
export function extractInstagramUsername(rawInput: string): string | null {
    if (!rawInput) return null;
    let clean = rawInput.trim();
    clean = clean.replace(/^@+/, '');

    // If it's a URL
    try {
        if (clean.includes('instagram.com/')) {
            const urlObj = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
            const segments = urlObj.pathname.split('/').filter(Boolean);
            if (segments.length > 0) {
                const first = segments[0].toLowerCase();
                const systemPaths = ['p', 'reel', 'reels', 'stories', 'explore', 'direct', 'accounts', 'developer'];
                if (!systemPaths.includes(first)) {
                    return first;
                }
            }
        }
    } catch {
        // Fall through to regex
    }

    const match = clean.match(/(?:instagram\.com\/)?(?:@)?([a-zA-Z0-9._]+)/);
    if (match && match[1]) {
        const username = match[1].toLowerCase();
        const systemPaths = ['instagram', 'p', 'reel', 'reels', 'explore'];
        if (!systemPaths.includes(username)) {
            return username;
        }
    }

    return null;
}

/**
 * Validates Meta Access Token and retrieves all accessible Instagram Business Accounts.
 */
export async function validateMetaAccessToken(
    tokenInput: string, 
    businessAccountIdInput?: string
): Promise<MetaTokenValidationResult> {
    const token = (tokenInput || process.env.META_ACCESS_TOKEN || '').trim();
    if (!token) {
        return {
            isValid: false,
            error: 'ไม่พบ Access Token กรุณาระบุ Meta Access Token',
            accounts: [],
        };
    }

    const accounts: DiscoveredInstagramAccount[] = [];
    let metaUser: { id: string; name: string } | undefined = undefined;

    try {
        // Step 1: Check token validity via /me
        const meRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(token)}`, {
            headers: { 'Accept': 'application/json' },
        });
        const meData = await meRes.json();

        if (meData.error) {
            // Check if it's an Instagram-specific user token
            const igMeRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,followers_count&access_token=${encodeURIComponent(token)}`, {
                headers: { 'Accept': 'application/json' },
            });
            const igMeData = await igMeRes.json();

            if (!igMeData.error && igMeData.id) {
                accounts.push({
                    id: igMeData.id,
                    username: igMeData.username,
                    name: igMeData.username,
                    followersCount: typeof igMeData.followers_count === 'number' ? igMeData.followers_count : 0,
                    source: 'instagram_login',
                });
                return {
                    isValid: true,
                    user: { id: igMeData.id, name: igMeData.username },
                    accounts,
                };
            }

            return {
                isValid: false,
                error: meData.error?.message || 'Token ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาสร้าง Token ใหม่ใน Meta for Developers',
                accounts: [],
            };
        }

        metaUser = {
            id: meData.id,
            name: meData.name || 'Meta User',
        };

        // Step 2: Query linked Facebook Pages and their Instagram Business Accounts
        const pagesRes = await fetch(
            `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,category,instagram_business_account{id,username,name,followers_count,profile_picture_url}&access_token=${encodeURIComponent(token)}`,
            { headers: { 'Accept': 'application/json' } }
        );
        const pagesData = await pagesRes.json();

        if (pagesData.data && Array.isArray(pagesData.data)) {
            for (const page of pagesData.data) {
                const ig = page.instagram_business_account;
                if (ig && ig.id && ig.username) {
                    accounts.push({
                        id: ig.id,
                        username: ig.username,
                        name: ig.name || ig.username,
                        followersCount: typeof ig.followers_count === 'number' ? ig.followers_count : 0,
                        source: 'page_linked',
                        pageName: page.name,
                        profilePictureUrl: ig.profile_picture_url,
                    });
                }
            }
        }

        // Step 3: If user provided a specific Business Account ID, check it
        const customId = (businessAccountIdInput || process.env.META_INSTAGRAM_ACCOUNT_ID || '').trim();
        if (customId && !accounts.some(a => a.id === customId)) {
            try {
                const directRes = await fetch(
                    `https://graph.facebook.com/v20.0/${encodeURIComponent(customId)}?fields=id,username,name,followers_count,profile_picture_url&access_token=${encodeURIComponent(token)}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                const directData = await directRes.json();
                if (!directData.error && directData.id && directData.username) {
                    accounts.push({
                        id: directData.id,
                        username: directData.username,
                        name: directData.name || directData.username,
                        followersCount: typeof directData.followers_count === 'number' ? directData.followers_count : 0,
                        source: 'direct_id',
                        profilePictureUrl: directData.profile_picture_url,
                    });
                }
            } catch (err) {
                console.warn('[Meta API] Failed to fetch custom businessAccountId:', err);
            }
        }

        return {
            isValid: true,
            user: metaUser,
            accounts,
        };
    } catch (err: any) {
        return {
            isValid: false,
            error: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Meta Graph API Server',
            accounts: [],
        };
    }
}

/**
 * Attempt to query followers for a target Instagram account using a single Meta token.
 */
export async function fetchInstagramFollowersForToken(
    targetUsername: string,
    token: string,
    businessAccountId?: string,
    tokenLabel?: string
): Promise<number | undefined> {
    if (!token || !targetUsername) return undefined;
    const cleanToken = token.trim();
    const cleanUsername = targetUsername.toLowerCase();
    const label = tokenLabel || 'Meta Token';

    try {
        // Strategy 1: Check linked Facebook Pages' Instagram Business Accounts
        const pagesRes = await fetch(
            `https://graph.facebook.com/v20.0/me/accounts?fields=instagram_business_account{id,username,followers_count}&access_token=${encodeURIComponent(cleanToken)}`,
            { headers: { 'Accept': 'application/json' } }
        );
        const pagesData = await pagesRes.json();

        if (pagesData.data && Array.isArray(pagesData.data)) {
            for (const page of pagesData.data) {
                const ig = page.instagram_business_account;
                if (ig && ig.username && ig.username.toLowerCase() === cleanUsername) {
                    if (typeof ig.followers_count === 'number') {
                        console.log(`[Meta API - ${label}] Successfully fetched ${ig.followers_count} followers for @${cleanUsername} via Page-linked IG account (${ig.id})`);
                        return ig.followers_count;
                    }
                }
            }
        }

        // Strategy 2: If a specific Business Account ID is configured, query it
        const customId = (businessAccountId || '').trim();
        if (customId) {
            const directRes = await fetch(
                `https://graph.facebook.com/v20.0/${encodeURIComponent(customId)}?fields=id,username,followers_count&access_token=${encodeURIComponent(cleanToken)}`,
                { headers: { 'Accept': 'application/json' } }
            );
            const directData = await directRes.json();
            if (directData && directData.username && directData.username.toLowerCase() === cleanUsername) {
                if (typeof directData.followers_count === 'number') {
                    console.log(`[Meta API - ${label}] Successfully fetched ${directData.followers_count} followers for @${cleanUsername} via direct Account ID (${customId})`);
                    return directData.followers_count;
                }
            }

            // Strategy 3: Try Business Discovery via the configured Business Account ID (for public accounts)
            try {
                const discRes = await fetch(
                    `https://graph.facebook.com/v20.0/${encodeURIComponent(customId)}?fields=business_discovery.username(${encodeURIComponent(cleanUsername)}){followers_count,media_count}&access_token=${encodeURIComponent(cleanToken)}`,
                    { headers: { 'Accept': 'application/json' } }
                );
                const discData = await discRes.json();
                if (discData?.business_discovery?.followers_count !== undefined) {
                    const count = discData.business_discovery.followers_count;
                    console.log(`[Meta API - ${label}] Successfully fetched ${count} followers for @${cleanUsername} via Business Discovery`);
                    return count;
                }
            } catch (discErr) {
                // Business discovery not permitted or account not business
            }
        }

        // Strategy 4: Direct Instagram User token endpoint (/me)
        try {
            const igMeRes = await fetch(
                `https://graph.instagram.com/me?fields=id,username,followers_count&access_token=${encodeURIComponent(cleanToken)}`,
                { headers: { 'Accept': 'application/json' } }
            );
            const igMeData = await igMeRes.json();
            if (igMeData && igMeData.username && igMeData.username.toLowerCase() === cleanUsername) {
                if (typeof igMeData.followers_count === 'number') {
                    console.log(`[Meta API - ${label}] Successfully fetched ${igMeData.followers_count} followers for @${cleanUsername} via Instagram Me API`);
                    return igMeData.followers_count;
                }
            }
        } catch {
            // IG Login API fallback
        }

    } catch (err) {
        console.warn(`[Meta API - ${label}] Request error while querying Instagram followers for @${cleanUsername}:`, err);
    }

    return undefined;
}

/**
 * Resolves followers for an Instagram account considering:
 * 1. Per-Channel Meta Token (Specific override for this channel/brand)
 * 2. Multi-Token Pool in Master Data (testing each enabled token in the pool)
 * 3. Default Global Meta Token (fallback)
 */
export async function fetchInstagramFollowersWithFallbacks(
    targetUrlOrHandle: string,
    channelMeta?: ChannelMetaApiConfig,
    globalMeta?: MetaApiConfig
): Promise<number | undefined> {
    const targetUsername = extractInstagramUsername(targetUrlOrHandle);
    if (!targetUsername) return undefined;

    // 1. Check Per-Channel Setting first (Highest Priority)
    if (channelMeta && channelMeta.enabled !== false && channelMeta.accessToken?.trim()) {
        const count = await fetchInstagramFollowersForToken(
            targetUsername,
            channelMeta.accessToken,
            channelMeta.businessAccountId,
            'Channel-Specific Override'
        );
        if (typeof count === 'number' && count > 0) {
            return count;
        }
    }

    // 2. Check Global Meta Configuration (Token Pool & Global Default)
    if (globalMeta && globalMeta.enabled !== false) {
        const triedTokens = new Set<string>();
        if (channelMeta?.accessToken?.trim()) {
            triedTokens.add(channelMeta.accessToken.trim());
        }

        // 2a. Iterate through Token Pool
        if (Array.isArray(globalMeta.tokenPool) && globalMeta.tokenPool.length > 0) {
            for (const item of globalMeta.tokenPool) {
                const token = item.accessToken?.trim();
                if (!token || item.enabled === false || triedTokens.has(token)) {
                    continue;
                }
                triedTokens.add(token);

                const count = await fetchInstagramFollowersForToken(
                    targetUsername,
                    token,
                    item.businessAccountId,
                    `Token Pool: ${item.label || 'Unnamed'}`
                );
                if (typeof count === 'number' && count > 0) {
                    return count;
                }
            }
        }

        // 2b. Check Global Default Token (if not in pool)
        const defaultToken = (globalMeta.accessToken || process.env.META_ACCESS_TOKEN || '').trim();
        if (defaultToken && !triedTokens.has(defaultToken)) {
            const count = await fetchInstagramFollowersForToken(
                targetUsername,
                defaultToken,
                globalMeta.businessAccountId,
                'Master Data Global Token'
            );
            if (typeof count === 'number' && count > 0) {
                return count;
            }
        }
    }

    return undefined;
}

/**
 * Backward compatibility wrapper
 */
export async function fetchInstagramFollowersViaMetaApi(
    targetUrlOrHandle: string,
    metaConfig?: MetaApiConfig
): Promise<number | undefined> {
    return fetchInstagramFollowersWithFallbacks(targetUrlOrHandle, undefined, metaConfig);
}
