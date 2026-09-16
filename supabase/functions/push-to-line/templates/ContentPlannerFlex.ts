import { getAppUrl, TypeConfig } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';

const PLATFORM_NAMES: Record<string, string> = {
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  LEMON8: 'Lemon8',
  THREADS: 'Threads',
  X: 'X (Twitter)',
  TWITTER: 'Twitter',
  OTHER: 'Other'
};

const FORMAT_NAMES: Record<string, string> = {
  SHORT_FORM: 'Short Form',
  LONG_FORM: 'Long Form',
  REELS: 'Reels',
  TIKTOK: 'TikTok Clip',
  SHORTS: 'Shorts',
  PODCAST: 'Podcast',
  LIVE: 'Live Stream',
  IMAGE: 'Photo / Graphic',
  CAROUSEL: 'Carousel',
  POST: 'Feed Post'
};

function formatSingleFormat(fStr: string): string {
  if (!fStr) return 'Video';
  const cleanKey = fStr.trim().toUpperCase();
  return FORMAT_NAMES[cleanKey] || fStr.replace(/_/g, ' ').trim();
}

function formatContentFormats(formatsInput: any): string {
  if (Array.isArray(formatsInput) && formatsInput.length > 0) {
    return formatsInput.map(f => formatSingleFormat(String(f))).join(', ');
  }
  if (typeof formatsInput === 'string' && formatsInput.trim()) {
    // Handle comma or slash separated strings
    const parts = formatsInput.split(/[,/]/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts.map(p => formatSingleFormat(p)).join(', ');
    }
    return formatSingleFormat(formatsInput);
  }
  return 'Short Form';
}

function formatStatusName(statusStr: string): string {
  if (!statusStr) return 'กำลังดำเนินการ';
  const s = statusStr.trim().toUpperCase();
  if (s.includes('APPROVE')) return 'อนุมัติแล้ว (Approved)';
  if (s.includes('DONE') || s.includes('FINAL')) return 'เสร็จสิ้น (Done)';
  if (s.includes('DRAFT_2') || s.includes('DRAFT2')) return 'ตัดต่อดราฟท์ 2';
  if (s.includes('DRAFT_1') || s.includes('DRAFT1')) return 'ตัดต่อดราฟท์ 1';
  if (s.includes('EDIT')) return 'กำลังตัดต่อ (Editing)';
  if (s.includes('FEEDBACK')) return 'รอแก้ฟีดแบ็ก';
  if (s.includes('SCRIPT')) return 'เขียนบท (Script)';
  if (s.includes('FILMING') || s.includes('SHOOT')) return 'กำลังถ่ายทำ';
  if (s.includes('IDEA')) return 'เสนอไอเดีย (Idea)';
  return statusStr.replace(/^\d+_/, '').replace(/_/g, ' ').trim();
}

function getStatusBadge(statusStr: string): { dot: string; color: string; isReady: boolean } {
  const s = (statusStr || '').toUpperCase();
  if (s.includes('APPROVE') || s.includes('DONE') || s.includes('FINAL')) {
    return { dot: '🟢', color: '#10b981', isReady: true };
  }
  if (s.includes('FEEDBACK') || s.includes('DRAFT') || s.includes('EDIT')) {
    return { dot: '🟡', color: '#f59e0b', isReady: false };
  }
  return { dot: '🔵', color: '#6366f1', isReady: false };
}

function extractCleanTitle(record: ClaimedNotificationRecord, meta: any): string {
  if (meta?.title && typeof meta.title === 'string' && meta.title.trim()) {
    return meta.title.trim();
  }
  const raw = record.title || '';
  return raw
    .replace(/^[⚠️🚨⏰\s]*(\[.*?\])?\s*(คอนเทนต์ใกล้ถึงเวลาลง:?\s*)?/i, '')
    .trim() || 'คอนเทนต์ประจำวัน';
}

