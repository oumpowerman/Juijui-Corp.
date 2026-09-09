export function buildEmptyStateBubble(dateStr: string, baseAppUrl: string): any {
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
          text: "📺 สรุปคอนเทนต์ประจำวัน",
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
          paddingTop: "4px",
          paddingBottom: "4px",
          margin: "sm",
          alignItems: "center",
          contents: [
            {
              type: "text",
              text: "✨ ไม่มีคลิปค้างลง ยอดเยี่ยมมาก!",
              color: "#065f46",
              size: "xs",
              weight: "bold",
              flex: 0
            }
          ]
        },
        {
          type: "text",
          text: `📅 ประจำวันที่ ${dateStr}`,
          color: "#047857",
          size: "xxs",
          margin: "sm"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "20px",
      alignItems: "center",
      backgroundColor: "#ffffff",
      contents: [
        {
          type: "text",
          text: "🎉 ทุกคลิปลงตามแผนเรียบร้อย",
          size: "sm",
          weight: "bold",
          color: "#0f172a"
        },
        {
          type: "text",
          text: "ไม่มีคลิปที่เลยกำหนดลงในทุกช่อง/แบรนด์",
          size: "xs",
          color: "#64748b",
          margin: "xs",
          align: "center"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      paddingAll: "12px",
      backgroundColor: "#ffffff",
      contents: [
        {
          type: "button",
          action: {
            type: "uri",
            label: "📅 เปิดดูปฏิทินคอนเทนต์ ›",
            uri: `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR`
          },
          style: "primary",
          color: "#059669",
          height: "sm"
        }
      ]
    }
  };
}
