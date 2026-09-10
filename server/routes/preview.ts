import { Router, Request, Response as ExpressResponse } from 'express';
import { promises as dns } from 'dns';

const router = Router();

// In-memory cache for preview results with bounded size (LRU-like)
interface CachedPreview {
    data: {
        title?: string;
        description?: string;
        image?: string;
        siteName?: string;
        url: string;
        favicon?: string;
    };
    timestamp: number;
}

const previewCache = new Map<string, CachedPreview>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 500; // Prevent unbounded memory growth

function getFromCache(url: string): CachedPreview['data'] | null {
    const cached = previewCache.get(url);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        previewCache.delete(url);
        return null;
    }
    return cached.data;
}

function setToCache(url: string, data: CachedPreview['data']) {
    if (previewCache.size >= MAX_CACHE_SIZE) {
        // Evict oldest entry
        const firstKey = previewCache.keys().next().value;
        if (firstKey) previewCache.delete(firstKey);
    }
    previewCache.set(url, { data, timestamp: Date.now() });
}

// ==========================================
// SSRF (Server-Side Request Forgery) Shield
// ==========================================

function isPrivateIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b, c, d] = parts;

    if (a === 0) return true; // 0.0.0.0/8 (This host on this network)
    if (a === 10) return true; // 10.0.0.0/8 (Private)
    if (a === 127) return true; // 127.0.0.0/8 (Loopback)
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (Private)
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 (Private)
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (Carrier-Grade NAT)
    if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
    if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
    if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
    if (a >= 224) return true; // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    return false;
}

function isPrivateIPv6(ip: string): boolean {
    const norm = ip.toLowerCase();
    if (norm === '::1' || norm === '::') return true; // Loopback & Unspecified
    if (norm.startsWith('::ffff:')) {
        const mappedIpv4 = norm.replace('::ffff:', '');
        return isPrivateIPv4(mappedIpv4);
    }
    if (norm.startsWith('fe8') || norm.startsWith('fe9') || norm.startsWith('fea') || norm.startsWith('feb')) return true; // fe80::/10 (Link-local)
    if (norm.startsWith('fc') || norm.startsWith('fd')) return true; // fc00::/7 (Unique Local)
    if (norm.startsWith('ff')) return true; // ff00::/8 (Multicast)
    if (norm.startsWith('2001:db8') || norm.startsWith('100:')) return true; // Documentation & Discard
    return false;
}

async function validateUrlForSsrf(targetUrl: string): Promise<{ safe: boolean; error?: string; parsed?: URL }> {
    let parsed: URL;
    try {
        parsed = new URL(targetUrl);
    } catch {
        return { safe: false, error: 'Invalid URL format' };
    }

    // 1. Protocol Restriction: Only HTTP & HTTPS
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { safe: false, error: 'Protocol not allowed. Only HTTP and HTTPS are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Blacklisted hostnames & internal domain patterns
    const forbiddenHostnames = [
        'localhost',
        'metadata.google.internal',
        '169.254.169.254',
        '0.0.0.0',
        '127.0.0.1',
        '::1',
    ];
    if (forbiddenHostnames.includes(hostname)) {
        return { safe: false, error: 'Access to internal or loopback hostnames is forbidden.' };
    }

    if (
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.lan') ||
        hostname.endsWith('.localhost') ||
        hostname.endsWith('.home.arpa')
    ) {
        return { safe: false, error: 'Access to internal domain networks is forbidden.' };
    }

    // 3. DNS Lookup: Verify that resolved IPs do not point to private networks
    try {
        const addresses = await dns.lookup(hostname, { all: true });
        if (!addresses || addresses.length === 0) {
            return { safe: false, error: 'Could not resolve domain name.' };
        }

        for (const addr of addresses) {
            if (addr.family === 4 && isPrivateIPv4(addr.address)) {
                return { safe: false, error: `Access to private IP (${addr.address}) is forbidden.` };
            }
            if (addr.family === 6 && isPrivateIPv6(addr.address)) {
                return { safe: false, error: `Access to private IPv6 (${addr.address}) is forbidden.` };
            }
        }
    } catch (err: any) {
        return { safe: false, error: `DNS resolution failed: ${err.message}` };
    }

    return { safe: true, parsed };
}

// Safe fetch that follows redirects up to 3 times while re-verifying SSRF on each hop
async function ssrfSafeFetch(initialUrl: string, options: RequestInit = {}): Promise<globalThis.Response> {
    let currentUrl = initialUrl;
    let hops = 0;
    const maxHops = 3;

    while (hops <= maxHops) {
        const ssrfCheck = await validateUrlForSsrf(currentUrl);
        if (!ssrfCheck.safe) {
            throw new Error(`SSRF blocked redirect: ${ssrfCheck.error}`);
        }

        const res = await fetch(currentUrl, {
            ...options,
            redirect: 'manual', // Never auto-follow without validating the destination
        });

        if ([301, 302, 303, 307, 308].includes(res.status)) {
            hops++;
            if (hops > maxHops) {
                throw new Error('Too many redirects');
            }
            const location = res.headers.get('location');
            if (!location) {
                return res;
            }
            // Resolve relative redirects
            currentUrl = new URL(location, currentUrl).href;
            continue;
        }

        return res;
    }

    throw new Error('Redirect limit reached');
}

// ==========================================
// oEmbed Provider Handlers (YouTube, TikTok)
// ==========================================

async function fetchOEmbedPreview(targetUrl: string, parsedUrl: URL): Promise<CachedPreview['data'] | null> {
    const hostname = parsedUrl.hostname.toLowerCase();
    const isYouTube = hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be';
    const isTikTok = hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com');

    if (!isYouTube && !isTikTok) {
        return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
        if (isYouTube) {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
            const res = await fetch(oEmbedUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                return {
                    title: data.author_name || data.title,
                    description: data.title && data.title !== data.author_name ? data.title : undefined,
                    image: data.thumbnail_url,
                    siteName: data.provider_name || 'YouTube',
                    url: targetUrl,
                    favicon: `https://www.google.com/s2/favicons?domain=youtube.com&sz=64`,
                };
            }
        } else if (isTikTok) {
            const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`;
            const res = await fetch(oEmbedUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                return {
                    title: data.author_name || data.title,
                    description: data.title,
                    image: data.thumbnail_url,
                    siteName: data.provider_name || 'TikTok',
                    url: targetUrl,
                    favicon: `https://www.google.com/s2/favicons?domain=tiktok.com&sz=64`,
                };
            }
        }
    } catch {
        // oEmbed failed or timed out; will fall back to HTML scraping seamlessly
    } finally {
        clearTimeout(timeoutId);
    }

    return null;
}

