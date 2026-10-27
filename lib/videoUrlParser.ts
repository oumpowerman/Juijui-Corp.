export interface ParsedVideoSource {
  type: 'youtube' | 'gdrive' | 'direct' | 'unknown';
  embedUrl: string;
  originalUrl: string;
  providerLabel: string;
  videoId?: string;
}

/**
 * แปลงลิงก์ Google Drive, YouTube หรือ Direct MP4 ให้เป็น Embed URL ที่พร้อมเปิดเล่นใน iframe ได้ทันที
 */
export function parseVideoUrl(rawUrl: string): ParsedVideoSource {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return {
      type: 'unknown',
      embedUrl: '',
      originalUrl: '',
      providerLabel: 'ไม่พบลิงก์วิดีโอ',
    };
  }

  // 1. Google Drive Links
  // - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // - https://drive.google.com/file/d/FILE_ID/preview
  // - https://drive.google.com/open?id=FILE_ID
  // - https://drive.google.com/uc?id=FILE_ID
  const gdriveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  const gdriveIdParamMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*?id=([a-zA-Z0-9_-]+)/i);
  const gdriveId = gdriveFileMatch?.[1] || gdriveIdParamMatch?.[1];

  if (gdriveId) {
    return {
      type: 'gdrive',
      embedUrl: `https://drive.google.com/file/d/${gdriveId}/preview`,
      originalUrl: trimmed,
      providerLabel: 'Google Drive',
      videoId: gdriveId,
    };
  }

  // 2. YouTube Links
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i
  );
  if (ytMatch?.[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`,
      originalUrl: trimmed,
      providerLabel: 'YouTube',
      videoId,
    };
  }

  // 3. Direct Video Files (.mp4, .webm, .ogg, .mov)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'direct',
      embedUrl: trimmed,
      originalUrl: trimmed,
      providerLabel: 'Direct Stream',
    };
  }

  return {
    type: 'unknown',
    embedUrl: trimmed,
    originalUrl: trimmed,
    providerLabel: 'เว็บภายนอก / Unknown',
  };
}

/**
 * ตรวจสอบความถูกต้องของลิงก์วิดีโอ
 */
export function validateVideoUrl(rawUrl: string): {
  isValid: boolean;
  type: 'youtube' | 'gdrive' | 'direct' | 'unknown';
  message: string;
} {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { isValid: false, type: 'unknown', message: 'กรุณากรอกลิงก์วิดีโอ' };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { isValid: false, type: 'unknown', message: 'URL ต้องขึ้นต้นด้วย https://' };
  }

  const parsed = parseVideoUrl(trimmed);
  if (parsed.type === 'youtube') {
    return { isValid: true, type: 'youtube', message: 'ลิงก์ YouTube ถูกต้อง พร้อมสร้าง Embed' };
  }
  if (parsed.type === 'gdrive') {
    return { isValid: true, type: 'gdrive', message: 'ลิงก์ Google Drive ถูกต้อง (อย่าลืมตั้งค่าแชร์เป็น Anyone with the link)' };
  }
  if (parsed.type === 'direct') {
    return { isValid: true, type: 'direct', message: 'ลิงก์ไฟล์วิดีโอตรงถูกต้อง (.mp4/.webm)' };
  }

  return { isValid: true, type: 'unknown', message: 'ตรวจไม่พบแพลตฟอร์มหลัก จะพยายามเปิดเป็น iframe' };
}
