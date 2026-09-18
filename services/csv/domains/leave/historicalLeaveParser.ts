import { LeaveRequest, LeaveType, RequestStatus, User } from '../../../../types';
import * as XLSX from 'xlsx';
import { parseCSVLine, readFileAsTextWithAutoEncoding } from '../../core/csvParser';
import { parseFlexibleDate } from '../../core/dateParsers';
import { findUserByName } from '../../core/entityMatchers';

/**
 * Historical Leave Parser supporting CSV, XLSX/XLS, and JSON.
 */

export interface ParsedHistoricalLeaveRow {
    raw: Record<string, any>;
    leaveRequest: Partial<LeaveRequest>;
    warnings: string[];
    isValid: boolean;
    error?: string;
}

const resolveLeaveType = (rawType: string, warnings: string[]): LeaveType => {
    const cleanType = rawType.toLowerCase();
    if (cleanType.includes('ป่วย') || cleanType.includes('sick')) return 'SICK';
    if (cleanType.includes('พักร้อน') || cleanType.includes('annual') || cleanType.includes('vacation')) return 'VACATION';
    if (cleanType.includes('ไม่รับค่าจ้าง') || cleanType.includes('unpaid')) return 'UNPAID';
    if (cleanType.includes('wfh')) return 'WFH';
    if (cleanType.includes('onsite') || cleanType.includes('site')) return 'ONSITE';
    if (cleanType.includes('กิจ') || cleanType.includes('personal') || cleanType.includes('business')) return 'PERSONAL';
    
    if (rawType) {
        warnings.push(`ประเภทการลา "${rawType}" ถูกปรับเป็น "PERSONAL"`);
    }
    return 'PERSONAL';
};

const resolveStatus = (rawStatus: string): RequestStatus => {
    const cleanStatus = rawStatus.toLowerCase();
    if (cleanStatus.includes('reject') || cleanStatus.includes('ปฏิเสธ') || cleanStatus.includes('ไม่อนุมัติ') || cleanStatus.includes('cancel') || cleanStatus.includes('ยกเลิก')) {
        return 'REJECTED';
    }
    if (cleanStatus.includes('pend') || cleanStatus.includes('รอ')) {
        return 'PENDING';
    }
    return 'APPROVED';
};

export const parseHistoricalLeaveCSV = (
    csvText: string,
    users: User[]
): ParsedHistoricalLeaveRow[] => {
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

    const findIdx = (keywords: string[]): number => {
        return headers.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
    };

    const idxName = findIdx(['name', 'ชื่อ', 'พนักงาน', 'employee', 'user']);
    const idxType = findIdx(['type', 'ประเภท', 'ชนิด']);
    const idxStartDate = findIdx(['start', 'เริ่ม', 'ตั้งแต่วันที่', 'date_start', 'from']);
    const idxEndDate = findIdx(['end', 'ถึง', 'สิ้นสุด', 'date_end', 'to']);
    const idxReason = findIdx(['reason', 'เหตุผล', 'หมายเหตุ', 'detail']);
    const idxStatus = findIdx(['status', 'สถานะ']);
    const idxFullDay = findIdx(['is_full_day', 'เต็มวัน', 'fullday', 'full_day']);
    const idxHalfPeriod = findIdx(['half_day', 'ครึ่งวัน', 'halfday', 'period']);

    const results: ParsedHistoricalLeaveRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const cells = parseCSVLine(line);
        const warnings: string[] = [];

        const rawName = idxName !== -1 ? (cells[idxName] || '').trim() : '';
        const rawType = idxType !== -1 ? (cells[idxType] || '').trim() : '';
        const rawStartDate = idxStartDate !== -1 ? (cells[idxStartDate] || '').trim() : '';
        const rawEndDate = idxEndDate !== -1 ? (cells[idxEndDate] || '').trim() : '';
        const rawReason = idxReason !== -1 ? (cells[idxReason] || '').trim() : '';
        const rawStatus = idxStatus !== -1 ? (cells[idxStatus] || '').trim() : 'approved';

        if (!rawName && !rawStartDate) continue; // Skip completely blank lines

        // Resolve user
        const matchedUser = findUserByName(rawName, users);
        if (!matchedUser) {
            warnings.push(`ไม่พบผู้ใช้งาน "${rawName}" ในระบบ`);
        }

        // Normalize Leave Type
        const leaveType = resolveLeaveType(rawType, warnings);

        const startDateStr = parseFlexibleDate(rawStartDate);
        const endDateStr = parseFlexibleDate(rawEndDate) || startDateStr;
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const endDate = endDateStr ? new Date(endDateStr) : startDate;

        let is_full_day = true;
        let half_day_period: 'morning' | 'afternoon' | undefined = undefined;

        if (idxFullDay !== -1 && cells[idxFullDay]) {
            const val = cells[idxFullDay].toLowerCase().trim();
            if (val === 'false' || val === '0' || val === 'ครึ่งวัน' || val === 'no') {
                is_full_day = false;
            }
        }

        if (idxHalfPeriod !== -1 && cells[idxHalfPeriod]) {
            const val = cells[idxHalfPeriod].toLowerCase().trim();
            if (val.includes('เช้า') || val === 'morning') {
                is_full_day = false;
                half_day_period = 'morning';
            } else if (val.includes('บ่าย') || val === 'afternoon') {
                is_full_day = false;
                half_day_period = 'afternoon';
            }
        }

        // Normalize Status
        const status = resolveStatus(rawStatus);

        const leaveRequest: Partial<LeaveRequest> & Record<string, any> = {
            userId: matchedUser?.id || '',
            user_id: matchedUser?.id || '',
            type: leaveType,
            leaveType: leaveType,
            startDate: startDate,
            endDate: endDate,
            start_date: startDateStr || '',
            end_date: endDateStr || '',
            reason: rawReason || 'ประวัติการลาเก่านำเข้าสู่ระบบ (Historical Data)',
            status: status,
            isHalfDay: !is_full_day,
            halfDaySession: half_day_period === 'morning' ? 'AM' : (half_day_period === 'afternoon' ? 'PM' : null),
            approverId: matchedUser ? 'historical_migration_admin' : undefined,
            createdAt: new Date()
        };

        const rawData: Record<string, any> = {};
        headers.forEach((h, colIdx) => {
            rawData[h] = cells[colIdx] || '';
        });

        results.push({
            raw: rawData,
            leaveRequest,
            warnings,
            isValid: Boolean(matchedUser && startDateStr),
            error: !matchedUser ? 'ไม่พบพนักงานในระบบ' : (!startDateStr ? 'รูปแบบวันที่ไม่ถูกต้อง' : undefined)
        });
    }

    return results;
};

