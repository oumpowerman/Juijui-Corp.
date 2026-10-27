import { supabase } from '../lib/supabase';
import { BRAND_CONFIG } from '../config/brand.ts';
import { SAAS_PLAN_PRESETS } from '../lib/multiTenantMigrationSql';

export interface PlatformPricingPlan {
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'LIFETIME';
  name: string;
  audience: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxMembers: number;
  recommended?: boolean;
  badge?: string;
  features: string[];
}

export interface FeatureVideoConfig {
  videoUrl: string;
  durationLabel?: string;
  description?: string;
}

export interface HeroVideoConfig {
  url: string;
  type?: 'youtube' | 'drive' | 'direct' | 'auto';
}

export type ModuleGroupId = 'WORKSPACE' | 'PRODUCTION' | 'OFFICE' | 'ADMIN';

export interface CustomModuleItemConfig {
  key: string;
  label: string;
  group: ModuleGroupId;
  description: string;
  monthlyPrice: number;
  isCore?: boolean;
  highlightTag?: string;
}

export interface CustomRecipePreset {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  moduleKeys: string[];
}

export interface PlatformBillingPaymentConfig {
  promptPayId: string;
  promptPayAccountName: string;
  promptPayQrImageUrl: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankBranch: string;
  enablePromptPayQr: boolean;
  enableStripeCard: boolean;
  enableBankSlip: boolean;
  enableFreeTrialButton: boolean;
}

export interface CustomModulePricingConfig {
  baseMonthlyPrice: number;
  includedBaseSeats: number;
  extraSeatMonthlyPrice: number;
  yearlyDiscountMonths: number;
  modules: CustomModuleItemConfig[];
  billingPaymentConfig?: PlatformBillingPaymentConfig;
}

export interface PlatformLandingConfig {
  id: string;
  pricing_plans: PlatformPricingPlan[];
  feature_videos: Record<string, FeatureVideoConfig>;
  hero_video: HeroVideoConfig;
  custom_module_config: CustomModulePricingConfig;
  billing_payment_config: PlatformBillingPaymentConfig;
  updated_at?: string;
  updated_by?: string;
}

