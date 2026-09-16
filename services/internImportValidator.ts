import * as XLSX from 'xlsx';
import { InternCandidate, InternStatus, Gender } from '../types';
import {
    parseCSVLine,
    readFileAsTextWithAutoEncoding
} from './csvService';
import { internMappingService } from './internMappingService';

export interface ParsedInternItemPreview {
    index: number;
    // Raw inputs
    rawName: string;
    rawNickname: string;
    rawGender: string;
    rawPosition: string;
    rawUniversity: string;
    rawFaculty: string;
    rawYear: string;
    rawPeriod: string;
    rawPhone: string;
    rawEmail: string;
    rawPortfolio: string;
    rawStatus: string;
    rawNotes: string;
    rawSource: string;

    // Resolved values
    fullName: string;
    nickname: string;
    gender: Gender;
    position: string;
    university: string;
    faculty: string;
    academicYear: string;
    startDate: Date;
    endDate: Date;
    startDateStr: string; // YYYY-MM-DD
    endDateStr: string;   // YYYY-MM-DD
    durationDays: number;
    phoneNumber: string;
    email: string;
    portfolioUrl: string;
    status: InternStatus;
    notes: string;
    source: string;

    // Validation
    isValid: boolean;
    errors: string[];
    warnings: string[];

    payload: Partial<InternCandidate>;
}

export interface InternImportValidationResult {
    fileName: string;
    totalRows: number;
    validRowsCount: number;
    warningRowsCount: number;
    errorRowsCount: number;
    hasCriticalHeaderError: boolean;
    headerErrorMessage?: string;
    items: ParsedInternItemPreview[];
}

export const INTERN_STATUS_META: Record<InternStatus, { label: string; color: string; desc: string }> = {
    APPLIED: {
        label: 'รอตรวจสอบ / สมัคร',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        desc: 'เพิ่งส่งใบสมัครเข้ามา'
    },
    INTERVIEW_SCHEDULED: {
        label: 'นัดสัมภาษณ์แล้ว',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        desc: 'กำหนดวันสัมภาษณ์เรียบร้อย'
    },
    INTERVIEWED: {
        label: 'สัมภาษณ์แล้ว',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        desc: 'สัมภาษณ์เสร็จสิ้น รอผล'
    },
    ACCEPTED: {
        label: 'ผ่านการคัดเลือก',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        desc: 'รับเข้าฝึกงานเรียบร้อย'
    },
    REJECTED: {
        label: 'ไม่ผ่าน / สละสิทธิ์',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        desc: 'ปฏิเสธหรือสละสิทธิ์'
    },
    ARCHIVED: {
        label: 'จัดเก็บประวัติ',
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        desc: 'เก็บเข้าคลังประวัติ'
    }
};