export const parseHistoricalLeaveExcel = async (
    file: File | Blob,
    users: User[]
): Promise<ParsedHistoricalLeaveRow[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rows || rows.length < 2) return [];

    const headers = (rows[0] as any[]).map(h => String(h || '').trim().toLowerCase());

    const findIdx = (keywords: string[]): number => {
        return headers.findIndex(h => keywords.some(k => h.includes(k.toLowerCase())));
    };

    const idxName = findIdx(['name', 'ชื่อ', 'พนักงาน', 'employee', 'user']);
    const idxType = findIdx(['type', 'ประเภท', 'ชนิด']);
    const idxStartDate = findIdx(['start', 'เริ่ม', 'ตั้งแต่วันที่', 'date_start', 'from']);
    const idxEndDate = findIdx(['end', 'ถึง', 'สิ้นสุด', 'date_end', 'to']);
    const idxReason = findIdx(['reason', 'เหตุผล', 'หมายเหตุ', 'detail']);
    const idxStatus = findIdx(['status', 'สถานะ']);
    const idxFullDay = findIdx(['is_full_day', 'เต็มวัน', 'fullday', 'full_day']);
    const idxHalfPeriod = findIdx(['half_day', 'ครึ่งวัน', 'halfday', 'period']);

    const results: ParsedHistoricalLeaveRow[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const warnings: string[] = [];

        const rawName = idxName !== -1 ? String(row[idxName] || '').trim() : '';
        const rawType = idxType !== -1 ? String(row[idxType] || '').trim() : '';
        const rawStartDate = idxStartDate !== -1 ? row[idxStartDate] : '';
        const rawEndDate = idxEndDate !== -1 ? row[idxEndDate] : '';
        const rawReason = idxReason !== -1 ? String(row[idxReason] || '').trim() : '';
        const rawStatus = idxStatus !== -1 ? String(row[idxStatus] || '').trim() : 'approved';

        if (!rawName && !rawStartDate) continue;

        const matchedUser = findUserByName(rawName, users);
        if (!matchedUser) {
            warnings.push(`ไม่พบผู้ใช้งาน "${rawName}" ในระบบ`);
        }

        const leaveType = resolveLeaveType(rawType, warnings);

        const startDateStr = parseFlexibleDate(rawStartDate);
        const endDateStr = parseFlexibleDate(rawEndDate) || startDateStr;
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const endDate = endDateStr ? new Date(endDateStr) : startDate;

        let is_full_day = true;
        let half_day_period: 'morning' | 'afternoon' | undefined = undefined;

        if (idxFullDay !== -1 && row[idxFullDay] !== undefined) {
            const val = String(row[idxFullDay]).toLowerCase().trim();
            if (val === 'false' || val === '0' || val === 'ครึ่งวัน' || val === 'no') {
                is_full_day = false;
            }
        }

        if (idxHalfPeriod !== -1 && row[idxHalfPeriod] !== undefined) {
            const val = String(row[idxHalfPeriod]).toLowerCase().trim();
            if (val.includes('เช้า') || val === 'morning') {
                is_full_day = false;
                half_day_period = 'morning';
            } else if (val.includes('บ่าย') || val === 'afternoon') {
                is_full_day = false;
                half_day_period = 'afternoon';
            }
        }

        const status = resolveStatus(rawStatus);

        const leaveRequest: Partial<LeaveRequest> & Record<string, any> = {
            userId: matchedUser?.id || '',
            user_id: matchedUser?.id || '',
            type: leaveType,
            leaveType: leaveType,
            startDate: startDate,
            endDate: endDate,
            start_date: startDateStr || '',
            end_date: endDateStr || '',
            reason: rawReason || 'ประวัติการลาเก่านำเข้าสู่ระบบ (Historical Data)',
            status: status,
            isHalfDay: !is_full_day,
            halfDaySession: half_day_period === 'morning' ? 'AM' : (half_day_period === 'afternoon' ? 'PM' : null),
            approverId: matchedUser ? 'historical_migration_admin' : undefined,
            createdAt: new Date()
        };

        const rawData: Record<string, any> = {};
        headers.forEach((h, colIdx) => {
            rawData[h] = row[colIdx] !== undefined ? row[colIdx] : '';
        });

        results.push({
            raw: rawData,
            leaveRequest,
            warnings,
            isValid: Boolean(matchedUser && startDateStr),
            error: !matchedUser ? 'ไม่พบพนักงานในระบบ' : (!startDateStr ? 'รูปแบบวันที่ไม่ถูกต้อง' : undefined)
        });
    }

    return results;
};

