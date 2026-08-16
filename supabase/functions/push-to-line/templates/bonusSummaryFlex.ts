import { getAppUrl } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';
import { formatThaiTime } from './flexBase.ts';

/**
 * Builds monthly bonus summary message payload (LINE Flex Message)
 */
export function buildMonthlyBonusSummaryPayload(targetDestination: string, record: ClaimedNotificationRecord) {
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

  const monthName = metadataObj.month_name || 'กรกฎาคม';
  const yearName = metadataObj.year_name || '2569';
  const totalEmployees = metadataObj.total_employees || 0;
  const eligibleCount = metadataObj.eligible_count || 0;
  const eligiblePercentage = metadataObj.eligible_percentage || 0;
  const eligibleUsers = metadataObj.eligible_users || [];

  // Parse app url
  const baseAppUrl = getAppUrl();
  const targetDeepLink = `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=REPORT`;

  // Build the list of eligible users as Flex components
  const userContents: any[] = [];

  if (eligibleUsers.length === 0) {
    userContents.push({
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
          text: "ไม่มีพนักงานที่ผ่านเกณฑ์เบี้ยขยันในเดือนนี้",
          size: "sm",
          color: "#94a3b8",
          align: "center",
          style: "italic"
        }
      ]
    });
  } else {
    eligibleUsers.forEach((user: any, idx: number) => {
      const infoContents: any[] = [
        {
          type: "text",
          text: `${user.full_name}`,
          weight: "bold",
          size: "sm",
          color: "#78350f"
        }
      ];

      const metaStrings: string[] = [];
      if (user.position) {
        metaStrings.push(user.position);
      }
      if (Number(user.vacation_days || 0) > 0) {
        metaStrings.push(`ลาพักร้อน ${user.vacation_days} วัน`);
      }

      if (metaStrings.length > 0) {
        infoContents.push({
          type: "text",
          text: metaStrings.join(' • '),
          size: "xs",
          color: "#b45309",
          margin: "xs"
        });
      }

      userContents.push({
        type: "box",
        layout: "horizontal",
        margin: "md",
        backgroundColor: "#fffbeb",
        borderColor: "#fde68a",
        borderWidth: "1px",
        cornerRadius: "lg",
        paddingAll: "10px",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅",
            size: "lg",
            flex: 0
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            flex: 1,
            contents: infoContents
          },
          {
            type: "box",
            layout: "vertical",
            flex: 0,
            alignItems: "flex-end",
            contents: [
              {
                type: "text",
                text: `${user.ontime_days} วัน`,
                weight: "bold",
                size: "sm",
                color: "#16a34a"
              },
              {
                type: "text",
                text: "ตรงเวลา",
                size: "xxs",
                color: "#15803d"
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
      backgroundColor: "#fde68a",
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
              text: "🏆",
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
                  text: "สรุปสิทธิ์เบี้ยขยันรายเดือน",
                  weight: "bold",
                  color: "#78350f",
                  size: "md"
                },
                {
                  type: "text",
                  text: `ประจำเดือน${monthName} ${yearName}`,
                  size: "xs",
                  color: "#b45309",
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
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#fffbeb",
          borderColor: "#fcd34d",
          borderWidth: "1px",
          cornerRadius: "lg",
          paddingAll: "14px",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: "👑 ผลงานระดับเหรียญทองเกียรติยศ",
              weight: "bold",
              size: "xs",
              color: "#d97706"
            },
            {
              type: "text",
              text: `ผ่านเกณฑ์ ${eligibleCount} / ${totalEmployees} คน (${eligiblePercentage}%)`,
              weight: "bold",
              size: "lg",
              color: "#78350f",
              margin: "sm"
            },
            {
              type: "text",
              text: "เงื่อนไข: ไม่ขาด ไม่สาย ไม่ลากิจ/ลาป่วย ตลอดทั้งเดือน",
              size: "xxs",
              color: "#b45309",
              margin: "xs"
            }
          ]
        },
        {
          type: "text",
          text: "📋 รายชื่อพนักงานที่ได้รับสิทธิ์:",
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
              text: formatThaiTime(record.created_at || new Date().toISOString()) + " น.",
              size: "xxs",
              color: "#94a3b8",
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
            label: "เปิดแอปเพื่อดูข้อมูลเพิ่มเติม",
            uri: targetDeepLink
          },
          style: "primary",
          height: "md",
          color: "#d97706"
        }
      ]
    }
  };

  return {
    to: targetDestination,
    messages: [
      {
        type: "flex",
        altText: `🏆 สรุปสิทธิ์เบี้ยขยันรายเดือนประจำเดือน${monthName} ${yearName}`,
        contents: bubbleContents
      }
    ]
  };
}
