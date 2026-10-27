import React from 'react';
import { type Variants } from 'framer-motion';
import { LayoutGrid, Clapperboard, Building2, ShieldCheck } from 'lucide-react';
import {
  CustomModuleItemConfig,
  PlatformPricingPlan,
  ModuleGroupId,
} from '../../../services/landingConfigService';

export type BillingCycleType = 'MONTHLY' | 'YEARLY';
export type SummaryTabMode = 'RECEIPT' | 'SIDEBAR';
export type CategoryFilterType = 'ALL' | ModuleGroupId;

export interface BuilderCalculationResult {
  extraSeats: number;
  extraSeatsMonthly: number;
  selectedModuleItems: CustomModuleItemConfig[];
  addonModuleItems: CustomModuleItemConfig[];
  addonsMonthly: number;
  totalMonthly: number;
  totalYearly: number;
  yearlySavings: number;
  displayTotal: number;
  recommendedStandardPlan: PlatformPricingPlan | null;
}

export interface GroupMetaConfig {
  code: string;
  title: string;
  subtitle: string;
  headerBgClass: string;
  iconBgClass: string;
  activeCardClass: string;
  groupIcon: React.ElementType;
}

export interface PresetStyleConfig {
  title: string;
  tagLabel: string;
  activeTextClass: string;
  pillClass: string;
}

/**
 * Unified Spring Physics for all Tab layoutId indicators (Zero-Jitter Rulebook)
 */
export const SPRING_TAB_TRANSITION = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
};

/**
 * Strictly typed Variants for Tab Content transitions
 */
export const TAB_CONTENT_VARIANTS: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.16,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const GROUP_META: Record<ModuleGroupId, GroupMetaConfig> = {
  WORKSPACE: {
    code: 'GROUP 01 · WORKSPACE & PLANNING',
    title: 'หมวด 1: พื้นที่ทำงานและการวางแผนหลัก (Workspace)',
    subtitle: 'จัดการภาพรวมองค์กร ปฏิทินคอนเทนต์ แชทประสานงาน และเป้าหมายโปรเจกต์',
    headerBgClass: 'bg-indigo-50/90 border-indigo-200/80 text-indigo-950',
    iconBgClass: 'bg-indigo-600 text-white shadow-xs',
    activeCardClass: 'bg-indigo-50/55 border-2 border-indigo-600 shadow-sm shadow-indigo-500/10',
    groupIcon: LayoutGrid,
  },
  PRODUCTION: {
    code: 'GROUP 02 · PRODUCTION & STUDIO',
    title: 'หมวด 2: กระบวนการผลิตและออกกองถ่าย (Production)',
    subtitle: 'ระบบเขียนบทร่วมกัน ห้องประชุม สต็อกฟุตเทจ สถิติช่อง และเช็กลิสต์อุปกรณ์ออกกอง',
    headerBgClass: 'bg-rose-50/90 border-rose-200/80 text-rose-950',
    iconBgClass: 'bg-rose-600 text-white shadow-xs',
    activeCardClass: 'bg-rose-50/55 border-2 border-rose-600 shadow-sm shadow-rose-500/10',
    groupIcon: Clapperboard,
  },
  OFFICE: {
    code: 'GROUP 03 · OFFICE, HR & FINANCE',
    title: 'หมวด 3: บริหารบุคลากร ออฟฟิศ และการเงิน (Office & HR)',
    subtitle: 'ระบบลงเวลาเข้างาน ตารางเวร ภารกิจ RPG ประเมินผล KPI คู่มือ Wiki และบัญชีการเงิน',
    headerBgClass: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-950',
    iconBgClass: 'bg-emerald-600 text-white shadow-xs',
    activeCardClass: 'bg-emerald-50/55 border-2 border-emerald-600 shadow-sm shadow-emerald-500/10',
    groupIcon: Building2,
  },
  ADMIN: {
    code: 'GROUP 04 · QUALITY CONTROL & SYSTEM',
    title: 'หมวด 4: ควบคุมคุณภาพงานและตั้งค่าองค์กร (Admin & QC)',
    subtitle: 'ระบบตรวจรับงาน Quality Gate บริหารหลายแบรนด์ในเครือ และตั้งค่าข้อมูลหลัก',
    headerBgClass: 'bg-amber-50/90 border-amber-200/80 text-amber-950',
    iconBgClass: 'bg-amber-600 text-white shadow-xs',
    activeCardClass: 'bg-amber-50/55 border-2 border-amber-600 shadow-sm shadow-amber-500/10',
    groupIcon: ShieldCheck,
  },
};

export const PRESET_STYLE_META: Record<string, PresetStyleConfig> = {
  'content-planner': {
    title: 'ชุดที่ 1: Content Planning Core',
    tagLabel: 'วางแผน & ปฏิทิน',
    activeTextClass: 'text-white',
    pillClass: 'bg-indigo-50 text-indigo-700',
  },
  'production-script': {
    title: 'ชุดที่ 2: Production & Script Studio',
    tagLabel: 'เขียนบท & ออกกอง',
    activeTextClass: 'text-white',
    pillClass: 'bg-rose-50 text-rose-700',
  },
  'office-duty': {
    title: 'ชุดที่ 3: HR, Attendance & Operations',
    tagLabel: 'ลงเวลา & จัดตารางเวร',
    activeTextClass: 'text-white',
    pillClass: 'bg-emerald-50 text-emerald-700',
  },
  'gamification-qc': {
    title: 'ชุดที่ 4: Quality Gate, KPI & RPG',
    tagLabel: 'ตรวจงาน QC & วัดผล',
    activeTextClass: 'text-white',
    pillClass: 'bg-purple-50 text-purple-700',
  },
  'blank-canvas': {
    title: 'ชุดที่ 5: Base Core (เริ่มต้นจากศูนย์)',
    tagLabel: 'Custom 100%',
    activeTextClass: 'text-white',
    pillClass: 'bg-slate-100 text-slate-700',
  },
};

export const SEAT_QUICK_STEPS = [5, 10, 15, 25, 50, 100];
