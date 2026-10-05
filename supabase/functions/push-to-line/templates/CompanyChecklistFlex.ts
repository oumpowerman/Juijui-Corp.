import { getAppUrl } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';

export interface OverdueChecklistInfo {
  id: string;
  title: string;
  cycle: string;
  cycle_label: string;
  color?: string;
  icon?: string;
  days_overdue?: number;
  total_items?: number;
  responsible_roles?: string;
  last_submitted_at?: string;
  last_submitted_by?: string;
  is_overdue?: boolean;
  is_due_soon?: boolean;
  days_until_due?: number;
  next_due_date?: string;
  alert_category?: 'OVERDUE' | 'DUE_SOON';
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  teal: { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  cyan: { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc' },
  sky: { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' },
  blue: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  indigo: { bg: '#eef2ff', text: '#4f46e5', border: '#c7d2fe' },
  violet: { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  purple: { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
  fuchsia: { bg: '#fdf4ff', text: '#c026d3', border: '#f5d0fe' },
  pink: { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
  rose: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
  amber: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  orange: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
};

function getColorStyle(colorKey?: string) {
  const normalized = (colorKey || 'emerald').toLowerCase();
  return COLOR_MAP[normalized] || COLOR_MAP.emerald;
}

/**
 * Builds Overview Bubble (Card 1) summarizing all overdue company checklists & advance notices
 */
function buildChecklistOverviewBubble(
  checklists: OverdueChecklistInfo[],
  totalOverdueCount: number,
  dateStr: string,
  summaryTime: string,
  baseAppUrl: string
): any {
  const overdueItems = checklists.filter(c => c.alert_category !== 'DUE_SOON' && !c.is_due_soon);
  const dueSoonItems = checklists.filter(c => c.alert_category === 'DUE_SOON' || c.is_due_soon);

  const buildRows = (items: OverdueChecklistInfo[]) => {
    return items.slice(0, 5).map(chk => {
      const col = getColorStyle(chk.color);
      const isDueSoon = chk.alert_category === 'DUE_SOON' || chk.is_due_soon;
      const badgeText = isDueSoon
        ? `อีก ${chk.days_until_due || 0} วัน`
        : (chk.days_overdue === 999 
            ? 'ยังไม่เคยตรวจ' 
            : (chk.days_overdue && chk.days_overdue > 0 ? `เลย ${chk.days_overdue} วัน` : 'รอบวันนี้'));

      const badgeBg = isDueSoon ? '#fef3c7' : col.bg;
      const badgeColor = isDueSoon ? '#b45309' : col.text;

      return {
        type: "box",
        layout: "horizontal",
        alignItems: "center",
        paddingTop: "5px",
        paddingBottom: "5px",
        contents: [
          {
            type: "text",
            text: isDueSoon ? "⏳" : "●",
            size: "xs",
            color: badgeColor,
            flex: 0
          },
          {
            type: "text",
            text: chk.title || 'เช็คลิสต์บริษัท',
            size: "xs",
            color: "#1e293b",
            margin: "sm",
            weight: "bold",
            flex: 1,
            maxLines: 1
          },
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: badgeBg,
            cornerRadius: "md",
            paddingStart: "8px",
            paddingEnd: "8px",
            paddingTop: "2px",
            paddingBottom: "2px",
            contents: [
              {
                type: "text",
                text: badgeText,
                size: "xxs",
                weight: "bold",
                color: badgeColor
              }
            ]
          }
        ]
      };
    });
  };

  const bodyContents: any[] = [];

  // Summary Banner
  if (overdueItems.length > 0 && dueSoonItems.length > 0) {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      backgroundColor: "#fff7ed",
      cornerRadius: "md",
      paddingAll: "10px",
      alignItems: "center",
      contents: [
        { type: "text", text: "⚠️", size: "sm", flex: 0 },
        {
          type: "text",
          text: `ค้างตรวจ ${overdueItems.length} • ใกล้กำหนด ${dueSoonItems.length} หัวข้อ`,
          size: "xs",
          weight: "bold",
          color: "#9a3412",
          margin: "sm",
          flex: 1
        }
      ]
    });
  } else if (overdueItems.length > 0) {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      backgroundColor: "#fef2f2",
      cornerRadius: "md",
      paddingAll: "10px",
      alignItems: "center",
      contents: [
        { type: "text", text: "⚠️", size: "sm", flex: 0 },
        {
          type: "text",
          text: `ยังไม่บันทึกรอบตรวจ: ${overdueItems.length} หัวข้อ`,
          size: "xs",
          weight: "bold",
          color: "#991b1b",
          margin: "sm",
          flex: 1
        }
      ]
    });
  } else {
    bodyContents.push({
      type: "box",
      layout: "horizontal",
      backgroundColor: "#fefce8",
      cornerRadius: "md",
      paddingAll: "10px",
      alignItems: "center",
      contents: [
        { type: "text", text: "⏳", size: "sm", flex: 0 },
        {
          type: "text",
          text: `ใกล้ครบกำหนดรอบตรวจ: ${dueSoonItems.length} หัวข้อ`,
          size: "xs",
          weight: "bold",
          color: "#854d0e",
          margin: "sm",
          flex: 1
        }
      ]
    });
  }

  // Section 1: Overdue Items
  if (overdueItems.length > 0) {
    bodyContents.push({
      type: "text",
      text: "🔴 หมวดงานค้างตรวจ (Overdue):",
      size: "xxs",
      color: "#dc2626",
      weight: "bold",
      margin: "md"
    });
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "xs",
      contents: buildRows(overdueItems)
    });
  }

  // Section 2: Due Soon Items
  if (dueSoonItems.length > 0) {
    bodyContents.push({
      type: "text",
      text: "🟡 หมวดงานใกล้ถึงกำหนด (Upcoming):",
      size: "xxs",
      color: "#d97706",
      weight: "bold",
      margin: "md"
    });
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "xs",
      contents: buildRows(dueSoonItems)
    });
  }

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#ecfdf5",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "📋 เช็คลิสต์บริษัทประจำวัน",
          weight: "bold",
          color: "#065f46",
          size: "md"
        },
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#d1fae5",
          cornerRadius: "xl",
          paddingStart: "10px",
          paddingEnd: "10px",
          paddingTop: "3px",
          paddingBottom: "3px",
          margin: "sm",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: `⏰ รายงานรอบ ${summaryTime} น. • ${dateStr}`,
              size: "xxs",
              color: "#047857",
              weight: "bold"
            }
          ]
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      contents: bodyContents
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "14px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#059669",
          height: "sm",
          action: {
            type: "uri",
            label: "เปิดเช็คลิสต์บริษัท 🚀",
            uri: `${baseAppUrl}?view=COMPANY_CHECKLIST`
          }
        }
      ]
    }
  };
}

