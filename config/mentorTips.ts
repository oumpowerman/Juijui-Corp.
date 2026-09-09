export type MentorTipVariant = 'blue' | 'yellow' | 'purple' | 'green' | 'pink' | 'orange';

export type MentorTipModuleId = 
  | 'DASHBOARD'
  | 'CONTENT_STOCK'
  | 'QUEST_BOARD'
  | 'DUTY'
  | 'SHOOT_CHECKLIST'
  | 'FEEDBACK'
  | 'LEADERBOARD'
  | 'KPI'
  | 'CHANNEL'
  | 'TEAM'
  | 'MASTER_DATA';

export interface MentorTipModuleConfig {
  id: MentorTipModuleId;
  name: string;
  description?: string;
  variant: MentorTipVariant;
  defaultMessages: string[];
}

export interface MentorTipsGlobalSettings {
  isGloballyEnabled: boolean;
  moduleSettings: Record<MentorTipModuleId, {
    isEnabled: boolean;
    customMessages?: string[];
  }>;
}

export const DEFAULT_MENTOR_TIPS: Record<MentorTipModuleId, MentorTipModuleConfig> = {
  DASHBOARD: {
    id: 'DASHBOARD',
    name: 'แดชบอร์ดหลัก (Admin Dashboard)',
    description: 'หน้าแรกสรุปภาพรวมงาน สถานะงาน และสถิติต่างๆ',
    variant: 'blue',
    defaultMessages: [
      "คลิกที่การ์ดสถานะด้านบน เพื่อดูรายการงานทั้งหมดในกลุ่มนั้นได้เลย",
      "ช่วง Script คือหัวใจสำคัญ วางโครงเรื่องให้แน่น จะถ่ายง่ายขึ้นเยอะ!",
      "พักสายตาทุก 45 นาทีด้วยนะ งานเดิน สุขภาพต้องดีด้วย"
    ]
  },
  CONTENT_STOCK: {
    id: 'CONTENT_STOCK',
    name: 'คลังคอนเทนต์ (Content Stock)',
    description: 'หน้ารวมคอนเทนต์ สคริปต์ และคิวถ่ายทำ',
    variant: 'purple',
    defaultMessages: [
      "มุมมอง List แบบละเอียด ช่วยให้เช็คสถานะงานได้ครบถ้วน",
      "ใช้ตัวกรอง Status เลือกดูเฉพาะขั้นตอนที่สนใจได้ เช่น ดูเฉพาะ 'Script' และ 'Shooting'",
      "ใหม่! ระบบ Shoot Queue ช่วยให้คุณจัดคิวถ่ายทำวันนี้ได้ง่ายขึ้น ไม่ว่าจะมีสคริปต์หรือไม่ก็ตาม"
    ]
  },
  QUEST_BOARD: {
    id: 'QUEST_BOARD',
    name: 'บอร์ดเควสประจำสัปดาห์ (Weekly Quest)',
    description: 'หน้าระบบภารกิจ เควสงานประจำสัปดาห์ และสถิติความสำเร็จ',
    variant: 'purple',
    defaultMessages: [
      "ใหม่! ระบบ Quest ยืดหยุ่น: สร้างเควสเริ่มวันไหนก็ได้ กำหนดวันจบเองได้ ไม่ต้องล็อค 7 วัน",
      "กดปุ่ม 'สถิติ (Chronicles)' เพื่อดูประวัติความสำเร็จและความล้มเหลวที่ผ่านมา",
      "การ Revive งานที่ล้มเหลว จะช่วยให้เราได้โอกาสแก้ตัว แต่ประวัติเก่าจะยังคงอยู่เป็นบทเรียนนะ"
    ]
  },
  DUTY: {
    id: 'DUTY',
    name: 'จัดการเวรประจำวัน (Duty System)',
    description: 'หน้าระบบเวรทำความสะอาด ตารางเวร และการแลกเวร',
    variant: 'green',
    defaultMessages: [
      "ใหม่! ระบบแลกเวร (Swap Request) 🔄 ขอกันดีๆ ไม่ต้องตีกัน",
      "ถ่ายรูปส่งการบ้าน 📸 เพื่อยืนยันความบริสุทธิ์ใจว่าทำจริง!",
      "หากลืมทำเวร ระบบจะให้โอกาสแก้ตัวในวันรุ่งขึ้น (Tribunal) อย่าเพิ่งตกใจ!"
    ]
  },
  SHOOT_CHECKLIST: {
    id: 'SHOOT_CHECKLIST',
    name: 'จัดเป๋าออกกอง (Smart Packer)',
    description: 'หน้าระบบเตรียมอุปกรณ์ เช็คลิสต์ และตรวจสภาพของออกกอง',
    variant: 'pink',
    defaultMessages: [
      "กดที่การ์ดเพื่อดูรูปก่อนเช็ค (Verify Mode)",
      "กดปุ่มดินสอที่ Preset เพื่อแก้ไขรายการข้างในได้แล้วนะ!"
    ]
  },
  FEEDBACK: {
    id: 'FEEDBACK',
    name: 'เสียงจากทีม (Voice of Team)',
    description: 'หน้ากล่องรับฟังความคิดเห็นและข้อเสนอแนะในทีม',
    variant: 'pink',
    defaultMessages: [
      "พื้นที่ปลอดภัยสำหรับทุกคน! อยากเสนอไอเดียหรือชมเพื่อน จัดไป!",
      "เลือก 'Anonymous' ได้นะ ถ้ายอมรับความจริงกันได้ ทีมจะแกร่งขึ้นแน่นอน",
      "Admin จะคอยดูอยู่ห่างๆ เพื่อความเรียบร้อยครับ"
    ]
  },
  LEADERBOARD: {
    id: 'LEADERBOARD',
    name: 'กระดานผู้นำ (Leaderboard)',
    description: 'หน้ารวมอันดับคะแนน MVP, XP และสถิติเกม',
    variant: 'orange',
    defaultMessages: [
      "🔥 สัปดาห์นี้ใครจะเป็น MVP? ดูคะแนนได้ที่นี่เลย!",
      "XP ได้จากการทำงานเสร็จตรงเวลา และการช่วยเพื่อนๆ",
      "อย่าลืมนะ! ส่งงานช้า หรือโดดเวร คะแนนลดนะจ๊ะ 📉"
    ]
  },
  KPI: {
    id: 'KPI',
    name: 'ประเมินผลงาน (KPI Review)',
    description: 'หน้าระบบประเมินผลงานประจำเดือนและ Peer Review',
    variant: 'orange',
    defaultMessages: [
      "KPI V10 Complete! 🚀 เพิ่มระบบ Peer Review, เชื่อมเกม และใบสรุปผลแบบ Print ได้แล้ว",
      "เมื่อสถานะเป็น PAID ระบบจะแจก Coin และ XP ให้พนักงานโดยอัตโนมัติตามเกรด",
      "อย่าลืมกด 'ส่งคำชม' ให้เพื่อนร่วมทีมบ้างนะ กำลังใจสำคัญมาก!"
    ]
  },
  CHANNEL: {
    id: 'CHANNEL',
    name: 'จัดการช่องรายการ (Brands & Shows)',
    description: 'หน้ารายการแบรนด์ ช่องทางโซเชียลมีเดีย และโลโก้',
    variant: 'orange',
    defaultMessages: [
      "อัปโหลด Logo ช่องได้แล้วนะ! จะช่วยให้ดูเป็นทางการขึ้นเยอะเลย",
      "คลิกที่การ์ดรายการเพื่อแก้ไขข้อมูลได้เลย"
    ]
  },
  TEAM: {
    id: 'TEAM',
    name: 'ผังทีม & สมาชิก (Team Directory)',
    description: 'หน้ารายชื่อสมาชิกในทีม Squad และสถานะการทำงาน',
    variant: 'blue',
    defaultMessages: [
      "ใหม่! ระบบกรองทีมแบบใหม่: เลือกดูเฉพาะ Squad ตัวเอง หรือดูทั้งหมดได้ง่ายๆ",
      "ใครว่าง/ไม่ว่าง ดูที่สถานะแบตเตอรี่และไอคอนสถานะ (Online/Sick) ได้เลย",
      "ใช้ปุ่ม My Tasks เพื่อดูงานตัวเองแบบรวมทุกที่"
    ]
  },
  MASTER_DATA: {
    id: 'MASTER_DATA',
    name: 'จัดการข้อมูลระบบ (Master Data)',
    description: 'หน้าตั้งค่าตัวเลือกระบบ ตัวกรอง และการบำรุงรักษา',
    variant: 'orange',
    defaultMessages: [
      "Maintenance Menu ใหม่! เช็คพื้นที่ Storage ได้แล้วนะ",
      "Game Balancing! ปรับค่า XP/HP ได้โดยไม่ต้องแก้โค้ดแล้ว",
      "Operational Calendar! กำหนดวันทำงาน/วันหยุดพิเศษได้ที่นี่"
    ]
  }
};

export const DEFAULT_MENTOR_TIPS_GLOBAL_SETTINGS: MentorTipsGlobalSettings = {
  isGloballyEnabled: true,
  moduleSettings: {
    DASHBOARD: { isEnabled: true },
    CONTENT_STOCK: { isEnabled: true },
    QUEST_BOARD: { isEnabled: true },
    DUTY: { isEnabled: true },
    SHOOT_CHECKLIST: { isEnabled: true },
    FEEDBACK: { isEnabled: true },
    LEADERBOARD: { isEnabled: true },
    KPI: { isEnabled: true },
    CHANNEL: { isEnabled: true },
    TEAM: { isEnabled: true },
    MASTER_DATA: { isEnabled: true }
  }
};
