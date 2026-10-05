import { MasterOption } from '../../../../../types/task';
import { PendingChecklistCadenceAlert } from '../../../../../hooks/company-checklist/useChecklistCadenceAlerts';

export type { MasterOption, PendingChecklistCadenceAlert };

export type ChecklistAlertSubTab = 'SCHEDULE' | 'LIVE_MONITOR' | 'ADVANCED';

export interface ChecklistAlertViewProps {
    masterOptions: MasterOption[];
    saveMasterOptionsBulk?: (options: MasterOption[]) => Promise<boolean>;
    onUpdate?: (option: MasterOption) => Promise<boolean>;
    onAdd?: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
}

export interface CycleOptionItem {
    key: string;
    label: string;
    desc: string;
}

export const CHECKLIST_CYCLE_OPTIONS: CycleOptionItem[] = [
    { key: 'DAILY', label: 'รอบประจำวัน (Daily)', desc: 'ตรวจเช็คทุกวัน หากยังไม่ได้ทำก่อนเวลาแจ้งเตือนจะแจ้งเตือนทันที' },
    { key: 'WEEKLY', label: 'รอบประจำสัปดาห์ (Weekly)', desc: 'ตรวจเช็คสัปดาห์ละครั้ง หากข้ามสัปดาห์แล้วยังไม่ทำจะแจ้งเตือน' },
    { key: 'SEMI_MONTHLY', label: 'รอบกลางเดือนและสิ้นเดือน (Semi-Monthly)', desc: 'ตรวจเช็ค 2 ครั้งต่อเดือน (1-15 และ 16-สิ้นเดือน) ไม่เหลื่อมตามวัน' },
    { key: 'MONTHLY', label: 'รอบประจำเดือน (Monthly)', desc: 'ตรวจเช็คเดือนละครั้ง หากขึ้นเดือนใหม่แล้วยังไม่ทำจะแจ้งเตือน' },
    { key: 'CUSTOM', label: 'รอบกำหนดเอง (Custom Interval)', desc: 'ตรวจเช็คตามจำนวนวันที่กำหนด (เช่น ทุก 3 วัน หรือ ทุก 14 วัน)' },
];
