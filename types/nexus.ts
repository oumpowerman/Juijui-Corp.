
export enum NexusPlatform {
    YOUTUBE = 'YOUTUBE',
    NOTION = 'NOTION',
    GOOGLE_SHEETS = 'GOOGLE_SHEETS',
    GOOGLE_DRIVE = 'GOOGLE_DRIVE',
    TIKTOK = 'TIKTOK',
    FACEBOOK = 'FACEBOOK',
    INSTAGRAM = 'INSTAGRAM',
    CANVA = 'CANVA',
    GENERIC = 'GENERIC'
}

export interface NexusIntegration {
    id: string;
    title: string;
    url: string;
    platform: NexusPlatform;
    description?: string;
    thumbnailUrl?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    metadata?: {
        videoId?: string;
        sheetId?: string;
        notionId?: string;
        author?: string;
        viewCount?: string;
    };
}
