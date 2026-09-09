import { OverdueChannelGroup } from './types.ts';
import { cleanText } from './constants.ts';

export function buildOverviewBubble(
  sortedChannels: OverdueChannelGroup[],
  totalOverdueCount: number,
  dateStr: string,
  baseAppUrl: string
): any {
  const overviewChannelRows: any[] = [];
  const topOverviewChannels = sortedChannels.slice(0, 6);

  topOverviewChannels.forEach((ch) => {
    const chColor = ch.channel_color && ch.channel_color.startsWith('#') ? ch.channel_color : '#6366f1';
    const chCount = Array.isArray(ch.items) ? ch.items.length : 0;
    const chName = cleanText(ch.channel_name, 'ช่องทั่วไป');

    overviewChannelRows.push({
      type: "box",
      layout: "horizontal",
      alignItems: "center",
      paddingTop: "4px",
      paddingBottom: "4px",
      contents: [
        {
          type: "text",
          text: "●",
          size: "xs",
          color: chColor,
          flex: 0
        },
        {
          type: "text",
          text: chName,
          size: "xs",
          color: "#334155",
          margin: "sm",
          weight: "bold",
          flex: 1,
          maxLines: 1
        },
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#ffe4e6",
          cornerRadius: "md",
          paddingStart: "8px",
          paddingEnd: "8px",
          paddingTop: "2px",
          paddingBottom: "2px",
          contents: [
            {
              type: "text",
              text: `${chCount} คลิป`,
              size: "xxs",
              weight: "bold",
              color: "#e11d48"
            }
          ]
        }
      ]
    });
  });

  if (sortedChannels.length > 6) {
    const remainingChannelsCount = sortedChannels.length - 6;
    overviewChannelRows.push({
      type: "text",
      text: `... และอีก ${remainingChannelsCount} ช่องในระบบ`,
      size: "xxs",
      color: "#94a3b8",
      style: "italic",
      margin: "xs",
      align: "center"
    });
  }

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#fff1f2",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "🌅 สรุปคลิปค้างลงภาพรวม",
          weight: "bold",
          color: "#9f1239",
          size: "md"
        },
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#fee2e2",
          cornerRadius: "xl",
          paddingStart: "10px",
          paddingEnd: "10px",
          paddingTop: "4px",
          paddingBottom: "4px",
          margin: "sm",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: `🚨 ค้างลงรวม ${totalOverdueCount} คลิป (${sortedChannels.length} ช่อง)`,
              color: "#be123c",
              size: "xs",
              weight: "bold",
              flex: 0
            }
          ]
        },
        {
          type: "text",
          text: `📅 ประจำวันที่ ${dateStr} • อัปเดตเช้า`,
          color: "#9f1239",
          size: "xxs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#ffffff",
      paddingTop: "12px",
      paddingBottom: "12px",
      paddingStart: "14px",
      paddingEnd: "14px",
      contents: [
        {
          type: "text",
          text: "📊 อันดับช่องที่มีคลิปค้างลง:",
          size: "xs",
          weight: "bold",
          color: "#0f172a",
          margin: "none"
        },
        {
          type: "separator",
          margin: "sm",
          color: "#f1f5f9"
        },
        {
          type: "box",
          layout: "vertical",
          margin: "sm",
          spacing: "xs",
          contents: overviewChannelRows
        },
        {
          type: "separator",
          margin: "md",
          color: "#f1f5f9"
        },
        {
          type: "text",
          text: "👉 ปัดขวาเพื่อดูรายละเอียดแต่ละช่อง",
          size: "xxs",
          color: "#64748b",
          align: "center",
          margin: "sm"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingTop: "8px",
      paddingBottom: "12px",
      paddingStart: "14px",
      paddingEnd: "14px",
      backgroundColor: "#ffffff",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "📅 เปิดดูปฏิทินคอนเทนต์ทั้งหมด ›",
            uri: `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR`
          },
          style: "primary",
          color: "#f43f5e",
          height: "sm"
        }
      ]
    }
  };
}
