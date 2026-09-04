import { User, MasterOption, Channel } from '../types';
import { parseCSVLine, findUserByName, findMasterKey, parseTHDate, readFileAsTextWithAutoEncoding } from './csvService';

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
    // Database payload ready to insert
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

export const validateAndParseStockCSV = async (
    file: File,
    users: User[],
    channels: Channel[],
    masterOptions: MasterOption[]
): Promise<StockCSVValidationResult> => {
    const text = await readFileAsTextWithAutoEncoding(file);
    const rows = text.split(/\r\n|\n/);

    if (rows.length < 2) {
        return {
            fileName: file.name,
            totalRows: 0,
            validRowsCount: 0,
            warningRowsCount: 0,
            errorRowsCount: 0,
            hasCriticalHeaderError: true,
            headerErrorMessage: 'ไฟล์ว่างเปล่าหรือไม่มีข้อมูลแถว',
            items: []
        };
    }

    const headers = parseCSVLine(rows[0]).map(h => h.trim().toLowerCase());

    const colMap = {
        title: headers.indexOf('content topic'),
        format: headers.indexOf('content format'),
        pillar: headers.indexOf('pillar'),
        category: headers.indexOf('category'),
        status: headers.indexOf('status'),
        date: headers.indexOf('publish date'),
        channel: headers.findIndex(h => h === 'chanel' || h === 'channel'),
        owner: headers.indexOf('owner'),
        idea: headers.indexOf('idea'),
        edit: headers.indexOf('edit'),
        sub: headers.indexOf('sub'),
        remark: headers.findIndex(h => h.includes('remark')),
        platform: headers.indexOf('post')
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
            headerErrorMessage: 'ไม่พบคอลัมน์ "Content Topic" ในหัวตาราง CSV กรุณาใช้ไฟล์ Template ที่ถูกต้อง',
            items: []
        };
    }

    const items: ParsedStockItemPreview[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const rowStr = rows[i].trim();
        if (!rowStr) continue;

        const cols = parseCSVLine(rowStr);
        const rawTitle = colMap.title > -1 ? (cols[colMap.title] || '').trim() : '';
        const rawFormat = colMap.format > -1 ? (cols[colMap.format] || '').trim() : '';
        const rawPillar = colMap.pillar > -1 ? (cols[colMap.pillar] || '').trim() : '';
        const rawCategory = colMap.category > -1 ? (cols[colMap.category] || '').trim() : '';
        const rawStatus = colMap.status > -1 ? (cols[colMap.status] || '').trim() : '';
        const rawDate = colMap.date > -1 ? (cols[colMap.date] || '').trim() : '';
        const rawChannel = colMap.channel > -1 ? (cols[colMap.channel] || '').trim() : '';
        const rawOwner = colMap.owner > -1 ? (cols[colMap.owner] || '').trim() : '';
        const rawIdea = colMap.idea > -1 ? (cols[colMap.idea] || '').trim() : '';
        const rawEdit = colMap.edit > -1 ? (cols[colMap.edit] || '').trim() : '';
        const rawSub = colMap.sub > -1 ? (cols[colMap.sub] || '').trim() : '';
        const rawRemark = colMap.remark > -1 ? (cols[colMap.remark] || '').trim() : '';
        const rawPlatform = colMap.platform > -1 ? (cols[colMap.platform] || '').trim() : '';

        const errors: string[] = [];
        const warnings: string[] = [];

        // 1. Title Validation (Crucial)
        if (!rawTitle) {
            errors.push('ไม่มีชื่อหัวข้อ (Content Topic)');
        }

        // 2. Status Mapping
        let status = 'TODO';
        let statusOption = masterOptions.find(o => o.type === 'STATUS' && o.key === 'TODO');
        if (rawStatus) {
            const mappedStatus = findMasterKey('STATUS', rawStatus.toUpperCase(), masterOptions);
            if (mappedStatus) {
                status = mappedStatus;
                statusOption = masterOptions.find(o => o.type === 'STATUS' && o.key === mappedStatus);
            } else {
                warnings.push(`สถานะ "${rawStatus}" ไม่ตรงกับในระบบ (ตั้งค่าเป็น TODO แทน)`);
            }
        }
        const statusLabel = statusOption?.label || status;

        // 3. Channel Mapping
        let channelId: string | null = null;
        let channelName: string | null = null;
        if (rawChannel) {
            const foundChannel = channels.find(c => c.name.toLowerCase().includes(rawChannel.toLowerCase()) || rawChannel.toLowerCase().includes(c.name.toLowerCase()));
            if (foundChannel) {
                channelId = foundChannel.id;
                channelName = foundChannel.name;
            } else {
                warnings.push(`ไม่พบช่อง "${rawChannel}" ในระบบ (ปล่อยว่าง)`);
            }
        }

        // 4. Platforms
        let targetPlatforms: string[] = [];
        if (rawPlatform) {
            const p = rawPlatform.toLowerCase();
            if (p.includes('yt') || p.includes('youtube')) targetPlatforms.push('YOUTUBE');
            if (p.includes('fb') || p.includes('facebook')) targetPlatforms.push('FACEBOOK');
            if (p.includes('tiktok') || p.includes('tt')) targetPlatforms.push('TIKTOK');
            if (p.includes('ig') || p.includes('instagram')) targetPlatforms.push('INSTAGRAM');
        }

        // 5. Date Parsing
        let targetDate: Date | null = null;
        let isUnscheduled = true;
        if (rawDate) {
            const parsedDate = parseTHDate(rawDate);
            if (parsedDate) {
                targetDate = parsedDate;
                isUnscheduled = false;
            } else {
                warnings.push(`รูปแบบวันที่ "${rawDate}" ไม่ถูกต้อง (จะถูกตั้งเป็น Unscheduled)`);
                targetDate = new Date();
                isUnscheduled = true;
            }
        } else {
            targetDate = new Date();
            isUnscheduled = true;
        }

        // 6. User Mapping (Owner, Edit, Sub)
        const ideaOwnerIds: string[] = [];
        const ownerNames: string[] = [];
        if (rawOwner) {
            const uid = findUserByName(rawOwner, users);
            if (uid) {
                ideaOwnerIds.push(uid);
                const u = users.find(x => x.id === uid);
                if (u) ownerNames.push(u.name);
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
                if (u) editorNames.push(u.name);
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
                if (u) subNames.push(u.name);
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

        if (!isValid) {
            errorCount++;
        } else if (warnings.length > 0) {
            warningCount++;
        } else {
            validCount++;
        }

        const payload = {
            title: rawTitle,
            description: rawIdea || '',
            status: status,
            channel_id: channelId,
            start_date: (targetDate || new Date()).toISOString(),
            end_date: (targetDate || new Date()).toISOString(),
            is_unscheduled: isUnscheduled,
            priority: 'MEDIUM',
            content_formats: formatKey ? [formatKey] : [],
            pillar: pillarKey,
            category: categoryKey,
            remark: rawRemark || '',
            target_platform: targetPlatforms,
            idea_owner_ids: ideaOwnerIds,
            editor_ids: editorIds,
            assignee_ids: assigneeIds
        };

        items.push({
            index: i,
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
        });
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
