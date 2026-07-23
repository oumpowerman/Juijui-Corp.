declare const Deno: any;

import { createClient } from '@supabase/supabase-js';

export const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/push';

export interface TypeConfig {
  color: string;
  emoji: string;
  label: string;
}

export const TYPE_CONFIG: Record<string, TypeConfig> = {
  'OVERDUE': { color: '#ef4444', emoji: '🔥', label: 'งานด่วน/เลยกำหนด' },
  'GAME_PENALTY': { color: '#ef4444', emoji: '📉', label: 'โดนหักคะแนน' },
  'GAME_REWARD': { color: '#eab308', emoji: '🎁', label: 'ได้รับรางวัล' },
  'APPROVAL_REQ': { color: '#3b82f6', emoji: '📋', label: 'คำขออนุมัติ' },
  'NEW_ASSIGNMENT': { color: '#8b5cf6', emoji: '⚡', label: 'งานใหม่เข้า' },
  'REVIEW': { color: '#a855f7', emoji: '🔍', label: 'ส่งตรวจงาน' },
  'INFO': { color: '#10b981', emoji: 'ℹ️', label: 'แจ้งเตือนทั่วไป' },
};

export function getSupabaseAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

export function getLineAccessToken(): string {
  return Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') ?? '';
}

export function getAppUrl(): string {
  const appUrl = Deno.env.get('APP_URL') || "https://juijui-corp.vercel.app/";
  return appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
}