export const parseHistoricalLeaveJSON = (
    jsonContent: any,
    users: User[]
): ParsedHistoricalLeaveRow[] => {
    const list = Array.isArray(jsonContent) ? jsonContent : (jsonContent.leaves || jsonContent.data || []);
    if (!Array.isArray(list) || list.length === 0) return [];

    const results: ParsedHistoricalLeaveRow[] = [];

    for (const item of list) {
        const warnings: string[] = [];
        const rawName = String(item.name || item.employee_name || item.user_id || item.email || item.nickname || '').trim();
        const rawType = String(item.leave_type || item.type || '').trim();
        const rawStartDate = item.start_date || item.startDate || item.start || item.date;
        const rawEndDate = item.end_date || item.endDate || item.end || rawStartDate;
        const rawReason = String(item.reason || item.detail || '').trim();
        const rawStatus = String(item.status || 'approved').trim();

        const matchedUser = findUserByName(rawName, users);
        if (!matchedUser) {
            warnings.push(`ไม่พบผู้ใช้งาน "${rawName}" ในระบบ`);
        }

        const leaveType = resolveLeaveType(rawType, warnings);

        const startDateStr = parseFlexibleDate(rawStartDate);
        const endDateStr = parseFlexibleDate(rawEndDate) || startDateStr;
        const startDate = startDateStr ? new Date(startDateStr) : new Date();
        const endDate = endDateStr ? new Date(endDateStr) : startDate;

        const is_full_day = item.is_full_day !== undefined ? Boolean(item.is_full_day) : true;
        const half_day_period = item.half_day_period === 'morning' || item.half_day_period === 'afternoon' ? item.half_day_period : undefined;

        const status = resolveStatus(rawStatus);

        const leaveRequest: Partial<LeaveRequest> & Record<string, any> = {
            userId: matchedUser?.id || '',
            user_id: matchedUser?.id || '',
            type: leaveType,
            leaveType: leaveType,
            startDate: startDate,
            endDate: endDate,
            start_date: startDateStr || '',
            end_date: endDateStr || '',
            reason: rawReason || 'ประวัติการลาเก่านำเข้าสู่ระบบ (Historical Data)',
            status: status,
            isHalfDay: !is_full_day,
            halfDaySession: half_day_period === 'morning' ? 'AM' : (half_day_period === 'afternoon' ? 'PM' : null),
            approverId: matchedUser ? 'historical_migration_admin' : undefined,
            createdAt: new Date()
        };

        results.push({
            raw: item,
            leaveRequest,
            warnings,
            isValid: Boolean(matchedUser && startDateStr),
            error: !matchedUser ? 'ไม่พบพนักงานในระบบ' : (!startDateStr ? 'รูปแบบวันที่ไม่ถูกต้อง' : undefined)
        });
    }

    return results;
};

/**
 * High-level unified dispatcher: Parses an uploaded file (.csv, .xlsx, .xls, .json) into historical leave rows.
 */
export const parseHistoricalLeaveFile = async (
    file: File,
    users: User[]
): Promise<ParsedHistoricalLeaveRow[]> => {
    const filename = file.name.toLowerCase();

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        return parseHistoricalLeaveExcel(file, users);
    }

    if (filename.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        return parseHistoricalLeaveJSON(json, users);
    }

    // Default to CSV with Auto Thai Encoding Support
    const text = await readFileAsTextWithAutoEncoding(file);
    return parseHistoricalLeaveCSV(text, users);
};
