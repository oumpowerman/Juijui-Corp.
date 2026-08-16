import { TypeConfig } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';
import { formatThaiTime } from './flexBase.ts';

/**
 * Helper to format date in Thai format (e.g. 16 ส.ค. 2569)
 */
function formatThaiDate(dateStr?: string): string {
  if (!dateStr) return 'ไม่ระบุ';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  } catch (_) {
    return dateStr;
  }
}

/**
 * Helper to format OT Rate Type to Thai description
 */
function formatOtType(otType?: string, isFixed?: boolean): string {
  if (isFixed) return 'เหมาจ่าย (Fixed OT)';
  if (!otType) return 'ล่วงเวลาปกติ';
  switch (otType) {
    case 'NORMAL_DAY':
      return 'เรท 1.5 เท่า (วันทำงานปกติ)';
    case 'HOLIDAY':
      return 'เรท 2.0 เท่า (วันหยุด)';
    case 'HOLIDAY_OVERTIME':
      return 'เรท 3.0 เท่า (ล่วงเวลาวันหยุด)';
    default:
      return `เรทพิเศษ (${otType})`;
  }
}

/**
 * Builds structured body contents for an OT request notification
 */
export function buildOTRequestBodyContents(record: ClaimedNotificationRecord, primaryConfig: TypeConfig) {
  let meta = record.metadata || {};
  if (typeof meta === 'string') {
    try {
      meta = JSON.parse(meta);
    } catch (_) {
      meta = {};
    }
  }

  const employeeName = meta.employee_name || 'คุณ พนักงาน';
  const displayDate = formatThaiDate(meta.date);
  const startTime = meta.start_time || '18:30';
  const endTime = meta.end_time || '20:30';
  const duration = meta.duration || 2.0;
  const isFixed = meta.is_fixed === true || meta.is_fixed === 'true';
  const otType = meta.ot_type;
  const reason = meta.reason || '-';

  const durationText = isFixed ? 'เหมาจ่าย (Fixed)' : `${duration} ชั่วโมง`;

  return [
    // 1. Employee Profile Card (Top highlight box)
    {
      type: "box",
      layout: "horizontal",
      backgroundColor: "#f1f5f9",
      borderColor: "#cbd5e1",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "10px",
      alignItems: "center",
      contents: [
        {
          type: "text",
          text: "👤",
          size: "md",
          flex: 0
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          flex: 1,
          contents: [
            {
              type: "text",
              text: employeeName,
              weight: "bold",
              size: "xs",
              color: "#0f172a"
            },
            {
              type: "text",
              text: "ยื่นคำขออนุมัติทำงานล่วงเวลา (OT)",
              size: "xxs",
              color: "#475569",
              weight: "bold"
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#f59e0b",
          cornerRadius: "sm",
          paddingStart: "8px",
          paddingEnd: "8px",
          paddingTop: "3px",
          paddingBottom: "3px",
          flex: 0,
          contents: [
            {
              type: "text",
              text: "รออนุมัติ",
              size: "xxs",
              color: "#ffffff",
              weight: "bold"
            }
          ]
        }
      ]
    },

    // 2. Detailed Key-Value Details Grid
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#ffffff",
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
            { type: "text", text: "📅 วันที่ทำงาน:", size: "xxs", color: "#64748b", flex: 2 },
            { type: "text", text: displayDate, size: "xxs", color: "#0f172a", weight: "bold", flex: 3, align: "end" }
          ]
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "⏱️ ช่วงเวลาที่ขอทำ:", size: "xxs", color: "#64748b", flex: 2 },
            { type: "text", text: `${startTime} - ${endTime} น.`, size: "xxs", color: "#1e3a8a", weight: "bold", flex: 3, align: "end" }
          ]
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "⏳ ชั่วโมงการทำงาน:", size: "xxs", color: "#64748b", flex: 2 },
            { type: "text", text: durationText, size: "xxs", color: "#d97706", weight: "bold", flex: 3, align: "end" }
          ]
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            { type: "text", text: "💸 เรทค่าจ้าง:", size: "xxs", color: "#64748b", flex: 2 },
            { type: "text", text: formatOtType(otType, isFixed), size: "xxs", color: "#16a34a", weight: "bold", flex: 3, align: "end" }
          ]
        }
      ]
    },

    // 3. Reason Box (Quote container)
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#f8fafc",
      borderColor: "#e2e8f0",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: "📝 เหตุผลการขอทำ OT:",
          size: "xxs",
          color: "#64748b",
          weight: "bold"
        },
        {
          type: "text",
          text: `"${reason}"`,
          size: "xs",
          color: "#1e293b",
          wrap: true,
          margin: "xs",
          weight: "bold"
        }
      ]
    },

    // 4. Timestamp & Meta
    {
      type: "box",
      layout: "horizontal",
      margin: "sm",
      contents: [
        {
          type: "text",
          text: primaryConfig.label,
          size: "xxs",
          color: "#94a3b8",
          flex: 1
        },
        {
          type: "text",
          text: formatThaiTime(record.created_at),
          size: "xxs",
          color: "#cbd5e1",
          align: "end"
        }
      ]
    }
  ];
}
