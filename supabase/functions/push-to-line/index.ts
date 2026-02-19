
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

  try {
    const payload = await req.json();
    const { record } = payload; // 'record' is the row from 'notifications' table

    // Validate Payload
    if (!record || !record.id || !record.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid Payload' }), { status: 400 });
    }

    console.log(`Processing notification ${record.id} for user ${record.user_id}`);

    // 1. Get User's LINE ID
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('line_user_id, full_name')
      .eq('id', record.user_id)
      .single();

    // CASE: No LINE ID Linked
    if (userError || !userProfile || !userProfile.line_user_id) {
      console.log(`User ${record.user_id} has no LINE ID linked.`);
      
      // Update DB: Abandoned
      await supabaseAdmin.from('notifications').update({
          line_status: 'ABANDONED',
          last_error: 'No LINE ID linked in profile'
      }).eq('id', record.id);

      return new Response(JSON.stringify({ message: 'No LINE ID linked, marked as ABANDONED' }), { status: 200 });
    }

    // 2. Construct LINE Message (Flex Message)
    const config = TYPE_CONFIG[record.type] || TYPE_CONFIG['INFO'];
    const lineAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');

    const flexMessage = {
      to: userProfile.line_user_id,
      messages: [
        {
          type: "flex",
          altText: `[Juijui] ${record.title}`,
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
                      text: config.emoji,
                      size: "xl"
                    },
                    {
                      type: "text",
                      text: "Juijui Alert",
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
              backgroundColor: config.color,
              paddingAll: "15px"
            },
            body: {
              type: "box",
              layout: "vertical",
              contents: [
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
                            text: config.label,
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
              ],
              paddingAll: "20px"
            },
            // Optional: Add button to open app
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "button",
                  action: {
                    type: "uri",
                    label: "เปิดดูในแอป",
                    uri: "https://your-app-url.com" // เปลี่ยนเป็น URL จริงของคุณ
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

    // CASE: Success
    // Update DB: SUCCESS
    await supabaseAdmin.from('notifications').update({
        line_status: 'SUCCESS',
        sent_at: new Date().toISOString(),
        last_error: null
    }).eq('id', record.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error("Error in push-to-line:", err);

    // CASE: Failed
    // We catch errors here to update the DB status instead of letting the function crash entirely.
    // This allows us to track failures.
    try {
        const payload = await req.clone().json(); // Clone req to read body again if needed
        const { record } = payload;
        
        if (record && record.id) {
             const currentRetry = record.retry_count || 0;
             await supabaseAdmin.from('notifications').update({
                line_status: 'FAILED',
                retry_count: currentRetry + 1,
                last_error: err.message?.substring(0, 500) // Truncate error if too long
            }).eq('id', record.id);
        }
    } catch (e) {
        // Fallback if we can't even read the record ID
        console.error("Critical failure updating DB status:", e);
    }

    // Return 200 OK to the Webhook even on logical error to prevent the Database Webhook from retrying indefinitely on its own.
    // We handle our own retries via the `line_status` column logic.
    return new Response(JSON.stringify({ error: err.message }), { status: 200 });
  }
});