export const GENDER_META: Record<Gender, { label: string; color: string }> = {
    MALE: { label: 'ชาย (Boy)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    FEMALE: { label: 'หญิง (Girl)', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    OTHER: { label: 'อื่นๆ (Other)', color: 'bg-purple-50 text-purple-700 border-purple-200' }
};

/**
 * Format Date to YYYY-MM-DD
 */
export const formatDateKey = (date: Date): string => {
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Parses raw period string (e.g., "23/03 - 05/06", "23/03/2026 - 05/06/2026", "23/03 ถึง 05/06")
 */
export const parsePeriodDates = (
    periodStr: string,
    baseYear: number = new Date().getFullYear()
): { startDate: Date; endDate: Date; isValid: boolean; error?: string } => {
    if (!periodStr || !periodStr.trim()) {
        const today = new Date();
        const future = new Date(today);
        future.setMonth(today.getMonth() + 3);
        return { startDate: today, endDate: future, isValid: false, error: 'ไม่ได้ระบุระยะเวลาฝึกงาน' };
    }

    try {
        const separators = /[-–—]|ถึง|to/i;
        const parts = periodStr.split(separators).map(p => p.trim()).filter(Boolean);

        if (parts.length < 2) {
            const today = new Date();
            return { startDate: today, endDate: today, isValid: false, error: 'รูปแบบช่วงเวลาไม่ถูกต้อง (เช่น 01/06 - 31/08)' };
        }

        const parseDateSegment = (segment: string): Date | null => {
            const clean = segment.replace(/-/g, '/');
            const pieces = clean.split('/').map(p => parseInt(p.trim(), 10));
            if (pieces.length < 2 || isNaN(pieces[0]) || isNaN(pieces[1])) return null;

            const day = pieces[0];
            const month = pieces[1] - 1;
            let year = pieces[2] || baseYear;
            if (year > 2400) year -= 543; // Buddhist Era conversion

            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
        };

        const start = parseDateSegment(parts[0]);
        let end = parseDateSegment(parts[1]);

        if (!start || !end) {
            return {
                startDate: new Date(),
                endDate: new Date(),
                isValid: false,
                error: 'ไม่สามารถแปลงวันที่ได้ ตรวจสอบวัน/เดือน/ปี'
            };
        }

        // Handle year rollover (e.g. 15/12 - 15/02 without year)
        if (end < start && parts[1].split('/').length < 3) {
            end.setFullYear(start.getFullYear() + 1);
        }

        if (end < start) {
            return {
                startDate: start,
                endDate: end,
                isValid: false,
                error: 'วันสิ้นสุดการฝึกงานมาก่อนวันเริ่มต้น'
            };
        }

        return { startDate: start, endDate: end, isValid: true };
    } catch {
        return {
            startDate: new Date(),
            endDate: new Date(),
            isValid: false,
            error: 'เกิดข้อผิดพลาดในการคำนวณช่วงเวลา'
        };
    }
};

/**
 * Process a single intern candidate record with validation
 */
export const processSingleInternRecord = (
    raw: {
        rawName: string;
        rawNickname?: string;
        rawGender?: string;
        rawPosition?: string;
        rawUniversity?: string;
        rawFaculty?: string;
        rawYear?: string;
        rawPeriod?: string;
        rawPhone?: string;
        rawEmail?: string;
        rawPortfolio?: string;
        rawStatus?: string;
        rawNotes?: string;
        rawSource?: string;
    },
    index: number,
    baseYear: number = new Date().getFullYear()
): ParsedInternItemPreview => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Name validation (Required)
    const fullName = (raw.rawName || '').trim();
    if (!fullName) {
        errors.push('จำเป็นต้องระบุชื่อ-นามสกุลของผู้สมัคร');
    }

    // 2. Nickname
    const nickname = (raw.rawNickname || '').trim();

    // 3. Gender mapping
    const rawGender = (raw.rawGender || '').trim();
    let gender: Gender = 'OTHER';
    if (rawGender) {
        const gLow = rawGender.toLowerCase();
        if (gLow.includes('ชาย') || gLow === 'boy' || gLow === 'male' || gLow === 'm') {
            gender = 'MALE';
        } else if (gLow.includes('หญิง') || gLow === 'girl' || gLow === 'female' || gLow === 'f') {
            gender = 'FEMALE';
        } else {
            gender = 'OTHER';
        }
    } else {
        warnings.push('ไม่ได้ระบุเพศ (กำหนดเป็น "อื่นๆ" ให้อัตโนมัติ)');
    }

    // 4. Position
    const position = (raw.rawPosition || '').trim().toUpperCase() || 'GENERAL INTERN';
    if (!raw.rawPosition || !raw.rawPosition.trim()) {
        warnings.push('ไม่ได้ระบุตำแหน่ง (ตั้งเป็น GENERAL INTERN)');
    }

    // 5. University & Faculty & Year
    const university = (raw.rawUniversity || '').trim() || '-';
    const faculty = (raw.rawFaculty || '').trim() || '';
    const academicYear = (raw.rawYear || '').trim() || '';
    if (university === '-') {
        warnings.push('ไม่ได้ระบุมหาวิทยาลัย');
    }

    // 6. Period parsing
    const rawPeriod = (raw.rawPeriod || '').trim();
    const periodResult = parsePeriodDates(rawPeriod, baseYear);
    if (!periodResult.isValid) {
        if (rawPeriod) {
            errors.push(periodResult.error || 'ช่วงเวลาฝึกงานไม่ถูกต้อง');
        } else {
            warnings.push('ไม่ได้ระบุระยะเวลาฝึกงาน (ใช้วันที่ปัจจุบันเป็นค่าเริ่มต้น)');
        }
    }

    const startDate = periodResult.startDate;
    const endDate = periodResult.endDate;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 7. Contact info
    const rawPhone = (raw.rawPhone || '').trim();
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    let phoneNumber = rawPhone;
    if (rawPhone && cleanPhone.length < 9) {
        warnings.push(`เบอร์โทรศัพท์ "${rawPhone}" อาจไม่ครบถ้วน`);
    }

    const email = (raw.rawEmail || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        warnings.push(`อีเมล "${email}" รูปแบบไม่ถูกต้องตามมาตรฐาน`);
    }

    // 8. Status mapping
    const rawStatus = (raw.rawStatus || '').trim();
    let status: InternStatus = 'APPLIED';
    if (rawStatus) {
        status = internMappingService.mapStatus(rawStatus);
    }

    // 9. Portfolio & Links
    const portfolioUrl = (raw.rawPortfolio || '').trim();
    const notes = (raw.rawNotes || '').trim();
    const source = (raw.rawSource || '').trim();

    const isValid = errors.length === 0;

    const payload: Partial<InternCandidate> = {
        fullName,
        nickname: nickname || undefined,
        gender,
        position,
        university,
        faculty: faculty || undefined,
        academicYear: academicYear || undefined,
        phoneNumber,
        email,
        portfolioUrl,
        startDate,
        endDate,
        durationDays,
        status,
        notes,
        source: source || undefined,
        createdAt: new Date(),
        avatarUrl: ''
    };

    return {
        index,
        rawName: raw.rawName || '',
        rawNickname: raw.rawNickname || '',
        rawGender: raw.rawGender || '',
        rawPosition: raw.rawPosition || '',
        rawUniversity: raw.rawUniversity || '',
        rawFaculty: raw.rawFaculty || '',
        rawYear: raw.rawYear || '',
        rawPeriod: raw.rawPeriod || '',
        rawPhone: raw.rawPhone || '',
        rawEmail: raw.rawEmail || '',
        rawPortfolio: raw.rawPortfolio || '',
        rawStatus: raw.rawStatus || '',
        rawNotes: raw.rawNotes || '',
        rawSource: raw.rawSource || '',

        fullName,
        nickname,
        gender,
        position,
        university,
        faculty,
        academicYear,
        startDate,
        endDate,
        startDateStr: formatDateKey(startDate),
        endDateStr: formatDateKey(endDate),
        durationDays,
        phoneNumber,
        email,
        portfolioUrl,
        status,
        notes,
        source,

        isValid,
        errors,
        warnings,
        payload
    };
};

/**
 * Validates and parses any intern file: CSV, Excel (.xlsx, .xls), or JSON
 */
export const validateAndParseInternFile = async (
    file: File,
    baseYear: number = new Date().getFullYear()
): Promise<InternImportValidationResult> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // ==========================================
    // 1. JSON FILE HANDLING
    // ==========================================
    if (ext === 'json') {
        try {
            const text = await readFileAsTextWithAutoEncoding(file);
            const parsed = JSON.parse(text);
            const rawList: any[] = Array.isArray(parsed)
                ? parsed
                : (parsed.interns || parsed.candidates || parsed.items || parsed.data || []);

            if (!Array.isArray(rawList) || rawList.length === 0) {
                return {
                    fileName: file.name,
                    totalRows: 0,
                    validRowsCount: 0,
                    warningRowsCount: 0,
                    errorRowsCount: 0,
                    hasCriticalHeaderError: true,
                    headerErrorMessage: 'รูปแบบ JSON ไม่ถูกต้อง คาดหวังอาเรย์ของรายชื่อเด็กฝึกงาน [ { ... }, { ... } ]',
                    items: []
                };
            }

            const items: ParsedInternItemPreview[] = [];
            let validCount = 0;
            let warningCount = 0;
            let errorCount = 0;

            for (let i = 0; i < rawList.length; i++) {
                const obj = rawList[i] || {};
                const findField = (keys: string[]): string => {
                    for (const k of keys) {
                        if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]).trim();
                    }
                    return '';
                };

                const rawName = findField(['fullName', 'fullname', 'name', 'ชื่อ', 'ชื่อ-นามสกุล', 'Name', 'Full Name']);
                const rawNickname = findField(['nickname', 'Nickname', 'ชื่อเล่น']);
                const rawGender = findField(['gender', 'Gender', 'เพศ', 'gen', 'Gen']);
                const rawPosition = findField(['position', 'Position', 'ตำแหน่ง', 'role', 'Role', 'job', 'Job']);
                const rawUniversity = findField(['university', 'University', 'มหาวิทยาลัย', 'มหาลัย']);
                const rawFaculty = findField(['faculty', 'Faculty', 'คณะ']);
                const rawYear = findField(['academicYear', 'year', 'Year', 'ชั้นปี', 'ปี']);
                const rawPeriod = findField(['period', 'Period', 'ระยะเวลาฝึกงาน', 'ช่วงเวลาฝึกงาน', 'ช่วงเวลา']);
                const rawPhone = findField(['phoneNumber', 'phone', 'Phone', 'Tel', 'tel', 'เบอร์โทร', 'เบอร์โทรศัพท์']);
                const rawEmail = findField(['email', 'Email', 'อีเมล', 'mail', 'Mail']);
                const rawPortfolio = findField(['portfolioUrl', 'portfolio', 'Portfolio', 'พอร์ต']);
                const rawStatus = findField(['status', 'Status', 'สถานะ']);
                const rawNotes = findField(['notes', 'Notes', 'note', 'Note', 'หมายเหตุ']);
                const rawSource = findField(['source', 'Source', 'ช่องทาง', 'มาจาก']);

                const item = processSingleInternRecord({
                    rawName,
                    rawNickname,
                    rawGender,
                    rawPosition,
                    rawUniversity,
                    rawFaculty,
                    rawYear,
                    rawPeriod,
                    rawPhone,
                    rawEmail,
                    rawPortfolio,
                    rawStatus,
                    rawNotes,
                    rawSource
                }, i + 1, baseYear);

                if (!item.isValid) errorCount++;
                else if (item.warnings.length > 0) warningCount++;
                else validCount++;

                items.push(item);
            }

            return {
                fileName: file.name,
                totalRows: items.length,
                validRowsCount: validCount,
                warningRowsCount: warningCount,
                errorRowsCount: errorCount,
                hasCriticalHeaderError: false,
                items
            };
        } catch (err: any) {
            return {
                fileName: file.name,
                totalRows: 0,
                validRowsCount: 0,
                warningRowsCount: 0,
                errorRowsCount: 0,
                hasCriticalHeaderError: true,
                headerErrorMessage: 'ไม่สามารถอ่านโครงสร้างไฟล์ JSON ได้: ' + (err.message || 'Syntax Error'),
                items: []
            };
        }
    }

    // ==========================================
    // 2. EXCEL & CSV FILE HANDLING
    // ==========================================
    let rows: any[][] = [];

    if (ext === 'xlsx' || ext === 'xls') {
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                return {
                    fileName: file.name,
                    totalRows: 0,
                    validRowsCount: 0,
                    warningRowsCount: 0,
                    errorRowsCount: 0,
                    hasCriticalHeaderError: true,
                    headerErrorMessage: 'ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel ที่เลือก',
                    items: []
                };
            }
            const worksheet = workbook.Sheets[firstSheetName];
            rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        } catch (err: any) {
            return {
                fileName: file.name,
                totalRows: 0,
                validRowsCount: 0,
                warningRowsCount: 0,
                errorRowsCount: 0,
                hasCriticalHeaderError: true,
                headerErrorMessage: 'ล้มเหลวในการอ่านไฟล์ Excel: ' + (err.message || 'File corrupted'),
                items: []
            };
        }
    } else {
        // CSV file handling
        try {
            const text = await readFileAsTextWithAutoEncoding(file);
            const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
            rows = lines.map(line => parseCSVLine(line));
        } catch (err: any) {
            return {
                fileName: file.name,
                totalRows: 0,
                validRowsCount: 0,
                warningRowsCount: 0,
                errorRowsCount: 0,
                hasCriticalHeaderError: true,
                headerErrorMessage: 'ล้มเหลวในการอ่านไฟล์ CSV: ' + (err.message || 'Encoding Error'),
                items: []
            };
        }
    }

    if (rows.length < 2) {
        return {
            fileName: file.name,
            totalRows: 0,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: 0,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'ไฟล์ว่างเปล่าหรือไม่มีแถวข้อมูลสำหรับนำเข้า',
            items: []
        };
    }

    // Header normalization and mapping
    const rawHeaders = (rows[0] || []).map((h: any) => String(h || '').trim());
    const normHeaders = rawHeaders.map(h => internMappingService.normalizeKey(h));

    const findHeaderIndex = (keywords: string[]): number => {
        const normalizedKeywords = keywords.map(k => internMappingService.normalizeKey(k));
        for (const kw of normalizedKeywords) {
            if (!kw) continue;
            const idx = normHeaders.findIndex(h => h.includes(kw) || kw.includes(h));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const colMap = {
        name: findHeaderIndex(['Name', 'ชื่อ', 'Fullname', 'ชื่อ-นามสกุล']),
        nickname: findHeaderIndex(['Nickname', 'ชื่อเล่น']),
        gender: findHeaderIndex(['Gen', 'Gender', 'เพศ']),
        position: findHeaderIndex(['ตำแหน่ง', 'Position', 'Job', 'Role']),
        university: findHeaderIndex(['University', 'มหาลัย', 'มหาวิทยาลัย']),
        faculty: findHeaderIndex(['Faculty', 'คณะ']),
        year: findHeaderIndex(['ปี', 'Year', 'ชั้นปี']),
        period: findHeaderIndex(['ระยะฝึกงาน (ช่วง)', 'Period', 'ช่วงเวลา', 'Duration']),
        phone: findHeaderIndex(['Tel', 'Phone', 'เบอร์', 'โทร']),
        email: findHeaderIndex(['Mail', 'Email', 'อีเมล']),
        portfolio: findHeaderIndex(['Portfolio', 'พอร์ต', 'link']),
        status: findHeaderIndex(['สถานะ', 'Status']),
        notes: findHeaderIndex(['หมายเหตุ', 'Note', 'Remark']),
        source: findHeaderIndex(['มาจาก', 'Source', 'ช่องทาง'])
    };

    // Critical Header Error check: Name is mandatory
    if (colMap.name === -1) {
        return {
            fileName: file.name,
            totalRows: rows.length - 1,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: rows.length - 1,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'ไม่พบคอลัมน์ "ชื่อ-นามสกุล" หรือ "Name" ในหัวตาราง กรุณาใช้ไฟล์ Template ที่ระบบจัดเตรียมไว้ให้',
            items: []
        };
    }

    const items: ParsedInternItemPreview[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length === 0) continue;

        const getColVal = (idx: number): string => {
            if (idx === -1 || idx >= cols.length) return '';
            const v = cols[idx];
            if (v === null || v === undefined) return '';
            if (v instanceof Date) return v.toISOString().split('T')[0];
            return String(v).trim();
        };

        const rawName = getColVal(colMap.name);
        // Skip completely blank rows where all columns are empty
        const allText = cols.map((c: any) => String(c || '').trim()).join('');
        if (!allText) continue;

        const rawNickname = getColVal(colMap.nickname);
        const rawGender = getColVal(colMap.gender);
        const rawPosition = getColVal(colMap.position);
        const rawUniversity = getColVal(colMap.university);
        const rawFaculty = getColVal(colMap.faculty);
        const rawYear = getColVal(colMap.year);
        const rawPeriod = getColVal(colMap.period);
        const rawPhone = getColVal(colMap.phone);
        const rawEmail = getColVal(colMap.email);
        const rawPortfolio = getColVal(colMap.portfolio);
        const rawStatus = getColVal(colMap.status);
        const rawNotes = getColVal(colMap.notes);
        const rawSource = getColVal(colMap.source);

        const item = processSingleInternRecord({
            rawName,
            rawNickname,
            rawGender,
            rawPosition,
            rawUniversity,
            rawFaculty,
            rawYear,
            rawPeriod,
            rawPhone,
            rawEmail,
            rawPortfolio,
            rawStatus,
            rawNotes,
            rawSource
        }, i, baseYear);

        if (!item.isValid) errorCount++;
        else if (item.warnings.length > 0) warningCount++;
        else validCount++;

        items.push(item);
    }

    return {
        fileName: file.name,
        totalRows: items.length,
        validRowsCount: validCount,
        warningRowsCount: warningCount,
        errorRowsCount: errorCount,
        hasCriticalHeaderError: false,
        items
    };
};