// Helper to extract meta tag content
function extractMeta(html: string, propertyPatterns: string[]): string | undefined {
    for (const pattern of propertyPatterns) {
        const regex1 = new RegExp(`<meta[^>]*(?:property|name)=["']${pattern}["'][^>]*content=["']([^"']*)["']`, 'i');
        const match1 = html.match(regex1);
        if (match1 && match1[1] && match1[1].trim()) {
            return decodeHtmlEntities(match1[1].trim());
        }

        const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${pattern}["']`, 'i');
        const match2 = html.match(regex2);
        if (match2 && match2[1] && match2[1].trim()) {
            return decodeHtmlEntities(match2[1].trim());
        }
    }
    return undefined;
}

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

// Endpoint: GET /api/preview-link?url=...
router.get('/api/preview-link', async (req: Request, res: ExpressResponse) => {
    const rawUrl = req.query.url as string;

    if (!rawUrl || typeof rawUrl !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }

    let targetUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
        targetUrl = 'https://' + targetUrl;
    }

    // 1. Check in-memory Cache
    const cachedData = getFromCache(targetUrl);
    if (cachedData) {
        return res.json({ success: true, ...cachedData, cached: true });
    }

    // 2. Validate SSRF on Target URL
    const ssrfValidation = await validateUrlForSsrf(targetUrl);
    if (!ssrfValidation.safe || !ssrfValidation.parsed) {
        return res.status(400).json({
            success: false,
            error: ssrfValidation.error || 'Access to target URL is prohibited by SSRF security policy',
            url: targetUrl,
        });
    }

    const parsedUrl = ssrfValidation.parsed;
    const domain = parsedUrl.hostname;
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    try {
        // 3. Priority: Try oEmbed for YouTube and TikTok (100% accurate, zero anti-bot issues)
        const oEmbedResult = await fetchOEmbedPreview(targetUrl, parsedUrl);
        if (oEmbedResult) {
            setToCache(targetUrl, oEmbedResult);
            return res.json({
                success: true,
                ...oEmbedResult,
                source: 'oembed',
            });
        }

        // 4. Fallback: SSRF-Safe HTML Scraper with 250KB stream limit & timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await ssrfSafeFetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Twitterbot/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'th,en-US,en;q=0.9',
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return res.json({
                success: false,
                url: targetUrl,
                siteName: domain,
                favicon,
                error: `HTTP status ${response.status}`,
            });
        }

        // Read first 250KB of HTML to save bandwidth and memory
        const reader = response.body?.getReader();
        let html = '';
        if (reader) {
            let receivedLength = 0;
            const maxBytes = 250 * 1024;
            while (receivedLength < maxBytes) {
                const { done, value } = await reader.read();
                if (done) break;
                html += new TextDecoder('utf-8').decode(value, { stream: true });
                receivedLength += value.length;
            }
        } else {
            html = await response.text();
        }

        // Extract Open Graph / Twitter meta tags
        const title = extractMeta(html, ['og:title', 'twitter:title', 'title']) || 
                      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();

        const description = extractMeta(html, ['og:description', 'twitter:description', 'description']);
        
        let image = extractMeta(html, ['og:image', 'twitter:image', 'image']);
        if (image && !/^https?:\/\//i.test(image)) {
            // Resolve relative image URLs
            try {
                image = new URL(image, targetUrl).href;
            } catch {
                // Ignore resolve error
            }
        }

        const siteName = extractMeta(html, ['og:site_name', 'application-name']) || domain;

        const resultData = {
            title: title ? decodeHtmlEntities(title) : undefined,
            description: description ? decodeHtmlEntities(description) : undefined,
            image,
            siteName: decodeHtmlEntities(siteName),
            url: targetUrl,
            favicon,
        };

        // Cache result
        setToCache(targetUrl, resultData);

        return res.json({
            success: true,
            ...resultData,
            source: 'scraper',
        });

    } catch (err: any) {
        return res.json({
            success: false,
            url: targetUrl,
            siteName: domain,
            favicon,
            error: err?.name === 'AbortError' ? 'Timeout fetching preview' : (err?.message || 'Failed to fetch preview'),
        });
    }
});

export default router;
