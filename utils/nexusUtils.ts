
import { NexusPlatform } from '../types';

export const detectPlatform = (url: string): NexusPlatform => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return NexusPlatform.YOUTUBE;
    }
    if (lowerUrl.includes('tiktok.com')) {
        return NexusPlatform.TIKTOK;
    }
    if (lowerUrl.includes('facebook.com') || lowerUrl.includes('fb.watch')) {
        return NexusPlatform.FACEBOOK;
    }
    if (lowerUrl.includes('instagram.com')) {
        return NexusPlatform.INSTAGRAM;
    }
    if (lowerUrl.includes('canva.com')) {
        return NexusPlatform.CANVA;
    }
    if (lowerUrl.includes('notion.so') || lowerUrl.includes('notion.site')) {
        return NexusPlatform.NOTION;
    }
    if (lowerUrl.includes('docs.google.com/spreadsheets')) {
        return NexusPlatform.GOOGLE_SHEETS;
    }
    if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com') || lowerUrl.includes('forms.google.com')) {
        // More specific check for sheets already done above
        if (lowerUrl.includes('spreadsheets')) return NexusPlatform.GOOGLE_SHEETS;
        return NexusPlatform.GOOGLE_DRIVE;
    }
    return NexusPlatform.GENERIC;
};

export const extractYouTubeId = (url: string): string | null => {
    // Standard and shortened URLs
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[7].length === 11) {
        return match[7];
    }
    
    // Shorts URLs
    const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    // Live URLs
    const liveMatch = url.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    if (liveMatch) return liveMatch[1];
    
    return null;
};

export const extractDriveId = (url: string): string | null => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

export const getYouTubeThumbnail = (videoId: string): string => {
    // Try high res first, but YouTube will redirect to lower res if not available
    return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
};

export const getPlatformConfig = (platform: NexusPlatform) => {
    switch (platform) {
        case NexusPlatform.YOUTUBE:
            return {
                color: 'rose',
                label: 'YouTube',
                iconColor: 'text-rose-600',
                bgColor: 'bg-rose-50',
                borderColor: 'border-rose-100'
            };
        case NexusPlatform.TIKTOK:
            return {
                color: 'slate',
                label: 'TikTok',
                iconColor: 'text-slate-900',
                bgColor: 'bg-slate-50',
                borderColor: 'border-slate-200'
            };
        case NexusPlatform.FACEBOOK:
            return {
                color: 'blue',
                label: 'Facebook',
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-100'
            };
        case NexusPlatform.INSTAGRAM:
            return {
                color: 'pink',
                label: 'Instagram',
                iconColor: 'text-pink-600',
                bgColor: 'bg-pink-50',
                borderColor: 'border-pink-100'
            };
        case NexusPlatform.CANVA:
            return {
                color: 'cyan',
                label: 'Canva',
                iconColor: 'text-cyan-600',
                bgColor: 'bg-cyan-50',
                borderColor: 'border-cyan-100'
            };
        case NexusPlatform.NOTION:
            return {
                color: 'slate',
                label: 'Notion',
                iconColor: 'text-slate-800',
                bgColor: 'bg-slate-50',
                borderColor: 'border-slate-200'
            };
        case NexusPlatform.GOOGLE_SHEETS:
            return {
                color: 'emerald',
                label: 'Google Sheets',
                iconColor: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-100'
            };
        case NexusPlatform.GOOGLE_DRIVE:
            return {
                color: 'blue',
                label: 'Google Drive',
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-100'
            };
        default:
            return {
                color: 'indigo',
                label: 'Web Link',
                iconColor: 'text-indigo-600',
                bgColor: 'bg-indigo-50',
                borderColor: 'border-indigo-100'
            };
    }
};