/**
 * Builds Individual Detailed Card (Card 2-11) for a specific overdue checklist
 */
function buildChecklistDetailBubble(
  chk: OverdueChecklistInfo,
  dateStr: string,
  baseAppUrl: string
): any {
  const col = getColorStyle(chk.color);
  const isDueSoon = chk.alert_category === 'DUE_SOON' || chk.is_due_soon;
  const overdueText = chk.days_overdue === 999 
    ? 'ยังไม่เคยบันทึก' 
    : (chk.days_overdue && chk.days_overdue > 0 ? `เลยกำหนดมา ${chk.days_overdue} วัน` : 'ค้างตรวจรอบวันนี้');

  const statusBg = isDueSoon ? '#fefce8' : '#fef2f2';
  const statusColor = isDueSoon ? '#b45309' : '#dc2626';
  const statusText = isDueSoon
    ? (chk.next_due_date 
        ? `⏳ สถานะ: ใกล้ครบกำหนด (${chk.next_due_date} • อีก ${chk.days_until_due || 0} วัน)`
        : `⏳ สถานะ: ใกล้ถึงกำหนด (อีก ${chk.days_until_due || 0} วัน)`)
    : `⏰ สถานะ: ${overdueText}`;

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: col.bg,
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: isDueSoon ? "⏳" : "🛡️",
              size: "sm",
              flex: 0
            },
            {
              type: "text",
              text: chk.cycle_label || 'รอบการตรวจ',
              size: "xxs",
              color: col.text,
              weight: "bold",
              margin: "sm",
              flex: 1
            }
          ]
        },
        {
          type: "text",
          text: chk.title || 'เช็คลิสต์บริษัท',
          size: "sm",
          weight: "bold",
          color: "#0f172a",
          wrap: true,
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      spacing: "sm",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: statusBg,
          cornerRadius: "md",
          paddingStart: "8px",
          paddingEnd: "8px",
          paddingTop: "4px",
          paddingBottom: "4px",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: statusText,
              size: "xxs",
              color: statusColor,
              weight: "bold"
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          margin: "sm",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "จำนวนข้อตรวจ:",
                  size: "xxs",
                  color: "#64748b",
                  flex: 3
                },
                {
                  type: "text",
                  text: `${chk.total_items || 0} รายการ`,
                  size: "xxs",
                  color: "#334155",
                  weight: "bold",
                  flex: 5,
                  align: "end"
                }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "ผู้รับผิดชอบ:",
                  size: "xxs",
                  color: "#64748b",
                  flex: 3
                },
                {
                  type: "text",
                  text: chk.responsible_roles || 'ทีมงานที่เกี่ยวข้อง',
                  size: "xxs",
                  color: "#334155",
                  weight: "bold",
                  flex: 5,
                  align: "end",
                  wrap: true
                }
              ]
            },
            ...(chk.next_due_date ? [{
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "ครบกำหนด:",
                  size: "xxs",
                  color: "#64748b",
                  flex: 3
                },
                {
                  type: "text",
                  text: chk.next_due_date,
                  size: "xxs",
                  color: isDueSoon ? "#b45309" : "#334155",
                  weight: "bold",
                  flex: 5,
                  align: "end"
                }
              ]
            }] : []),
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "ตรวจล่าสุด:",
                  size: "xxs",
                  color: "#64748b",
                  flex: 3
                },
                {
                  type: "text",
                  text: chk.last_submitted_at || 'ยังไม่เคยบันทึก',
                  size: "xxs",
                  color: "#334155",
                  weight: "bold",
                  flex: 5,
                  align: "end"
                }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: "ผู้ตรวจล่าสุด:",
                  size: "xxs",
                  color: "#64748b",
                  flex: 3
                },
                {
                  type: "text",
                  text: chk.last_submitted_by || '-',
                  size: "xxs",
                  color: "#334155",
                  weight: "bold",
                  flex: 5,
                  align: "end"
                }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "14px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: col.text,
          height: "sm",
          action: {
            type: "uri",
            label: "เข้าตรวจหัวข้อนี้ ✍️",
            uri: `${baseAppUrl}?view=COMPANY_CHECKLIST&presetId=${chk.id}`
          }
        }
      ]
    }
  };
}

