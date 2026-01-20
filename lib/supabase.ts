import { createClient } from '@supabase/supabase-js';

/**
 * มาตรฐานการดึงค่า Environment Variables ใน Vite
 * ต้องขึ้นต้นด้วย VITE_ เสมอถึงจะดึงมาใช้ในโค้ดฝั่ง Client ได้
 */
// Fix: Use type assertion to resolve 'Property env does not exist on type ImportMeta'
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// ตรวจสอบความพร้อมของกุญแจก่อนเริ่มระบบ
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase environment variables! \n' +
    'กรุณาตรวจสอบว่ามี VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env หรือยังครับ'
  );
}

// สร้าง Client โดยดึงค่าจาก env
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);