export const DEFAULT_PLATFORM_PRICING_PLANS: PlatformPricingPlan[] = [
  {
    tier: 'STARTER',
    name: SAAS_PLAN_PRESETS.STARTER.name,
    audience: 'สำหรับทีมครีเอเตอร์และช่องขนาดเล็ก',
    monthlyPrice: SAAS_PLAN_PRESETS.STARTER.monthlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.STARTER.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.STARTER.defaultMaxMembers,
    recommended: false,
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 10 คน',
      'แยกฐานข้อมูลองค์กรอิสระ (Tenant Isolation)',
      'ปฏิทินคอนเทนต์, สต็อกงาน และบอร์ดสถานะ',
      'ระบบเช็คอินเข้างาน & ตารางเวรทำความสะอาด',
      'ห้องแชทภายในทีมและระบบแจ้งเตือนพื้นฐาน',
    ],
  },
  {
    tier: 'PRO',
    name: SAAS_PLAN_PRESETS.PRO.name,
    audience: 'ยอดนิยมสำหรับสตูดิโอและบริษัทผลิตคอนเทนต์',
    monthlyPrice: SAAS_PLAN_PRESETS.PRO.monthlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.PRO.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.PRO.defaultMaxMembers,
    recommended: true,
    badge: 'ทดลองใช้ฟรี 7 วัน',
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 30 คน (Trial 5 คน)',
      'ทุกฟีเจอร์ในแผน Starter + ระบบแยกแบรนด์ในเครือ',
      'Script Hub, คลังเก็บเรฟ (Workbox) & จัดทริปออกกอง',
      'ระบบตรวจคุณภาพงาน (Quality Gate) & RPG Gamification',
      'ศูนย์คู่มือ Wiki, ห้องประชุม & ตารางเวรครบวงจร',
    ],
  },
  {
    tier: 'ENTERPRISE',
    name: SAAS_PLAN_PRESETS.ENTERPRISE.name,
    audience: 'สำหรับเอเจนซี่และเครือบริษัทหลายแบรนด์',
    monthlyPrice: SAAS_PLAN_PRESETS.ENTERPRISE.monthlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.ENTERPRISE.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.ENTERPRISE.defaultMaxMembers,
    recommended: false,
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 100 คน',
      'ปลดล็อกทุกโมดูล 100% เต็มรูปแบบ',
      'ระบบบริหารการเงิน & บัญชีรายรับ-รายจ่าย (Finance)',
      'ระบบประเมินผล KPI รายบุคคลและแดชบอร์ดผู้บริหาร',
      'จัดการหลายบริษัทย่อย/แบรนด์ในเครือเดียวกันไม่จำกัด',
    ],
  },
  {
    tier: 'LIFETIME',
    name: SAAS_PLAN_PRESETS.LIFETIME.name,
    audience: 'สิทธิ์ใช้งานตลอดชีพสำหรับองค์กรขนาดใหญ่',
    monthlyPrice: SAAS_PLAN_PRESETS.LIFETIME.yearlyPriceTHB,
    yearlyPrice: SAAS_PLAN_PRESETS.LIFETIME.yearlyPriceTHB,
    maxMembers: SAAS_PLAN_PRESETS.LIFETIME.defaultMaxMembers,
    recommended: false,
    badge: 'จ่ายครั้งเดียวจบ',
    features: [
      'รองรับสมาชิกในองค์กรสูงสุด 500 คน',
      'ชำระครั้งเดียว ใช้งานได้ตลอดชีพไม่มีรายเดือน',
      'ปลดล็อกทุกโมดูลปัจจุบันและอัปเดตใหม่ในอนาคต',
      'รองรับการตั้งค่า Master Data เฉพาะขององค์กรเต็มรูปแบบ',
      'ทีมซัพพอร์ตดูแลการตั้งค่าองค์กรแบบ Priority',
    ],
  },
];

export const DEFAULT_FEATURE_VIDEOS: Record<string, FeatureVideoConfig> =
  BRAND_CONFIG.featureShowcaseVideos || {
    'feature-1': {
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      durationLabel: '02:15',
      description: 'พาชมภาพรวมสตูดิโอแบบ Real-time ทั้งสถานะ Content ที่กำลังผลิต คิวกองถ่าย และยอด KPI ของทีมในหน้าเดียว',
    },
    'feature-2': {
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      durationLabel: '01:50',
      description: 'วิธีวางแผนตารางโพสต์ด้วยระบบ Drag & Drop ดูภาพรวมความถี่ของ Content แยกตามแพลตฟอร์มและช่องทางต่างๆ',
    },
    'feature-3': {
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      durationLabel: '02:30',
      description: 'ระบบมอบหมายงาน ตรวจรับงาน (Quality Gate) พร้อมแจกแต้ม XP และให้ Feedback ทีมงานโดยไม่ตกหล่นในแชทส่วนตัว',
    },
    'feature-4': {
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      durationLabel: '02:05',
      description: 'คลังเก็บเรฟไวรัล เขียนบท สคริปต์ และสตอรี่บอร์ด พร้อมแชร์ลิงก์หน้ากองถ่ายแบบไม่ต้องกลัวไฟล์ทับกัน',
    },
    'feature-5': {
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      durationLabel: '01:45',
      description: 'การจัดคิวออกกอง เช็กลิสต์อุปกรณ์การถ่ายทำ และมอบหมายเวรประจำวันให้ทีมงานพร้อมแจ้งเตือนอัตโนมัติ',
    },
    'feature-6': {
      videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
      durationLabel: '02:20',
      description: 'การบริหารจัดการหลายช่อง หลายเพจ หรือหลายแบรนด์ในเครือภายใต้บริษัทเดียวกัน แยกหมวดหมู่งานอย่างชัดเจน',
    },
  };

export const DEFAULT_HERO_VIDEO: HeroVideoConfig = {
  url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  type: 'youtube',
};

