import * as XLSX from 'xlsx';
import { User } from '../types';
import {
    parseCSVLine,
    parseTHDate,
    formatToYYYYMMDD,
    readFileAsTextWithAutoEncoding
} from './csvService';

export interface ParsedLeaveItemPreview {
    index: number;
    // Raw inputs
    rawEmail: string;
    rawLeaveType: string;
    rawStartDate: string;
    rawEndDate: string;
    rawReason: string;
    rawIsHalfDay: string;
    rawHalfDaySession: string;

    // Resolved User
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    userAvatarUrl?: string;
    userPosition?: string;

    // Resolved Leave Details
    leaveType: string;
    leaveTypeLabel: string;
    leaveTypeColor: string;

    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    startDateObj: Date | null;
    endDateObj: Date | null;

    isHalfDay: boolean;
    halfDaySession: 'AM' | 'PM' | null;
    durationDays: number;

    reason: string;
    status: string;

    isValid: boolean;
    errors: string[];
    warnings: string[];

    payload: any;
}

export interface LeaveImportValidationResult {
    fileName: string;
    totalRows: number;
    validRowsCount: number;
    warningRowsCount: number;
    errorRowsCount: number;
    totalLeaveDays: number;
    uniqueEmployeesCount: number;
    hasCriticalHeaderError: boolean;
    headerErrorMessage?: string;
    items: ParsedLeaveItemPreview[];
}

