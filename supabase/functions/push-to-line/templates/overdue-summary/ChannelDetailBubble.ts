import { OverdueChannelGroup } from './types.ts';
import { cleanText } from './constants.ts';
import { buildChannelItemRow } from './ChannelItemRow.ts';

export function buildChannelDetailBubble(
  ch: OverdueChannelGroup,
  dateStr: string,
  baseAppUrl: string
): any {
  const chColor = ch.channel_color && ch.channel_color.startsWith('#') ? ch.channel_color : '#6366f1';
  const itemCount = Array.isArray(ch.items) ? ch.items.length : 0;
  const channelName = cleanText(ch.channel_name, 'ช่องทั่วไป');

  const listContents: any[] = [];
  const displayItems = (ch.items || []).slice(0, 5);

  displayItems.forEach((item, idx) => {
    if (idx > 0) {
      listContents.push({
        type: "separator",
        margin: "md",
        color: "#f1f5f9"
      });
    }
    listContents.push(buildChannelItemRow(item, idx, chColor, baseAppUrl));
  });

  const hasMoreItems = (ch.items || []).length > 5;
  if (hasMoreItems) {
    listContents.push({
      type: "box",
      layout: "vertical",
      margin: "sm",
      alignItems: "center",
      contents: [
        {
          type: "text",
          text: `... และอีก ${(ch.items || []).length - 5} รายการในช่องนี้`,
          size: "xxs",
          color: "#94a3b8",
          style: "italic"
        }
      ]
    });
  }

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#f8fafc",
      paddingAll: "16px",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: "●",
              size: "sm",
              color: chColor,
              flex: 0
            },
            {
              type: "text",
              text: `📺 ${channelName}`,
              weight: "bold",
              color: "#0f172a",
              size: "md",
              margin: "sm",
              wrap: true,
              flex: 1
            }
          ]
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
              text: `🚨 ค้างลงทั้งหมด ${itemCount} คลิป`,
              color: "#be123c",
              size: "xs",
              weight: "bold",
              flex: 0
            }
          ]
        },
        {
          type: "text",
          text: `📅 สรุปประจำเช้า • ${dateStr}`,
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
      contents: listContents
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
            label: "📅 เปิดดูปฏิทินช่องนี้ ›",
            uri: `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&channelId=${ch.channel_id}`
          },
          style: "secondary",
          height: "sm",
          color: "#f1f5f9"
        }
      ]
    }
  };
}