/**
 * Builds Empty State Bubble when no checklists are overdue
 */
function buildEmptyStateBubble(dateStr: string, baseAppUrl: string): any {
  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#ecfdf5",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "✨ เช็คลิสต์บริษัทเสร็จสมบูรณ์",
          weight: "bold",
          color: "#059669",
          size: "md"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: `🎉 ทุกหัวข้อการตรวจเช็คในระบบ ประจำวันที่ ${dateStr} ได้รับการบันทึกผลเรียบร้อยครบถ้วนทั้งหมดแล้วครับ`,
          size: "xs",
          color: "#334155",
          wrap: true
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "14px",
      contents: [
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "ดูหน้าเช็คลิสต์บริษัท",
            uri: `${baseAppUrl}?view=COMPANY_CHECKLIST`
          }
        }
      ]
    }
  };
}

/**
 * Main Payload Builder for COMPANY_CHECKLIST_OVERDUE_ALERT
 */
export function buildCompanyChecklistOverduePayload(
  targetDestination: string,
  record: ClaimedNotificationRecord
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
  const dateStr = meta.date_str || new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Bangkok'
  });
  const summaryTime = meta.summary_time || '10:00';

  const rawChecklists: OverdueChecklistInfo[] = Array.isArray(meta.overdue_checklists) 
    ? meta.overdue_checklists 
    : [];

  const totalOverdueCount = Number(meta.total_overdue_count) || rawChecklists.length;

  if (rawChecklists.length === 0 || totalOverdueCount === 0) {
    return {
      to: targetDestination,
      messages: [
        {
          type: "flex",
          altText: `[Kontent OS] เช็คลิสต์บริษัท: บันทึกครบถ้วนทั้งหมดแล้ว (${dateStr})`,
          contents: buildEmptyStateBubble(dateStr, baseAppUrl)
        }
      ]
    };
  }

  const allBubbles: any[] = [];

  // Bubble 1: Summary Overview Card
  allBubbles.push(buildChecklistOverviewBubble(rawChecklists, totalOverdueCount, dateStr, summaryTime, baseAppUrl));

  // Bubbles 2-11: Top 10 individual checklist cards
  const maxDetailCards = 10;
  const topChecklists = rawChecklists.slice(0, maxDetailCards);
  topChecklists.forEach((chk) => {
    allBubbles.push(buildChecklistDetailBubble(chk, dateStr, baseAppUrl));
  });

  // Bubble 12: If more than 10 checklists, overflow card
  if (rawChecklists.length > maxDetailCards) {
    const remainingCount = rawChecklists.length - maxDetailCards;
    allBubbles.push({
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        justifyContent: "center",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: `+${remainingCount}`,
            size: "xxl",
            weight: "bold",
            color: "#059669"
          },
          {
            type: "text",
            text: `ยังมีอีก ${remainingCount} หัวข้อค้างตรวจ`,
            size: "xs",
            color: "#64748b",
            margin: "sm"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "14px",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#059669",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูทั้งหมดในระบบ 📋",
              uri: `${baseAppUrl}?view=COMPANY_CHECKLIST`
            }
          }
        ]
      }
    });
  }

  // Ensure strict limit of max 12 bubbles for LINE Carousel
  const finalBubbles = allBubbles.slice(0, 12);

  const contentsPayload = finalBubbles.length === 1
    ? finalBubbles[0]
    : {
        type: "carousel",
        contents: finalBubbles
      };

  const overdueCount = rawChecklists.filter(c => c.alert_category !== 'DUE_SOON' && !c.is_due_soon).length;
  const dueSoonCount = rawChecklists.filter(c => c.alert_category === 'DUE_SOON' || c.is_due_soon).length;

  let dynamicAltText = `[Kontent OS] รายงานเช็คลิสต์บริษัท (${dateStr})`;
  if (overdueCount > 0 && dueSoonCount > 0) {
    dynamicAltText = `⚠️ เช็คลิสต์: ค้าง ${overdueCount} • ใกล้กำหนด ${dueSoonCount} (${dateStr})`;
  } else if (overdueCount > 0) {
    dynamicAltText = `⚠️ สรุปเช็คลิสต์บริษัทค้างตรวจ ${overdueCount} หัวข้อ (${dateStr})`;
  } else if (dueSoonCount > 0) {
    dynamicAltText = `⏳ แจ้งเตือนล่วงหน้า: เช็คลิสต์ใกล้ครบกำหนด ${dueSoonCount} หัวข้อ (${dateStr})`;
  }

  return {
    to: targetDestination,
    messages: [
      {
        type: "flex",
        altText: dynamicAltText,
        contents: contentsPayload
      }
    ]
  };
}