export const DEFAULT_CUSTOM_MODULES_LIST: CustomModuleItemConfig[] = [
  // Group 1: WORKSPACE
  {
    key: 'DASHBOARD',
    label: 'ภาพรวม (Dashboard)',
    group: 'WORKSPACE',
    description: 'หน้ากระดานหลักสรุปสถานะงานวันนี้ ตารางคิวงานด่วน และภาพรวมสตูดิโอ',
    monthlyPrice: 0,
    isCore: true,
    highlightTag: 'ฟรีใน Base Core',
  },
  {
    key: 'ROADMAP',
    label: 'แผนงาน (Roadmap)',
    group: 'WORKSPACE',
    description: 'วางไทม์ไลน์แคมเปญระยะยาวและภาพรวมโปรเจกต์รายไตรมาส',
    monthlyPrice: 250,
    isCore: false,
  },
  {
    key: 'CALENDAR',
    label: 'ปฏิทิน & บอร์ด (Calendar & Kanban)',
    group: 'WORKSPACE',
    description: 'ตารางวางแผนคอนเทนต์ลากวาง (Drag & Drop) พร้อมบอร์ดสถานะงานครบวงจร',
    monthlyPrice: 390,
    isCore: false,
    highlightTag: 'ยอดฮิต',
  },
  {
    key: 'CHAT',
    label: 'ห้องแชท (Team Chat)',
    group: 'WORKSPACE',
    description: 'แชทสื่อสารภายในทีมพร้อมบอทแจ้งเตือนสถานะงานอัตโนมัติ',
    monthlyPrice: 190,
    isCore: false,
  },
  {
    key: 'TEAM',
    label: 'ทีมงาน (Team Directory)',
    group: 'WORKSPACE',
    description: 'จัดการรายชื่อสมาชิก ตำแหน่ง บทบาทหน้าที่ และดูภาระงานรายบุคคล',
    monthlyPrice: 0,
    isCore: true,
    highlightTag: 'ฟรีใน Base Core',
  },
  {
    key: 'NEXUS',
    label: 'Nexus Hub (ศูนย์รวมลิงก์ & AI)',
    group: 'WORKSPACE',
    description: 'เชื่อมโยง Google Drive, Canva, Notion และคลังเครื่องมือ 외부ไว้ในหน้าเดียว',
    monthlyPrice: 250,
    isCore: false,
  },
  {
    key: 'WEEKLY',
    label: 'ภารกิจรายสัปดาห์ (Weekly Quest)',
    group: 'WORKSPACE',
    description: 'กำหนดเควสต์เป้าหมายประจำสัปดาห์ให้ทีมโฟกัสงานสำคัญและเก็บแต้มโบนัส',
    monthlyPrice: 250,
    isCore: false,
    highlightTag: 'สายเกม',
  },
  {
    key: 'GOALS',
    label: 'เป้าหมาย (OKRs & Goals)',
    group: 'WORKSPACE',
    description: 'ตั้งเป้าหมายยอดวิว ยอดผู้ติดตาม และวัดความคืบหน้าของโปรเจกต์',
    monthlyPrice: 250,
    isCore: false,
  },

  // Group 2: PRODUCTION
  {
    key: 'SCRIPT_HUB',
    label: 'เขียนบท (Script Hub & Teleprompter)',
    group: 'PRODUCTION',
    description: 'เขียนสคริปต์ร่วมกันแบบ Real-time แยกซีน พร้อมโหมด Teleprompter หน้ากองถ่าย',
    monthlyPrice: 390,
    isCore: false,
    highlightTag: 'ยอดฮิต',
  },
  {
    key: 'MEETINGS',
    label: 'ห้องประชุม (Meeting & Brainstorm)',
    group: 'PRODUCTION',
    description: 'จดบันทึกการประชุม ขายงานลูกค้า สรุปมติ และแปลงเป็นการ์ดงานได้ทันที',
    monthlyPrice: 250,
    isCore: false,
  },
  {
    key: 'ContentStock',
    label: 'คลังคลิป (Content Stock & Shoot Queue)',
    group: 'PRODUCTION',
    description: 'บริหารสต็อกคลิปที่ถ่ายเก็บไว้ จัดคิวออกกองถ่ายทำ และเช็กสถานะตัดต่อ',
    monthlyPrice: 350,
    isCore: false,
    highlightTag: 'ยอดฮิต',
  },
  {
    key: 'ANALYTICS',
    label: 'วิเคราะห์ข้อมูล (Studio Analytics)',
    group: 'PRODUCTION',
    description: 'เจาะลึกสถิติการผลิตคอนเทนต์ ประสิทธิภาพรายช่องทาง และความเร็วของทีม',
    monthlyPrice: 290,
    isCore: false,
  },
  {
    key: 'CHECKLIST',
    label: 'จัดเป๋า (Shoot Packing & Gear)',
    group: 'PRODUCTION',
    description: 'เช็กลิสต์จัดกระเป๋ากล้อง ไฟ ไมค์ ก่อนออกกองถ่าย ป้องกันการลืมอุปกรณ์สำคัญ',
    monthlyPrice: 190,
    isCore: false,
  },

  // Group 3: OFFICE
  {
    key: 'ATTENDANCE',
    label: 'ลงเวลาทำงาน (Attendance & Leave)',
    group: 'OFFICE',
    description: 'ตอกบัตรเข้า-ออกงาน เช็กพิกัด/รูปถ่าย พร้อมระบบยื่นใบลาและอนุมัติวันลา',
    monthlyPrice: 350,
    isCore: false,
    highlightTag: 'ยอดฮิต',
  },
  {
    key: 'LEADERBOARD',
    label: 'Hall of Fame (RPG & Gamification)',
    group: 'OFFICE',
    description: 'ระบบเลเวล XP เหรียญรางวัล ร้านค้าแลกของรางวัล และจัดอันดับคนขยันประจำเดือน',
    monthlyPrice: 290,
    isCore: false,
    highlightTag: 'สายเกม',
  },
  {
    key: 'DUTY',
    label: 'ตารางเวร (Duty Roster)',
    group: 'OFFICE',
    description: 'จัดตารางเวรประจำวัน สุ่มเวร แลกเวร ส่งรูปหลักฐานตรวจเวร และหักแต้มอัตโนมัติ',
    monthlyPrice: 250,
    isCore: false,
    highlightTag: 'สายออฟฟิศ',
  },
  {
    key: 'COMPANY_CHECKLIST',
    label: 'เช็คลิสต์บริษัท (SOP Checklist)',
    group: 'OFFICE',
    description: 'รายการตรวจเช็กมาตรฐานการเปิด-ปิดสตูดิโอ และงานรูทีนประจำวันของออฟฟิศ',
    monthlyPrice: 190,
    isCore: false,
  },
  {
    key: 'KPI',
    label: 'ประเมินผล (KPI & Performance)',
    group: 'OFFICE',
    description: 'ประเมินผลงานรายเดือน คำนวณเกรดอัตโนมัติจากสถิติส่งงานและวินัยการทำงาน',
    monthlyPrice: 390,
    isCore: false,
  },
  {
    key: 'FEEDBACK',
    label: 'Voice of Team (กล่องรับฟังความคิดเห็น)',
    group: 'OFFICE',
    description: 'พื้นที่ส่งฟีดแบ็ก เสนอไอเดียพัฒนาองค์กร หรือแจ้งปัญหาแบบระบุตัวตน/ไม่ระบุตัวตน',
    monthlyPrice: 150,
    isCore: false,
  },
  {
    key: 'WIKI',
    label: 'คู่มือองค์กร (Studio Wiki)',
    group: 'OFFICE',
    description: 'คลังความรู้ คู่มือการทำงานของแต่ละตำแหน่ง และระเบียบข้อบังคับบริษัท',
    monthlyPrice: 250,
    isCore: false,
  },
  {
    key: 'ASSETS',
    label: 'ทะเบียนทรัพย์สิน (Asset Registry)',
    group: 'OFFICE',
    description: 'ระบบยืม-คืนอุปกรณ์กล้อง คอมพิวเตอร์ ตรวจสอบสถานะของชำรุดและผู้ถือครอง',
    monthlyPrice: 290,
    isCore: false,
  },
  {
    key: 'FINANCE',
    label: 'ระบบบัญชี (Studio Finance)',
    group: 'OFFICE',
    description: 'บันทึกรายรับจากสปอนเซอร์ รายจ่ายกองถ่าย เบิกงบประมาณ และสรุปกำไรรายโปรเจกต์',
    monthlyPrice: 490,
    isCore: false,
  },

  // Group 4: ADMIN
  {
    key: 'QUALITY_GATE',
    label: 'ห้องตรวจงาน (Quality Gate)',
    group: 'ADMIN',
    description: 'ด่านตรวจคุณภาพคลิปและชิ้นงานก่อนโพสต์ คอมเมนต์แก้รายจุดพร้อมอนุมัติผ่านงาน',
    monthlyPrice: 350,
    isCore: false,
    highlightTag: 'ยอดฮิต',
  },
  {
    key: 'CHANNELS',
    label: 'จัดการช่องทาง (Multi-Brand Channels)',
    group: 'ADMIN',
    description: 'บริหารหลายช่อง หลายเพจ หรือหลายแบรนด์ในเครือภายใต้พื้นที่ทำงานเดียว',
    monthlyPrice: 250,
    isCore: false,
  },
  {
    key: 'MASTER_DATA',
    label: 'ตั้งค่าระบบ (Master Data)',
    group: 'ADMIN',
    description: 'ปรับแต่งหมวดหมู่งาน แท็กสถานะ กฎการให้แต้ม และโครงสร้างพื้นฐานขององค์กร',
    monthlyPrice: 0,
    isCore: true,
    highlightTag: 'ฟรีใน Base Core',
  },
  {
    key: 'SYSTEM_GUIDE',
    label: 'คู่มือระบบ (System Logic Guide)',
    group: 'ADMIN',
    description: 'เอกสารอธิบายกลไกการทำงานของระบบและวิธีตั้งค่าสำหรับผู้ดูแลองค์กร',
    monthlyPrice: 0,
    isCore: true,
    highlightTag: 'ฟรีใน Base Core',
  },
];

