// Follow this setup guide to integrate the Deno runtime into your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs on Supabase Edge Functions.

declare const Deno: any;

import { TYPE_CONFIG, getSupabaseAdminClient, getLineAccessToken, getAppUrl } from './config.ts';
import {
  claimPendingNotifications,
  getTargetDestination,
  getWorkConfigOptions,
  markAsAbandoned,
  markAsSuccess,
  markAsFailed,
  getSubmissionAlertMode
} from './services/database.ts';
import { sendLineMessages } from './services/lineService.ts';
import { buildFlexHeader } from './templates/flexBase.ts';
import {
  buildMonthlyBonusSummaryPayload,
  buildSingleBodyContents,
  buildBatchBodyContents
} from './templates/attendanceFlex.ts';
import { buildDailySummaryPayload } from './templates/SummaryFlex.ts';
import { buildMonthlyOTSummaryPayload } from './templates/otSummaryFlex.ts';
import { buildFooterButtons } from './templates/requestFlex.ts';

Deno.serve(async (req: any) => {
  // Initialize Supabase Admin Client inside the handler to ensure fresh context
  const supabaseAdmin = getSupabaseAdminClient();

  let record: any = null;

  try {
    const payload = await req.json();
    record = payload.record; // 'record' is the row from 'notifications' table

    // Validate Payload
    if (!record || !record.id || !record.user_id) {
      console.warn("Invalid payload received: missing record, id, or user_id", payload);
      return new Response(JSON.stringify({ error: 'Invalid Payload' }), { status: 400 });
    }

    console.log(`Processing notification trigger ${record.id} for user ${record.user_id}`);

    // Process the notification in the background to prevent synchronous deadlock/lock-wait with PostgreSQL
    const processNotification = async () => {
      let claimedIds: string[] = [];
      try {
        // Wait 1.0 second to capture other notifications generated in the same user action/flow
        const DEBOUNCE_DELAY_MS = 1000;
        console.log(`Debouncing task: waiting ${DEBOUNCE_DELAY_MS}ms for potential concurrent messages...`);
        await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_DELAY_MS));

        // Atomically claim all pending notifications for this user
        const { claimedRecords, isOurRecordClaimed } = await claimPendingNotifications(
          supabaseAdmin,
          record.user_id,
          record.id
        );

        if (!claimedRecords || claimedRecords.length === 0 || !isOurRecordClaimed) {
          console.log(`Notification ${record.id} was already claimed/processed by a sibling thread. Gracefully idling.`);
          return;
        }

        claimedIds = claimedRecords.map((r: any) => r.id);

        // Fetch LINE submission alert mode config
        const submissionAlertMode = await getSubmissionAlertMode(supabaseAdmin);

        // Handle NONE Mode: Suppress notification entirely
        if (record.type === 'APPROVAL_REQ' && submissionAlertMode === 'NONE') {
          console.log(`Notification ${record.id} bypassed because LINE_SUBMISSION_ALERT_MODE is set to NONE.`);
          await supabaseAdmin.from('notifications').update({
            line_status: 'ABANDONED',
            last_error: 'Submission notifications disabled by LINE_SUBMISSION_ALERT_MODE = NONE'
          }).in('id', claimedIds);
          return;
        }

        // Handle GROUP_ONLY Deduplication: If this is an APPROVAL_REQ, we only send it once to the group.
        if (record.type === 'APPROVAL_REQ' && submissionAlertMode === 'GROUP_ONLY' && record.related_id) {
          const { data: siblings, error: siblingError } = await supabaseAdmin
            .from('notifications')
            .select('id, line_status')
            .eq('related_id', record.related_id)
            .eq('type', 'APPROVAL_REQ');

          if (siblingError) {
            console.error("Error fetching sibling notifications for deduplication:", siblingError);
          }

          if (siblings && siblings.length > 0) {
            // Check if any sibling is already marked as SUCCESS
            const hasSuccess = siblings.some((s: any) => s.line_status === 'SUCCESS');
            if (hasSuccess) {
              console.log(`Deduplication: Notification for related_id ${record.related_id} was already sent to group successfully. Marking sibling notifications as ABANDONED.`);
              await supabaseAdmin.from('notifications').update({
                line_status: 'ABANDONED',
                last_error: 'Duplicate request notification for group already sent'
              }).in('id', claimedIds);
              return;
            }

            // Sort sibling IDs lexicographically to find the smallest UUID (Elected Representative)
            const sortedIds = siblings.map((s: any) => s.id).sort();
            const smallestId = sortedIds[0];

            // Only the notification with the smallest ID proceeds to send to the LINE group
            const isElected = record.id === smallestId;

            if (!isElected) {
              console.log(`Deduplication: Notification ${record.id} is NOT the elected leader (Elected: ${smallestId}). Abandoning to avoid duplicate group send.`);
              await supabaseAdmin.from('notifications').update({
                line_status: 'ABANDONED',
                last_error: 'Deduplicated: Sibling notification will handle group alert'
              }).in('id', claimedIds);
              return;
            } else {
              console.log(`Deduplication: Notification ${record.id} IS the elected leader. Proceeding to send the group alert.`);
            }
          }
        }

        // 1. Get Target LINE ID / Destination (passing submissionAlertMode)
        const { targetDestination } = await getTargetDestination(supabaseAdmin, record, submissionAlertMode);

        // CASE: No LINE ID or Destination Linked
        if (!targetDestination) {
          console.log(`No valid LINE destination found for notification. Marking as ABANDONED.`);
          await markAsAbandoned(supabaseAdmin, claimedIds, record.type);
          return;
        }

        // 1.5 Fetch WORK_CONFIG options
        const { isInteractive, lineHeaderTitle } = await getWorkConfigOptions(supabaseAdmin);

        // 2. Construct LINE Message
        const lineAccessToken = getLineAccessToken();
        let lineMessagePayload: any;

        if (record.type === 'DAILY_SUMMARY') {
          lineMessagePayload = buildDailySummaryPayload(targetDestination, record);
        } else if (record.type === 'MONTHLY_BONUS_SUMMARY') {
          lineMessagePayload = buildMonthlyBonusSummaryPayload(targetDestination, record);
        } else if (record.type === 'MONTHLY_OT_SUMMARY') {
          lineMessagePayload = buildMonthlyOTSummaryPayload(targetDestination, record);
        } else {
          const isBatch = claimedRecords.length > 1;
          
          let effectiveType = record.type;
          const isAttendanceAlert = record.type === 'OVERDUE' && (
            record.title?.includes('ลงเวลา') || 
            record.title?.includes('ผ่อนปรน') || 
            record.title?.includes('เช็คอิน') || 
            record.link_path === 'ATTENDANCE'
          );
          if (isAttendanceAlert) {
            effectiveType = 'ATTENDANCE_ALERT';
          }

          const primaryConfig = isBatch
            ? { color: '#4f46e5', emoji: '🔔', label: 'การแจ้งเตือนแบบรวม' }
            : (TYPE_CONFIG[effectiveType] || TYPE_CONFIG['INFO']);

          const bodyContents = isBatch
            ? buildBatchBodyContents(claimedRecords)
            : buildSingleBodyContents(record, primaryConfig);

          const baseAppUrl = getAppUrl();
          const footerButtons = buildFooterButtons(baseAppUrl, record, isInteractive);

          lineMessagePayload = {
            to: targetDestination,
            messages: [
              {
                type: "flex",
                altText: isBatch
                  ? `[${lineHeaderTitle}] แจ้งเตือนใหม่ ${claimedRecords.length} รายการ`
                  : `[${lineHeaderTitle}] ${record.title}`,
                contents: {
                  type: "bubble",
                  size: "mega",
                  header: buildFlexHeader(primaryConfig, lineHeaderTitle),
                  body: {
                    type: "box",
                    layout: "vertical",
                    contents: bodyContents,
                    paddingTop: "10px",
                    paddingBottom: "12px",
                    paddingStart: "15px",
                    paddingEnd: "15px"
                  },
                  footer: {
                    type: "box",
                    layout: "vertical",
                    contents: footerButtons,
                    paddingAll: "15px"
                  }
                }
              }
            ]
          };
        }

        // 3. Send to LINE API
        await sendLineMessages(targetDestination, lineMessagePayload, lineAccessToken);

        // Update DB: SUCCESS
        await markAsSuccess(supabaseAdmin, claimedIds);

      } catch (err: any) {
        console.error("Error in background push-to-line:", err);
        try {
          await markAsFailed(supabaseAdmin, claimedIds, record, err);
        } catch (e) {
          console.error("Critical failure during background error-status update:", e);
        }
      }
    };

    await processNotification();

    return new Response(JSON.stringify({ success: true, message: 'Notification processed and status updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("Error in push-to-line request handler:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
