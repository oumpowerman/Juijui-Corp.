import { ChannelItem, STATUS_PRIORITY } from '../types';

/**
 * Safely parse background color class and extract corresponding text/border classes
 */
export const getColorClasses = (chColor?: string) => {
  const rawColor = chColor || 'bg-slate-400';
  const bgClass = rawColor.split(' ')[0];
  const textClass = bgClass.replace('bg-', 'text-');
  const borderClass = bgClass.replace('bg-', 'border-');
  return { bgClass, textClass, borderClass };
};

/**
 * Comparator to sort channels by status lifecycle (ACTIVE -> PLANNING -> PAUSED -> ARCHIVED),
 * preserving original index as secondary sort.
 */
export const compareChannelsByStatus = (a: ChannelItem, b: ChannelItem): number => {
  const priorityA = STATUS_PRIORITY[a.status] || 99;
  const priorityB = STATUS_PRIORITY[b.status] || 99;
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }
  return a.originalIndex - b.originalIndex;
};

/**
 * Generate human-friendly descriptive Thai tooltips based on item status
 */
export const getChannelTooltip = (item: ChannelItem): string => {
  if (item.isAll) {
    return 'รวมทุกช่องทาง • แสดงสต็อกคอนเทนต์ทั้งหมด';
  }
  if (item.isUnassigned) {
    return 'ไม่มีช่องทาง • แสดงสต็อกคอนเทนต์ที่ยังไม่ได้ระบุช่องทาง';
  }
  switch (item.status) {
    case 'PLANNING':
      return `[กำลังเตรียมงาน] ${item.name} • สถานะ: อยู่ระหว่างวางแผนเตรียมงาน ก่อสร้างช่องรายการใหม่ (Planning)`;
    case 'PAUSED':
      return `[พักชั่วคราว] ${item.name} • สถานะ: พักชั่วคราว / จบซีซัน (Paused)`;
    case 'ARCHIVED':
      return `[ปิดตัวแล้ว] ${item.name} • สถานะ: ยุติการออกอากาศ / เก็บประวัติ (Archived)`;
    case 'ACTIVE':
    default:
      return `${item.name} • สถานะ: เปิดใช้งานปกติ (Active)`;
  }
};