export const LEAVE_TYPE_MAP: Record<string, { key: string; label: string; color: string }> = {
    SICK: { key: 'SICK', label: 'ลาป่วย', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    VACATION: { key: 'VACATION', label: 'ลาพักร้อน/ประจำปี', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PERSONAL: { key: 'PERSONAL', label: 'ลากิจ', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    EMERGENCY: { key: 'EMERGENCY', label: 'เหตุฉุกเฉิน', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    LATE_ENTRY: { key: 'LATE_ENTRY', label: 'ขอเข้าสาย', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    ONSITE: { key: 'ONSITE', label: 'ทำงานนอกสถานที่ (Onsite)', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    WFH: { key: 'WFH', label: 'ทำงานที่บ้าน (WFH)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    UNPAID: { key: 'UNPAID', label: 'ลาไม่รับค่าจ้าง (Unpaid)', color: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export const resolveLeaveType = (rawType: string) => {
    const t = (rawType || '').trim().toUpperCase();
    if (t.includes('ป่วย') || t === 'SICK') return LEAVE_TYPE_MAP.SICK;
    if (t.includes('พักร้อน') || t.includes('ประจำปี') || t === 'VACATION') return LEAVE_TYPE_MAP.VACATION;
    if (t.includes('กิจ') || t === 'PERSONAL') return LEAVE_TYPE_MAP.PERSONAL;
    if (t.includes('ฉุกเฉิน') || t === 'EMERGENCY') return LEAVE_TYPE_MAP.EMERGENCY;
    if (t.includes('สาย') || t === 'LATE_ENTRY') return LEAVE_TYPE_MAP.LATE_ENTRY;
    if (t.includes('นอกสถานที่') || t.includes('ONSITE') || t === 'ONSITE') return LEAVE_TYPE_MAP.ONSITE;
    if (t.includes('รีโมท') || t.includes('WFH') || t.includes('บ้าน')) return LEAVE_TYPE_MAP.WFH;
    if (t.includes('ไม่รับค่าจ้าง') || t === 'UNPAID') return LEAVE_TYPE_MAP.UNPAID;

    // Default or custom fallback
    return {
        key: t || 'SICK',
        label: rawType || 'ลาป่วย',
        color: 'bg-slate-100 text-slate-700 border-slate-200'
    };
};

export const parseFlexDate = (dateVal: any): Date | null => {
    if (!dateVal) return null;
    const str = String(dateVal).trim();
    if (!str) return null;

    // Excel serial number
    if (/^\d+(\.\d+)?$/.test(str)) {
        const serial = parseFloat(str);
        const utcDays = Math.floor(serial - 25569);
        const date = new Date(utcDays * 86400 * 1000);
        if (!isNaN(date.getTime())) return date;
    }

    // Try Standard Date parsing or Thai Date parsing
    const cleanStr = str.replace(/-/g, '/');
    const parsed = parseTHDate(cleanStr);
    if (parsed && !isNaN(parsed.getTime())) return parsed;

    const directDate = new Date(str);
    if (!isNaN(directDate.getTime())) return directDate;

    return null;
};

export const calculateLeaveDays = (start: Date | null, end: Date | null, isHalfDay: boolean): number => {
    if (isHalfDay) return 0.5;
    if (!start || !end) return 1.0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1.0;
};

export const validateAndParseLeaveFile = async (
    file: File,
    allUsers: User[]
): Promise<LeaveImportValidationResult> => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        return parseLeaveJSON(file, allUsers);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return parseLeaveExcel(file, allUsers);
    } else {
        return parseLeaveCSV(file, allUsers);
    }
};

const parseLeaveCSV = async (file: File, allUsers: User[]): Promise<LeaveImportValidationResult> => {
    const text = await readFileAsTextWithAutoEncoding(file);
    const rows = text.split(/\r\n|\n/).filter(r => r.trim().length > 0);

    if (rows.length < 2) {
        return {
            fileName: file.name,
            totalRows: 0,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: 0,
            totalLeaveDays: 0,
            uniqueEmployeesCount: 0,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'ไฟล์ CSV ว่างเปล่าหรือไม่มีแถวข้อมูล',
            items: []
        };
    }

    const headerRow = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());
    const colMap = {
        email: headerRow.findIndex(h => h === 'email' || h === 'อีเมล' || h === 'username' || h === 'ชื่อผู้ใช้' || h.includes('email')),
        leaveType: headerRow.findIndex(h => h === 'leave_type' || h === 'leave type' || h === 'ประเภทการลา' || h === 'type' || h.includes('ประเภท')),
        startDate: headerRow.findIndex(h => h === 'start_date' || h === 'start date' || h === 'วันที่เริ่มต้น' || h === 'เริ่ม' || h.includes('เริ่ม')),
        endDate: headerRow.findIndex(h => h === 'end_date' || h === 'end date' || h === 'วันที่สิ้นสุด' || h === 'สิ้นสุด' || h.includes('สิ้นสุด')),
        reason: headerRow.findIndex(h => h === 'reason' || h === 'เหตุผล' || h === 'เหตุผลการลา' || h.includes('เหตุผล')),
        isHalfDay: headerRow.findIndex(h => h === 'is_half_day' || h === 'is half day' || h === 'ครึ่งวัน' || h === 'ลาครึ่งวัน'),
        halfDaySession: headerRow.findIndex(h => h === 'half_day_session' || h === 'session' || h === 'ช่วงเวลา' || h === 'am/pm')
    };

    if (colMap.email === -1 || colMap.startDate === -1) {
        return {
            fileName: file.name,
            totalRows: rows.length - 1,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: rows.length - 1,
            totalLeaveDays: 0,
            uniqueEmployeesCount: 0,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'ไม่พบคอลัมน์ "email" หรือ "start_date" ในหัวตาราง CSV กรุณาใช้ไฟล์ Template ที่ถูกต้อง',
            items: []
        };
    }

    const rawDataRows: any[][] = [];
    for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVLine(rows[i]);
        if (cols.length > 0 && cols.some(c => c.trim().length > 0)) {
            rawDataRows.push(cols);
        }
    }

    return processParsedRows(rawDataRows, colMap, file.name, allUsers);
};

const parseLeaveExcel = async (file: File, allUsers: User[]): Promise<LeaveImportValidationResult> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

                if (rows.length < 2) {
                    resolve({
                        fileName: file.name,
                        totalRows: 0,
                        validRowsCount: 0,
                        warningRowsCount: 0,
                        errorRowsCount: 0,
                        totalLeaveDays: 0,
                        uniqueEmployeesCount: 0,
                        hasCriticalHeaderError: true,
                        headerErrorMessage: 'ไฟล์ Excel ว่างเปล่าหรือไม่มีข้อมูล',
                        items: []
                    });
                    return;
                }

                const headerRow = (rows[0] as any[]).map(h => String(h || '').trim().toLowerCase());
                const colMap = {
                    email: headerRow.findIndex(h => h === 'email' || h === 'อีเมล' || h === 'username' || h === 'ชื่อผู้ใช้' || h.includes('email')),
                    leaveType: headerRow.findIndex(h => h === 'leave_type' || h === 'leave type' || h === 'ประเภทการลา' || h === 'type' || h.includes('ประเภท')),
                    startDate: headerRow.findIndex(h => h === 'start_date' || h === 'start date' || h === 'วันที่เริ่มต้น' || h === 'เริ่ม' || h.includes('เริ่ม')),
                    endDate: headerRow.findIndex(h => h === 'end_date' || h === 'end date' || h === 'วันที่สิ้นสุด' || h === 'สิ้นสุด' || h.includes('สิ้นสุด')),
                    reason: headerRow.findIndex(h => h === 'reason' || h === 'เหตุผล' || h === 'เหตุผลการลา' || h.includes('เหตุผล')),
                    isHalfDay: headerRow.findIndex(h => h === 'is_half_day' || h === 'is half day' || h === 'ครึ่งวัน' || h === 'ลาครึ่งวัน'),
                    halfDaySession: headerRow.findIndex(h => h === 'half_day_session' || h === 'session' || h === 'ช่วงเวลา' || h === 'am/pm')
                };

                if (colMap.email === -1 || colMap.startDate === -1) {
                    resolve({
                        fileName: file.name,
                        totalRows: rows.length - 1,
                        validRowsCount: 0,
                        warningRowsCount: 0,
                        errorRowsCount: rows.length - 1,
                        totalLeaveDays: 0,
                        uniqueEmployeesCount: 0,
                        hasCriticalHeaderError: true,
                        headerErrorMessage: 'ไม่พบคอลัมน์ที่จำเป็นใน Excel (email หรือ start_date)',
                        items: []
                    });
                    return;
                }

                const rawDataRows: any[][] = [];
                for (let i = 1; i < rows.length; i++) {
                    const cols = rows[i] as any[];
                    if (cols && cols.length > 0 && cols.some(c => String(c || '').trim().length > 0)) {
                        rawDataRows.push(cols);
                    }
                }

                resolve(processParsedRows(rawDataRows, colMap, file.name, allUsers));
            } catch (err: any) {
                resolve({
                    fileName: file.name,
                    totalRows: 0,
                    validRowsCount: 0,
                    warningRowsCount: 0,
                    errorRowsCount: 0,
                    totalLeaveDays: 0,
                    uniqueEmployeesCount: 0,
                    hasCriticalHeaderError: true,
                    headerErrorMessage: 'เกิดข้อผิดพลาดในการเปิดไฟล์ Excel: ' + (err.message || err),
                    items: []
                });
            }
        };
        reader.readAsArrayBuffer(file);
    });
};

