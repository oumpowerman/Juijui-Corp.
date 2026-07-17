import { supabase } from '../../lib/supabase';

/**
 * Sends an approval notification to the user.
 */
export async function sendApprovalNotification(userId: string, title: string, message: string) {
    return supabase.from('notifications').insert({
        user_id: userId,
        type: 'INFO',
        title,
        message,
        is_read: false,
        link_path: 'ATTENDANCE'
    });
}

/**
 * Sends a rejection notification to the user.
 */
export async function sendRejectionNotification(userId: string, title: string, message: string) {
    return supabase.from('notifications').insert({
        user_id: userId,
        type: 'INFO',
        title,
        message,
        is_read: false,
        link_path: 'ATTENDANCE'
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
