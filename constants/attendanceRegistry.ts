import { LeaveType } from '../types/attendance';

export interface ApprovalBehavior {
    correctionTarget?: 'CHECKIN_ONLY' | 'CHECKOUT_ONLY' | 'BOTH' | 'NONE';
    verifyLateness?: boolean;
    updateProfileOnline?: boolean;
    refundHpOnAbsent?: boolean;
    refundHpOnCorrection?: boolean;
    refundDescriptionAbsent?: string;
    refundDescriptionPenalized?: string;
}

export interface AttendanceRegistryItem {
    id: LeaveType;
    label: string;
    category: 'LEAVE' | 'CORRECTION' | 'SPECIAL';
    colors: {
        bg: string;
        text: string;
        border: string;
        accent: string;
    };
    rules: {
        isTimeSpecific: boolean;
        isSingleDay: boolean;
        requireAttachment?: boolean;
        isProvisionalAllowed?: boolean;
        defaultTargetTime?: string;
        defaultEndTime?: string;
        forceTodayDate?: boolean;
    };
    tags: {
        provisional?: string;
        pending: string;
        approved: string;
        rejected: string;
    };
    placeholder?: string;
    reasonLabel?: string;
    approvalBehavior?: ApprovalBehavior;
}

export const ATTENDANCE_REGISTRY: Record<LeaveType, AttendanceRegistryItem> = {
    SICK: {
        id: 'SICK',
        label: 'ลาป่วย',
        category: 'LEAVE',
        colors: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        rules: { isTimeSpecific: false, isSingleDay: false, requireAttachment: true },
        tags: {
            pending: '[SICK_LEAVE_PENDING]',
            approved: '[APPROVED SICK_LEAVE]',
            rejected: '[REJECTED SICK_LEAVE]'
        },
        placeholder: 'ระบุเหตุผลการลาป่วย (เช่น เป็นไข้หวัด ตัวร้อน)...'
    },
    VACATION: {
        id: 'VACATION',
        label: 'ลาพักร้อน',
        category: 'LEAVE',
        colors: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', accent: 'bg-emerald-500' },
        rules: { isTimeSpecific: false, isSingleDay: false },
        tags: {
            pending: '[VACATION_LEAVE_PENDING]',
            approved: '[APPROVED VACATION_LEAVE]',
            rejected: '[REJECTED VACATION_LEAVE]'
        },
        placeholder: 'ระบุเหตุผลการลาพักร้อน...'
    },
    PERSONAL: {
        id: 'PERSONAL',
        label: 'ลากิจ',
        category: 'LEAVE',
        colors: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', accent: 'bg-slate-500' },
        rules: { isTimeSpecific: false, isSingleDay: false },
        tags: {
            pending: '[PERSONAL_LEAVE_PENDING]',
            approved: '[APPROVED PERSONAL_LEAVE]',
            rejected: '[REJECTED PERSONAL_LEAVE]'
        },
        placeholder: 'ระบุเหตุผลการลากิจ (เช่น ติดต่อทำธุระราชการ)...'
    },
    EMERGENCY: {
        id: 'EMERGENCY',
        label: 'ลาฉุกเฉิน',
        category: 'LEAVE',
        colors: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        rules: { isTimeSpecific: false, isSingleDay: false },
        tags: {
            pending: '[EMERGENCY_LEAVE_PENDING]',
            approved: '[APPROVED EMERGENCY_LEAVE]',
            rejected: '[REJECTED EMERGENCY_LEAVE]'
        },
        placeholder: 'ระบุรายละเอียดเหตุฉุกเฉิน...'
    },
    UNPAID: {
        id: 'UNPAID',
        label: 'ลากิจไม่รับค่าจ้าง (Unpaid Leave)',
        category: 'LEAVE',
        colors: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', accent: 'bg-slate-500' },
        rules: { isTimeSpecific: false, isSingleDay: false },
        tags: {
            pending: '[UNPAID_LEAVE_PENDING]',
            approved: '[APPROVED UNPAID_LEAVE]',
            rejected: '[REJECTED UNPAID_LEAVE]'
        },
        placeholder: 'ระบุเหตุผลลากิจไม่รับค่าจ้าง...'
    },
    LATE_ENTRY: {
        id: 'LATE_ENTRY',
        label: 'ขอเข้าสาย',
        category: 'CORRECTION',
        colors: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', accent: 'bg-violet-500' },
        rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, defaultTargetTime: '09:00', forceTodayDate: true },
        tags: {
            provisional: '[PROVISIONAL_LATE_ENTRY]',
            pending: '[LATE_ENTRY_PENDING]',
            approved: '[APPROVED LATE_ENTRY]',
            rejected: '[REJECTED LATE_ENTRY]'
        },
        placeholder: 'เช่น รถติดหนักมากที่แยก...',
        approvalBehavior: {
            correctionTarget: 'CHECKIN_ONLY',
            verifyLateness: true,
            updateProfileOnline: true,
            refundHpOnAbsent: true,
            refundHpOnCorrection: true,
            refundDescriptionAbsent: 'จากการแก้สถานะขาดงานวันที่',
            refundDescriptionPenalized: 'จากการแก้เวลาออกงานวันที่'
        }
    },
    OVERTIME: {
        id: 'OVERTIME',
        label: 'แจ้งทำงานล่วงเวลา (OT)',
        category: 'SPECIAL',
        colors: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', accent: 'bg-indigo-500' },
        rules: { isTimeSpecific: true, isSingleDay: true, defaultTargetTime: '18:30', defaultEndTime: '20:30' },
        tags: {
            pending: '[OVERTIME_PENDING]',
            approved: '[APPROVED OVERTIME]',
            rejected: '[REJECTED OVERTIME]'
        },
        placeholder: 'เช่น เร่งปิดงานลูกค้า Project A...'
    },
    FORGOT_CHECKIN: {
        id: 'FORGOT_CHECKIN',
        label: 'ลืมเช็คอิน (ลืมลงเวลาเข้างาน)',
        category: 'CORRECTION',
        colors: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, defaultTargetTime: '09:00' },
        tags: {
            provisional: '[PROVISIONAL_FORGOT_CHECKIN]',
            pending: '[FORGOT_CHECKIN_PENDING]',
            approved: '[APPROVED FORGOT_CHECKIN]',
            rejected: '[REJECTED FORGOT_CHECKIN]'
        },
        placeholder: 'กรุณาระบุรายละเอียดงานที่ทำในช่วงเวลานั้นและเหตุผลย้อนหลังโดยละเอียด เพื่อให้แอดมินตรวจสอบได้...',
        approvalBehavior: {
            correctionTarget: 'CHECKIN_ONLY',
            verifyLateness: true,
            updateProfileOnline: true,
            refundHpOnAbsent: true,
            refundHpOnCorrection: true,
            refundDescriptionAbsent: 'จากการแก้สถานะขาดงานวันที่',
            refundDescriptionPenalized: 'จากการแก้เวลาออกงานวันที่'
        }
    },
    FORGOT_CHECKOUT: {
        id: 'FORGOT_CHECKOUT',
        label: 'ลืมเช็คเอาท์ (ลืมลงเวลาออกงาน)',
        category: 'CORRECTION',
        colors: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, defaultTargetTime: '18:00' },
        tags: {
            provisional: '[PROVISIONAL_CHECKOUT]',
            pending: '[FORGOT_CHECKOUT_PENDING]',
            approved: '[APPROVED FORGOT_CHECKOUT]',
            rejected: '[REJECTED FORGOT_CHECKOUT]'
        },
        placeholder: 'กรุณาระบุรายละเอียดงานที่ทำในช่วงเวลานั้นและเหตุผลย้อนหลังโดยละเอียด เพื่อให้แอดมินตรวจสอบได้...',
        approvalBehavior: {
            correctionTarget: 'CHECKOUT_ONLY',
            verifyLateness: false,
            updateProfileOnline: true,
            refundHpOnAbsent: true,
            refundHpOnCorrection: true,
            refundDescriptionAbsent: 'จากการแก้เวลาออกงานวันที่',
            refundDescriptionPenalized: 'จากการแก้เวลาออกงานวันที่'
        }
    },
    FORGOT_BOTH: {
        id: 'FORGOT_BOTH',
        label: 'ลืมบันทึกเวลาทั้งเข้าและออก',
        category: 'CORRECTION',
        colors: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', accent: 'bg-amber-500' },
        rules: { isTimeSpecific: true, isSingleDay: true, defaultTargetTime: '09:00', defaultEndTime: '18:00' },
        tags: {
            pending: '[FORGOT_BOTH_PENDING]',
            approved: '[APPROVED FORGOT_BOTH]',
            rejected: '[REJECTED FORGOT_BOTH]'
        },
        placeholder: 'กรุณาระบุรายละเอียดงานที่ทำในช่วงเวลานั้นและเหตุผลย้อนหลังโดยละเอียด เพื่อให้แอดมินตรวจสอบได้...',
        approvalBehavior: {
            correctionTarget: 'BOTH',
            verifyLateness: false,
            updateProfileOnline: false,
            refundHpOnAbsent: true,
            refundHpOnCorrection: true,
            refundDescriptionAbsent: 'จากการแก้สถานะขาดงานวันที่',
            refundDescriptionPenalized: 'จากการแก้เวลาออกงานวันที่'
        }
    },
    WFH: {
        id: 'WFH',
        label: 'ขอทำงานที่บ้าน (WFH)',
        category: 'SPECIAL',
        colors: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', accent: 'bg-sky-500' },
        rules: { isTimeSpecific: false, isSingleDay: false, isProvisionalAllowed: true },
        tags: {
            provisional: '[PROVISIONAL_WFH]',
            pending: '[WFH_PENDING]',
            approved: '[APPROVED WFH]',
            rejected: '[REJECTED WFH]'
        },
        placeholder: 'เช่น เคลียร์งานตัดต่อที่บ้าน...',
        reasonLabel: 'รายละเอียดงานที่จะทำ (Task)'
    },
    ONSITE: {
        id: 'ONSITE',
        label: 'ทำงานนอกสถานที่ (On Site)',
        category: 'SPECIAL',
        colors: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', accent: 'bg-orange-500' },
        rules: { isTimeSpecific: false, isSingleDay: false, isProvisionalAllowed: true },
        tags: {
            provisional: '[PROVISIONAL_ONSITE]',
            pending: '[ONSITE_PENDING]',
            approved: '[APPROVED ONSITE]',
            rejected: '[REJECTED ONSITE]'
        },
        placeholder: 'ระบุเหตุผลการทำงานนอกสถานที่...',
        reasonLabel: 'รายละเอียดงานที่จะทำ (Task)'
    },
    OUT_OF_RANGE_CHECKOUT: {
        id: 'OUT_OF_RANGE_CHECKOUT',
        label: 'ลงเวลานอกพื้นที่ (Out of Range)',
        category: 'CORRECTION',
        colors: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', accent: 'bg-orange-500' },
        rules: { isTimeSpecific: true, isSingleDay: true, isProvisionalAllowed: true, requireAttachment: true, defaultTargetTime: '18:00' },
        tags: {
            provisional: '[PROVISIONAL_CHECKOUT]',
            pending: '[OUT_OF_RANGE_CHECKOUT_PENDING]',
            approved: '[APPROVED OUT_OF_RANGE_CHECKOUT]',
            rejected: '[REJECTED OUT_OF_RANGE_CHECKOUT]'
        },
        placeholder: 'กรุณาระบุพิกัดจีพีเอสที่ถูกต้อง และเหตุผลโดยละเอียดว่าทำไมถึงไม่สามารถลงเวลาในพื้นที่ที่กำหนดได้ในเวลานั้น เพื่อความรวดเร็วในการพิจารณาอนุมัติ...',
        approvalBehavior: {
            correctionTarget: 'CHECKOUT_ONLY',
            verifyLateness: false,
            updateProfileOnline: true,
            refundHpOnAbsent: true,
            refundHpOnCorrection: true,
            refundDescriptionAbsent: 'จากการแก้เวลาออกนอกพื้นที่วันที่',
            refundDescriptionPenalized: 'จากการแก้เวลาออกนอกพื้นที่วันที่'
        }
    },
    GPS_SPOOF_APPEAL: {
        id: 'GPS_SPOOF_APPEAL',
        label: 'อุทธรณ์พิกัด GPS ผิดปกติ',
        category: 'SPECIAL',
        colors: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', accent: 'bg-rose-500' },
        rules: { isTimeSpecific: false, isSingleDay: true, isProvisionalAllowed: true, requireAttachment: true },
        tags: {
            provisional: '[PROVISIONAL_GPS_SPOOF_APPEAL]',
            pending: '[GPS_SPOOF_APPEAL_PENDING]',
            approved: '[APPROVED GPS_SPOOF_APPEAL]',
            rejected: '[REJECTED GPS_SPOOF_APPEAL]'
        },
        placeholder: 'กรุณาระบุรายละเอียดข้อเท็จจริงและเหตุผลที่พิกัดผิดปกติ เพื่อให้แอดมินตรวจสอบย้อนหลัง...'
    }
};