export const DEFAULT_CUSTOM_MODULE_CONFIG: CustomModulePricingConfig = {
  baseMonthlyPrice: 490,
  includedBaseSeats: 5,
  extraSeatMonthlyPrice: 50,
  yearlyDiscountMonths: 2,
  modules: DEFAULT_CUSTOM_MODULES_LIST,
};

export const QUICK_RECIPE_PRESETS: CustomRecipePreset[] = [
  {
    id: 'content-planner',
    name: 'สูตร 1: สายวางแพลน & ปฏิทินล้วน',
    subtitle: 'เน้นจัดตารางคอนเทนต์ สต็อกคลิป และจัดการหลายช่อง',
    badge: 'ประหยัดสุด',
    moduleKeys: ['DASHBOARD', 'TEAM', 'MASTER_DATA', 'SYSTEM_GUIDE', 'CALENDAR', 'ContentStock', 'CHANNELS'],
  },
  {
    id: 'production-script',
    name: 'สูตร 2: สายออกกอง เขียนบท & ประชุม',
    subtitle: 'ครบเครื่องเรื่องเขียนบท ประชุมไอเดีย จัดกระเป๋าออกกอง',
    badge: 'กองถ่ายฮิต',
    moduleKeys: [
      'DASHBOARD',
      'TEAM',
      'MASTER_DATA',
      'SYSTEM_GUIDE',
      'CALENDAR',
      'SCRIPT_HUB',
      'MEETINGS',
      'ContentStock',
      'CHECKLIST',
    ],
  },
  {
    id: 'office-duty',
    name: 'สูตร 3: สายออฟฟิศ จัดเวร & ตอกบัตร',
    subtitle: 'เน้นระเบียบวินัยทีม ตอกบัตรเข้างาน จัดตารางเวร และคู่มือบริษัท',
    badge: 'HR แนะนำ',
    moduleKeys: [
      'DASHBOARD',
      'TEAM',
      'MASTER_DATA',
      'SYSTEM_GUIDE',
      'ATTENDANCE',
      'DUTY',
      'COMPANY_CHECKLIST',
      'WIKI',
      'ASSETS',
    ],
  },
  {
    id: 'gamification-qc',
    name: 'สูตร 4: สายเกมมิฟิเคชัน & ตรวจงาน QC',
    subtitle: 'เปลี่ยนงานเป็นเกม เก็บเลเวล XP แลกรางวัล พร้อมห้องตรวจงานและ KPI',
    badge: 'ปลุกไฟทีม',
    moduleKeys: [
      'DASHBOARD',
      'TEAM',
      'MASTER_DATA',
      'SYSTEM_GUIDE',
      'CALENDAR',
      'WEEKLY',
      'QUALITY_GATE',
      'LEADERBOARD',
      'KPI',
    ],
  },
  {
    id: 'blank-canvas',
    name: 'ล้างสูตร (เลือกผสมเองจากศูนย์)',
    subtitle: 'เริ่มต้นเฉพาะ Base Core พื้นฐาน แล้วจิ้มโมดูลที่ต้องการเองทีละชิ้น',
    badge: 'Custom 100%',
    moduleKeys: ['DASHBOARD', 'TEAM', 'MASTER_DATA', 'SYSTEM_GUIDE'],
  },
];

