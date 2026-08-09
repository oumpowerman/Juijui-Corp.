import { ClaimedNotificationRecord } from '../services/database.ts';
import { getAppUrl } from '../config.ts';
import { formatThaiTime } from './flexBase.ts';

/**
 * Builds monthly OT summary message payload (LINE Flex Message)
 */
export function buildMonthlyOTSummaryPayload(targetDestination: string, record: ClaimedNotificationRecord) {
  let metadataObj: any = {};
  if (record.metadata) {
    try {
      metadataObj = typeof record.metadata === 'string'
        ? JSON.parse(record.metadata)
        : record.metadata;
    } catch (e) {
      console.error("Failed to parse notification metadata:", e);
    }
  }

  const monthName = metadataObj.month_name || '';
  const yearName = metadataObj.year_name || '';
  const totalEmployees = metadataObj.total_employees || 0;
  const hasOtCount = metadataObj.has_ot_count || 0;
  const otUsers = metadataObj.ot_users || [];
  const summaryMode = metadataObj.summary_mode || 'PREV_MONTH';
  const summaryEndDate = metadataObj.summary_end_date || '';

  // Calculate customized subtitle & description depending on summary_mode
  let subtitle = `ประจำเดือน${monthName} ${yearName}`;
  let periodText = "ข้อมูลสะสมตลอดทั้งเดือน";
  if (summaryMode === 'CURRENT_MONTH' && summaryEndDate) {
    try {
      const day = new Date(summaryEndDate).getDate();
      subtitle = `สะสมช่วงวันที่ 1 ถึง ${day} ${monthName} ${yearName}`;
      periodText = `สะสมถึงวันที่ ${day} ${monthName}`;
    } catch (_) {
      // fallback
    }
  }

  const baseAppUrl = getAppUrl();
  const targetDeepLink = `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=admin`;

  const userContents: any[] = [];

  if (otUsers.length === 0) {
    userContents.push({
      type: "text",
      text: "ไม่มีพนักงานที่มีรายการทำงานล่วงเวลาในรอบนี้",
      size: "xs",
      color: "#94a3b8",
      align: "center",
      style: "italic",
      margin: "md"
    });
  } else {
    otUsers.forEach((user: any, idx: number) => {
      userContents.push({
        type: "box",
        layout: "vertical",
        margin: idx === 0 ? "md" : "lg",
        spacing: "xs",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            alignItems: "center",
            contents: [
              {
                type: "text",
                text: "👤",
                size: "sm",
                flex: 0
              },
              {
                type: "text",
                text: `${user.full_name}`,
                weight: "bold",
                size: "sm",
                color: "#1e293b",
                margin: "sm",
                flex: 1
              },
              {
                type: "text",
                text: `${user.position}`,
                size: "xxs",
                color: "#64748b",
                align: "end",
                flex: 0
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#f8fafc",
            borderColor: "#e2e8f0",
            borderWidth: "1px",
            cornerRadius: "md",
            paddingAll: "10px",
            spacing: "xs",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "• OT เหมาจ่าย:", size: "xxs", color: "#64748b", flex: 3 },
                  { type: "text", text: `${user.fixed_ot_count} ครั้ง`, size: "xxs", color: "#334155", align: "end", flex: 2 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "• OT วันธรรมดา:", size: "xxs", color: "#64748b", flex: 3 },
                  { type: "text", text: `${user.weekday_ot_hours || 0} ชม.`, size: "xxs", color: "#334155", align: "end", flex: 2 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "• OT วันหยุด (≤8 ชม.):", size: "xxs", color: "#64748b", flex: 3 },
                  { type: "text", text: `${user.holiday_ot_hours || 0} ชม.`, size: "xxs", color: "#334155", align: "end", flex: 2 }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "• OT ล่วงเวลาวันหยุด (>8 ชม.):", size: "xxs", color: "#64748b", flex: 3 },
                  { type: "text", text: `${user.holiday_overtime_hours || 0} ชม.`, size: "xxs", color: "#334155", align: "end", flex: 2 }
                ]
              },
              {
                type: "separator",
                margin: "xs"
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  { type: "text", text: "⏱️ รวมชั่วโมง OT ทั้งหมด:", size: "xxs", color: "#1e293b", weight: "bold", flex: 3 },
                  { type: "text", text: `${user.total_hours || 0} ชม.`, size: "xs", color: "#0f172a", weight: "bold", align: "end", flex: 2 }
                ]
              }
            ]
          }
        ]
      });
    });
  }

  const bubbleContents: any = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1e293b", // Slate Navy
      paddingAll: "16px",
      alignItems: "center",
      contents: [
        {
          type: "text",
          text: "📊 สรุปสถิติทำงานล่วงเวลา (OT)",
          weight: "bold",
          size: "md",
          color: "#ffffff"
        },
        {
          type: "text",
          text: subtitle,
          size: "xs",
          color: "#94a3b8",
          margin: "sm"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#f1f5f9",
          borderColor: "#e2e8f0",
          borderWidth: "1px",
          cornerRadius: "md",
          paddingAll: "12px",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: "📈 ภาพรวมระบบงานล่วงเวลา",
              weight: "bold",
              size: "xs",
              color: "#475569"
            },
            {
              type: "text",
              text: `พนักงานทำ OT: ${hasOtCount} / ${totalEmployees} คน`,
              weight: "bold",
              size: "sm",
              color: "#0f172a",
              margin: "sm"
            },
            {
              type: "text",
              text: `ประมวลผลระบบอัตโนมัติ (${periodText})`,
              size: "xxs",
              color: "#64748b",
              margin: "sm"
            }
          ]
        },
        {
          type: "text",
          text: "📋 สรุปรายการตามรายบุคคล:",
          weight: "bold",
          size: "xs",
          color: "#475569",
          margin: "md"
        },
        {
          type: "box",
          layout: "vertical",
          contents: userContents
        },
        {
          type: "separator",
          margin: "lg"
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "md",
          contents: [
            {
              type: "text",
              text: "💡 ข้อมูลสรุปอัตโนมัติของระบบ",
              size: "xxs",
              color: "#94a3b8",
              flex: 1
            },
            {
              type: "text",
              text: formatThaiTime(record.created_at || new Date().toISOString()),
              size: "xxs",
              color: "#cbd5e1",
              align: "end"
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "16px",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "เปิดระบบจัดการเพื่อตรวจสอบ OT 📅",
            uri: targetDeepLink
          },
          style: "primary",
          height: "md",
          color: "#1e293b" // Slate Navy
        }
      ]
    }
  };

  return {
    to: targetDestination,
    messages: [
      {
        type: "flex",
        altText: `📊 สรุปสถิติทำงานล่วงเวลา (OT) ${subtitle}`,
        contents: bubbleContents
      }
    ]
  };
}
