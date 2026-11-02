import { supabase } from '../../lib/supabase';
import { insertAndDispatchNotifications } from '../../utils/pushDispatcher';

/**
 * Sends an approval notification to the user and dispatches a device Web Push.
 */
export async function sendApprovalNotification(userId: string, title: string, message: string, relatedId?: string, metadata?: any) {
    return insertAndDispatchNotifications({
        user_id: userId,
        type: 'INFO',
        title,
        message,
        is_read: false,
        link_path: 'ATTENDANCE',
        related_id: relatedId || null,
        metadata: metadata || null
    }, {
        category: 'APPROVAL_SUMMARY'
    });
}

/**
 * Sends a rejection notification to the user and dispatches a device Web Push.
 */
export async function sendRejectionNotification(userId: string, title: string, message: string, relatedId?: string, metadata?: any) {
    return insertAndDispatchNotifications({
        user_id: userId,
        type: 'INFO',
        title,
        message,
        is_read: false,
        link_path: 'ATTENDANCE',
        related_id: relatedId || null,
        metadata: metadata || null
    }, {
        category: 'APPROVAL_SUMMARY'
    });
}

/**
 * Sends an approval/rejection summary notification to the user.
 */
export async function sendGroupSummaryNotification(
    employeeId: string,
    employeeName: string,
    requestType: string,
    adminName: string,
    statusText: string,
    reason: string = '',
    relatedId?: string,
    metadata?: any,
    companyShortName?: string
) {
    const compPrefix = companyShortName ? `[${companyShortName}] ` : '';
    let message = `พนักงาน: ${compPrefix}${employeeName}\nประเภทคำขอ: ${requestType}\nสถานะ: ${statusText}\nผู้พิจารณา: ${adminName}`;
    if (reason) {
        message += `\nหมายเหตุ: ${reason}`;
    }

    return supabase.from('notifications').insert({
        user_id: employeeId,
        type: 'APPROVAL_SUMMARY',
        title: `อัปเดตคำขอ: ${compPrefix}${employeeName}`,
        message,
        is_read: false,
        link_path: 'ATTENDANCE',
        related_id: relatedId || null,
        metadata: metadata || null
    });
}

/**
 * Publishes a dynamic status message or bot announcement to the team channel.
 */
export async function publishToTeamChannel(content: string) {
    return supabase.from('team_messages').insert({
        content,
        is_bot: true,
        message_type: 'TEXT',
        user_id: null
    });
}