export const DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG: PlatformBillingPaymentConfig = {
  promptPayId: '089-999-9999',
  promptPayAccountName: 'บจก. คอนเทนต์ โอเอส (Kontent OS Co., Ltd.)',
  promptPayQrImageUrl: '',
  bankName: 'ธนาคารกสิกรไทย (KBANK)',
  bankAccountNumber: '123-4-56789-0',
  bankAccountName: 'บจก. คอนเทนต์ โอเอส',
  bankBranch: 'สาขาสยามพารากอน · บัญชีออมทรัพย์',
  enablePromptPayQr: true,
  enableStripeCard: true,
  enableBankSlip: true,
  enableFreeTrialButton: true,
};

const BILLING_CONFIG_LOCAL_STORAGE_KEY = 'juijui_platform_billing_payment_config';

export function normalizeBillingPaymentConfig(raw: any): PlatformBillingPaymentConfig {
  let cached: Partial<PlatformBillingPaymentConfig> = {};
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(BILLING_CONFIG_LOCAL_STORAGE_KEY);
      if (saved) {
        cached = JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
  }

  const source = raw && typeof raw === 'object' ? raw : cached;
  return {
    promptPayId:
      typeof source.promptPayId === 'string' && source.promptPayId.trim()
        ? source.promptPayId.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.promptPayId,
    promptPayAccountName:
      typeof source.promptPayAccountName === 'string' && source.promptPayAccountName.trim()
        ? source.promptPayAccountName.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.promptPayAccountName,
    promptPayQrImageUrl:
      typeof source.promptPayQrImageUrl === 'string'
        ? source.promptPayQrImageUrl.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.promptPayQrImageUrl,
    bankName:
      typeof source.bankName === 'string' && source.bankName.trim()
        ? source.bankName.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.bankName,
    bankAccountNumber:
      typeof source.bankAccountNumber === 'string' && source.bankAccountNumber.trim()
        ? source.bankAccountNumber.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.bankAccountNumber,
    bankAccountName:
      typeof source.bankAccountName === 'string' && source.bankAccountName.trim()
        ? source.bankAccountName.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.bankAccountName,
    bankBranch:
      typeof source.bankBranch === 'string'
        ? source.bankBranch.trim()
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.bankBranch,
    enablePromptPayQr:
      typeof source.enablePromptPayQr === 'boolean'
        ? source.enablePromptPayQr
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.enablePromptPayQr,
    enableStripeCard:
      typeof source.enableStripeCard === 'boolean'
        ? source.enableStripeCard
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.enableStripeCard,
    enableBankSlip:
      typeof source.enableBankSlip === 'boolean'
        ? source.enableBankSlip
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.enableBankSlip,
    enableFreeTrialButton:
      typeof source.enableFreeTrialButton === 'boolean'
        ? source.enableFreeTrialButton
        : DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG.enableFreeTrialButton,
  };
}

