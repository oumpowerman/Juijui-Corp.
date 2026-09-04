import { TypeConfig } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';

const PLATFORM_LABELS: Record<string, { label: string; icon: string }> = {
  YOUTUBE: { label: 'YouTube', icon: '🔴' },
  TIKTOK: { label: 'TikTok', icon: '🎵' },
  FACEBOOK: { label: 'Facebook', icon: '🔵' },
  INSTAGRAM: { label: 'Instagram', icon: '📸' },
  OTHER: { label: 'Other', icon: '🌐' },
};

/**
 * Builds the Flex Message Bubble for Content Planner reminders and schedule alerts.
 * Distinguishes clearly between "Channel (ช่อง/แบรนด์)" and "Target Platforms (โซเชียลมีเดีย)".
 */
export function buildContentPlannerBodyContents(
  record: ClaimedNotificationRecord,
  config: TypeConfig
) {
  let meta: any = {};
  if (record.metadata) {
    try {
      meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
    } catch (_) {
      meta = {};
    }
  }

  const channelName = meta.channel_name || meta.channel || 'ช่องหลัก (Main Channel)';
  const platforms: string[] = Array.isArray(meta.target_platforms) 
    ? meta.target_platforms 
    : (meta.platform ? [meta.platform] : []);
  
  const scheduledTime = meta.scheduled_time || meta.due_time || 'ตามกำหนดการ';
  const currentStatus = meta.current_status || record.type;
  const contentFormat = meta.format || 'Video Clip';

  // Build platform chips text
  const platformBadges = platforms.map(p => {
    const pConf = PLATFORM_LABELS[p.toUpperCase()] || { label: p, icon: '📱' };
    return `${pConf.icon} ${pConf.label}`;
  }).join('  ');

  return [
    // Header row with Channel Badge
    {
      type: "box",
      layout: "horizontal",
      alignItems: "center",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#f5f3ff",
          cornerRadius: "md",
          paddingAll: "sm",
          contents: [
            {
              type: "text",
              text: `📺 ช่อง: ${channelName}`,
              size: "xs",
              weight: "bold",
              color: "#6366f1"
            }
          ]
        }
      ]
    },
    // Title
    {
      type: "text",
      text: record.title || "แจ้งเตือนกำหนดลงคอนเทนต์",
      weight: "bold",
      size: "lg",
      color: "#1e293b",
      wrap: true,
      margin: "md"
    },
    // Description / Message
    {
      type: "text",
      text: record.message || "มีคอนเทนต์ที่ใกล้ถึงเวลาเผยแพร่หรือต้องอัปเดตสถานะ",
      size: "sm",
      color: "#64748b",
      wrap: true,
      margin: "sm"
    },
    // Separator
    {
      type: "separator",
      margin: "lg",
      color: "#e2e8f0"
    },
    // Metadata Box
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "sm",
      contents: [
        // Publishing Platforms
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "แพลตฟอร์ม:",
              color: "#94a3b8",
              size: "xs",
              flex: 2
            },
            {
              type: "text",
              text: platformBadges || "ทุกแพลตฟอร์ม",
              weight: "bold",
              size: "xs",
              color: "#334155",
              flex: 5,
              wrap: true
            }
          ]
        },
        // Scheduled Time
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "เวลาลงคลิป:",
              color: "#94a3b8",
              size: "xs",
              flex: 2
            },
            {
              type: "text",
              text: `⏰ ${scheduledTime}`,
              weight: "bold",
              size: "xs",
              color: "#0f172a",
              flex: 5
            }
          ]
        },
        // Format & Status
        {
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "สถานะปัจจุบัน:",
              color: "#94a3b8",
              size: "xs",
              flex: 2
            },
            {
              type: "text",
              text: `🟡 ${currentStatus} (${contentFormat})`,
              weight: "bold",
              size: "xs",
              color: "#d97706",
              flex: 5
            }
          ]
        }
      ]
    }
  ];
}
