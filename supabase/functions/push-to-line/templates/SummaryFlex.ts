import { getAppUrl } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';
import { formatThaiTime } from './flexBase.ts';

export interface ParsedDailySummary {
  dateStr: string;
  ontimeCount: number;
  ontimeList: string[];
  lateCount: number;
  lateList: string[];
  leaveCount: number;
  leaveList: string[];
  absentCount: number;
  absentList: string[];
  appName: string;
}

/**
 * Parsed daily summary lists either from JSONB metadata or fallback text parsing.
 */
export function parseDailySummaryMessage(record: ClaimedNotificationRecord): ParsedDailySummary {
  const metadata = record.metadata || {};
  const message = record.message || '';

  // 1. Check and support JSONB Metadata first
  if (
    metadata.ontime_list ||
    metadata.late_list ||
    metadata.leave_list ||
    metadata.absent_list
  ) {
    return {
      dateStr: metadata.date_str || record.title?.replace('📊 รายงานการเข้างานประจำวันที่ ', '') || '',
      ontimeCount: Number(metadata.ontime_count ?? (metadata.ontime_list?.length ?? 0)),
      ontimeList: Array.isArray(metadata.ontime_list) ? metadata.ontime_list : [],
      lateCount: Number(metadata.late_count ?? (metadata.late_list?.length ?? 0)),
      lateList: Array.isArray(metadata.late_list) ? metadata.late_list : [],
      leaveCount: Number(metadata.leave_count ?? (metadata.leave_list?.length ?? 0)),
      leaveList: Array.isArray(metadata.leave_list) ? metadata.leave_list : [],
      absentCount: Number(metadata.absent_count ?? (metadata.absent_list?.length ?? 0)),
      absentList: Array.isArray(metadata.absent_list) ? metadata.absent_list : [],
      appName: metadata.app_name || 'Juijui Planner'
    };
  }

  // 2. Fallback Parser (Line-by-line Parsing)
  const lines = message.split('\n').map(line => line.trim());
  let dateStr = '';
  const ontimeList: string[] = [];
  const lateList: string[] = [];
  const leaveList: string[] = [];
  const absentList: string[] = [];
  let appName = 'Juijui Planner';

  // Extract date from "ประจำวันที่ DD/MM/YYYY"
  const dateRegex = /ประจำวันที่\s*(\d{2}\/\d{2}\/\d{4})/i;
  const titleMatch = (record.title || '').match(dateRegex);
  if (titleMatch) {
    dateStr = titleMatch[1];
  } else {
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match) {
        dateStr = match[1];
        break;
      }
    }
  }

  // Parse sections
  let currentSection: 'NONE' | 'ONTIME' | 'LATE' | 'LEAVE' | 'ABSENT' = 'NONE';

  for (const line of lines) {
    if (!line) continue;

    if (line.includes('🟢 มาปกติ')) {
      currentSection = 'ONTIME';
      continue;
    } else if (line.includes('🟡 มาสาย')) {
      currentSection = 'LATE';
      continue;
    } else if (line.includes('🔵 ลา')) {
      currentSection = 'LEAVE';
      continue;
    } else if (line.includes('🔴 ขาดงาน')) {
      currentSection = 'ABSENT';
      continue;
    } else if (line.startsWith('ระบบสรุปรายงานอัตโนมัติ')) {
      currentSection = 'NONE';
      appName = line.replace('ระบบสรุปรายงานอัตโนมัติ', '').trim();
      continue;
    }

    if (line.startsWith('•')) {
      const itemText = line.substring(1).trim();
      if (itemText === '(ไม่มี)' || itemText === '  (ไม่มี)') {
        continue;
      }
      if (currentSection === 'ONTIME') {
        ontimeList.push(itemText);
      } else if (currentSection === 'LATE') {
        lateList.push(itemText);
      } else if (currentSection === 'LEAVE') {
        leaveList.push(itemText);
      } else if (currentSection === 'ABSENT') {
        absentList.push(itemText);
      }
    }
  }

  return {
    dateStr,
    ontimeCount: ontimeList.length,
    ontimeList,
    lateCount: lateList.length,
    lateList,
    leaveCount: leaveList.length,
    leaveList,
    absentCount: absentList.length,
    absentList,
    appName
  };
}