/**
 * Returns registry item helper
 */
export const getRegistryItem = (type: string): AttendanceRegistryItem | undefined => {
    return ATTENDANCE_REGISTRY[type as LeaveType];
};

/**
 * Returns types belonging to a specific category
 */
export const getTypesByCategory = (category: 'LEAVE' | 'CORRECTION' | 'SPECIAL'): LeaveType[] => {
    return Object.values(ATTENDANCE_REGISTRY)
        .filter(item => item.category === category)
        .map(item => item.id);
};

/**
 * Checks if a string contains any of the pending tags from the registry
 */
export const findPendingRegistryItemByNote = (note?: string): AttendanceRegistryItem | undefined => {
    if (!note) return undefined;
    return Object.values(ATTENDANCE_REGISTRY).find(item => {
        if (item.tags.provisional && note.includes(item.tags.provisional)) return true;
        if (note.includes(item.tags.pending)) return true;
        return false;
    });
};

export interface WorkTypeRegistryItem {
    id: string;
    label: string;
    colors: {
        bg: string;
        text: string;
        border: string;
    };
}

export const WORK_TYPE_REGISTRY: Record<string, WorkTypeRegistryItem> = {
    OFFICE: {
        id: 'OFFICE',
        label: 'OFFICE',
        colors: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' }
    },
    WFH: {
        id: 'WFH',
        label: 'WFH',
        colors: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' }
    },
    LEAVE: {
        id: 'LEAVE',
        label: 'LEAVE',
        colors: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' }
    },
    SITE: {
        id: 'SITE',
        label: 'SITE',
        colors: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' }
    },
    ABSENT: {
        id: 'ABSENT',
        label: 'ABSENT',
        colors: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' }
    }
};

/**
 * Returns work type colors or fallback
 */
export const getWorkTypeStyles = (workType: string): { bg: string; text: string; border: string } => {
    return WORK_TYPE_REGISTRY[workType]?.colors || { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
};