export const DEFAULT_PLATFORM_LANDING_CONFIG: PlatformLandingConfig = {
  id: 'default',
  pricing_plans: DEFAULT_PLATFORM_PRICING_PLANS,
  feature_videos: DEFAULT_FEATURE_VIDEOS,
  hero_video: DEFAULT_HERO_VIDEO,
  custom_module_config: DEFAULT_CUSTOM_MODULE_CONFIG,
  billing_payment_config: DEFAULT_PLATFORM_BILLING_PAYMENT_CONFIG,
};

/**
 * ผสานรายการโมดูลจาก DB เข้ากับ DEFAULT_CUSTOM_MODULES_LIST เพื่อให้มั่นใจว่ามีครบทั้ง 26 โมดูลเสมอ
 */
function normalizeCustomModuleConfig(raw: any): CustomModulePricingConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_CUSTOM_MODULE_CONFIG;
  }

  const rawModulesMap = new Map<string, Partial<CustomModuleItemConfig>>();
  if (Array.isArray(raw.modules)) {
    for (const m of raw.modules) {
      if (m && typeof m.key === 'string') {
        rawModulesMap.set(m.key, m);
      }
    }
  }

  const mergedModules: CustomModuleItemConfig[] = DEFAULT_CUSTOM_MODULES_LIST.map((defMod) => {
    const override = rawModulesMap.get(defMod.key);
    if (!override) return defMod;
    return {
      ...defMod,
      label: typeof override.label === 'string' && override.label.trim() ? override.label : defMod.label,
      description:
        typeof override.description === 'string' && override.description.trim()
          ? override.description
          : defMod.description,
      monthlyPrice:
        typeof override.monthlyPrice === 'number' && !Number.isNaN(override.monthlyPrice)
          ? override.monthlyPrice
          : defMod.monthlyPrice,
      isCore: typeof override.isCore === 'boolean' ? override.isCore : defMod.isCore,
      highlightTag:
        typeof override.highlightTag === 'string' ? override.highlightTag : defMod.highlightTag,
    };
  });

  return {
    baseMonthlyPrice:
      typeof raw.baseMonthlyPrice === 'number' && !Number.isNaN(raw.baseMonthlyPrice)
        ? raw.baseMonthlyPrice
        : DEFAULT_CUSTOM_MODULE_CONFIG.baseMonthlyPrice,
    includedBaseSeats:
      typeof raw.includedBaseSeats === 'number' && !Number.isNaN(raw.includedBaseSeats)
        ? raw.includedBaseSeats
        : DEFAULT_CUSTOM_MODULE_CONFIG.includedBaseSeats,
    extraSeatMonthlyPrice:
      typeof raw.extraSeatMonthlyPrice === 'number' && !Number.isNaN(raw.extraSeatMonthlyPrice)
        ? raw.extraSeatMonthlyPrice
        : DEFAULT_CUSTOM_MODULE_CONFIG.extraSeatMonthlyPrice,
    yearlyDiscountMonths:
      typeof raw.yearlyDiscountMonths === 'number' && !Number.isNaN(raw.yearlyDiscountMonths)
        ? raw.yearlyDiscountMonths
        : DEFAULT_CUSTOM_MODULE_CONFIG.yearlyDiscountMonths,
    modules: mergedModules,
    ...(raw.billingPaymentConfig
      ? { billingPaymentConfig: normalizeBillingPaymentConfig(raw.billingPaymentConfig) }
      : {}),
  };
}

