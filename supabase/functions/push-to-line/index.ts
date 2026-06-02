
// Follow this setup guide to integrate the Deno runtime into your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs on Supabase Edge Functions.

import { createClient } from '@supabase/supabase-js'

declare const Deno: any;

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';

// Configuration for colors/emojis based on notification type
const TYPE_CONFIG: Record<string, { color: string, emoji: string, label: string }> = {
  'OVERDUE': { color: '#ef4444', emoji: '🔥', label: 'งานด่วน/เลยกำหนด' },
  'GAME_PENALTY': { color: '#ef4444', emoji: '📉', label: 'โดนหักคะแนน' },
  'GAME_REWARD': { color: '#eab308', emoji: '🎁', label: 'ได้รับรางวัล' },
  'APPROVAL_REQ': { color: '#3b82f6', emoji: '📋', label: 'คำขออนุมัติ' },
  'NEW_ASSIGNMENT': { color: '#8b5cf6', emoji: '⚡', label: 'งานใหม่เข้า' },
  'REVIEW': { color: '#a855f7', emoji: '🔍', label: 'ส่งตรวจงาน' },
  'INFO': { color: '#10b981', emoji: 'ℹ️', label: 'แจ้งเตือนทั่วไป' },
};

Deno.serve(async (req: any) => {
  // Initialize Supabase Admin Client inside the handler to ensure fresh context
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let claimedIds: string[] = [];

  try {
    const payload = await req.json();
    const { record } = payload; // 'record' is the row from 'notifications' table

    // Validate Payload
    if (!record || !record.id || !record.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid Payload' }), { status: 400 });
    }

    console.log(`Processing notification trigger ${record.id} for user ${record.user_id}`);

    // Wait 6 seconds to capture other notifications generated in the same user action/flow
    const DEBOUNCE_DELAY_MS = 6000;
    console.log(`Debouncing: waiting ${DEBOUNCE_DELAY_MS}ms for potential concurrent messages...`);
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_DELAY_MS));

    // Atomically claim all pending (null status) notifications for this specific user.
    // Whichever concurrent thread executes this query first will mutate them to 'SENDING' and capture them.
    const { data: claimedRecords, error: claimError } = await supabaseAdmin
      .from('notifications')
      .update({ line_status: 'SENDING' })
      .eq('user_id', record.user_id)
      .is('line_status', null)
      .select('*');

    if (claimError) {
      throw new Error(`DB Claim Error: ${claimError.message}`);
    }

    // Check if there are any claimed notifications, and if the current trigger's record ID is amongst them.
    // If our current record is NOT in the list, it means a previous concurrent thread already claimed and processed it.
    // This maintains perfect idempotency and prevents duplicate sends.
    const isOurRecordClaimed = (claimedRecords || []).some((r: any) => r.id === record.id);
    
    if (!claimedRecords || claimedRecords.length === 0 || !isOurRecordClaimed) {
      console.log(`Notification ${record.id} was already claimed/processed by a sibling thread. Gracefully idling.`);
      return new Response(JSON.stringify({ message: 'Processed by sibling handler thread' }), { status: 200 });
    }

    // Extract claimed notification IDs for updating status later
    claimedIds = claimedRecords.map((r: any) => r.id);
    console.log(`Thread ${record.id} successfully claimed ${claimedRecords.length} notifications: [${claimedIds.join(', ')}]`);

    // 1. Get User's LINE ID
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('line_user_id, full_name')
      .eq('id', record.user_id)
      .single();

    // CASE: No LINE ID Linked
    if (userError || !userProfile || !userProfile.line_user_id) {
      console.log(`User ${record.user_id} has no LINE ID linked. Marking as ABANDONED.`);
      
      await supabaseAdmin.from('notifications').update({
          line_status: 'ABANDONED',
          last_error: 'No LINE ID linked in profile'
      }).in('id', claimedIds);

      return new Response(JSON.stringify({ message: 'No LINE ID linked, batch marked as ABANDONED' }), { status: 200 });
    }

    // 2. Construct LINE Message (Flex Message)
    const lineAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    const isBatch = claimedRecords.length > 1;

    // Use a distinct Indigo background for batched notifications, or the single config type color if solo
    const primaryConfig = isBatch 
      ? { color: '#4f46e5', emoji: '🔔', label: 'การแจ้งเตือนแบบรวม' }
      : (TYPE_CONFIG[record.type] || TYPE_CONFIG['INFO']);

    // Build Flex Contents dynamically
    const bodyContents: any[] = [];

    if (isBatch) {
      bodyContents.push({
        type: "text",
        text: `คุณได้รับการแจ้งเตือนใหม่ ${claimedRecords.length} รายการ`,
        weight: "bold",
        size: "sm",
        color: "#1e293b",
        margin: "none"
      });

      // Limit display inside the LINE Flex bubbles to max 4 to fit clean height limits comfortably
      const displayRecords = claimedRecords.slice(0, 4);
      displayRecords.forEach((rec: any, idx: number) => {
        const itemConfig = TYPE_CONFIG[rec.type] || TYPE_CONFIG['INFO'];
        
        bodyContents.push({
          type: "box",
          layout: "vertical",
          margin: "md",
          paddingAll: "10px",
          backgroundColor: "#f8fafc",
          cornerRadius: "md",
          borderWidth: "1px",
          borderColor: "#e2e8f0",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                {
                  type: "text",
                  text: `${itemConfig.emoji} ${rec.title}`,
                  weight: "bold",
                  size: "xs",
                  wrap: true,
                  color: "#334155",
                  flex: 1
                }
              ]
            },
            rec.message ? {
              type: "text",
              text: rec.message,
              size: "xxs",
              color: "#64748b",
              wrap: true,
              margin: "xs",
              maxLines: 2
            } : null,
            {
              type: "box",
              layout: "horizontal",
              margin: "xs",
              contents: [
                {
                  type: "text",
                  text: itemConfig.label,
                  size: "xxs",
                  color: "#94a3b8",
                  flex: 1
                },
                {
                  type: "text",
                  text: new Date(rec.created_at || Date.now()).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
                  size: "xxs",
                  color: "#cbd5e1",
                  align: "end"
                }
              ]
            }
          ].filter(Boolean) as any[]
        });
      });

      if (claimedRecords.length > 4) {
        bodyContents.push({
          type: "text",
          text: `• มีการแจ้งเตือนเพิ่มเติมอีก ${claimedRecords.length - 4} รายการในระบบ`,
          size: "xxs",
          color: "#6366f1",
          margin: "sm",
          align: "center",
          weight: "bold"
        });
      }
    } else {
      // Normal single notification format
      bodyContents.push(
        {
          type: "text",
          text: record.title,
          weight: "bold",
          size: "md",
          wrap: true,
          color: "#334155"
        },
        {
          type: "text",
          text: record.message || "-",
          size: "xs",
          color: "#64748b",
          wrap: true,
          margin: "md",
          maxLines: 4
        },
        {
          type: "box",
          layout: "horizontal",
          margin: "lg",
          contents: [
            {
              type: "text",
              text: primaryConfig.label,
              size: "xxs",
              color: "#94a3b8",
              flex: 1
            },
            {
              type: "text",
              text: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              size: "xxs",
              color: "#cbd5e1",
              align: "end"
            }
          ]
        }
      );
    }

    const flexMessage = {
      to: userProfile.line_user_id,
      messages: [
        {
          type: "flex",
          altText: isBatch 
            ? `[Juijui] แจ้งเตือนใหม่ ${claimedRecords.length} รายการ`
            : `[Juijui] ${record.title}`,
          contents: {
            type: "bubble",
            size: "kilo",
            header: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: primaryConfig.emoji,
                      size: "xl"
                    },
                    {
                      type: "text",
                      text: "Juijui Alert Center",
                      weight: "bold",
                      color: "#ffffff",
                      size: "sm",
                      flex: 1,
                      gravity: "center",
                      margin: "sm"
                    }
                  ]
                }
              ],
              backgroundColor: primaryConfig.color,
              paddingAll: "15px"
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: bodyContents,
              paddingAll: "20px"
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "เปิดเข้าแอป",
                    uri: "https://juijui-corp.vercel.app/"
                  },
                  style: "secondary",
                  height: "sm",
                  color: "#f1f5f9"
                }
              ],
              paddingAll: "15px"
            }
          }
        }
      ]
    };

    // 3. Send to LINE API
    const lineResponse = await fetch(LINE_MESSAGING_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineAccessToken}`
      },
      body: JSON.stringify(flexMessage)
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      throw new Error(`LINE API Error (${lineResponse.status}): ${errorText}`);
    }

    // Update DB: SUCCESS for all batched records
    await supabaseAdmin.from('notifications').update({
        line_status: 'SUCCESS',
        sent_at: new Date().toISOString(),
        last_error: null
    }).in('id', claimedIds);

    return new Response(JSON.stringify({ success: true, count: claimedIds.length }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("Error in push-to-line:", err);

    try {
        if (claimedIds.length > 0) {
             await supabaseAdmin.from('notifications').update({
                line_status: 'FAILED',
                last_error: err.message?.substring(0, 500)
            }).in('id', claimedIds);
        } else {
             // Fallback for individual record if failed before claiming block
             const payload = await req.clone().json();
             const { record } = payload;
             if (record && record.id) {
                  const currentRetry = record.retry_count || 0;
                  await supabaseAdmin.from('notifications').update({
                     line_status: 'FAILED',
                     retry_count: currentRetry + 1,
                     last_error: err.message?.substring(0, 500)
                 }).eq('id', record.id);
             }
        }
    } catch (e) {
        console.error("Critical failure during error-status update:", e);
    }

    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
