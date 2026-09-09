
import React, { useMemo } from 'react';
import { Activity, CheckSquare, Flag, Tag, Calendar, CalendarDays, Type, Layers, LayoutTemplate, FileText, MapPin, Presentation, Package, AlertTriangle, Briefcase, HeartPulse, Clock, ShieldAlert, Gift, Smile, Monitor, HardDrive, BookOpen, Gamepad2, Coins, Gavel, ShieldCheck, Building2, Film, Sparkles } from 'lucide-react';
import { MasterTab } from '../../../hooks/useMasterDataView';
import { MasterOption } from '../../../types';

// Metadata Configuration
export type MasterTabGroupId = 'WORKFLOW' | 'CONTENT' | 'RESOURCES' | 'SYSTEM';

export interface MasterTabMeta {
    label: string;
    icon: any;
    desc: string;
    group: MasterTabGroupId;
}

export interface MasterTabGroupInfo {
    id: string;
    title: string;
    groupCode: MasterTabGroupId;
}

export const MASTER_TAB_GROUPS: MasterTabGroupInfo[] = [
    { id: 'workflow', title: 'Production & Workflow', groupCode: 'WORKFLOW' },
    { id: 'content', title: 'Content Metadata', groupCode: 'CONTENT' },
    { id: 'resources', title: 'Resources & HR', groupCode: 'RESOURCES' },
    { id: 'system', title: 'System Config', groupCode: 'SYSTEM' },
];

