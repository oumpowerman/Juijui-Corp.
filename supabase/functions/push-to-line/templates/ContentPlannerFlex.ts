import { TypeConfig } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';

const PLATFORM_LABELS: Record<string, { label: string; icon: string }> = {
  YOUTUBE: { label: 'YouTube', icon: '🔴' },
  TIKTOK: { label: 'TikTok', icon: '🎵' },
  FACEBOOK: { label: 'Facebook', icon: '🔵' },
  INSTAGRAM: { label: 'Instagram', icon: '📸' },
  LEMON8: { label: 'Lemon8', icon: '🍋' },
  THREADS: { label: 'Threads', icon: '🧵' },
  X: { label: 'X', icon: '⚫' },
  TWITTER: { label: 'Twitter', icon: '🐦' },
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
  const channelColor = meta.channel_color || '#6366f1';
  
  // Format platforms
  let rawPlatforms: string[] = [];
  if (Array.isArray(meta.target_platform)) {
    rawPlatforms = meta.target_platform;
  } else if (Array.isArray(meta.target_platforms)) {
    rawPlatforms = meta.target_platforms;
  } else if (meta.target_platform) {
    rawPlatforms = [meta.target_platform];
  } else if (meta.platform) {
    rawPlatforms = [meta.platform];
  }

  const scheduledTime = meta.scheduled_time || meta.due_time || 'ตามกำหนดการ';
  const currentStatus = (meta.status || meta.current_status || record.type || 'IDEA').toUpperCase();
  
  // Format content formats
  let formatText = 'Video Clip';
  if (Array.isArray(meta.content_formats) && meta.content_formats.length > 0) {
    formatText = meta.content_formats.join(', ');
  } else if (meta.format) {
    formatText = meta.format;
  }

  const remainingText = meta.remaining_text || 'ใกล้ถึงเวลาลงคลิป';
  const assigneeNames = meta.assignee_names && meta.assignee_names !== '-' ? meta.assignee_names : null;
  const editorNames = meta.editor_names && meta.editor_names !== '-' ? meta.editor_names : null;

  // Build platform chips text
  const platformBadges = rawPlatforms.length > 0
    ? rawPlatforms.map(p => {
        const pConf = PLATFORM_LABELS[p.toUpperCase()] || { label: p, icon: '📱' };
        return `${pConf.icon} ${pConf.label}`;
      }).join('  ')
    : '📱 ทุกช่องทาง';

  return [
    // Header row with Channel Badge & Alert Pill
    {
      type: "box",
      layout: "horizontal",
      alignItems: "center",
      justifyContent: "space-between",
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
              color: channelColor.startsWith('#') ? channelColor : "#6366f1"
            }
          ]
        },
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#fef2f2",
          cornerRadius: "md",
          paddingAll: "sm",
          contents: [
            {
              type: "text",
              text: `⏳ ${remainingText}`,
              size: "xxs",
              weight: "bold",
              color: "#dc2626"
            }
          ]
        }
      ]
    },
    // Title
    {
      type: "text",
      text: record.title || meta.title || "แจ้งเตือนกำหนดลงคอนเทนต์",
      weight: "bold",
      size: "md",
      color: "#0f172a",
      wrap: true,
      margin: "md"
    },
    // Warning Callout Banner
    {
      type: "box",
      layout: "horizontal",
      backgroundColor: "#fffbeb",
      cornerRadius: "md",
      paddingAll: "sm",
      margin: "sm",
      alignItems: "center",
      contents: [
        {
          type: "text",
          text: `⚠️ ยังไม่ได้รับการอนุมัติ (สถานะ: ${currentStatus}) กรุณาตรวจสอบคลิปก่อนถึงเวลาเผยแพร่`,
          size: "xxs",
          color: "#b45309",
          wrap: true
        }
      ]
    },
    // Separator
    {
      type: "separator",
      margin: "md",
      color: "#e2e8f0"
    },
    // Metadata Box
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "xs",
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
              text: platformBadges,
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
              text: "รูปแบบคลิป:",
              color: "#94a3b8",
              size: "xs",
              flex: 2
            },
            {
              type: "text",
              text: `🎬 ${formatText}`,
              weight: "bold",
              size: "xs",
              color: "#475569",
              flex: 5
            }
          ]
        },
        // Assignee / Editor if available
        ...(assigneeNames ? [{
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "ผู้รับผิดชอบ:",
              color: "#94a3b8",
              size: "xs",
              flex: 2
            },
            {
              type: "text",
              text: `👤 ${assigneeNames}`,
              weight: "bold",
              size: "xs",
              color: "#334155",
              flex: 5,
              wrap: true
            }
          ]
        }] : []),
        ...(editorNames ? [{
          type: "box",
          layout: "baseline",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: "คนตัดต่อ:",
              color: "#94a3b8",
              size: "xs",
              flex: 2
            },
            {
              type: "text",
              text: `✂️ ${editorNames}`,
              weight: "bold",
              size: "xs",
              color: "#334155",
              flex: 5,
              wrap: true
            }
          ]
        }] : [])
      ]
    }
  ];
}
