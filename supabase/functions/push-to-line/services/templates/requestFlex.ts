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

  // For ADMIN notifications (APPROVAL_REQ) -> send to leave-requests or ot-requests
  // For Employee notifications (e.g. approval results, rejections) -> send to history
  let tab = 'history';
  if (record.type === 'APPROVAL_REQ') {
    tab = (reqType === 'OT') ? 'ot-requests' : 'leave-requests';
  } else {
    tab = 'history';
  }

  const targetDeepLink = record.related_id
    ? `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}&highlightReqId=${record.related_id}`
    : `${baseAppUrl}/?openExternalBrowser=1&view=ATTENDANCE&tab=${tab}`;

  // If interactive mode is enabled and this is a single approval request notification
  if (isInteractive && record.type === 'APPROVAL_REQ' && record.related_id) {
    return [
      {
        type: "box",
        layout: "horizontal",
        spacing: "md",
        margin: "none",
        contents: [
          {
            type: "button",
            action: {
              type: "postback",
              label: "อนุมัติ ✅",
              data: `action=approve&req_id=${record.related_id}&req_type=${reqType}&notif_id=${record.id}`
            },
            style: "primary",
            height: "sm",
            color: "#10b981"
          },
          {
            type: "button",
            action: {
              type: "postback",
              label: "ปฏิเสธ ❌",
              data: `action=reject&req_id=${record.related_id}&req_type=${reqType}&notif_id=${record.id}`
            },
            style: "primary",
            height: "sm",
            color: "#ef4444"
          }
        ]
      },
      {
        type: "button",
        action: {
          type: "uri",
          label: "เปิดเข้าแอป",
          uri: targetDeepLink
        },
        style: "secondary",
        height: "sm",
        color: "#f1f5f9",
        margin: "sm"
      }
    ];
  }

  // Default non-interactive button
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
