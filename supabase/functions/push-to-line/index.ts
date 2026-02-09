// Follow this setup guide to integrate the Deno runtime into your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs on Supabase Edge Functions.

import { createClient } from '@supabase/supabase-js';


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
  try {
    // 1. Check Auth (Optional but recommended for Webhooks)
    // For raw database webhooks, we might skip strict auth header checks 
    // but ensure the payload structure is correct.

    const payload = await req.json();
    const { record } = payload; // 'record' is the new row from the 'notifications' table

    if (!record || !record.user_id) {
      return new Response(JSON.stringify({ error: 'Invalid Payload' }), { status: 400 });
    }

    // 2. Initialize Supabase Admin Client
    // We need Service Role Key to bypass RLS and read user's line_user_id
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Get User's LINE ID
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('line_user_id, full_name')
      .eq('id', record.user_id)
      .single();

    if (userError || !userProfile || !userProfile.line_user_id) {
      console.log(`User ${record.user_id} has no LINE ID linked. Skipping.`);
      return new Response(JSON.stringify({ message: 'No LINE ID linked' }), { status: 200 });
    }

    // 4. Construct LINE Message (Flex Message)
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

    // 5. Send to LINE API
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
      console.error('LINE API Error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to send to LINE', details: errorText }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});