import * as XLSX from 'xlsx';
import { User, MasterOption, Channel } from '../types';
import {
    parseCSVMatrix,
    findUserByName,
    findChannelByName,
    findMasterKey,
    parseFlexibleDateTime,
    parseTimeString,
    parseTimeRange,
    timeStringToMinutes,
    localDateFromYYYYMMDD,
    readFileAsTextWithAutoEncoding
} from './csvService';

export interface ParsedStockItemPreview {
    index: number;
    rawTitle: string;
    title: string;
    status: string;
    statusLabel: string;
    channelId: string | null;
    channelName: string | null;
    rawChannelName: string;
    format: string | null;
    rawFormat: string;
    pillar: string | null;
    rawPillar: string;
    category: string | null;
    rawCategory: string;
    publishDate: Date | null;
    rawPublishDate: string;
    scheduledTime: string | null;
    rawScheduledTime: string;
    isUnscheduled: boolean;
    shootDate?: Date | null;
    rawShootDate?: string;
    shootTimeStart?: string | null;
    shootTimeEnd?: string | null;
    rawShootTime?: string;
    storagePath?: string;
    idea: string;
    remark: string;
    targetPlatforms: string[];
    rawOwner: string;
    ownerIds: string[];
    ownerNames: string[];
    rawEdit: string;
    editorIds: string[];
    editorNames: string[];
    rawSub: string;
    subIds: string[];
    subNames: string[];
    isValid: boolean;
    errors: string[];
    warnings: string[];
    // Database payload ready to insert into Supabase `contents`
    payload: any;
}

export interface StockCSVValidationResult {
    fileName: string;
    totalRows: number;
    validRowsCount: number;
    warningRowsCount: number;
    errorRowsCount: number;
    hasCriticalHeaderError: boolean;
    headerErrorMessage?: string;
    items: ParsedStockItemPreview[];
}

interface RawNormalizedRecord {
    rawTitle: string;
    rawFormat: string;
    rawPillar: string;
    rawCategory: string;
    rawStatus: string;
    rawDate: any;
    rawScheduledTime: any;
    rawShootDate: any;
    rawShootTime: any;
    rawShootTimeStart: any;
    rawShootTimeEnd: any;
    rawChannel: string;
    rawOwner: string;
    rawIdea: string;
    rawEdit: string;
    rawSub: string;
    rawRemark: string;
    rawPlatform: string;
    rawStorage: string;
}

const formatRawCellDisplay = (val: any): string => {
    if (val === undefined || val === null) return '';
    if (val instanceof Date) return val.toLocaleString();
    return String(val).trim();
};

/**
 * Normalizes and validates a single content stock row into ParsedStockItemPreview
 */
