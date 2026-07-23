import { SupabaseClient } from '@supabase/supabase-js';

export interface ClaimedNotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  metadata?: any;
  related_id?: string;
  created_at?: string;
  retry_count?: number;
  [key: string]: any;
}

/**
 * Atomically claims all pending or orphaned notifications for a user.
 */
export async function claimPendingNotifications(
  supabaseAdmin: SupabaseClient,
  userId: string,
  triggerRecordId: string
): Promise<{ claimedRecords: ClaimedNotificationRecord[]; isOurRecordClaimed: boolean }> {
  const { data: claimedRecords, error: claimError } = await supabaseAdmin
    .from('notifications')
    .update({ line_status: 'SENDING' })
    .eq('user_id', userId)
    .or(`line_status.is.null,line_status.eq.PENDING,id.eq.${triggerRecordId}`)
    .select('*');

  if (claimError) {
    throw new Error(`DB Claim Error: ${claimError.message}`);
  }

  const isOurRecordClaimed = (claimedRecords || []).some((r: any) => r.id === triggerRecordId);

  return {
    claimedRecords: (claimedRecords as ClaimedNotificationRecord[]) || [],
    isOurRecordClaimed,
  };
}

/**
 * Resolves target destination (LINE User ID or Group ID).
 */
export async function getTargetDestination(
  supabaseAdmin: SupabaseClient,
  record: ClaimedNotificationRecord
): Promise<{ targetDestination: string | null; targetName: string }> {
  let targetDestination: string | null = null;
  let targetName = '';

  if (record.type === 'DAILY_SUMMARY') {
    const { data: destOpt } = await supabaseAdmin
      .from('master_options')
      .select('label')
      .eq('type', 'WORK_CONFIG')
      .eq('key', 'LINE_SUMMARY_DESTINATION')
      .maybeSingle();

    if (destOpt && destOpt.label) {
      targetDestination = destOpt.label;
      targetName = 'LINE Summary Group';
    } else {
      console.log(`DAILY_SUMMARY requested but LINE_SUMMARY_DESTINATION is empty or not found.`);
    }
  } else {
    const { data: userProfile } = await supabaseAdmin
      .from('profiles')
      .select('line_user_id, full_name')
      .eq('id', record.user_id)
      .single();

    if (userProfile && userProfile.line_user_id) {
      targetDestination = userProfile.line_user_id;
      targetName = userProfile.full_name || 'User';
    }
  }

  // Sanitize LINE Destination (extract valid 33-char LINE ID like U..., C..., R... or trim whitespace)
  if (targetDestination) {
    const rawDest = targetDestination.trim();
    const match = rawDest.match(/([UCR][a-fA-F0-9]{32})/);
    targetDestination = match ? match[1] : rawDest;
  }

  return { targetDestination, targetName };
}

/**
 * Fetches LINE work config options: LINE_APPROVAL_MODE and LINE_HEADER_TITLE
 */
export async function getWorkConfigOptions(supabaseAdmin: SupabaseClient): Promise<{
  isInteractive: boolean;
  lineHeaderTitle: string;
}> {
  const { data: modeOpt } = await supabaseAdmin
    .from('master_options')
    .select('label, is_active')
    .eq('type', 'WORK_CONFIG')
    .eq('key', 'LINE_APPROVAL_MODE')
    .maybeSingle();

  const isInteractive = modeOpt?.is_active !== false && (!modeOpt || modeOpt.label === 'INTERACTIVE');

  const { data: headerTitleOpt } = await supabaseAdmin
    .from('master_options')
    .select('label')
    .eq('type', 'WORK_CONFIG')
    .eq('key', 'LINE_HEADER_TITLE')
    .maybeSingle();

  const lineHeaderTitle = (headerTitleOpt?.label && headerTitleOpt.label.trim())
    ? headerTitleOpt.label.trim()
    : "Juijui Alert Center";

  return { isInteractive, lineHeaderTitle };
}

/**
 * Updates status to ABANDONED when no destination is found.
 */
export async function markAsAbandoned(
  supabaseAdmin: SupabaseClient,
  claimedIds: string[],
  recordType: string
): Promise<void> {
  await supabaseAdmin.from('notifications').update({
    line_status: 'ABANDONED',
    last_error: recordType === 'DAILY_SUMMARY'
      ? 'LINE_SUMMARY_DESTINATION is empty or not found in master_options'
      : 'No LINE ID linked in profile'
  }).in('id', claimedIds);
}

/**
 * Updates status to SUCCESS for claimed notifications.
 */
export async function markAsSuccess(
  supabaseAdmin: SupabaseClient,
  claimedIds: string[]
): Promise<void> {
  await supabaseAdmin.from('notifications').update({
    line_status: 'SUCCESS',
    sent_at: new Date().toISOString(),
    last_error: null
  }).in('id', claimedIds);
}

/**
 * Updates status to FAILED for claimed or individual notification record.
 */
export async function markAsFailed(
  supabaseAdmin: SupabaseClient,
  claimedIds: string[],
  record: ClaimedNotificationRecord | null,
  err: any
): Promise<void> {
  if (claimedIds.length > 0) {
    await supabaseAdmin.from('notifications').update({
      line_status: 'FAILED',
      last_error: err.message?.substring(0, 500)
    }).in('id', claimedIds);
  } else if (record && record.id) {
    const currentRetry = record.retry_count || 0;
    await supabaseAdmin.from('notifications').update({
      line_status: 'FAILED',
      retry_count: currentRetry + 1,
      last_error: err.message?.substring(0, 500)
    }).eq('id', record.id);
  }
}
