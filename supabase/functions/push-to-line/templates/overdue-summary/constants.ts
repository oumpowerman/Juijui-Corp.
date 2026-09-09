import { OverdueItem } from './types.ts';

export const STATUS_BADGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  IDEA: { label: '💡 ร่างไอเดีย', bg: '#f1f5f9', text: '#475569' },
  SCRIPT: { label: '✍️ เขียนบท', bg: '#fef3c7', text: '#92400e' },
  SCRIPTING: { label: '✍️ เขียนบท', bg: '#fef3c7', text: '#92400e' },
  SHOOTING: { label: '🎬 ถ่ายทำ/อัดเสียง', bg: '#ffedd5', text: '#9a3412' },
  RECORDING: { label: '🎬 ถ่ายทำ/อัดเสียง', bg: '#ffedd5', text: '#9a3412' },
  EDIT_CLIP: { label: '✂️ กำลังตัดต่อ', bg: '#e0e7ff', text: '#3730a3' },
  EDITING: { label: '✂️ กำลังตัดต่อ', bg: '#e0e7ff', text: '#3730a3' },
  EDIT_DRAFT_1: { label: '🛠️ ตัดต่อดราฟท์ 1', bg: '#e0e7ff', text: '#3730a3' },
  FEEDBACK: { label: '🗣️ รอตรวจฟีดแบ็ก', bg: '#fce7f3', text: '#9d174d' },
  FEEDBACK_1: { label: '🗣️ ฟีดแบ็ก 1', bg: '#fce7f3', text: '#9d174d' },
  REVIEW: { label: '👀 รอตรวจงาน', bg: '#fce7f3', text: '#9d174d' },
  EDIT_DRAFT_2: { label: '🔄 แก้ไขดราฟท์ 2', bg: '#ede9fe', text: '#5b21b6' },
  FEEDBACK_2: { label: '💬 ฟีดแบ็ก 2', bg: '#fce7f3', text: '#9d174d' },
  REVISE: { label: '🔄 ส่งแก้ไข', bg: '#fee2e2', text: '#991b1b' },
  WAITING_SCHEDULE: { label: '⏳ รอตั้งเวลา', bg: '#dcfce7', text: '#166534' },
  SCHEDULED: { label: '⏰ ตั้งเวลาแล้ว', bg: '#fef9c3', text: '#713f12' },
  APPROVED: { label: '✅ อนุมัติแล้ว', bg: '#d1fae5', text: '#065f46' },
  DONE: { label: '✅ เสร็จสิ้น', bg: '#d1fae5', text: '#065f46' },
};

/**
 * Fallback pattern matching for custom or unknown status keys to assign elegant pastel colors.
 */
function matchStatusByKeyword(key: string, label: string): { label: string; bg: string; text: string } {
  const combined = `${key} ${label}`.toUpperCase();
  if (combined.includes('IDEA') || combined.includes('บรีฟ') || combined.includes('ร่าง')) {
    return { label: label || '💡 ร่างไอเดีย', bg: '#f1f5f9', text: '#475569' };
  }
  if (combined.includes('SCRIPT') || combined.includes('บท')) {
    return { label: label || '✍️ เขียนบท', bg: '#fef3c7', text: '#92400e' };
  }
  if (combined.includes('SHOOT') || combined.includes('ถ่าย') || combined.includes('RECORD')) {
    return { label: label || '🎬 กำลังถ่ายทำ', bg: '#ffedd5', text: '#9a3412' };
  }
  if (combined.includes('EDIT') || combined.includes('ตัดต่อ') || combined.includes('CLIP')) {
    return { label: label || '✂️ กำลังตัดต่อ', bg: '#e0e7ff', text: '#3730a3' };
  }
  if (combined.includes('FEEDBACK') || combined.includes('ตรวจ') || combined.includes('REVIEW')) {
    return { label: label || '🗣️ รอตรวจงาน', bg: '#fce7f3', text: '#9d174d' };
  }
  if (combined.includes('REVISE') || combined.includes('แก้ไข')) {
    return { label: label || '🔄 แก้ไขงาน', bg: '#ede9fe', text: '#5b21b6' };
  }
  if (combined.includes('SCHEDULE') || combined.includes('ตั้งเวลา')) {
    return { label: label || '⏳ รอตั้งเวลา', bg: '#dcfce7', text: '#166534' };
  }
  if (combined.includes('DONE') || combined.includes('เสร็จ') || combined.includes('APPROV')) {
    return { label: label || '✅ เสร็จสิ้น', bg: '#d1fae5', text: '#065f46' };
  }
  return { label: label || key || 'รอดำเนินการ', bg: '#f1f5f9', text: '#475569' };
}

/**
 * Resolves the display label and pastel badge styles for an overdue item.
 * Prioritizes `status_label` from master_options, with fallback to STATUS_BADGE_CONFIG and keyword matching.
 */
export function resolveStatusBadge(item: OverdueItem): { label: string; bg: string; text: string } {
  const statusKey = (item.status || 'IDEA').toUpperCase();

  // 1. If explicit status_label was provided from master_options
  if (item.status_label && item.status_label.trim() !== '') {
    const rawLabel = item.status_label.trim();
    const config = STATUS_BADGE_CONFIG[statusKey] || matchStatusByKeyword(statusKey, rawLabel);
    return {
      label: rawLabel,
      bg: config.bg,
      text: config.text,
    };
  }

  // 2. Fallback from status key
  const matched = STATUS_BADGE_CONFIG[statusKey] || matchStatusByKeyword(statusKey, '');
  return {
    label: cleanText(matched.label, cleanText(item.status, 'รอดำเนินการ')),
    bg: matched.bg,
    text: matched.text,
  };
}

/**
 * Ensures text sent to LINE Flex message is never empty or blank.
 * Empty text strings cause immediate 400 Bad Request error from LINE API.
 */
export function cleanText(val: any, fallback: string = '-'): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  return str.length > 0 ? str : fallback;
}
