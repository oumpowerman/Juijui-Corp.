-- ============================================================================
-- Migration: Create Platform Landing & Media Showcase Configuration
-- Description: Stores dynamic pricing plans, 6-feature showcase videos, hero video, and À La Carte module pricing
-- Access: Public Read, Super Admin Only Write (RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_landing_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    pricing_plans JSONB NOT NULL DEFAULT '[]'::jsonb,
    feature_videos JSONB NOT NULL DEFAULT '{}'::jsonb,
    hero_video JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_module_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Ensure column exists if table was created earlier
ALTER TABLE public.platform_landing_config
    ADD COLUMN IF NOT EXISTS custom_module_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Index for instant lookup
CREATE INDEX IF NOT EXISTS idx_platform_landing_config_id ON public.platform_landing_config(id);

-- Enable Row-Level Security
ALTER TABLE public.platform_landing_config ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy (All visitors, anonymous and authenticated, can view landing config)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'platform_landing_config' 
        AND policyname = 'public_read_landing_config'
    ) THEN
        CREATE POLICY "public_read_landing_config" 
            ON public.platform_landing_config
            FOR SELECT TO public
            USING (true);
    END IF;
END $$;

-- 2. Super Admin Write Policy (Only authenticated profiles with is_super_admin = true can modify)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'platform_landing_config' 
        AND policyname = 'super_admin_manage_landing_config'
    ) THEN
        CREATE POLICY "super_admin_manage_landing_config" 
            ON public.platform_landing_config
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.is_super_admin = true
                )
            )
            With CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.is_super_admin = true
                )
            );
    END IF;
END $$;

-- 3. Seed Default Configuration row if not present
INSERT INTO public.platform_landing_config (id, pricing_plans, feature_videos, hero_video)
VALUES (
    'default',
    '[
        {
            "tier": "STARTER",
            "name": "Starter Plan",
            "audience": "สำหรับทีมครีเอเตอร์และช่องขนาดเล็ก",
            "monthlyPrice": 1990,
            "yearlyPrice": 19900,
            "maxMembers": 10,
            "recommended": false,
            "features": [
                "รองรับสมาชิกในองค์กรสูงสุด 10 คน",
                "แยกฐานข้อมูลองค์กรอิสระ (Tenant Isolation)",
                "ปฏิทินคอนเทนต์, สต็อกงาน และบอร์ดสถานะ",
                "ระบบเช็คอินเข้างาน & ตารางเวรทำความสะอาด",
                "ห้องแชทภายในทีมและระบบแจ้งเตือนพื้นฐาน"
            ]
        },
        {
            "tier": "PRO",
            "name": "Pro Studio Plan",
            "audience": "ยอดนิยมสำหรับสตูดิโอและบริษัทผลิตคอนเทนต์",
            "monthlyPrice": 3990,
            "yearlyPrice": 39900,
            "maxMembers": 30,
            "recommended": true,
            "badge": "ทดลองใช้ฟรี 7 วัน",
            "features": [
                "รองรับสมาชิกในองค์กรสูงสุด 30 คน (Trial 5 คน)",
                "ทุกฟีเจอร์ในแผน Starter + ระบบแยกแบรนด์ในเครือ",
                "Script Hub, คลังเก็บเรฟ (Workbox) & จัดทริปออกกอง",
                "ระบบตรวจคุณภาพงาน (Quality Gate) & RPG Gamification",
                "ศูนย์คู่มือ Wiki, ห้องประชุม & ตารางเวรครบวงจร"
            ]
        },
        {
            "tier": "ENTERPRISE",
            "name": "Enterprise Plan",
            "audience": "สำหรับเอเจนซี่และเครือบริษัทหลายแบรนด์",
            "monthlyPrice": 8990,
            "yearlyPrice": 89900,
            "maxMembers": 100,
            "recommended": false,
            "features": [
                "รองรับสมาชิกในองค์กรสูงสุด 100 คน",
                "ปลดล็อกทุกโมดูล 100% เต็มรูปแบบ",
                "ระบบบริหารการเงิน & บัญชีรายรับ-รายจ่าย (Finance)",
                "ระบบประเมินผล KPI รายบุคคลและแดชบอร์ดผู้บริหาร",
                "จัดการหลายบริษัทย่อย/แบรนด์ในเครือเดียวกันไม่จำกัด"
            ]
        },
        {
            "tier": "LIFETIME",
            "name": "Lifetime License",
            "audience": "สิทธิ์ใช้งานตลอดชีพสำหรับองค์กรขนาดใหญ่",
            "monthlyPrice": 89900,
            "yearlyPrice": 89900,
            "maxMembers": 500,
            "recommended": false,
            "badge": "จ่ายครั้งเดียวจบ",
            "features": [
                "รองรับสมาชิกในองค์กรสูงสุด 500 คน",
                "ชำระครั้งเดียว ใช้งานได้ตลอดชีพไม่มีรายเดือน",
                "ปลดล็อกทุกโมดูลปัจจุบันและอัปเดตใหม่ในอนาคต",
                "รองรับการตั้งค่า Master Data เฉพาะขององค์กรเต็มรูปแบบ",
                "ทีมซัพพอร์ตดูแลการตั้งค่าองค์กรแบบ Priority"
            ]
        }
    ]'::jsonb,
    '{
        "feature-1": {
            "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "durationLabel": "02:15",
            "description": "พาชมภาพรวมสตูดิโอแบบ Real-time ทั้งสถานะ Content ที่กำลังผลิต คิวกองถ่าย และยอด KPI ของทีมในหน้าเดียว"
        },
        "feature-2": {
            "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "durationLabel": "01:50",
            "description": "วิธีวางแผนตารางโพสต์ด้วยระบบ Drag & Drop ดูภาพรวมความถี่ของ Content แยกตามแพลตฟอร์มและช่องทางต่างๆ"
        },
        "feature-3": {
            "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "durationLabel": "02:30",
            "description": "ระบบมอบหมายงาน ตรวจรับงาน (Quality Gate) พร้อมแจกแต้ม XP และให้ Feedback ทีมงานโดยไม่ตกหล่นในแชทส่วนตัว"
        },
        "feature-4": {
            "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "durationLabel": "02:05",
            "description": "คลังเก็บเรฟไวรัล เขียนบท สคริปต์ และสตอรี่บอร์ด พร้อมแชร์ลิงก์หน้ากองถ่ายแบบไม่ต้องกลัวไฟล์ทับกัน"
        },
        "feature-5": {
            "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "durationLabel": "01:45",
            "description": "การจัดคิวออกกอง เช็กลิสต์อุปกรณ์การถ่ายทำ และมอบหมายเวรประจำวันให้ทีมงานพร้อมแจ้งเตือนอัตโนมัติ"
        },
        "feature-6": {
            "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            "durationLabel": "02:20",
            "description": "การบริหารจัดการหลายช่อง หลายเพจ หรือหลายแบรนด์ในเครือภายใต้บริษัทเดียวกัน แยกหมวดหมู่งานอย่างชัดเจน"
        }
    }'::jsonb,
    '{
        "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        "type": "youtube"
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;