const parseLeaveJSON = async (file: File, allUsers: User[]): Promise<LeaveImportValidationResult> => {
    try {
        const text = await readFileAsTextWithAutoEncoding(file);
        const list = JSON.parse(text);

        if (!Array.isArray(list) || list.length === 0) {
            return {
                fileName: file.name,
                totalRows: 0,
                validRowsCount: 0,
                warningRowsCount: 0,
                errorRowsCount: 0,
                totalLeaveDays: 0,
                uniqueEmployeesCount: 0,
                hasCriticalHeaderError: true,
                headerErrorMessage: 'รูปแบบ JSON ต้องเป็น Array ของรายการวันลา',
                items: []
            };
        }

        const rawDataRows: any[][] = [];
        list.forEach(item => {
            rawDataRows.push([
                item.email || item.username || item.name || '',
                item.leave_type || item.type || '',
                item.start_date || item.startDate || '',
                item.end_date || item.endDate || item.start_date || '',
                item.reason || '',
                item.is_half_day ?? item.isHalfDay ?? '',
                item.half_day_session || item.session || ''
            ]);
        });

        const colMap = {
            email: 0,
            leaveType: 1,
            startDate: 2,
            endDate: 3,
            reason: 4,
            isHalfDay: 5,
            halfDaySession: 6
        };

        return processParsedRows(rawDataRows, colMap, file.name, allUsers);
    } catch (err: any) {
        return {
            fileName: file.name,
            totalRows: 0,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: 0,
            totalLeaveDays: 0,
            uniqueEmployeesCount: 0,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'รูปแบบ JSON ไม่ถูกต้อง: ' + (err.message || err),
            items: []
        };
    }
};