/**
 * ดึงการตั้งค่า Landing Page และ Pricing จากฐานข้อมูล พร้อม Fallback ค่าตั้งต้นอัตโนมัติ
 */
export async function getPlatformLandingConfig(): Promise<PlatformLandingConfig> {
  try {
    const { data, error } = await supabase
      .from('platform_landing_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      return {
        ...DEFAULT_PLATFORM_LANDING_CONFIG,
        billing_payment_config: normalizeBillingPaymentConfig(null),
      };
    }

    const normalizedCustomConfig = normalizeCustomModuleConfig(data.custom_module_config);
    const resolvedBillingConfig = normalizeBillingPaymentConfig(
      data.billing_payment_config || data.custom_module_config?.billingPaymentConfig || null
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BILLING_CONFIG_LOCAL_STORAGE_KEY, JSON.stringify(resolvedBillingConfig));
      } catch {
        // Ignore storage quota errors
      }
    }

    return {
      id: 'default',
      pricing_plans:
        Array.isArray(data.pricing_plans) && data.pricing_plans.length > 0
          ? data.pricing_plans
          : DEFAULT_PLATFORM_PRICING_PLANS,
      feature_videos:
        data.feature_videos && typeof data.feature_videos === 'object'
          ? { ...DEFAULT_FEATURE_VIDEOS, ...data.feature_videos }
          : DEFAULT_FEATURE_VIDEOS,
      hero_video:
        data.hero_video && typeof data.hero_video === 'object'
          ? { ...DEFAULT_HERO_VIDEO, ...data.hero_video }
          : DEFAULT_HERO_VIDEO,
      custom_module_config: normalizedCustomConfig,
      billing_payment_config: resolvedBillingConfig,
      updated_at: data.updated_at,
      updated_by: data.updated_by,
    };
  } catch (err) {
    console.error('Error fetching platform_landing_config:', err);
    return {
      ...DEFAULT_PLATFORM_LANDING_CONFIG,
      billing_payment_config: normalizeBillingPaymentConfig(null),
    };
  }
}

