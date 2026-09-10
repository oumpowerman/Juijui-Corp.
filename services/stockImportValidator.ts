import * as XLSX from 'xlsx';
import { User, MasterOption, Channel } from '../types';
import { 
    parseCSVLine, 
    findUserByName, 
    findChannelByName, 
    findMasterKey, 
    parseFlexibleDate, 
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
    isUnscheduled: boolean;
    shootDate?: Date | null;
    rawShootDate?: string;
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
    rawDate: string;
    rawShootDate: string;
    rawChannel: string;
    rawOwner: string;
    rawIdea: string;
    rawEdit: string;
    rawSub: string;
    rawRemark: string;
    rawPlatform: string;
    rawStorage: string;
}

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
        rawShootDate,
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

    // 5. Date Parsing (Publish Date)
    let targetDate: Date | null = null;
    let isUnscheduled = true;
    if (rawDate) {
        const parsedDate = parseFlexibleDate(rawDate);
        if (parsedDate) {
            targetDate = parsedDate;
            isUnscheduled = false;
        } else {
            warnings.push(`รูปแบบวันที่เผยแพร่ "${rawDate}" ไม่ถูกต้อง (จะถูกตั้งเป็น Unscheduled ในคลัง)`);
            targetDate = new Date();
            isUnscheduled = true;
        }
    } else {
        targetDate = new Date();
        isUnscheduled = true;
    }

    // Shoot Date Parsing
    let shootDateObj: Date | null = null;
    if (rawShootDate) {
        const parsedShootDate = parseFlexibleDate(rawShootDate);
        if (parsedShootDate) {
            shootDateObj = parsedShootDate;
        }
    }

    // 6. User Mapping (Owner, Edit, Sub) with Nickname / Thai support
    const ideaOwnerIds: string[] = [];
    const ownerNames: string[] = [];
    if (rawOwner) {
        const uid = findUserByName(rawOwner, users);
        if (uid) {
            ideaOwnerIds.push(uid);
            const u = users.find(x => x.id === uid);
            if (u) ownerNames.push(u.name || u.nickname || 'Unknown');
        } else {
            warnings.push(`ไม่พบผู้รับผิดชอบ Owner "${rawOwner}" ในระบบ`);
        }
    }

    const editorIds: string[] = [];
    const editorNames: string[] = [];
    if (rawEdit) {
        const uid = findUserByName(rawEdit, users);
        if (uid) {
            editorIds.push(uid);
            const u = users.find(x => x.id === uid);
            if (u) editorNames.push(u.name || u.nickname || 'Unknown');
        } else {
            warnings.push(`ไม่พบผู้ตัดต่อ Editor "${rawEdit}" ในระบบ`);
        }
    }

    const assigneeIds: string[] = [];
    const subNames: string[] = [];
    if (rawSub) {
        const uid = findUserByName(rawSub, users);
        if (uid) {
            assigneeIds.push(uid);
            const u = users.find(x => x.id === uid);
            if (u) subNames.push(u.name || u.nickname || 'Unknown');
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
        content_formats: formatKey ? [formatKey] : [],
        pillar: pillarKey,
        category: categoryKey,
        remark: rawRemark || '',
        target_platform: targetPlatforms,
        idea_owner_ids: ideaOwnerIds,
        editor_ids: editorIds,
        assignee_ids: assigneeIds
    };

    if (shootDateObj) {
        payload.shoot_date = shootDateObj.toISOString();
    }
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
        rawPublishDate: rawDate,
        isUnscheduled,
        shootDate: shootDateObj,
        rawShootDate,
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
                const findField = (keys: string[]): string => {
                    for (const k of keys) {
                        if (obj[k] !== undefined && obj[k] !== null) return String(obj[k]).trim();
                    }
                    return '';
                };

                const rawTitle = findField(['title', 'Content Topic', 'content topic', 'topic', 'ชื่อคอนเทนต์', 'หัวข้อ', 'ชื่อคลิป']);
                const rawFormat = findField(['format', 'Content Format', 'content format', 'รูปแบบคอนเทนต์', 'รูปแบบ']);
                const rawPillar = findField(['pillar', 'Pillar', 'เสาหลักคอนเทนต์', 'เสาหลัก']);
                const rawCategory = findField(['category', 'Category', 'หมวดหมู่', 'หมวด']);
                const rawStatus = findField(['status', 'Status', 'สถานะ', 'ขั้นตอน']);
                const rawDate = findField(['publishDate', 'publish_date', 'Publish Date', 'publish date', 'date', 'วันที่เผยแพร่', 'วันลงงาน']);
                const rawShootDate = findField(['shootDate', 'shoot_date', 'Shoot Date', 'shoot date', 'วันถ่ายทำ', 'คิวถ่าย']);
                const rawChannel = findField(['channel', 'Channel', 'Chanel', 'chanel', 'ชื่อช่อง', 'ช่อง']);
                const rawOwner = findField(['owner', 'Owner', 'ideaOwner', 'idea_owner', 'เจ้าของไอเดีย', 'ผู้รับผิดชอบ']);
                const rawIdea = findField(['idea', 'IDEA', 'description', 'บรีฟ', 'รายละเอียด', 'เนื้อหา']);
                const rawEdit = findField(['edit', 'Edit', 'editor', 'Editor', 'ผู้ตัดต่อ', 'คนตัด']);
                const rawSub = findField(['sub', 'Sub', 'assignee', 'Assignee', 'ผู้ช่วย/ซับ', 'ผู้ช่วย', 'ซับ']);
                const rawRemark = findField(['remark', 'Remark', 'Remark หมายเหตุ', 'หมายเหตุ']);
                const rawPlatform = findField(['platform', 'Post', 'post', 'target_platform', 'targetPlatforms', 'แพลตฟอร์ม']);
                const rawStorage = findField(['storage', 'storagePath', 'storage_path', 'drive_url', 'drive', 'ที่เก็บไฟล์']);

                const item = processSingleStockRecord({
                    rawTitle,
                    rawFormat,
                    rawPillar,
                    rawCategory,
                    rawStatus,
                    rawDate,
                    rawShootDate,
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
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
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
        // Standard CSV / Text
        try {
            const text = await readFileAsTextWithAutoEncoding(file);
            const lineStrings = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
            rows = lineStrings.map(line => parseCSVLine(line));
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

    const findCol = (aliases: string[]): number => {
        return headers.findIndex(h => aliases.some(alias => h === alias || h.includes(alias)));
    };

    const colMap = {
        title: findCol(['content topic', 'topic', 'title', 'ชื่อคอนเทนต์', 'หัวข้อ', 'ชื่อเรื่อง', 'ชื่อคลิป']),
        format: findCol(['content format', 'format', 'รูปแบบคอนเทนต์', 'รูปแบบ']),
        pillar: findCol(['pillar', 'เสาหลักคอนเทนต์', 'เสาหลัก']),
        category: findCol(['category', 'หมวดหมู่', 'หมวด']),
        status: findCol(['status', 'สถานะ', 'ขั้นตอน']),
        date: findCol(['publish date', 'publish_date', 'date', 'วันที่เผยแพร่', 'วันลงงาน', 'วันโพสต์', 'กำหนดเผยแพร่']),
        shootDate: findCol(['shoot date', 'shoot_date', 'วันถ่ายทำ', 'คิวถ่าย', 'วันถ่าย']),
        channel: findCol(['chanel', 'channel', 'ชื่อช่อง', 'ช่อง']),
        owner: findCol(['owner', 'idea owner', 'เจ้าของไอเดีย', 'ผู้รับผิดชอบ', 'คนคิด']),
        idea: findCol(['idea', 'description', 'บรีฟ', 'รายละเอียด', 'เนื้อหา']),
        edit: findCol(['edit', 'editor', 'ผู้ตัดต่อ', 'คนตัด']),
        sub: findCol(['sub', 'assignee', 'ผู้ช่วย/ซับ', 'ผู้ช่วย', 'ซับ']),
        remark: headers.findIndex(h => h.includes('remark') || h.includes('หมายเหตุ')),
        platform: findCol(['post', 'platform', 'target_platform', 'แพลตฟอร์ม']),
        storage: findCol(['storage', 'storage path', 'drive', 'drive_url', 'ที่เก็บไฟล์', 'โฟลเดอร์'])
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

        const getColVal = (idx: number): string => {
            if (idx === -1 || idx >= cols.length) return '';
            const v = cols[idx];
            if (v === null || v === undefined) return '';
            if (v instanceof Date) return v.toISOString().split('T')[0];
            return String(v).trim();
        };

        const rawTitle = getColVal(colMap.title);
        // Skip completely blank rows where title and all keys are empty
        const allText = cols.map((c: any) => String(c || '').trim()).join('');
        if (!allText) continue;

        const rawFormat = getColVal(colMap.format);
        const rawPillar = getColVal(colMap.pillar);
        const rawCategory = getColVal(colMap.category);
        const rawStatus = getColVal(colMap.status);
        const rawDate = getColVal(colMap.date);
        const rawShootDate = getColVal(colMap.shootDate);
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
            rawShootDate,
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