/**
 * Extracted phone number and name from worker text.
 */
export function extractPhone(text: string): { name: string; phone: string | null; cleanPhone: string | null } {
  // Matches typical Thai phone numbers: e.g. 02-123-4567, 081-234-5678, 0812345678
  const phoneRegex = /(02[-\s]?\d{3,4}[-\s]?\d{3,4}|0[3-9]\d[-\s]?\d{3,4}[-\s]?\d{3,4})/;
  const match = text.match(phoneRegex);

  let phone: string | null = null;
  let cleanPhone: string | null = null;

  if (match) {
    phone = match[0];
    cleanPhone = phone.replace(/[-\s]/g, '');
  }

  // Clean the text to get the proper name
  let name = text;
  if (phone) {
    name = name.replace(phone, '');
  }

  // Remove common parenthesized/bracketed phone indicators like (โทร. ...), [โทร. ...], (โทร. ), [โทร. ], etc.
  name = name.replace(/\(\s*โทร\.?[^)]*\)/gi, '');
  name = name.replace(/\[\s*โทร\.?[^\]]*\]/gi, '');
  name = name.replace(/โทร\.?\s*\d*/gi, '');

  // Remove phone emojis
  name = name.replace(/📞/g, '');

  // Clean any empty parentheses or brackets
  name = name.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '');

  // Clean extra spaces, trailing/leading non-word structures, trailing commas/dashes
  name = name.trim();
  name = name.replace(/^[-,\s(]+|[-,\s)]+$/g, '').trim();

  return { name, phone, cleanPhone };
}

/**
 * Builds custom Flex Message payload for daily summary.
 */
