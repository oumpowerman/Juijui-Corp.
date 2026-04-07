
/**
 * Ensures a URL is treated as an external link by prepending https:// if no protocol is present.
 * This prevents browsers from treating it as a relative path within the application.
 * 
 * @param url The URL string to format
 * @returns The formatted URL string with a protocol
 */
export const ensureExternalLink = (url: string | undefined | null): string => {
    if (!url) return '';
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';

    // Check if it already has a protocol (http://, https://, ftp://, etc.)
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedUrl)) {
        return trimmedUrl;
    }

    // If it starts with //, it's a protocol-relative URL
    if (trimmedUrl.startsWith('//')) {
        return trimmedUrl;
    }

    // Default to https://
    return `https://${trimmedUrl}`;
};
