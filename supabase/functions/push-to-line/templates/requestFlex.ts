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

  const isAttendanceAlert = record.type === 'OVERDUE' && (
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
  } else if (isAttendanceAlert) {
    tab = 'CHECK_IN';
  } else {
    tab = 'history';
  }

  const targetDeepLink = record.related_id
    ? `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}&highlightReqId=${record.related_id}`
    : isAttendanceAlert
      ? `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}&action=checkin`
      : `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}`;

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