export const MASTER_META: Record<string, MasterTabMeta> = {
    // --- WORKFLOW ---
    STATUS: { label: 'Content Status', icon: Activity, desc: 'สถานะของงานวิดีโอ/คอนเทนต์ (เช่น Idea, Script, Shoot)', group: 'WORKFLOW' },
    TASK_STATUS: { label: 'Task Status', icon: CheckSquare, desc: 'สถานะของงานทั่วไป (เช่น To Do, Doing, Done)', group: 'WORKFLOW' },
    PROJECT_TYPE: { label: 'Project Type', icon: Flag, desc: 'ประเภทของโปรเจกต์ (เช่น Internal, Sponsor, Collab) ใช้แยกกลุ่มรายได้', group: 'WORKFLOW' },
    TAG_PRESET: { label: 'Tag Presets', icon: Tag, desc: 'ป้ายกำกับด่วน (เช่น #Urgent, #Rerun) ให้ทีมกดเลือกได้เลยไม่ต้องพิมพ์', group: 'WORKFLOW' },
    EVENT_TYPE: { label: 'Calendar Events', icon: Calendar, desc: 'ประเภทของ Highlight วันที่ในปฏิทิน (เช่น วันหยุด, วันออกกอง)', group: 'WORKFLOW' },
    YEARLY: { label: 'Yearly Holidays', icon: CalendarDays, desc: 'วันหยุดประจำปี (กำหนดครั้งเดียว แสดงทุกปี)', group: 'WORKFLOW' },
    CALENDAR: { label: 'Operational Calendar', icon: Calendar, desc: 'ปฏิทินปฏิบัติงาน (กำหนดวันทำงาน/วันหยุดพิเศษรายวัน)', group: 'WORKFLOW' }, // NEW
    
    // --- CONTENT ---
    FORMAT: { label: 'Formats', icon: Type, desc: 'รูปแบบของงาน (เช่น Short Form, Long Form, Post)', group: 'CONTENT' },
    PILLAR: { label: 'Pillars', icon: Layers, desc: 'แกนเนื้อหา (เช่น Education, Entertainment, Lifestyle)', group: 'CONTENT' },
    CATEGORY: { label: 'Categories', icon: LayoutTemplate, desc: 'หมวดหมู่ย่อย (เช่น Vlog, Review, Interview)', group: 'CONTENT' },
    SCRIPT_CATEGORY: { label: 'Script Categories', icon: FileText, desc: 'หมวดหมู่สคริปต์ (เช่น Vlog, Storytelling, Review)', group: 'CONTENT' },
    CONTENT_ALERT: { label: 'Content LINE Alerts', icon: Film, desc: 'ตั้งค่าระบบแจ้งเตือนคิวลงคลิปล่วงหน้าผ่าน LINE อัตโนมัติ (Pre-Release)', group: 'CONTENT' },
    SHOOT_LOCATION: { label: 'พิกัดสถานที่ถ่ายทำ', icon: MapPin, desc: 'จัดการพิกัดและรัศมี GPS ของกองถ่ายหรือสถานที่ถ่ายทำนอกสถานที่ (Onsite)', group: 'CONTENT' },
    MEETING_CATEGORY: { label: 'Meeting Topics', icon: Presentation, desc: 'หัวข้อการประชุม (เช่น General, Crisis, Project Update)', group: 'CONTENT' },

    // --- RESOURCES ---
    INVENTORY: { label: 'Equipment Categories', icon: Package, desc: 'หมวดหมู่อุปกรณ์หลักและย่อย (ใช้ในหน้า Checklist)', group: 'RESOURCES' },
    ITEM_CONDITION: { label: 'Item Condition', icon: AlertTriangle, desc: 'สภาพอุปกรณ์ (เช่น Good, Broken, Lost) ใช้แปะป้ายสถานะของ', group: 'RESOURCES' },
    POSITION: { label: 'Positions', icon: Briefcase, desc: 'ตำแหน่งงานและหน้าที่ความรับผิดชอบ (ใช้ในหน้าสมัครและหน้าทีม)', group: 'RESOURCES' },
    ATTENDANCE_RULES: { label: 'HR System Rules', icon: Clock, desc: 'บริหารกฎกติกาการเข้างาน, การลา, ขาด, สาย, และสิทธิ์พนักงานทั้งหมด', group: 'RESOURCES' },
    COMPANIES: { label: 'บริษัทในเครือ (Companies)', icon: Building2, desc: 'จัดการรายชื่อและข้อมูลบริษัทในเครือ (SaaS Multi-Company)', group: 'RESOURCES' },
    LOCATIONS: { label: 'พิกัดออฟฟิศหลัก', icon: MapPin, desc: 'จัดการพิกัดและรัศมี GPS ของสำนักงานใหญ่หรือออฟฟิศสาขาหลัก', group: 'RESOURCES' },
    REJECTION_REASON: { label: 'Reject Reasons', icon: ShieldAlert, desc: 'เหตุผลที่ส่งแก้งาน (QC) ใช้เก็บสถิติปัญหาที่พบบ่อย', group: 'RESOURCES' },

    // --- SYSTEM ---
    GAME_TUNING: { label: 'Game Balancing', icon: Gamepad2, desc: 'ปรับสมดุลเกม (XP, HP, Gold, Drop Rate)', group: 'SYSTEM' },
    REWARDS: { label: 'Rewards', icon: Gift, desc: 'ของรางวัลในร้านค้าสวัสดิการ (ใช้แลกแต้ม JP)', group: 'SYSTEM' },
    GREETINGS: { label: 'Greetings', icon: Smile, desc: 'คำอวยพร/ข้อความต้อนรับที่จะสุ่มแสดงเมื่อเปิดแอป', group: 'SYSTEM' },
    DASHBOARD: { label: 'Dashboard', icon: Monitor, desc: 'ตั้งค่าการ์ดสรุปงานในหน้า Admin Dashboard', group: 'SYSTEM' },
    MAINTENANCE: { label: 'Maintenance', icon: HardDrive, desc: 'ดูแลรักษาระบบ (Backup, Cleanup)', group: 'SYSTEM' },
    WIKI_CATEGORY: { label: 'Wiki Categories', icon: BookOpen, desc: 'หมวดหมู่ของคู่มือการทำงาน (Wiki)', group: 'SYSTEM' },
    STORAGE_HUB: { label: 'Storage Hubs', icon: HardDrive, desc: 'จัดการไดรฟ์และ Hub เก็บไฟล์ (รองรับการย้ายไดรฟ์ E: F: G: อัตโนมัติ)', group: 'SYSTEM' },
    PAYROLL_RULES: { label: 'Payroll Rules', icon: Coins, desc: 'ตั้งค่าอัตราค่าปรับ (หักเงิน) สำหรับการขาด/ลา/สาย', group: 'SYSTEM' },
    TRIBUNAL_SETTINGS: { label: 'Tribunal Settings', icon: Gavel, desc: 'ตั้งค่าระบบฟ้องร้อง (รางวัล, บทลงโทษ, หมวดหมู่)', group: 'SYSTEM' },
    SYSTEM_POLICY: { label: 'Policy Enforcer', icon: ShieldCheck, desc: 'ข้อตกลงการปฏิบัติงานและระเบียบวินัยสำหรับการใช้ระบบ', group: 'SYSTEM' },
    MENTOR_TIPS: { label: 'Mentor Tips', icon: Sparkles, desc: 'จัดการและเปิด-ปิดคำแนะนำระบบ (Mentor Tips) ในแต่ละหน้าจอ', group: 'SYSTEM' },
};

