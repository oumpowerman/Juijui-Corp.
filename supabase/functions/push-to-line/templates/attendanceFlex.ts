import { TYPE_CONFIG } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';
import { formatThaiTime } from './flexBase.ts';

export interface ParsedNotificationDetail {
  employeeName: string;
  requestTypeLabel: string;
  dateStr: string;
  targetShift: string | null;
  requestedTime: string | null;
  otTime: string | null;
  cleanReason: string;
}

/**
 * Parses raw notification title and message to extract structured details.
 */
export function parseNotificationPayload(record: ClaimedNotificationRecord): ParsedNotificationDetail {
  const rawTitle = record.title || '';
  const rawMessage = record.message || '';
  const meta = record.metadata || {};

  // 1. Extract Employee Name
  let employeeName = 'คุณ พนักงาน';
  const nameMatch = rawMessage.match(/(?:คุณ|ของ|พนักงาน:)\s*([A-Za-z0-9ก-๙_\-\s]+?)(?=\s+(?:ส่งคำขอ|ขอ|วันที่|โปรด|\(|"|'|$))/);
  if (nameMatch && nameMatch[1]) {
    const extracted = nameMatch[1].trim();
    employeeName = extracted.startsWith('คุณ') ? extracted : `คุณ ${extracted}`;
  } else if (rawTitle.includes('จาก')) {
    const titleNameMatch = rawTitle.match(/จาก\s*([A-Za-z0-9ก-๙_\-\s]+)/);
    if (titleNameMatch && titleNameMatch[1]) {
      employeeName = `คุณ ${titleNameMatch[1].trim()}`;
    }
  }

  // 2. Extract Request Type Label
  let requestTypeLabel = 'คำขออนุมัติ';
  const reqTypeMeta = meta.request_type || '';
  
  if (reqTypeMeta === 'FORGOT_CHECKIN') {
    requestTypeLabel = 'ลืมลงเวลาเข้างาน (Check-in)';
  } else if (reqTypeMeta === 'FORGOT_CHECKOUT') {
    requestTypeLabel = 'ลืมลงเวลาเลิกงาน (Check-out)';
  } else if (reqTypeMeta === 'FORGOT_BOTH') {
    requestTypeLabel = 'ลืมลงเวลาเข้า-เลิกงาน';
  } else if (reqTypeMeta === 'OT') {
    requestTypeLabel = 'ขอทำงานล่วงเวลา (OT)';
  } else if (reqTypeMeta === 'WFH') {
    requestTypeLabel = 'ขอทำงานที่บ้าน (WFH)';
  } else if (reqTypeMeta === 'ONSITE') {
    requestTypeLabel = 'ขอปฏิบัติงานนอกสถานที่';
  } else if (reqTypeMeta === 'LEAVE') {
    requestTypeLabel = 'คำขอลางาน';
  } else if (reqTypeMeta === 'DUTY_SWAP') {
    requestTypeLabel = 'คำขอแลกเวร';
  } else {
    // Try extract from brackets in title or message e.g. [ลืมเช็คอิน (ลืมลงเวลาเข้างาน)]
    const bracketMatch = rawTitle.match(/\[(.*?)\]/) || rawMessage.match(/\[(.*?)\]/);
    if (bracketMatch && bracketMatch[1] && !bracketMatch[1].startsWith('TARGET_SHIFT') && !bracketMatch[1].startsWith('TIME') && !bracketMatch[1].startsWith('OT') && !bracketMatch[1].startsWith('PROVISIONAL')) {
      requestTypeLabel = bracketMatch[1].trim();
    }
  }

  // 3. Extract Date
  let dateStr = 'วันนี้';
  const dateMatch = rawMessage.match(/วันที่\s*([0-9A-Za-z\s\/-ก-๙]+?)(?::|\"|'|\[|$|\n)/);
  if (dateMatch && dateMatch[1]) {
    dateStr = dateMatch[1].trim();
  }

  // 4. Extract Target Shift [TARGET_SHIFT:09:00]
  let targetShift: string | null = null;
  const shiftMatch = rawMessage.match(/\[TARGET_SHIFT:([^\]]+)\]/);
  if (shiftMatch && shiftMatch[1]) {
    targetShift = `${shiftMatch[1].trim()} น.`;
  }

  // 5. Extract Requested Time [TIME:09:00] or [TIME:09:00-18:00] or [ACTUAL_CHECK_IN:09:15]
  let requestedTime: string | null = null;
  const actualCheckInMatch = rawMessage.match(/\[ACTUAL_CHECK_IN:([^\]]+)\]/);
  if (actualCheckInMatch && actualCheckInMatch[1]) {
    const rawActual = actualCheckInMatch[1].trim();
    // Format 09:15:00 to 09:15 if seconds included
    const parts = rawActual.split(':');
    const formattedActual = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : rawActual;
    requestedTime = `${formattedActual} น.`;
  } else {
    const timeMatch = rawMessage.match(/\[TIME:([^\]]+)\]/);
    if (timeMatch && timeMatch[1]) {
      const rawT = timeMatch[1].trim();
      requestedTime = rawT.includes('-') ? `${rawT.replace('-', ' - ')} น.` : `${rawT} น.`;
    }
  }

  // 6. Extract OT Time [OT:18:00-20:00]
  let otTime: string | null = null;
  const otMatch = rawMessage.match(/\[OT:([^\]]+)\]/);
  if (otMatch && otMatch[1]) {
    const rawOt = otMatch[1].trim();
    if (rawOt === 'FIXED') {
      otTime = 'เหมาจ่าย';
    } else {
      otTime = rawOt.includes('-') ? `${rawOt.replace('-', ' - ')} น.` : `${rawOt} น.`;
    }
  }

  // 7. Clean Reason
  let cleanReason = rawMessage;
  // Remove initial header patterns like: คุณ ... ส่งคำขอ ... วันที่ ...:
  cleanReason = cleanReason.replace(/^คุณ.*?(?:ส่งคำขอ|ขอ).*?:/g, '');
  // Remove tags
  cleanReason = cleanReason.replace(/\[TARGET_SHIFT:[^\]]+\]/g, '');
  cleanReason = cleanReason.replace(/\[ACTUAL_CHECK_IN:[^\]]+\]/g, '');
  cleanReason = cleanReason.replace(/\[TIME:[^\]]+\]/g, '');
  cleanReason = cleanReason.replace(/\[OT:[^\]]+\]/g, '');
  cleanReason = cleanReason.replace(/\[PROVISIONAL_[^\]]+\]/g, '');
  cleanReason = cleanReason.replace(/\[LATE_SUBMISSION\]/g, '');
  cleanReason = cleanReason.replace(/\[LINKID:[^\]]+\]/g, '');
  // Remove quotes and whitespace
  cleanReason = cleanReason.replace(/^[\s"'\\]+|[\s"'\\]+$/g, '').trim();

  if (!cleanReason) {
    cleanReason = '-';
  }

  return {
    employeeName,
    requestTypeLabel,
    dateStr,
    targetShift,
    requestedTime,
    otTime,
    cleanReason
  };
}

/**
 * Formats daily summary message payload (plain text)
 */
export function buildDailySummaryPayload(targetDestination: string, record: ClaimedNotificationRecord) {
  return {
    to: targetDestination,
    messages: [
      {
        type: "text",
        text: record.message || record.title
      }
    ]
  };
}

/**
 * Builds structured body contents for single notification
 */
export function buildSingleBodyContents(record: ClaimedNotificationRecord, primaryConfig: { label: string; color: string; emoji: string }) {
  const isApprovalReq = record.type === 'APPROVAL_REQ';
  const parsed = parseNotificationPayload(record);

  if (isApprovalReq) {
    return [
      // 1. Employee Profile Card (Top highlight box)
      {
        type: "box",
        layout: "horizontal",
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
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
                text: parsed.employeeName,
                weight: "bold",
                size: "xs",
                color: "#1e3a8a"
              },
              {
                type: "text",
                text: parsed.requestTypeLabel,
                size: "xxs",
                color: "#2563eb",
                weight: "bold"
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#fe2929",
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

      // 2. Structured Key-Value Details Grid
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
              { type: "text", text: "📅 วันที่:", size: "xxs", color: "#64748b", flex: 2 },
              { type: "text", text: parsed.dateStr, size: "xxs", color: "#0f172a", weight: "bold", flex: 3, align: "end" }
            ]
          },
          parsed.targetShift ? {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "🎯 เวลาตามกะ:", size: "xxs", color: "#64748b", flex: 2 },
              { type: "text", text: parsed.targetShift, size: "xxs", color: "#0f172a", weight: "bold", flex: 3, align: "end" }
            ]
          } : null,
          parsed.requestedTime ? {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "⏰ เวลาที่ขอลง:", size: "xxs", color: "#64748b", flex: 2 },
              { type: "text", text: parsed.requestedTime, size: "xxs", color: "#2563eb", weight: "bold", flex: 3, align: "end" }
            ]
          } : null,
          parsed.otTime ? {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "⏳ ช่วงเวลา OT:", size: "xxs", color: "#64748b", flex: 2 },
              { type: "text", text: parsed.otTime, size: "xxs", color: "#d97706", weight: "bold", flex: 3, align: "end" }
            ]
          } : null
        ].filter(Boolean) as any[]
      },

      // 3. Reason Box (Quote container)
      {
        type: "box",
        layout: "vertical",
        margin: "md",
        backgroundColor: "#f8fafc",
        borderColor: "#cbd5e1",
        borderWidth: "1px",
        cornerRadius: "md",
        paddingAll: "10px",
        contents: [
          {
            type: "text",
            text: "📝 เหตุผล / หมายเหตุ:",
            size: "xxs",
            color: "#64748b",
            weight: "bold"
          },
          {
            type: "text",
            text: `"${parsed.cleanReason}"`,
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

  // Default Standard Notification Layout (INFO / GAME / REVIEW / etc.)
  return [
    {
      type: "text",
      text: record.title,
      weight: "bold",
      size: "md",
      wrap: true,
      color: "#334155"
    },
    {
      type: "text",
      text: parsed.cleanReason || record.message || "-",
      size: "xs",
      color: "#64748b",
      wrap: true,
      margin: "sm",
      maxLines: 4
    },
    {
      type: "box",
      layout: "horizontal",
      margin: "md",
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

/**
 * Builds body contents for batched notifications
 */
export function buildBatchBodyContents(claimedRecords: ClaimedNotificationRecord[]) {
  const bodyContents: any[] = [];

  bodyContents.push({
    type: "text",
    text: `คุณได้รับการแจ้งเตือนใหม่ ${claimedRecords.length} รายการ`,
    weight: "bold",
    size: "sm",
    color: "#1e293b",
    margin: "none"
  });

  const displayRecords = claimedRecords.slice(0, 4);
  displayRecords.forEach((rec: any, idx: number) => {
    const itemConfig = TYPE_CONFIG[rec.type] || TYPE_CONFIG['INFO'];
    const parsed = parseNotificationPayload(rec);

    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: idx === 0 ? "xs" : "md",
      paddingAll: "10px",
      backgroundColor: "#f8fafc",
      cornerRadius: "md",
      borderWidth: "1px",
      borderColor: "#e2e8f0",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${itemConfig.emoji} ${parsed.employeeName} - ${parsed.requestTypeLabel}`,
              weight: "bold",
              size: "xs",
              wrap: true,
              color: "#334155",
              flex: 1
            }
          ]
        },
        parsed.cleanReason ? {
          type: "text",
          text: `"${parsed.cleanReason}"`,
          size: "xxs",
          color: "#64748b",
          wrap: true,
          margin: "xs",
          maxLines: 2
        } : null,
        {
          type: "box",
          layout: "horizontal",
          margin: "xs",
          contents: [
            {
              type: "text",
              text: itemConfig.label,
              size: "xxs",
              color: "#94a3b8",
              flex: 1
            },
            {
              type: "text",
              text: formatThaiTime(rec.created_at),
              size: "xxs",
              color: "#cbd5e1",
              align: "end"
            }
          ]
        }
      ].filter(Boolean) as any[]
    });
  });

  if (claimedRecords.length > 4) {
    bodyContents.push({
      type: "text",
      text: `• มีการแจ้งเตือนเพิ่มเติมอีก ${claimedRecords.length - 4} รายการในระบบ`,
      size: "xxs",
      color: "#6366f1",
      margin: "sm",
      align: "center",
      weight: "bold"
    });
  }

  return bodyContents;
}