/**
 * Builds an InternImportValidationResult from an array of Partial<InternCandidate> (e.g. from AI extraction)
 */
export const buildValidationResultFromCandidates = (
    candidates: Partial<InternCandidate>[],
    sourceName: string = 'AI Smart Ingestion',
    baseYear: number = new Date().getFullYear()
): InternImportValidationResult => {
    const items: ParsedInternItemPreview[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const periodStr = c.startDate && c.endDate
            ? `${typeof c.startDate === 'string' ? c.startDate : new Date(c.startDate).toISOString().split('T')[0]} - ${typeof c.endDate === 'string' ? c.endDate : new Date(c.endDate).toISOString().split('T')[0]}`
            : '';

        const item = processSingleInternRecord({
            rawName: c.fullName || '',
            rawNickname: c.nickname || '',
            rawGender: c.gender || 'OTHER',
            rawPosition: c.position || '',
            rawUniversity: c.university || '',
            rawFaculty: c.faculty || '',
            rawYear: c.academicYear || '',
            rawPeriod: periodStr,
            rawPhone: c.phoneNumber || '',
            rawEmail: c.email || '',
            rawPortfolio: c.portfolioUrl || '',
            rawStatus: c.status || 'APPLIED',
            rawNotes: c.notes || '',
            rawSource: c.source || 'AI Ingestion'
        }, i + 1, baseYear);

        if (!item.isValid) errorCount++;
        else if (item.warnings.length > 0) warningCount++;
        else validCount++;

        items.push(item);
    }

    return {
        fileName: sourceName,
        totalRows: items.length,
        validRowsCount: validCount,
        warningRowsCount: warningCount,
        errorRowsCount: errorCount,
        hasCriticalHeaderError: false,
        items
    };
};

