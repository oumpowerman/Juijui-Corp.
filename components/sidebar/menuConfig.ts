import { 
  LayoutGrid, Calendar as CalendarIcon, Users, MessageCircle, Target, TrendingUp, 
  Coffee, ScanEye, Film, ClipboardList, BookOpen, Settings2, Database, Briefcase, 
  ShieldCheck, BarChart3, Megaphone, FileText, Presentation, Building2, Clapperboard, 
  Terminal, Clock, DollarSign, Crown, Monitor, Share2, Map 
} from 'lucide-react';
import { MenuGroup } from './types';

export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม', icon: LayoutGrid },
      { view: 'ROADMAP', label: 'แผนงาน', icon: Map },
      { view: 'CALENDAR', label: 'ปฏิทิน & บอร์ด', icon: CalendarIcon, mobileLabel: 'ปฏิทิน' }, 
      { view: 'CHAT', label: 'ห้องแชท', icon: MessageCircle, mobileLabel: 'แชททีม' },
      { view: 'TEAM', label: 'ทีมงาน', icon: Users },
      { view: 'NEXUS', label: 'Nexus Hub', icon: Share2, mobileLabel: 'Nexus' },
      { view: 'WEEKLY', label: 'ภารกิจ', icon: Target },
      { view: 'GOALS', label: 'เป้าหมาย', icon: TrendingUp }, 
    ]
  },
  {
    id: 'PRODUCTION',
    title: 'Production',
    icon: Clapperboard,
    items: [
      { view: 'SCRIPT_HUB', label: 'เขียนบท', icon: FileText },
      { view: 'MEETINGS', label: 'ห้องประชุม', icon: Presentation, mobileLabel: 'ประชุม' },
      { view: 'ContentStock', label: 'คลังคลิป', icon: Film },
      { view: 'ANALYTICS', label: 'วิเคราะห์ข้อมูล', icon: BarChart3, mobileLabel: 'วิเคราะห์' },
      { view: 'CHECKLIST', label: 'จัดเป๋า', icon: ClipboardList },
    ]
  },
  {
    id: 'OFFICE',
    title: 'Office',
    icon: Building2,
    items: [
      { view: 'ATTENDANCE', label: 'ลงเวลาทำงาน', icon: Clock, mobileLabel: 'ลงเวลา' },
      { view: 'LEADERBOARD', label: 'Hall of Fame', icon: Crown }, 
      { view: 'DUTY', label: 'ตารางเวร', icon: Coffee, mobileLabel: 'เวรวันนี้' },
      { view: 'KPI', label: 'ประเมินผล', icon: BarChart3 }, 
      { view: 'FEEDBACK', label: 'Voice of Team', icon: Megaphone, mobileLabel: 'Voice' },
      { view: 'WIKI', label: 'คู่มือ', icon: BookOpen },
      { view: 'ASSETS', label: 'ทะเบียนทรัพย์สิน', icon: Monitor, mobileLabel: 'ทรัพย์สิน' },
      { view: 'FINANCE', label: 'ระบบบัญชี', icon: DollarSign, mobileLabel: 'บัญชี' },
    ]
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { view: 'QUALITY_GATE', label: 'ห้องตรวจงาน', icon: ScanEye, mobileLabel: 'ห้องตรวจ' },
      { view: 'CHANNELS', label: 'จัดการช่องทาง', icon: Settings2, mobileLabel: 'ช่องทาง' },
      { view: 'MASTER_DATA', label: 'ตั้งค่าระบบ', icon: Database },
      { view: 'SYSTEM_GUIDE', label: 'คู่มือระบบ (Logic)', icon: Terminal, mobileLabel: 'Logic' }, 
    ]
  }
];