function parsePlatforms(meta: any): string {
  let raw: string[] = [];
  if (Array.isArray(meta.target_platform)) raw = meta.target_platform;
  else if (Array.isArray(meta.target_platforms)) raw = meta.target_platforms;
  else if (meta.target_platform) raw = [meta.target_platform];
  else if (meta.platform) raw = [meta.platform];

  if (raw.length === 0) return 'ทุกแพลตฟอร์ม';
  return raw.map(p => PLATFORM_NAMES[p.toUpperCase()] || p).join(' • ');
}

/**
 * Builds a Soft Pastel Aesthetic & Apple iOS Live Activity Flex Bubble
 * for Content Planner Pre-Release & Schedule Reminders.
 */
export function buildContentPlannerAlertPayload(
  targetDestination: string,
  record: ClaimedNotificationRecord,
  lineHeaderTitle?: string
) {
  let meta: any = {};
  if (record.metadata) {
    try {
      meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
    } catch (_) {
      meta = {};
    }
  }

  const baseAppUrl = getAppUrl();
  const channelName = meta.channel_name || meta.channel || 'ช่องหลัก';
  const channelColor = meta.channel_color && meta.channel_color.startsWith('#') ? meta.channel_color : '#6366f1';
  const scheduledTime = meta.scheduled_time || meta.due_time || 'ตามกำหนดการ';
  const remainingText = meta.remaining_text || 'ใกล้ถึงเวลาลงคลิป';
  const remainingMinutes = Number(meta.remaining_minutes);
  const cleanTitle = extractCleanTitle(record, meta);
  const platformsText = parsePlatforms(meta);

  // Status formatting
  const rawStatus = meta.status || meta.current_status || 'EDITING';
  const statusFormatted = formatStatusName(rawStatus);
  const statusMeta = getStatusBadge(rawStatus);

  // Format label: Clean, transformed (e.g. "🎬 Short Form, Reels")
  const formattedFormats = formatContentFormats(meta.content_formats || meta.format);

  const assigneeNames = meta.assignee_names && meta.assignee_names !== '-' ? meta.assignee_names : null;
  const editorNames = meta.editor_names && meta.editor_names !== '-' ? meta.editor_names : null;

  // Soft Pastel Urgency Pill (Soft Peach / Soft Rose)
  const isUrgent = !isNaN(remainingMinutes) && remainingMinutes <= 15;
  const urgencyBg = isUrgent ? '#fee2e2' : '#fef3c7';
  const urgencyTextColor = isUrgent ? '#b91c1c' : '#d97706';
  const urgencyLabel = !isNaN(remainingMinutes) && remainingMinutes < 0
    ? `เลยเวลา ${Math.abs(remainingMinutes)} นาที`
    : `อีก ${remainingText}`;

  // Deep links
  const taskId = record.related_id || meta.content_id || '';
  const channelIdParam = meta.channel_id ? `&channelId=${meta.channel_id}` : '';
  const contentDeepLink = `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&taskId=${taskId}&highlightTaskId=${taskId}${channelIdParam}`;
  const quickApproveLink = `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&taskId=${taskId}&highlightTaskId=${taskId}&quickAction=approve${channelIdParam}`;
  const quickDoneLink = `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&taskId=${taskId}&highlightTaskId=${taskId}&quickAction=set_done${channelIdParam}`;

  const contents: any[] = [
    // 1. Sleek Sub-eyebrow: Channel Name & Notification Tag
    {
      type: "box",
      layout: "horizontal",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: "xs",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          alignItems: "center",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: `● ${channelName}`,
              size: "xs",
              weight: "bold",
              color: channelColor
            }
          ]
        },
        {
          type: "text",
          text: "SCHEDULED ALERT",
          size: "xxs",
          weight: "bold",
          color: "#94a3b8"
        }
      ]
    },

    // 2. Soft Pastel Hero Card (Light Indigo Cream / Ice Slate)
    {
      type: "box",
      layout: "vertical",
      backgroundColor: "#f0f4f8",
      cornerRadius: "xl",
      paddingAll: "lg",
      margin: "sm",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          alignItems: "center",
          justifyContent: "space-between",
          contents: [
            {
              type: "text",
              text: "กำหนดลงคลิป",
              size: "xs",
              weight: "bold",
              color: "#64748b"
            },
            {
              type: "box",
              layout: "horizontal",
              backgroundColor: urgencyBg,
              cornerRadius: "xxl",
              paddingStart: "sm",
              paddingEnd: "sm",
              paddingTop: "xs",
              paddingBottom: "xs",
              contents: [
                {
                  type: "text",
                  text: urgencyLabel,
                  size: "xxs",
                  weight: "bold",
                  color: urgencyTextColor
                }
              ]
            }
          ]
        },
        {
          type: "text",
          text: `${scheduledTime} น.`,
          size: "xxl",
          weight: "bold",
          color: "#1e293b",
          margin: "xs"
        },
        {
          type: "text",
          text: `🎬 ${formattedFormats}`,
          size: "xs",
          color: "#475569",
          weight: "bold",
          margin: "xs",
          wrap: true
        }
      ]
    },

    // 3. Content Title Headline (Clean typography, no messy emojis)
    {
      type: "text",
      text: cleanTitle,
      weight: "bold",
      size: "md",
      color: "#0f172a",
      wrap: true,
      margin: "md"
    }
  ];

  // 4. Subtle Pastel Status Notice (Only if not yet ready, minimal & soft)
  if (!statusMeta.isReady) {
    contents.push({
      type: "box",
      layout: "horizontal",
      backgroundColor: "#fffbeb",
      cornerRadius: "md",
      paddingStart: "md",
      paddingEnd: "md",
      paddingTop: "sm",
      paddingBottom: "sm",
      margin: "sm",
      alignItems: "center",
      contents: [
        {
          type: "text",
          text: `⚠️ ยังไม่ได้รับการอนุมัติ (${statusFormatted})`,
          size: "xxs",
          weight: "bold",
          color: "#b45309",
          wrap: true
        }
      ]
    });
  }

  // 5. Inset Grouped Spec Card (Apple Settings Style - Pastel Slate Background)
  const specRows: any[] = [
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "สถานะ",
          color: "#64748b",
          size: "xs",
          flex: 3
        },
        {
          type: "text",
          text: `${statusMeta.dot} ${statusFormatted}`,
          color: "#0f172a",
          weight: "bold",
          size: "xs",
          flex: 7
        }
      ]
    },
    {
      type: "separator",
      margin: "sm",
      color: "#e2e8f0"
    },
    {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: "แพลตฟอร์ม",
          color: "#64748b",
          size: "xs",
          flex: 3
        },
        {
          type: "text",
          text: platformsText,
          color: "#334155",
          weight: "bold",
          size: "xs",
          flex: 7,
          wrap: true
        }
      ]
    }
  ];

  if (assigneeNames) {
    specRows.push(
      {
        type: "separator",
        margin: "sm",
        color: "#e2e8f0"
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "ผู้รับผิดชอบ",
            color: "#64748b",
            size: "xs",
            flex: 3
          },
          {
            type: "text",
            text: assigneeNames,
            color: "#334155",
            size: "xs",
            flex: 7,
            wrap: true
          }
        ]
      }
    );
  }

  if (editorNames) {
    specRows.push(
      {
        type: "separator",
        margin: "sm",
        color: "#e2e8f0"
      },
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "คนตัดต่อ",
            color: "#64748b",
            size: "xs",
            flex: 3
          },
          {
            type: "text",
            text: editorNames,
            color: "#334155",
            size: "xs",
            flex: 7,
            wrap: true
          }
        ]
      }
    );
  }

  contents.push({
    type: "box",
    layout: "vertical",
    backgroundColor: "#f8fafc",
    cornerRadius: "lg",
    paddingAll: "md",
    margin: "md",
    contents: specRows
  });

  return {
    to: targetDestination,
    messages: [
      {
        type: "flex",
        altText: `⏰ [${channelName}] ใกล้ถึงเวลาลงคลิป: ${cleanTitle} (${scheduledTime} น.)`,
        contents: {
          type: "bubble",
          size: "mega",
          body: {
            type: "box",
            layout: "vertical",
            paddingAll: "16px",
            contents: contents
          },
          footer: {
            type: "box",
            layout: "vertical",
            paddingStart: "16px",
            paddingEnd: "16px",
            paddingBottom: "16px",
            paddingTop: "0px",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                spacing: "sm",
                contents: [
                  {
                    type: "button",
                    action: {
                      type: "uri",
                      label: "ตรวจผ่าน / อนุมัติ",
                      uri: quickApproveLink
                    },
                    style: "primary",
                    height: "sm",
                    color: "#4f46e5",
                    flex: 1
                  },
                  {
                    type: "button",
                    action: {
                      type: "uri",
                      label: "โพสต์คลิปแล้ว (Done)",
                      uri: quickDoneLink
                    },
                    style: "secondary",
                    height: "sm",
                    color: "#ecfdf5",
                    flex: 1
                  }
                ]
              },
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "ดูในตารางคอนเทนต์ ↗",
                  uri: contentDeepLink
                },
                style: "link",
                height: "sm",
                color: "#64748b",
                margin: "xs"
              }
            ]
          }
        }
      }
    ]
  };
}

