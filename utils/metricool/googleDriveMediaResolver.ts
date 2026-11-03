import { AssetCategory, Task, TaskAsset } from '../../types';

export type GoogleDriveUrlKind =
    | 'DRIVE_FILE'
    | 'DRIVE_FOLDER'
    | 'DRIVE_DOCUMENT'
    | 'EXTERNAL_URL'
    | 'EMPTY';

export interface GoogleDriveUrlClassification {
    kind: GoogleDriveUrlKind;
    originalUrl: string;
    fileId?: string;
    /** ลิงก์ดาวน์โหลดตรงสำหรับใส่ใน Picture Url 1 หรือ Video Thumbnail Url ของ Metricool */
    directDownloadUrl: string;
    isGoogleDrive: boolean;
    isPublishableFile: boolean;
    warningMessage?: string;
}

export type MetricoolMediaReadinessStatus =
    | 'READY_DRIVE_DIRECT'
    | 'READY_EXTERNAL'
    | 'WARNING_DRIVE_FOLDER'
    | 'WARNING_UNMARKED_ASSETS'
    | 'NO_MEDIA';

export interface MetricoolMediaInspection {
    status: MetricoolMediaReadinessStatus;
    /** รายการไฟล์แนบที่ผู้ใช้ติ๊กเลือก "ส่งโพสต์ Metricool" ทั้งหมด (ไม่รวม THUMBNAIL) */
    selectedAssets: TaskAsset[];
    /** รายการไฟล์ที่ติ๊กเลือกและสามารถแปลงเป็นลิงก์ไฟล์มีเดียส่งให้ Metricool ได้จริง */
    validPublishAssets: TaskAsset[];
    /** รายการไฟล์ที่ติ๊กเลือกแต่เผลอเป็นลิงก์โฟลเดอร์ Google Drive หรือ Google Docs */
    folderWarningAssets: TaskAsset[];
    /** จำนวนไฟล์แนบหมวดวิดีโอ/ลิงก์ในการ์ดที่ยังไม่ได้ติ๊กเลือกเป็นคลิปไฟนอล */
    unmarkedCandidateCount: number;
    /** ลิงก์มีเดียที่ผ่านการแปลงเป็น Direct Link พร้อมใส่คอลัมน์ Picture Url 1..10 */
    resolvedMediaUrls: string[];
    /** ลิงก์ภาพปกที่ผ่านการแปลงเป็น Direct Link พร้อมใส่คอลัมน์ Video Thumbnail Url */
    resolvedThumbnailUrl: string;
    /** มีไฟล์ภาพปก (THUMBNAIL) ที่พร้อมส่งออกหรือไม่ */
    hasThumbnail: boolean;
}

/**
 * ตรวจสอบว่าหมวดหมู่ไฟล์แนบนี้สามารถติ๊กเลือกเป็นไฟล์มีเดียหลักสำหรับส่งโพสต์ Metricool ได้หรือไม่
 * (แยกออกจาก SCRIPT, INVOICE และ THUMBNAIL ซึ่งมีคอลัมน์เฉพาะ)
 */
export function isMediaEligibleCategory(category?: AssetCategory): boolean {
    if (!category) return true;
    return category !== 'SCRIPT' && category !== 'INVOICE' && category !== 'THUMBNAIL';
}

/**
 * จำแนกประเภทลิงก์ Google Drive (ไฟล์เดี่ยว vs โฟลเดอร์ vs เอกสาร Docs/Sheets vs ลิงก์ภายนอก)
 * และสกัด FILE_ID เพื่อแปลงเป็น Direct Download URL (`https://drive.google.com/uc?export=download&id=...`)
 */