export function buildDailySummaryPayload(targetDestination: string, record: ClaimedNotificationRecord) {
  const parsed = parseDailySummaryMessage(record);
  const baseAppUrl = getAppUrl();

  const bodyContents: any[] = [];

  // Add Overall Stats block
  bodyContents.push({
    type: "box",
    layout: "vertical",
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: "1px",
    cornerRadius: "md",
    paddingAll: "12px",
    contents: [
      {
        type: "text",
        text: "📊 สรุปสถิติภาพรวมวันนี้",
        weight: "bold",
        size: "xs",
        color: "#475569"
      },
      {
        type: "box",
        layout: "horizontal",
        margin: "md",
        contents: [
          {
            type: "box",
            layout: "vertical",
            alignItems: "center",
            contents: [
              { type: "text", text: "ปกติ", size: "xxs", color: "#64748b", align: "center" },
              { type: "text", text: String(parsed.ontimeCount), weight: "bold", size: "sm", color: "#166534", align: "center" }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            alignItems: "center",
            contents: [
              { type: "text", text: "สาย", size: "xxs", color: "#64748b", align: "center" },
              { type: "text", text: String(parsed.lateCount), weight: "bold", size: "sm", color: "#b45309", align: "center" }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            alignItems: "center",
            contents: [
              { type: "text", text: "ลา", size: "xxs", color: "#64748b", align: "center" },
              { type: "text", text: String(parsed.leaveCount), weight: "bold", size: "sm", color: "#1e3b8a", align: "center" }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            alignItems: "center",
            contents: [
              { type: "text", text: "ขาด", size: "xxs", color: "#64748b", align: "center" },
              { type: "text", text: String(parsed.absentCount), weight: "bold", size: "sm", color: "#991b1b", align: "center" }
            ]
          }
        ]
      }
    ]
  });

  // Group 1: 🟢 มาปกติ
  if (parsed.ontimeList.length > 0) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: `🟢 มาปกติ (${parsed.ontimeCount} คน)`,
          weight: "bold",
          size: "xs",
          color: "#166534"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          contents: parsed.ontimeList.map(name => ({
            type: "text",
            text: name,
            size: "xs",
            color: "#14532d",
            wrap: true,
            margin: "xs"
          }))
        }
      ]
    });
  }

  // Group 2: 🟡 มาสาย
  if (parsed.lateList.length > 0) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#fef3c7",
      borderColor: "#fde68a",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: `🟡 มาสาย (${parsed.lateCount} คน)`,
          weight: "bold",
          size: "xs",
          color: "#b45309"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          contents: parsed.lateList.map(name => ({
            type: "text",
            text: name,
            size: "xs",
            color: "#78350f",
            wrap: true,
            margin: "xs"
          }))
        }
      ]
    });
  }

  // Group 3: 🔵 ลา
  if (parsed.leaveList.length > 0) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: `🔵 ลา (${parsed.leaveCount} คน)`,
          weight: "bold",
          size: "xs",
          color: "#1e3b8a"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          contents: parsed.leaveList.map(name => ({
            type: "text",
            text: name,
            size: "xs",
            color: "#1e3a8a",
            wrap: true,
            margin: "xs"
          }))
        }
      ]
    });
  }

  // Group 4: 🔴 ขาดงาน / ยังไม่เช็คอิน
  if (parsed.absentList.length > 0) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#fef2f2",
      borderColor: "#fca5a5",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "10px",
      contents: [
        {
          type: "text",
          text: `🔴 ขาดงาน / ยังไม่เช็คอิน (${parsed.absentCount} คน)`,
          weight: "bold",
          size: "xs",
          color: "#991b1b"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          contents: parsed.absentList.map(item => {
            const { name, phone, cleanPhone } = extractPhone(item);
            const rowContents: any[] = [
              {
                type: "text",
                text: name,
                size: "xs",
                color: "#7f1d1d",
                wrap: true,
                flex: 1
              }
            ];

            if (phone && cleanPhone) {
              rowContents.push({
                type: "text",
                text: `โทร. ${phone}`,
                size: "xs",
                color: "#1d4ed8",
                weight: "bold",
                align: "end",
                flex: 0,
                action: {
                  type: "uri",
                  label: "Call Phone",
                  uri: `tel:${cleanPhone}`
                }
              });
            }

            return {
              type: "box",
              layout: "horizontal",
              margin: "xs",
              contents: rowContents
            };
          })
        }
      ]
    });
  }

  // If all lists are empty (e.g. no employees tracked/today holiday)
  if (bodyContents.length === 1) {
    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: "md",
      backgroundColor: "#f8fafc",
      borderColor: "#e2e8f0",
      borderWidth: "1px",
      cornerRadius: "md",
      paddingAll: "12px",
      alignItems: "center",
      contents: [
        {
          type: "text",
          text: "☕ ไม่มีรายการเข้างานของพนักงานในวันนี้",
          size: "xs",
          color: "#64748b",
          align: "center"
        }
      ]
    });
  }

  return {
    to: targetDestination,
    messages: [
      {
        type: "flex",
        altText: `[รายงานเข้างาน] ประจำวันที่ ${parsed.dateStr || ''}`,
        contents: {
          type: "bubble",
          size: "mega",
          header: {
            type: "box",
            layout: "vertical",
            backgroundColor: "#d9e4ff",
            paddingTop: "14px",
            paddingBottom: "14px",
            paddingStart: "16px",
            paddingEnd: "16px",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                alignItems: "center",
                contents: [
                  {
                    type: "text",
                    text: "📋",
                    size: "xl",
                    flex: 0
                  },
                  {
                    type: "box",
                    layout: "vertical",
                    margin: "md",
                    flex: 1,
                    contents: [
                      {
                        type: "text",
                        text: "รายงานสรุปการเข้างานรายวัน",
                        weight: "bold",
                        color: "#0f172a",
                        size: "md"
                      },
                      {
                        type: "text",
                        text: parsed.dateStr ? `ประจำวันที่ ${parsed.dateStr}` : "ประจำวัน",
                        size: "xs",
                        color: "#64748b",
                        margin: "xs"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          body: {
            type: "box",
            layout: "vertical",
            paddingTop: "16px",
            paddingBottom: "16px",
            paddingStart: "16px",
            paddingEnd: "16px",
            contents: bodyContents
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
                  label: "เปิดดูประวัติและแดชบอร์ด 📅",
                  uri: `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=admin`
                },
                style: "secondary",
                color: "#d9e4ff",
                height: "md"
              },
              {
                type: "text",
                text: `${parsed.appName || 'Juijui Planner'} • สรุปอัตโนมัติเมื่อ ${formatThaiTime(record.created_at)} น.`,
                size: "xxs",
                color: "#94a3b8",
                align: "center",
                margin: "md"
              }
            ]
          }
        }
      }
    ]
  };
}
