import { OverdueItem } from './types.ts';
import { resolveStatusBadge, cleanText } from './constants.ts';

export function buildChannelItemRow(
  item: OverdueItem,
  idx: number,
  chColor: string,
  baseAppUrl: string
): any {
  const statusBadge = resolveStatusBadge(item);

  const timeStr = cleanText(item.scheduled_time, '');
  const dateStrItem = cleanText(item.target_date, 'กำหนดลง');
  const fallbackSchedule = timeStr ? `${dateStrItem} ${timeStr} น.` : `${dateStrItem} (ไม่ระบุเวลา)`;
  const scheduleLabel = cleanText(
    item.formatted_datetime,
    fallbackSchedule
  );

  let shortTeam = 'ทีมงาน';
  if (item.editor_names && item.editor_names.trim() !== '' && item.editor_names !== '-') {
    const firstEditor = item.editor_names.split(',')[0].trim();
    shortTeam = `ตัดต่อ: ${cleanText(firstEditor, 'ทีมงาน')}`;
  } else if (item.assignee_names && item.assignee_names.trim() !== '' && item.assignee_names !== '-') {
    const firstAssignee = item.assignee_names.split(',')[0].trim();
    shortTeam = `ผู้รับผิดชอบ: ${cleanText(firstAssignee, 'ทีมงาน')}`;
  }

  const taskModalUri = `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&taskId=${item.id}&highlightTaskId=${item.id}`;

  return {
    type: "box",
    layout: "vertical",
    action: {
      type: "uri",
      label: "เปิดอัปเดตงาน",
      uri: taskModalUri
    },
    paddingTop: "6px",
    paddingBottom: "6px",
    contents: [
      // Line 1: Index + Timestamp in Soft Rose
      {
        type: "box",
        layout: "horizontal",
        alignItems: "center",
        contents: [
          {
            type: "text",
            text: `${idx + 1}.`,
            size: "xxs",
            weight: "bold",
            color: chColor,
            flex: 0
          },
          {
            type: "text",
            text: `🕒 ${scheduleLabel}`,
            size: "xxs",
            weight: "bold",
            color: "#e11d48",
            margin: "xs",
            flex: 1
          }
        ]
      },
      // Line 2: Clip Title
      {
        type: "text",
        text: cleanText(item.title, 'ไม่มีชื่อคลิป'),
        size: "xs",
        weight: "bold",
        color: "#1e293b",
        wrap: true,
        margin: "xs"
      },
      // Line 3: Pastel Status Pill + Team member + Arrow Icon
      {
        type: "box",
        layout: "horizontal",
        alignItems: "center",
        margin: "xs",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            backgroundColor: statusBadge.bg,
            cornerRadius: "md",
            paddingStart: "7px",
            paddingEnd: "7px",
            paddingTop: "2px",
            paddingBottom: "2px",
            contents: [
              {
                type: "text",
                text: cleanText(statusBadge.label, 'รอดำเนินการ'),
                size: "xxs",
                weight: "bold",
                color: statusBadge.text
              }
            ]
          },
          {
            type: "text",
            text: `👤 ${shortTeam}`,
            size: "xxs",
            color: "#64748b",
            margin: "sm",
            flex: 1,
            wrap: true
          },
          {
            type: "text",
            text: "›",
            size: "sm",
            weight: "bold",
            color: "#cbd5e1",
            align: "end",
            flex: 0
          }
        ]
      }
    ]
  };
}