/**
 * Helper to dynamically get grouped tabs derived directly from MASTER_META
 */
export const getMasterTabGroups = () => {
    return MASTER_TAB_GROUPS.map(group => ({
        id: group.id,
        title: group.title,
        groupCode: group.groupCode,
        keys: Object.entries(MASTER_META)
            .filter(([_, meta]) => meta.group === group.groupCode)
            .map(([key]) => key)
    }));
};

export const ALL_MASTER_TAB_KEYS = Object.keys(MASTER_META);

interface MasterTabNavigationProps {
    activeTab: MasterTab;
    onTabChange: (tab: MasterTab) => void;
    masterOptions: MasterOption[];
    activeTabsConfig?: string[] | null;
}

const MasterTabNavigation: React.FC<MasterTabNavigationProps> = ({ activeTab, onTabChange, masterOptions, activeTabsConfig }) => {
    
    const activeTabs = useMemo(() => {
        if (activeTabsConfig !== undefined) return activeTabsConfig;
        const config = masterOptions.find(o => o.type === 'MASTER_DATA_CONFIG' && o.key === 'ACTIVE_TABS');
        if (!config) return null;
        try {
            return JSON.parse(config.label) as string[];
        } catch (e) {
            console.error("Failed to parse master data active tabs config", e);
            return null;
        }
    }, [masterOptions, activeTabsConfig]);

    const renderTabButton = (key: string) => {
        const meta = MASTER_META[key];
        if (!meta) return null;
        const Icon = meta.icon;
        const isActive = activeTab === key;
        
        return (
            <button 
                key={key}
                onClick={() => onTabChange(key as MasterTab)} 
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap mb-1 ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                <Icon className="w-4 h-4 mr-2" /> {meta.label}
            </button>
        );
    };

    const groupsWithFilteredKeys = useMemo(() => {
        const groups = getMasterTabGroups();
        return groups.map(group => {
            const filteredKeys = activeTabs ? group.keys.filter(k => activeTabs.includes(k)) : group.keys;
            return {
                ...group,
                keys: filteredKeys
            };
        }).filter(g => g.keys.length > 0);
    }, [activeTabs]);

    return (
        <div className="flex xl:flex-col gap-2 overflow-x-auto xl:w-64 pb-2 xl:pb-0 shrink-0">
            {groupsWithFilteredKeys.map(group => (
                <div key={group.id} className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm min-w-max">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        {group.title}
                    </div>
                    {group.keys.map(key => renderTabButton(key))}
                </div>
            ))}
        </div>
    );
};

export default MasterTabNavigation;