const processSingleStockRecord = (
    raw: RawNormalizedRecord,
    index: number,
    users: User[],
    channels: Channel[],
    masterOptions: MasterOption[]
): ParsedStockItemPreview => {
    const {
        rawTitle,
        rawFormat,
        rawPillar,
        rawCategory,
        rawStatus,
        rawDate,
        rawScheduledTime,
        rawShootDate,
        rawShootTime,
        rawShootTimeStart,
        rawShootTimeEnd,
        rawChannel,
        rawOwner,
        rawIdea,
        rawEdit,
        rawSub,
        rawRemark,
        rawPlatform,
        rawStorage
    } = raw;

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Title (Required)
    if (!rawTitle) {
        errors.push('หัวข้อคอนเทนต์ (Content Topic) ว่างเปล่า');
    }

    // 2. Status Mapping
    let status = 'TODO';
    let statusOption = masterOptions.find(o => o.type === 'STATUS' && (o.key === 'TODO' || o.label === 'To Do'));
    if (rawStatus) {
        const mappedStatus = findMasterKey('STATUS', rawStatus.toUpperCase(), masterOptions);
        if (mappedStatus) {
            status = mappedStatus;
            statusOption = masterOptions.find(o => o.type === 'STATUS' && o.key === mappedStatus);
        } else {
            warnings.push(`สถานะ "${rawStatus}" ไม่ตรงกับในระบบ (กำหนดเป็น TODO อัตโนมัติ)`);
        }
    }
    const statusLabel = statusOption?.label || status;

    // 3. Channel Mapping with Fuzzy Matching
    let channelId: string | null = null;
    let channelName: string | null = null;
    if (rawChannel) {
        const foundChannel = findChannelByName(rawChannel, channels);
        if (foundChannel) {
            channelId = foundChannel.id;
            channelName = foundChannel.name;
        } else {
            warnings.push(`ไม่พบช่อง "${rawChannel}" ในระบบ (ปล่อยว่าง)`);
        }
    }

    // 4. Target Platforms Parsing
    const targetPlatforms: string[] = [];
    if (rawPlatform) {
        const p = rawPlatform.toLowerCase();
        if (p.includes('yt') || p.includes('youtube')) targetPlatforms.push('YOUTUBE');
        if (p.includes('fb') || p.includes('facebook')) targetPlatforms.push('FACEBOOK');
        if (p.includes('tiktok') || p.includes('tt')) targetPlatforms.push('TIKTOK');
        if (p.includes('ig') || p.includes('instagram')) targetPlatforms.push('INSTAGRAM');
    }

    // 5. Publish Date & Publish Time Parsing
    let targetDate: Date | null = null;
    let isUnscheduled = true;
    const rawDateDisplay = formatRawCellDisplay(rawDate);
    const parsedPublishDT = parseFlexibleDateTime(rawDate);

    if (rawDateDisplay) {
        if (parsedPublishDT.dateValid && parsedPublishDT.dateStr) {
            targetDate = localDateFromYYYYMMDD(parsedPublishDT.dateStr) || new Date();
            isUnscheduled = false;
        } else {
            warnings.push(`รูปแบบวันที่เผยแพร่ "${rawDateDisplay}" ไม่ถูกต้อง (ตั้งเป็น Unscheduled ในคลัง)`);
            targetDate = new Date();
            isUnscheduled = true;
        }
    } else {
        targetDate = new Date();
        isUnscheduled = true;
    }

    const rawScheduledTimeDisplay = formatRawCellDisplay(rawScheduledTime);
    let scheduledTime: string | null = null;

    if (rawScheduledTimeDisplay !== '') {
        const parsedExplicitTime = parseTimeString(rawScheduledTime);
        if (!parsedExplicitTime.isValid) {
            errors.push(parsedExplicitTime.error || `รูปแบบเวลาเผยแพร่ไม่ถูกต้อง ("${rawScheduledTimeDisplay}")`);
        } else {
            scheduledTime = parsedExplicitTime.value;
        }
    } else if (parsedPublishDT.dateValid && !parsedPublishDT.timeValid) {
        errors.push(parsedPublishDT.timeError || `รูปแบบเวลาในวันเผยแพร่ไม่ถูกต้อง ("${rawDateDisplay}")`);
    } else if (parsedPublishDT.timeValid && parsedPublishDT.timeStr) {
        scheduledTime = parsedPublishDT.timeStr;
    }

    if (isUnscheduled && scheduledTime) {
        warnings.push(`ระบุเวลาเผยแพร่ไว้ (${scheduledTime} น.) แต่ยังไม่ได้ใส่วันเผยแพร่ (คงสถานะ Unscheduled)`);
    }

    // 5.5 Shoot Date & Shoot Time Range Parsing
    let shootDateObj: Date | null = null;
    const rawShootDateDisplay = formatRawCellDisplay(rawShootDate);
    const parsedShootDT = parseFlexibleDateTime(rawShootDate);

    if (rawShootDateDisplay) {
        if (parsedShootDT.dateValid && parsedShootDT.dateStr) {
            shootDateObj = localDateFromYYYYMMDD(parsedShootDT.dateStr);
        } else {
            warnings.push(`รูปแบบวันถ่ายทำ "${rawShootDateDisplay}" ไม่ถูกต้อง (ปล่อยว่าง)`);
        }
    }

    const rawShootTimeRangeDisplay = formatRawCellDisplay(rawShootTime);
    const rawShootStartDisplay = formatRawCellDisplay(rawShootTimeStart);
    const rawShootEndDisplay = formatRawCellDisplay(rawShootTimeEnd);
    const combinedRawShootTime = [
        rawShootTimeRangeDisplay,
        rawShootStartDisplay && rawShootEndDisplay
            ? `${rawShootStartDisplay}-${rawShootEndDisplay}`
            : (rawShootStartDisplay || rawShootEndDisplay)
    ].filter(Boolean).join(' / ');

    let shootTimeStart: string | null = null;
    let shootTimeEnd: string | null = null;
    let hasShootTimeError = false;

    if (rawShootTimeRangeDisplay !== '') {
        const rangeRes = parseTimeRange(rawShootTime);
        if (!rangeRes.isValid) {
            errors.push(rangeRes.error || `ช่วงเวลาถ่ายทำไม่ถูกต้อง ("${rawShootTimeRangeDisplay}")`);
            hasShootTimeError = true;
        } else {
            shootTimeStart = rangeRes.start;
            shootTimeEnd = rangeRes.end;
        }
    }

    if (rawShootStartDisplay !== '') {
        const startRes = parseTimeString(rawShootTimeStart);
        if (!startRes.isValid) {
            errors.push(`เวลาเริ่มถ่ายทำไม่ถูกต้อง ("${rawShootStartDisplay}") กรุณาใช้รูปแบบ HH:mm`);
            hasShootTimeError = true;
        } else {
            shootTimeStart = startRes.value;
        }
    }

    if (rawShootEndDisplay !== '') {
        const endRes = parseTimeString(rawShootTimeEnd);
        if (!endRes.isValid) {
            errors.push(`เวลาเลิกถ่ายทำไม่ถูกต้อง ("${rawShootEndDisplay}") กรุณาใช้รูปแบบ HH:mm`);
            hasShootTimeError = true;
        } else {
            shootTimeEnd = endRes.value;
        }
    }

    // Fallback: time embedded in Shoot Date cell if explicit shoot time columns were omitted
    if (
        rawShootTimeRangeDisplay === '' &&
        rawShootStartDisplay === '' &&
        rawShootEndDisplay === '' &&
        rawShootDateDisplay !== ''
    ) {
        if (parsedShootDT.dateValid && !parsedShootDT.timeValid) {
            errors.push(parsedShootDT.timeError || `รูปแบบเวลาในวันถ่ายทำไม่ถูกต้อง ("${rawShootDateDisplay}")`);
            hasShootTimeError = true;
        } else if (parsedShootDT.timeValid && parsedShootDT.timeStr) {
            shootTimeStart = parsedShootDT.timeStr;
        }
    }

    if (!hasShootTimeError && shootTimeStart && shootTimeEnd) {
        if (timeStringToMinutes(shootTimeEnd) < timeStringToMinutes(shootTimeStart)) {
            errors.push(`เวลาเลิกถ่ายทำ (${shootTimeEnd}) ต้องไม่น้อยกว่าเวลาเริ่มถ่ายทำ (${shootTimeStart})`);
        }
    }

    if (!shootDateObj && (shootTimeStart || shootTimeEnd)) {
        warnings.push('ระบุช่วงเวลาถ่ายทำไว้แล้ว แต่ยังไม่ได้ใส่วันถ่ายทำ');
    }

    // 6. User Mapping (Owner, Edit, Sub) with Nickname / Thai support
    const ideaOwnerIds: string[] = [];
    const ownerNames: string[] = [];
    if (rawOwner) {
        const foundUser = findUserByName(rawOwner, users);
        if (foundUser) {
            ideaOwnerIds.push(foundUser.id);
            ownerNames.push(foundUser.name || foundUser.nickname || 'Unknown');
        } else {
            warnings.push(`ไม่พบผู้รับผิดชอบ Owner "${rawOwner}" ในระบบ`);
        }
    }

    const editorIds: string[] = [];
    const editorNames: string[] = [];
    if (rawEdit) {
        const foundUser = findUserByName(rawEdit, users);
        if (foundUser) {
            editorIds.push(foundUser.id);
            editorNames.push(foundUser.name || foundUser.nickname || 'Unknown');
        } else {
            warnings.push(`ไม่พบผู้ตัดต่อ Editor "${rawEdit}" ในระบบ`);
        }
    }

    const assigneeIds: string[] = [];
    const subNames: string[] = [];
    if (rawSub) {
        const foundUser = findUserByName(rawSub, users);
        if (foundUser) {
            assigneeIds.push(foundUser.id);
            subNames.push(foundUser.name || foundUser.nickname || 'Unknown');
        } else {
            warnings.push(`ไม่พบผู้ช่วย Sub "${rawSub}" ในระบบ`);
        }
    }

    // 7. Master Key Mapping (Format, Pillar, Category)
    const formatKey = rawFormat ? findMasterKey('FORMAT', rawFormat, masterOptions) : null;
    if (rawFormat && !formatKey) {
        warnings.push(`Format "${rawFormat}" ไม่พบใน Master Data`);
    }

    const pillarKey = rawPillar ? findMasterKey('PILLAR', rawPillar, masterOptions) : null;
    if (rawPillar && !pillarKey) {
        warnings.push(`Pillar "${rawPillar}" ไม่พบใน Master Data`);
    }

    const categoryKey = rawCategory ? findMasterKey('CATEGORY', rawCategory, masterOptions) : null;
    if (rawCategory && !categoryKey) {
        warnings.push(`Category "${rawCategory}" ไม่พบใน Master Data`);
    }

    const isValid = errors.length === 0;

    const payload: any = {
        title: rawTitle,
        description: rawIdea || '',
        status: status,
        channel_id: channelId,
        start_date: (targetDate || new Date()).toISOString(),
        end_date: (targetDate || new Date()).toISOString(),
        is_unscheduled: isUnscheduled,
        scheduled_time: scheduledTime || null,
        shoot_date: shootDateObj ? shootDateObj.toISOString() : null,
        shoot_time_start: shootTimeStart || null,
        shoot_time_end: shootTimeEnd || null,
        content_formats: formatKey ? [formatKey] : [],
        pillar: pillarKey,
        category: categoryKey,
        remark: rawRemark || '',
        target_platform: targetPlatforms,
        idea_owner_ids: ideaOwnerIds,
        editor_ids: editorIds,
        assignee_ids: assigneeIds
    };

    if (rawStorage) {
        payload.local_path = rawStorage;
    }

    return {
        index,
        rawTitle,
        title: rawTitle,
        status,
        statusLabel,
        channelId,
        channelName,
        rawChannelName: rawChannel,
        format: formatKey,
        rawFormat,
        pillar: pillarKey,
        rawPillar,
        category: categoryKey,
        rawCategory,
        publishDate: targetDate,
        rawPublishDate: rawDateDisplay,
        scheduledTime,
        rawScheduledTime: rawScheduledTimeDisplay || (parsedPublishDT.timeStr || ''),
        isUnscheduled,
        shootDate: shootDateObj,
        rawShootDate: rawShootDateDisplay,
        shootTimeStart,
        shootTimeEnd,
        rawShootTime: combinedRawShootTime || (parsedShootDT.timeStr || ''),
        storagePath: rawStorage,
        idea: rawIdea,
        remark: rawRemark,
        targetPlatforms,
        rawOwner,
        ownerIds: ideaOwnerIds,
        ownerNames,
        rawEdit,
        editorIds,
        editorNames,
        rawSub,
        subIds: assigneeIds,
        subNames,
        isValid,
        errors,
        warnings,
        payload
    };
};

