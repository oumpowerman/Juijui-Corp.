import { OverdueChannelGroup } from './types.ts';
import { cleanText } from './constants.ts';

export function buildOverflowBubble(
  remainingChannels: OverdueChannelGroup[],
  dateStr: string,
  baseAppUrl: string
): any {
  const remainingRows: any[] = [];
  remainingChannels.slice(0, 8).forEach((ch) => {
    const chColor = ch.channel_color && ch.channel_color.startsWith('#') ? ch.channel_color : '#64748b';
    const chCount = Array.isArray(ch.items) ? ch.items.length : 0;
    const chName = cleanText(ch.channel_name, 'ช่องทั่วไป');

    remainingRows.push({
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
          type: "text",
          text: `${chCount} คลิป`,
          size: "xxs",
          weight: "bold",
          color: "#e11d48",
          flex: 0
        }
      ]
    });
  });

  if (remainingChannels.length > 8) {
    remainingRows.push({
      type: "text",
      text: `... และอีก ${remainingChannels.length - 8} ช่อง`,
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
      backgroundColor: "#f1f5f9",
      paddingAll: "16px",
      contents: [
        {
          type: "text",
          text: "📋 ช่องอื่นๆ ที่มีคลิปค้าง",
          weight: "bold",
          color: "#334155",
          size: "md"
        },
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#e2e8f0",
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
              text: `✨ อีก ${remainingChannels.length} ช่องในระบบ`,
              color: "#334155",
              size: "xs",
              weight: "bold",
              flex: 0
            }
          ]
        },
        {
          type: "text",
          text: `📅 ประจำวันที่ ${dateStr}`,
          color: "#64748b",
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
          text: "รายชื่อช่องเพิ่มเติม:",
          size: "xs",
          weight: "bold",
          color: "#0f172a"
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
          contents: remainingRows
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
            label: "🌐 เปิดดูงานทั้งหมดในระบบ ›",
            uri: `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR`
          },
          style: "primary",
          color: "#475569",
          height: "sm"
        }
      ]
    }
  };
}