const processParsedRows = (
    rows: any[][],
    colMap: any,
    fileName: string,
    allUsers: User[]
): LeaveImportValidationResult => {
    const items: ParsedLeaveItemPreview[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let totalLeaveDays = 0;
    const userIdsSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
        const cols = rows[i];
        const rawEmail = String(cols[colMap.email] || '').trim();
        const rawType = colMap.leaveType > -1 ? String(cols[colMap.leaveType] || '').trim() : 'SICK';
        const rawStart = colMap.startDate > -1 ? String(cols[colMap.startDate] || '').trim() : '';
        const rawEnd = colMap.endDate > -1 ? String(cols[colMap.endDate] || '').trim() : rawStart;
        const rawReason = colMap.reason > -1 ? String(cols[colMap.reason] || '').trim() : '';
        const rawIsHalfDay = colMap.isHalfDay > -1 ? String(cols[colMap.isHalfDay] || '').trim() : '';
        const rawSession = colMap.halfDaySession > -1 ? String(cols[colMap.halfDaySession] || '').trim().toUpperCase() : '';

        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Match User
        let matchedUser: User | undefined = undefined;
        if (rawEmail) {
            matchedUser = allUsers.find(u => u.email?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                          allUsers.find(u => u.name?.trim().toLowerCase() === rawEmail.toLowerCase()) ||
                          allUsers.find(u => (u as any).username?.trim().toLowerCase() === rawEmail.toLowerCase());
        }

        if (!rawEmail) {
            errors.push('ไม่มีข้อมูลอีเมลหรือชื่อพนักงาน');
        } else if (!matchedUser) {
            errors.push(`ไม่พบผู้ใช้ "${rawEmail}" ในระบบ`);
        }

        // 2. Resolve Leave Type
        const leaveTypeInfo = resolveLeaveType(rawType);

        // 3. Resolve Dates
        const startDateObj = parseFlexDate(rawStart);
        const endDateObj = parseFlexDate(rawEnd || rawStart);

        let formattedStart = '';
        let formattedEnd = '';

        if (!rawStart) {
            errors.push('ไม่มีวันที่เริ่มต้นลา (Start Date)');
        } else if (!startDateObj) {
            errors.push(`รูปแบบวันที่เริ่มต้น "${rawStart}" ไม่ถูกต้อง`);
        } else {
            formattedStart = formatToYYYYMMDD(startDateObj);
        }

        if (endDateObj) {
            formattedEnd = formatToYYYYMMDD(endDateObj);
        } else if (startDateObj) {
            formattedEnd = formattedStart;
        } else if (rawEnd) {
            errors.push(`รูปแบบวันที่สิ้นสุด "${rawEnd}" ไม่ถูกต้อง`);
        }

        // Check if endDate is before startDate
        if (startDateObj && endDateObj && endDateObj.getTime() < startDateObj.getTime()) {
            errors.push('วันที่สิ้นสุดมาก่อนวันที่เริ่มต้น');
        }

        // 4. Resolve Half-day
        const isHalfDay = rawIsHalfDay.toLowerCase() === 'true' ||
                          rawIsHalfDay === '1' ||
                          rawIsHalfDay === 'yes' ||
                          rawIsHalfDay.includes('ใช่') ||
                          rawIsHalfDay.includes('ครึ่งวัน');

        let halfDaySession: 'AM' | 'PM' | null = null;
        if (isHalfDay) {
            if (rawSession === 'AM' || rawSession.includes('เช้า')) {
                halfDaySession = 'AM';
            } else if (rawSession === 'PM' || rawSession.includes('บ่าย')) {
                halfDaySession = 'PM';
            } else {
                halfDaySession = 'AM';
                warnings.push('ไม่ระบุช่วงเวลาครึ่งวัน (ระบบตั้งเป็นรอบเช้า AM ให้อัตโนมัติ)');
            }
        }

        const durationDays = calculateLeaveDays(startDateObj, endDateObj, isHalfDay);

        const reason = rawReason
            ? `[MIGRATED] ประวัติการลาย้อนหลัง: ${rawReason}`
            : '[MIGRATED] ประวัติการลาย้อนหลัง (นำเข้าจากไฟล์)';

        const isValid = errors.length === 0;

        if (isValid) {
            if (warnings.length > 0) {
                warningCount++;
            } else {
                validCount++;
            }
            totalLeaveDays += durationDays;
            if (matchedUser) {
                userIdsSet.add(matchedUser.id);
            }
        } else {
            errorCount++;
        }

        const payload = {
            user_id: matchedUser ? matchedUser.id : null,
            type: leaveTypeInfo.key,
            start_date: formattedStart,
            end_date: formattedEnd || formattedStart,
            reason: reason,
            status: 'APPROVED',
            is_half_day: isHalfDay,
            half_day_session: halfDaySession,
            created_at: new Date().toISOString()
        };

        items.push({
            index: i + 1,
            rawEmail,
            rawLeaveType: rawType,
            rawStartDate: rawStart,
            rawEndDate: rawEnd,
            rawReason,
            rawIsHalfDay,
            rawHalfDaySession: rawSession,
            userId: matchedUser ? matchedUser.id : null,
            userName: matchedUser ? matchedUser.name : null,
            userEmail: matchedUser ? matchedUser.email : null,
            userAvatarUrl: matchedUser ? matchedUser.avatarUrl : undefined,
            userPosition: matchedUser ? matchedUser.position : undefined,
            leaveType: leaveTypeInfo.key,
            leaveTypeLabel: leaveTypeInfo.label,
            leaveTypeColor: leaveTypeInfo.color,
            startDate: formattedStart,
            endDate: formattedEnd || formattedStart,
            startDateObj,
            endDateObj,
            isHalfDay,
            halfDaySession,
            durationDays,
            reason,
            status: 'APPROVED',
            isValid,
            errors,
            warnings,
            payload
        });
    }

    // Secondary pass: Detect overlapping leaves for same employee
    for (let j = 0; j < items.length; j++) {
        const itemA = items[j];
        if (!itemA.isValid || !itemA.userId || !itemA.startDateObj || !itemA.endDateObj) continue;

        for (let k = j + 1; k < items.length; k++) {
            const itemB = items[k];
            if (!itemB.isValid || !itemB.userId || !itemB.startDateObj || !itemB.endDateObj) continue;

            if (itemA.userId === itemB.userId) {
                // Check if dates overlap
                const overlap = (itemA.startDateObj.getTime() <= itemB.endDateObj.getTime()) &&
                                (itemA.endDateObj.getTime() >= itemB.startDateObj.getTime());
                if (overlap) {
                    const warnMsg = `ช่วงวันที่ลาทับซ้อนกับแถวที่ #${itemB.index} (${itemB.startDate} ถึง ${itemB.endDate})`;
                    if (!itemA.warnings.includes(warnMsg)) itemA.warnings.push(warnMsg);
                    const warnMsgB = `ช่วงวันที่ลาทับซ้อนกับแถวที่ #${itemA.index} (${itemA.startDate} ถึง ${itemA.endDate})`;
                    if (!itemB.warnings.includes(warnMsgB)) itemB.warnings.push(warnMsgB);
                }
            }
        }
    }

    return {
        fileName,
        totalRows: items.length,
        validRowsCount: validCount,
        warningRowsCount: warningCount,
        errorRowsCount: errorCount,
        totalLeaveDays,
        uniqueEmployeesCount: userIdsSet.size,
        hasCriticalHeaderError: false,
        items
    };
};
