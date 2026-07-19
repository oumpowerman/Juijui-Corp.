import React from 'react';
import { format } from 'date-fns';
import { 
    Clock, Moon, Briefcase
} from 'lucide-react';
import { getRegistryItem } from '../../../../constants/attendanceRegistry';

export interface ParsedReason {
    cleanReason: string;
    isLateSubmission: boolean;
    isLocationMismatch: boolean;
    forgotCheckoutPenalty: boolean;
    time: string | null;
    otHours: string | null;
    isFixedOt: boolean;
    isProvisionalWfh: boolean;
    isProvisionalOnsite: boolean;
    isProvisionalForgotCheckin: boolean;
    isProvisionalCheckout: boolean;
    isProvisionalLate: boolean;
    proofUrl: string | null;
}

export const parseReason = (reason: string): ParsedReason => {
    let text = reason || '';

    // Extract [PROOF:url]
    const proofMatch = text.match(/\[PROOF:([^\]]+)\]/);
    let proofUrl: string | null = null;
    if (proofMatch) {
        proofUrl = proofMatch[1];
        text = text.replace(/\[PROOF:[^\]]+\]/g, '');
    }
    
    const isLateSubmission = text.includes('[LATE_SUBMISSION]');
    text = text.replace(/\[LATE_SUBMISSION\]/g, '');
    
    const isLocationMismatch = text.includes('(Location Mismatch)');
    text = text.replace(/\(Location Mismatch\)/g, '');
    
    const forgotCheckoutPenalty = text.includes('Penalized for forgotten checkout') || text.includes('forgotten checkout') || text.includes('ลืมเช็คเอาท์');
    text = text.replace(/\[SYSTEM\]\s*Penalized for forgotten checkout/g, '');
    text = text.replace(/Penalized for forgotten checkout/g, '');
    text = text.replace(/\|/g, '');

    const isFixedOt = text.includes('[OT:FIXED]');
    text = text.replace(/\[OT:FIXED\]/g, '');

    const isProvisionalWfh = text.includes('[PROVISIONAL_WFH]');
    text = text.replace(/\[PROVISIONAL_WFH\]/g, '');

    const isProvisionalOnsite = text.includes('[PROVISIONAL_ONSITE]');
    text = text.replace(/\[PROVISIONAL_ONSITE\]/g, '');

    const isProvisionalForgotCheckin = text.includes('[PROVISIONAL_FORGOT_CHECKIN]');
    text = text.replace(/\[PROVISIONAL_FORGOT_CHECKIN\]/g, '');

    const isProvisionalLate = text.includes('[PROVISIONAL_LATE_ENTRY]');
    text = text.replace(/\[PROVISIONAL_LATE_ENTRY\]/g, '');

    const isProvisionalCheckout = text.includes('[PROVISIONAL_CHECKOUT]');
    text = text.replace(/\[PROVISIONAL_CHECKOUT\]/g, '');
    
    const timeMatch = text.match(/\[TIME:(\d{2}:\d{2})\]/);
    let time: string | null = null;
    if (timeMatch) {
        time = timeMatch[1];
        text = text.replace(/\[TIME:\d{2}:\d{2}\]/g, '');
    }

    // Extract [OT:HH:MM-HH:MM]
    const otRangeMatch = text.match(/\[OT:(\d{2}:\d{2}-\d{2}:\d{2})\]/);
    if (otRangeMatch) {
        time = isFixedOt ? null : otRangeMatch[1];
    }

    // Extract OT hours: from either (Xhr) or [OT:Xhr]
    const otHoursMatch1 = text.match(/\(([\d\.]+)hr\)/);
    const otHoursMatch2 = text.match(/\[OT:([\d\.]+)hr\]/);
    let otHours: string | null = null;
    if (otHoursMatch1) {
        otHours = isFixedOt ? null : otHoursMatch1[1];
    } else if (otHoursMatch2) {
        otHours = isFixedOt ? null : otHoursMatch2[1];
    }

    // Cleanup all OT markup tags completely
    text = text.replace(/\[OT:\d{2}:\d{2}-\d{2}:\d{2}\]/g, '');
    text = text.replace(/\([\d\.]+hr\)/g, '');
    text = text.replace(/\[OT_MINUTES:\d+\]/g, '');
    text = text.replace(/\[OT:[\d\.]+hr\]/g, '');

    text = text.trim();

    // Check if the message is a system-generated generic provisional text
    const cleanLower = text.toLowerCase();
    const isGenericProvisional = 
        cleanLower === '' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional wfh)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional on-site)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional onsite)' ||
        cleanLower === 'ลงเวลาแบบจำลอง (provisional checkout)' ||
        cleanLower === 'ลงเวลาแบบจำลอง' ||
        cleanLower === 'provisional wfh' ||
        cleanLower === 'provisional on-site' ||
        cleanLower === 'provisional onsite' ||
        cleanLower === 'provisional checkout' ||
        cleanLower === 'provisional';

    if (isGenericProvisional && (isProvisionalWfh || isProvisionalOnsite || isProvisionalForgotCheckin || isProvisionalCheckout || isProvisionalLate)) {
        text = 'ลงเวลางานโดยไม่มีใบคำขออนุมัติล่วงหน้า (ระบบสร้างใบคำขอให้อัตโนมัติ)';
    }

    return {
        cleanReason: text,
        isLateSubmission,
        isLocationMismatch,
        forgotCheckoutPenalty,
        time,
        otHours,
        isFixedOt,
        isProvisionalWfh,
        isProvisionalOnsite,
        isProvisionalForgotCheckin,
        isProvisionalCheckout,
        isProvisionalLate,
        proofUrl
    };
};

export const getTypeName = (type: string) => {
    const registryItem = getRegistryItem(type);
    return registryItem ? registryItem.label : type;
};

export const getTypeColorClass = (type: string) => {
    const registryItem = getRegistryItem(type);
    return registryItem ? registryItem.colors : { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', accent: 'bg-gray-500' };
};

export const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
        PENDING: { bg: 'bg-amber-100 text-amber-800 border border-amber-200', text: 'text-amber-500', label: 'รอตรวจสอบ' },
        APPROVED: { bg: 'bg-green-100 text-green-800 border border-green-200', text: 'text-green-500', label: 'อนุมัติแล้ว' },
        REJECTED: { bg: 'bg-red-100 text-red-800 border border-red-200', text: 'text-red-500', label: 'ปฏิเสธแล้ว' }
    };
    const current = badges[status] || { bg: 'bg-gray-100 text-gray-800 border border-gray-200', text: 'text-gray-500', label: status };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${current.bg}`}>
            {current.label}
        </span>
    );
};