/**
 * Validates and parses any content stock file: CSV, Excel (.xlsx, .xls), or JSON
 */
export const validateAndParseStockFile = async (
    file: File,
    users: User[],
    channels: Channel[],
    masterOptions: MasterOption[]
): Promise<StockCSVValidationResult> => {
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
                : (parsed.contents || parsed.items || parsed.data || []);

            if (!Array.isArray(rawList) || rawList.length === 0) {
                return {
                    fileName: file.name,
                    totalRows: 0,
                    validRowsCount: 0,
                    warningRowsCount: 0,
                    errorRowsCount: 0,
                    hasCriticalHeaderError: true,
                    headerErrorMessage: 'รูปแบบ JSON ไม่ถูกต้อง คาดหวังอาเรย์ของรายการคอนเทนต์ [ { ... }, { ... } ]',
                    items: []
                };
            }

            const items: ParsedStockItemPreview[] = [];
            let validCount = 0;
            let warningCount = 0;
            let errorCount = 0;

            for (let i = 0; i < rawList.length; i++) {
                const obj = rawList[i] || {};
                const findRawField = (keys: string[]): any => {
                    for (const k of keys) {
                        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
                    }
                    return '';
                };
                const findField = (keys: string[]): string => {
                    const val = findRawField(keys);
                    return val !== '' ? String(val).trim() : '';
                };

                const rawTitle = findField(['title', 'Content Topic', 'content topic', 'topic', 'ชื่อคอนเทนต์', 'หัวข้อ', 'ชื่อคลิป']);
                const rawFormat = findField(['format', 'Content Format', 'content format', 'รูปแบบคอนเทนต์', 'รูปแบบ']);
                const rawPillar = findField(['pillar', 'Pillar', 'เสาหลักคอนเทนต์', 'เสาหลัก']);
                const rawCategory = findField(['category', 'Category', 'หมวดหมู่', 'หมวด']);
                const rawStatus = findField(['status', 'Status', 'สถานะ', 'ขั้นตอน']);
                const rawDate = findRawField(['publishDate', 'publish_date', 'Publish Date', 'publish date', 'due_date', 'dueDate', 'Due Date', 'date', 'วันที่เผยแพร่', 'วันลงงาน']);
                const rawScheduledTime = findRawField(['publishTime', 'publish_time', 'Publish Time', 'scheduledTime', 'scheduled_time', 'Scheduled Time', 'time', 'เวลาโพสต์', 'เวลาเผยแพร่', 'เวลาลงงาน']);
                const rawShootDate = findRawField(['shootDate', 'shoot_date', 'Shoot Date', 'shoot date', 'วันถ่ายทำ', 'คิวถ่าย']);
                const rawShootTime = findRawField(['shootTime', 'shoot_time', 'Shoot Time', 'shoot time', 'เวลาถ่ายทำ', 'ช่วงเวลาถ่าย', 'เวลาถ่าย']);
                const rawShootTimeStart = findRawField(['shootTimeStart', 'shoot_time_start', 'Shoot Time Start', 'เวลาเริ่มถ่าย', 'เริ่มถ่าย']);
                const rawShootTimeEnd = findRawField(['shootTimeEnd', 'shoot_time_end', 'Shoot Time End', 'เวลาเลิกถ่าย', 'เวลาสิ้นสุดถ่าย', 'เลิกถ่าย']);
                const rawChannel = findField(['channel', 'Channel', 'Chanel', 'chanel', 'ชื่อช่อง', 'ช่อง']);
                const rawOwner = findField(['owner', 'Owner', 'ideaOwner', 'idea_owner', 'เจ้าของไอเดีย', 'ผู้รับผิดชอบ']);
                const rawIdea = findField(['idea', 'IDEA', 'description', 'บรีฟ', 'รายละเอียด', 'เนื้อหา']);
                const rawEdit = findField(['edit', 'Edit', 'editor', 'Editor', 'ผู้ตัดต่อ', 'คนตัด']);
                const rawSub = findField(['sub', 'Sub', 'assignee', 'Assignee', 'ผู้ช่วย/ซับ', 'ผู้ช่วย', 'ซับ']);
                const rawRemark = findField(['remark', 'Remark', 'Remark หมายเหตุ', 'หมายเหตุ']);
                const rawPlatform = findField(['platform', 'Post', 'post', 'Post / Platform', 'target_platform', 'targetPlatforms', 'แพลตฟอร์ม']);
                const rawStorage = findField(['storage', 'storagePath', 'storage_path', 'Storage Path', 'drive_url', 'drive', 'ที่เก็บไฟล์']);

                const item = processSingleStockRecord({
                    rawTitle,
                    rawFormat,
                    rawPillar,
                    rawCategory,
                    rawStatus,
                    rawDate,
                    rawScheduledTime,
                    rawShootDate,
                    rawShootTime,
                    rawShootTimeStart,
                    rawShootTimeEnd,
                    rawChannel,
                    rawOwner,
                    rawIdea,
                    rawEdit,
                    rawSub,
                    rawRemark,
                    rawPlatform,
                    rawStorage
                }, i + 1, users, channels, masterOptions);

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
                headerErrorMessage: 'ไม่สามารถอ่านไฟล์ JSON ได้: ' + (err.message || err),
                items: []
            };
        }
    }

    // ==========================================
    // 2. EXCEL & CSV 2D MATRIX HANDLING
    // ==========================================
    let rows: any[][] = [];

    if (ext === 'xlsx' || ext === 'xls') {
        try {
            const buffer = await file.arrayBuffer();
            // Use cellDates: false so numeric Excel date/time serials (including 0.75 = 18:00)
            // preserve exact precision without JS Date local/UTC timezone drift.
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        } catch (err: any) {
            return {
                fileName: file.name,
                totalRows: 0,
                validRowsCount: 0,
                warningRowsCount: 0,
                errorRowsCount: 0,
                hasCriticalHeaderError: true,
                headerErrorMessage: 'ไม่สามารถเปิดไฟล์ Excel ได้: ' + (err.message || err),
                items: []
            };
        }
    } else {
        // Standard CSV / Text (multiline quoted cells supported)
        try {
            const text = await readFileAsTextWithAutoEncoding(file);
            rows = parseCSVMatrix(text);
        } catch (err: any) {
            return {
                fileName: file.name,
                totalRows: 0,
                validRowsCount: 0,
                warningRowsCount: 0,
                errorRowsCount: 0,
                hasCriticalHeaderError: true,
                headerErrorMessage: 'ไม่สามารถเปิดไฟล์ CSV ได้: ' + (err.message || err),
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
            headerErrorMessage: 'ไฟล์ว่างเปล่าหรือไม่มีข้อมูลแถวเนื้อหา',
            items: []
        };
    }

    const headers = (rows[0] || []).map((h: any) => String(h || '').trim().toLowerCase());

    const findCol = (aliases: string[], excludeKeywords: string[] = []): number => {
        const isAllowed = (h: string) =>
            excludeKeywords.length === 0 || !excludeKeywords.some(ex => h.includes(ex));

        // Pass 1: exact header match (in alias priority order)
        for (const alias of aliases) {
            const exactIdx = headers.findIndex(h => h === alias && isAllowed(h));
            if (exactIdx !== -1) return exactIdx;
        }
        // Pass 2: substring match (in alias priority order)
        for (const alias of aliases) {
            const partialIdx = headers.findIndex(h => h.includes(alias) && isAllowed(h));
            if (partialIdx !== -1) return partialIdx;
        }
        return -1;
    };

    const colMap = {
        title: findCol(['content topic', 'topic', 'title', 'ชื่อคอนเทนต์', 'หัวข้อ', 'ชื่อเรื่อง', 'ชื่อคลิป']),
        format: findCol(['content format', 'format', 'รูปแบบคอนเทนต์', 'รูปแบบ']),
        pillar: findCol(['pillar', 'เสาหลักคอนเทนต์', 'เสาหลัก']),
        category: findCol(['category', 'หมวดหมู่', 'หมวด']),
        status: findCol(['status', 'สถานะ', 'ขั้นตอน']),
        date: findCol(
            ['publish date', 'publish_date', 'due date', 'due_date', 'วันที่เผยแพร่', 'วันลงงาน', 'วันโพสต์', 'กำหนดเผยแพร่', 'กำหนดส่ง', 'date'],
            ['shoot', 'ถ่าย']
        ),
        publishTime: findCol(
            ['publish time', 'publish_time', 'scheduled time', 'scheduled_time', 'เวลาโพสต์', 'เวลาเผยแพร่', 'เวลาลงงาน', 'time'],
            ['shoot', 'ถ่าย', 'start', 'end', 'เริ่ม', 'เลิก']
        ),
        shootDate: findCol(['shoot date', 'shoot_date', 'วันถ่ายทำ', 'คิวถ่าย', 'วันถ่าย']),
        shootTime: findCol(
            ['shoot time', 'shoot_time', 'เวลาถ่ายทำ', 'ช่วงเวลาถ่าย', 'เวลาถ่าย'],
            ['start', 'end', 'เริ่ม', 'เลิก', 'สิ้นสุด']
        ),
        shootTimeStart: findCol(['shoot time start', 'shoot_time_start', 'เวลาเริ่มถ่าย', 'เริ่มถ่าย']),
        shootTimeEnd: findCol(['shoot time end', 'shoot_time_end', 'เวลาเลิกถ่าย', 'เวลาสิ้นสุดถ่าย', 'เลิกถ่าย']),
        channel: findCol(['channel', 'chanel', 'ชื่อช่อง', 'ช่อง']),
        owner: findCol(['owner', 'idea owner', 'เจ้าของไอเดีย', 'ผู้รับผิดชอบ', 'คนคิด']),
        idea: findCol(['idea', 'description', 'บรีฟ', 'รายละเอียด', 'เนื้อหา']),
        edit: findCol(['edit', 'editor', 'ผู้ตัดต่อ', 'คนตัด']),
        sub: findCol(['sub', 'assignee', 'ผู้ช่วย/ซับ', 'ผู้ช่วย', 'ซับ']),
        remark: findCol(['remark', 'หมายเหตุ']),
        platform: findCol(['post / platform', 'target_platform', 'platform', 'post', 'แพลตฟอร์ม']),
        storage: findCol(['storage path', 'storage_path', 'storage', 'drive_url', 'drive', 'ที่เก็บไฟล์', 'โฟลเดอร์'])
    };

    // Header validation check
    if (colMap.title === -1) {
        return {
            fileName: file.name,
            totalRows: rows.length - 1,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: rows.length - 1,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'ไม่พบคอลัมน์ "Content Topic" หรือ "ชื่อคอนเทนต์" ในหัวตาราง กรุณาใช้ไฟล์ Template ที่ระบบจัดเตรียมไว้ให้',
            items: []
        };
    }

    const items: ParsedStockItemPreview[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (!cols || cols.length === 0) continue;

        const getRawColVal = (idx: number): any => {
            if (idx === -1 || idx >= cols.length) return '';
            const v = cols[idx];
            if (v === null || v === undefined) return '';
            return v;
        };

        const getColVal = (idx: number): string => {
            const v = getRawColVal(idx);
            if (v === '') return '';
            if (v instanceof Date) return v.toISOString();
            return String(v).trim();
        };

        // Skip completely blank rows
        const allText = cols.map((c: any) => String(c ?? '').trim()).join('');
        if (!allText) continue;

        const rawTitle = getColVal(colMap.title);
        const rawFormat = getColVal(colMap.format);
        const rawPillar = getColVal(colMap.pillar);
        const rawCategory = getColVal(colMap.category);
        const rawStatus = getColVal(colMap.status);
        const rawDate = getRawColVal(colMap.date);
        const rawScheduledTime = getRawColVal(colMap.publishTime);
        const rawShootDate = getRawColVal(colMap.shootDate);
        const rawShootTime = getRawColVal(colMap.shootTime);
        const rawShootTimeStart = getRawColVal(colMap.shootTimeStart);
        const rawShootTimeEnd = getRawColVal(colMap.shootTimeEnd);
        const rawChannel = getColVal(colMap.channel);
        const rawOwner = getColVal(colMap.owner);
        const rawIdea = getColVal(colMap.idea);
        const rawEdit = getColVal(colMap.edit);
        const rawSub = getColVal(colMap.sub);
        const rawRemark = getColVal(colMap.remark);
        const rawPlatform = getColVal(colMap.platform);
        const rawStorage = getColVal(colMap.storage);

        const item = processSingleStockRecord({
            rawTitle,
            rawFormat,
            rawPillar,
            rawCategory,
            rawStatus,
            rawDate,
            rawScheduledTime,
            rawShootDate,
            rawShootTime,
            rawShootTimeStart,
            rawShootTimeEnd,
            rawChannel,
            rawOwner,
            rawIdea,
            rawEdit,
            rawSub,
            rawRemark,
            rawPlatform,
            rawStorage
        }, i, users, channels, masterOptions);

        if (!item.isValid) {
            errorCount++;
        } else if (item.warnings.length > 0) {
            warningCount++;
        } else {
            validCount++;
        }

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
 * Backward-compatible alias for validateAndParseStockFile
 */
export const validateAndParseStockCSV = validateAndParseStockFile;