/**
 * บันทึกการตั้งค่า Landing Page และ Pricing โดย Super Admin
 */
export async function updatePlatformLandingConfig(
  config: Partial<PlatformLandingConfig>,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const current = await getPlatformLandingConfig();
    const mergedBilling = normalizeBillingPaymentConfig(
      config.billing_payment_config ||
        config.custom_module_config?.billingPaymentConfig ||
        current.billing_payment_config
    );

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(BILLING_CONFIG_LOCAL_STORAGE_KEY, JSON.stringify(mergedBilling));
      } catch {
        // Ignore storage errors
      }
    }

    const customModulePayload: CustomModulePricingConfig = {
      ...(config.custom_module_config || current.custom_module_config || DEFAULT_CUSTOM_MODULE_CONFIG),
      billingPaymentConfig: mergedBilling,
    };

    const payload = {
      id: 'default',
      pricing_plans: config.pricing_plans || current.pricing_plans || DEFAULT_PLATFORM_PRICING_PLANS,
      feature_videos: config.feature_videos || current.feature_videos || DEFAULT_FEATURE_VIDEOS,
      hero_video: config.hero_video || current.hero_video || DEFAULT_HERO_VIDEO,
      custom_module_config: customModulePayload,
      updated_at: new Date().toISOString(),
      ...(userId ? { updated_by: userId } : {}),
    };

    const { error } = await supabase
      .from('platform_landing_config')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Failed to update platform_landing_config:', error);
      return { success: false, error: error.message };
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('platform-billing-config-updated', { detail: mergedBilling })
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception updating platform_landing_config:', err);
    return { success: false, error: err?.message || 'Unknown error occurred' };
  }
}

/**
 * บันทึกเฉพาะการตั้งค่าช่องทางรับชำระเงิน (PromptPay QR, บัญชีธนาคาร, และการเปิด/ปิดช่องทาง) โดย Super Admin
 */
export async function savePlatformBillingPaymentConfig(
  billingConfig: PlatformBillingPaymentConfig,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizeBillingPaymentConfig(billingConfig);
  return updatePlatformLandingConfig({ billing_payment_config: normalized }, userId);
}