/**
 * Backward compatibility function for standard multi-record or custom body callers.
 */
export function buildContentPlannerBodyContents(
  record: ClaimedNotificationRecord,
  _config?: TypeConfig
) {
  let meta: any = {};
  if (record.metadata) {
    try {
      meta = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
    } catch (_) {
      meta = {};
    }
  }

  const channelName = meta.channel_name || meta.channel || 'ช่องหลัก';
  const channelColor = meta.channel_color && meta.channel_color.startsWith('#') ? meta.channel_color : '#6366f1';
  const scheduledTime = meta.scheduled_time || meta.due_time || 'ตามกำหนดการ';
  const remainingText = meta.remaining_text || 'ใกล้ถึงเวลาลงคลิป';
  const remainingMinutes = Number(meta.remaining_minutes);
  const cleanTitle = extractCleanTitle(record, meta);

  const rawStatus = meta.status || meta.current_status || 'EDITING';
  const statusFormatted = formatStatusName(rawStatus);
  const statusMeta = getStatusBadge(rawStatus);

  const formattedFormats = formatContentFormats(meta.content_formats || meta.format);

  const isUrgent = !isNaN(remainingMinutes) && remainingMinutes <= 15;
  const urgencyBg = isUrgent ? '#fee2e2' : '#fef3c7';
  const urgencyTextColor = isUrgent ? '#b91c1c' : '#d97706';
  const urgencyLabel = !isNaN(remainingMinutes) && remainingMinutes < 0
    ? `เลยเวลา ${Math.abs(remainingMinutes)} นาที`
    : `อีก ${remainingText}`;

  return [
    {
      type: "box",
      layout: "vertical",
      backgroundColor: "#f0f4f8",
      cornerRadius: "xl",
      paddingAll: "md",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          alignItems: "center",
          justifyContent: "space-between",
          contents: [
            {
              type: "text",
              text: `● ${channelName}`,
              size: "xs",
              weight: "bold",
              color: channelColor
            },
            {
              type: "box",
              layout: "horizontal",
              backgroundColor: urgencyBg,
              cornerRadius: "xxl",
              paddingStart: "sm",
              paddingEnd: "sm",
              paddingTop: "xs",
              paddingBottom: "xs",
              contents: [
                {
                  type: "text",
                  text: urgencyLabel,
                  size: "xxs",
                  weight: "bold",
                  color: urgencyTextColor
                }
              ]
            }
          ]
        },
        {
          type: "text",
          text: `${scheduledTime} น.`,
          size: "xl",
          weight: "bold",
          color: "#1e293b",
          margin: "xs"
        },
        {
          type: "text",
          text: `🎬 ${formattedFormats}`,
          size: "xs",
          color: "#475569",
          margin: "xs"
        }
      ]
    },
    {
      type: "text",
      text: cleanTitle,
      weight: "bold",
      size: "md",
      color: "#0f172a",
      wrap: true,
      margin: "md"
    },
    {
      type: "box",
      layout: "horizontal",
      backgroundColor: "#f8fafc",
      cornerRadius: "md",
      paddingAll: "sm",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: `สถานะ: ${statusMeta.dot} ${statusFormatted}`,
          size: "xs",
          color: "#334155",
          weight: "bold"
        }
      ]
    }
  ];
}