export function classifyGoogleDriveUrl(rawUrl?: string | null): GoogleDriveUrlClassification {
    const trimmed = (rawUrl || '').trim();
    if (!trimmed) {
        return {
            kind: 'EMPTY',
            originalUrl: '',
            directDownloadUrl: '',
            isGoogleDrive: false,
            isPublishableFile: false
        };
    }

    const lower = trimmed.toLowerCase();

    // 1. ตรวจจับลิงก์โฟลเดอร์ Google Drive (เช่น https://drive.google.com/drive/folders/1AbCdEfG...)
    if (
        /drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/i.test(trimmed) ||
        lower.includes('drive.google.com/drive/folders') ||
        lower.includes('drive.google.com/drive/my-drive')
    ) {
        return {
            kind: 'DRIVE_FOLDER',
            originalUrl: trimmed,
            directDownloadUrl: '',
            isGoogleDrive: true,
            isPublishableFile: false,
            warningMessage:
                'ลิงก์โฟลเดอร์ Google Drive เหมาะสำหรับเก็บฟุตเทจดิบเท่านั้น ไม่สามารถส่งให้ Metricool ดึงคลิปได้ (กรุณาคัดลอกลิงก์ของไฟล์วิดีโอ .mp4 โดยตรง)'
        };
    }

    // 2. ตรวจจับลิงก์เอกสาร Google Docs / Sheets / Slides
    if (/docs\.google\.com\/(document|spreadsheets|presentation|forms)\//i.test(trimmed)) {
        return {
            kind: 'DRIVE_DOCUMENT',
            originalUrl: trimmed,
            directDownloadUrl: '',
            isGoogleDrive: true,
            isPublishableFile: false,
            warningMessage:
                'ลิงก์เอกสาร Google Docs/Sheets ไม่สามารถใช้เป็นไฟล์วิดีโอหรือรูปภาพใน Metricool ได้'
        };
    }

    // 3. ตรวจจับลิงก์ไฟล์เดี่ยวบน Google Drive ทุกรูปแบบ:
    // - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
    // - https://drive.google.com/open?id={FILE_ID}
    // - https://drive.google.com/uc?id={FILE_ID}&export=download
    // - https://drive.usercontent.google.com/download?id={FILE_ID}
    const filePathMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    const queryIdMatch =
        trimmed.match(
            /drive\.(?:usercontent\.)?google\.com\/(?:open|uc|download|file)\b[^#]*?[?&]id=([a-zA-Z0-9_-]+)/i
        ) || trimmed.match(/drive\.google\.com\/[^#]*?[?&]id=([a-zA-Z0-9_-]+)/i);

    const fileId = filePathMatch?.[1] || queryIdMatch?.[1];
    if (fileId) {
        return {
            kind: 'DRIVE_FILE',
            originalUrl: trimmed,
            fileId,
            directDownloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
            isGoogleDrive: true,
            isPublishableFile: true
        };
    }

    // กรณีเป็นลิงก์ drive.google.com อื่นๆ ที่ไม่มีรหัสไฟล์ชัดเจน
    if (lower.includes('drive.google.com')) {
        return {
            kind: 'DRIVE_FOLDER',
            originalUrl: trimmed,
            directDownloadUrl: '',
            isGoogleDrive: true,
            isPublishableFile: false,
            warningMessage:
                'ไม่พบรหัสไฟล์ในลิงก์ Google Drive นี้ กรุณาใช้ลิงก์แชร์ไฟล์วิดีโอโดยตรง (คลิกขวาที่ไฟล์คลิป > คัดลอกลิงก์)'
        };
    }

    // 4. ลิงก์ภายนอกทั่วไป (เช่น Direct MP4 / Supabase Storage / Dropbox)
    let resolvedExternal = trimmed;
    if (/dropbox\.com\//i.test(resolvedExternal) && resolvedExternal.includes('dl=0')) {
        resolvedExternal = resolvedExternal.replace('dl=0', 'dl=1');
    }

    return {
        kind: 'EXTERNAL_URL',
        originalUrl: trimmed,
        directDownloadUrl: resolvedExternal,
        isGoogleDrive: false,
        isPublishableFile: true
    };
}

/**
 * แปลงลิงก์ไฟล์แนบให้เป็น Direct Download URL สำหรับใส่ในคอลัมน์ Picture Url 1..10 หรือ Video Thumbnail Url
 * หากเป็นลิงก์โฟลเดอร์หรือเอกสารจะคืนค่าว่าง '' เพื่อป้องกันการส่งลิงก์ผิดเข้า Metricool
 */
export function toMetricoolDirectMediaUrl(url?: string | null): string {
    const classification = classifyGoogleDriveUrl(url);
    if (!classification.isPublishableFile) {
        return '';
    }
    return classification.directDownloadUrl;
}

/**
 * ตรวจสอบความพร้อมของไฟล์แนบในการ์ดงานสำหรับส่งออกไป Metricool CSV
 * กฎเหล็ก: ดึงเฉพาะไฟล์ที่ถูกติ๊กเลือก `isMetricoolReady === true` เท่านั้น เพื่อป้องกันการดึงลิงก์ฟุตเทจดิบหรือดราฟต์ผิดเวอร์ชัน
 */
export function inspectTaskMetricoolMedia(task: Task): MetricoolMediaInspection {
    const assets: TaskAsset[] = Array.isArray(task.assets) ? task.assets : [];

    // คัดแยกเฉพาะไฟล์ที่ผู้ใช้ติ๊กเลือก "ส่งโพสต์ Metricool" (ไม่รวม THUMBNAIL ซึ่งแยกไปคอลัมน์ปก)
    const selectedAssets = assets.filter(
        a => Boolean(a.url) && Boolean(a.isMetricoolReady) && a.category !== 'THUMBNAIL'
    );

    const validPublishAssets: TaskAsset[] = [];
    const folderWarningAssets: TaskAsset[] = [];
    const resolvedMediaUrls: string[] = [];

    let hasDriveFileReady = false;

    selectedAssets.forEach(asset => {
        const check = classifyGoogleDriveUrl(asset.url);
        if (check.isPublishableFile && check.directDownloadUrl) {
            validPublishAssets.push(asset);
            resolvedMediaUrls.push(check.directDownloadUrl);
            if (check.kind === 'DRIVE_FILE') {
                hasDriveFileReady = true;
            }
        } else {
            folderWarningAssets.push(asset);
        }
    });

    // ตรวจสอบจำนวนไฟล์แนบหมวดวิดีโอ/ลิงก์ที่ยังไม่ได้ติ๊กเลือก (เช่น ฟุตเทจดิบ หรือดราฟต์ที่ยังไม่ติ๊ก)
    const candidateMediaAssets = assets.filter(
        a => Boolean(a.url) && isMediaEligibleCategory(a.category)
    );
    const unmarkedCandidateCount = candidateMediaAssets.filter(a => !a.isMetricoolReady).length;

    // ตรวจสอบภาพปก (THUMBNAIL) และแปลงเป็น Direct Link อัตโนมัติถ้าอยู่บน Google Drive
    const thumbnailAsset =
        assets.find(a => Boolean(a.url) && a.category === 'THUMBNAIL' && a.isMetricoolReady) ||
        assets.find(a => Boolean(a.url) && a.category === 'THUMBNAIL');
    const resolvedThumbnailUrl = thumbnailAsset?.url
        ? toMetricoolDirectMediaUrl(thumbnailAsset.url)
        : '';

    let status: MetricoolMediaReadinessStatus = 'NO_MEDIA';
    if (folderWarningAssets.length > 0 && validPublishAssets.length === 0) {
        status = 'WARNING_DRIVE_FOLDER';
    } else if (validPublishAssets.length > 0) {
        status = hasDriveFileReady ? 'READY_DRIVE_DIRECT' : 'READY_EXTERNAL';
    } else if (unmarkedCandidateCount > 0) {
        status = 'WARNING_UNMARKED_ASSETS';
    } else {
        status = 'NO_MEDIA';
    }

    return {
        status,
        selectedAssets,
        validPublishAssets,
        folderWarningAssets,
        unmarkedCandidateCount,
        resolvedMediaUrls,
        resolvedThumbnailUrl,
        hasThumbnail: Boolean(resolvedThumbnailUrl)
    };
}
