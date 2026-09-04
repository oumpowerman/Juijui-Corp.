import { ClaimedNotificationRecord } from '../services/database.ts';

/**
 * Builds footer contents (DeepLink buttons & Interactive approval/reject buttons)
 */
export function buildFooterButtons(
  baseAppUrl: string,
  record: ClaimedNotificationRecord,
  isInteractive: boolean
) {
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
  const reqType = metadataObj.request_type || 'WFH';

  const isCheckoutPenalty = record.type === 'OVERDUE' && (
    (record.title?.includes('ลืมบันทึกเวลา') || record.title?.includes('ลืมตอกบัตร')) &&
    !record.title?.includes('อย่าลืม')
  );

  const isCheckoutReminder = record.type === 'OVERDUE' && (
    record.title?.includes('อย่าลืมตอกบัตร') ||
    record.title?.includes('เลิกงาน')
  );

  const isAttendanceAlert = !isCheckoutPenalty && !isCheckoutReminder && record.type === 'OVERDUE' && (
    record.title?.includes('ลงเวลา') || 
    record.title?.includes('ผ่อนปรน') || 
    record.title?.includes('เช็คอิน') || 
    record.link_path === 'ATTENDANCE'
  );

  // For ADMIN notifications (APPROVAL_REQ, APPROVAL_SUMMARY) -> send to leave-requests or ot-requests
  // For Employee notifications (e.g. approval results, rejections) -> send to history
  // For Check-In reminders -> send to CHECK_IN
  let tab = 'history';
  if (record.type === 'APPROVAL_REQ' || record.type === 'APPROVAL_SUMMARY') {
    tab = (reqType === 'OT' || reqType === 'OVERTIME') ? 'ot-requests' : 'leave-requests';
  } else if (isAttendanceAlert || isCheckoutPenalty || isCheckoutReminder) {
    tab = 'CHECK_IN';
  } else {
    tab = 'history';
  }

  const targetDeepLink = record.related_id
    ? `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}&highlightReqId=${record.related_id}`
    : isAttendanceAlert
      ? `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}&action=checkin`
      : `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}`;

  // If this is a checkout reminder (Plan E), provide direct link button to check out with primary brand color (Indigo)
  if (isCheckoutReminder) {
    return [
      {
        type: "button",
        action: {
          type: "uri",
          label: "ลงเวลาออกงานทันที ⏱️",
          uri: targetDeepLink
        },
        style: "primary",
        height: "md",
        color: "#4f46e5"
      }
    ];
  }

  // If this is a checkout penalty, provide direct link to CHECK_IN dashboard to correct without triggering instant checkin
  if (isCheckoutPenalty) {
    return [
      {
        type: "button",
        action: {
          type: "uri",
          label: "ยื่นคำขอแก้ไขเวลา",
          uri: targetDeepLink
        },
        style: "primary",
        height: "md",
        color: "#ea580c"
      }
    ];
  }

  // If this is an attendance alert reminder, provide direct deep link button
  if (isAttendanceAlert) {
    return [
      {
        type: "button",
        action: {
          type: "uri",
          label: "ลงเวลาเข้างานทันที ⏱️",
          uri: targetDeepLink
        },
        style: "primary",
        height: "md",
        color: "#4f46e5"
      }
    ];
  }

  // If this is a Content Planner notification, provide quick link to Calendar and quick status update
  if (record.type === 'CONTENT_PLANNER_ALERT' || (record.type === 'OVERDUE' && record.link_path === 'CALENDAR')) {
    const taskId = record.related_id || '';
    const contentDeepLink = `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&highlightTaskId=${taskId}`;
    const quickDoneLink = `${baseAppUrl}/?openExternalBrowser=1&view=CALENDAR&highlightTaskId=${taskId}&quickAction=set_done`;

    return [
      {
        type: "button",
        action: {
          type: "uri",
          label: "ปรับสถานะเป็น DONE ✅",
          uri: quickDoneLink
        },
        style: "primary",
        height: "md",
        color: "#10b981"
      },
      {
        type: "button",
        action: {
          type: "uri",
          label: "ดูในตารางคอนเทนต์ 📅",
          uri: contentDeepLink
        },
        style: "secondary",
        height: "sm",
        color: "#f1f5f9",
        margin: "sm"
      }
    ];
  }

  // If this is a single approval request notification, provide the direct "View and Approve" button
  if (record.type === 'APPROVAL_REQ' && record.related_id) {
    return [
      {
        type: "button",
        action: {
          type: "uri",
          label: "ดูรายละเอียดและอนุมัติ 📝",
          uri: targetDeepLink
        },
        style: "primary",
        height: "md",
        color: "#6366f1"
      }
    ];
  }

  // Default non-interactive button for general notifications
  return [
    {
      type: "button",
      action: {
        type: "uri",
        label: "เปิดเข้าแอป",
        uri: targetDeepLink
      },
      style: "secondary",
      height: "sm",
      color: "#f1f5f9"
    }
  ];
}
