import { Task, User, Channel, MasterOption } from '../../../../types';
import { parseCSVLine } from '../../core/csvParser';
import { parseFlexibleDate } from '../../core/dateParsers';
import { findUserByName, findChannelByName, findMasterKey } from '../../core/entityMatchers';

/**
 * Content Stock CSV Parser
 */

export interface ParsedStockRow {
    raw: Record<string, string>;
    task: Partial<Task>;
    warnings: string[];
    isValid: boolean;
}

export const parseContentStockCSV = (
    csvText: string,
    channels: Channel[],
    users: User[],
    formats: MasterOption[],
    pillars: MasterOption[],
    categories: MasterOption[]
): ParsedStockRow[] => {
    // Split lines cleanly handling CRLF and LF
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());

    const findHeaderIdx = (patterns: string[]): number => {
        return headers.findIndex(h => patterns.some(p => h.includes(p.toLowerCase())));
    };

    const idxTitle = findHeaderIdx(['title', 'หัวข้อ', 'ชื่องาน', 'ชื่อคอนเทนต์']);
    const idxChannel = findHeaderIdx(['channel', 'ช่อง', 'แชนแนล']);
    const idxFormat = findHeaderIdx(['format', 'รูปแบบ']);
    const idxPillar = findHeaderIdx(['pillar', 'เสาหลัก']);
    const idxCategory = findHeaderIdx(['category', 'หมวดหมู่', 'ประเภท']);
    const idxStorage = findHeaderIdx(['storage', 'drive', 'link', 'path', 'ลิงก์ไดรฟ์', 'ที่อยู่']);
    const idxStatus = findHeaderIdx(['status', 'สถานะ']);
    const idxAssignee = findHeaderIdx(['assignee', 'ผู้รับผิดชอบ', 'คนทำ']);
    const idxShootDate = findHeaderIdx(['shoot', 'วันถ่าย', 'ถ่ายทำ']);
    const idxDueDate = findHeaderIdx(['due', 'กำหนดส่ง', 'เดดไลน์']);
    const idxDesc = findHeaderIdx(['desc', 'description', 'รายละเอียด']);
    const idxTags = findHeaderIdx(['tags', 'แท็ก', 'ป้ายกำกับ']);

    const results: ParsedStockRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const cells = parseCSVLine(line);
        const warnings: string[] = [];

        const title = idxTitle !== -1 ? (cells[idxTitle] || '').trim() : '';
        if (!title) {
            continue; // Skip completely empty or titleless rows
        }

        // Channel resolution
        const rawChannel = idxChannel !== -1 ? (cells[idxChannel] || '').trim() : '';
        const matchedChannel = findChannelByName(rawChannel, channels);
        if (rawChannel && !matchedChannel) {
            warnings.push(`ไม่พบแชนแนล "${rawChannel}" ในระบบ (จะบันทึกเป็นค่าว่าง)`);
        }

        // Assignee resolution
        const rawAssignee = idxAssignee !== -1 ? (cells[idxAssignee] || '').trim() : '';
        const matchedUser = findUserByName(rawAssignee, users);
        if (rawAssignee && !matchedUser) {
            warnings.push(`ไม่พบผู้รับผิดชอบ "${rawAssignee}" ในระบบ (จะปล่อยว่าง)`);
        }

        // Taxonomy resolution
        const rawFormat = idxFormat !== -1 ? (cells[idxFormat] || '').trim() : '';
        const formatKey = findMasterKey(rawFormat, formats);

        const rawPillar = idxPillar !== -1 ? (cells[idxPillar] || '').trim() : '';
        const pillarKey = findMasterKey(rawPillar, pillars);

        const rawCategory = idxCategory !== -1 ? (cells[idxCategory] || '').trim() : '';
        const categoryKey = findMasterKey(rawCategory, categories);

        // Dates
        const rawShootDate = idxShootDate !== -1 ? cells[idxShootDate] : undefined;
        const shootDate = parseFlexibleDate(rawShootDate);

        const rawDueDate = idxDueDate !== -1 ? cells[idxDueDate] : undefined;
        const dueDate = parseFlexibleDate(rawDueDate);

        // Tags
        const rawTags = idxTags !== -1 ? (cells[idxTags] || '') : '';
        const tags = rawTags
            ? rawTags.split(/[,;\n]/).map(t => t.trim()).filter(Boolean)
            : [];

        // Storage path & desc
        const storagePath = idxStorage !== -1 ? (cells[idxStorage] || '').trim() : '';
        const description = idxDesc !== -1 ? (cells[idxDesc] || '').trim() : '';
        const rawStatus = idxStatus !== -1 ? (cells[idxStatus] || '').trim() : 'TODO';

        const task: Partial<Task> & Record<string, any> = {
            title,
            channelId: matchedChannel?.id || '',
            assigneeIds: matchedUser ? [matchedUser.id] : [],
            contentFormats: formatKey ? [formatKey] : (rawFormat ? [rawFormat] : []),
            pillar: pillarKey || rawPillar || '',
            category: categoryKey || rawCategory || '',
            localPath: storagePath,
            description: description,
            status: (rawStatus.toLowerCase() === 'done' || rawStatus.toLowerCase() === 'เสร็จสิ้น') ? 'DONE' : 'TODO',
            shootDate: shootDate ? new Date(shootDate) : undefined,
            startDate: dueDate ? new Date(dueDate) : new Date(),
            endDate: dueDate ? new Date(dueDate) : new Date(),
            tags: tags,
            type: 'CONTENT'
        };

        const rawData: Record<string, string> = {};
        headers.forEach((h, colIdx) => {
            rawData[h] = cells[colIdx] || '';
        });

        results.push({
            raw: rawData,
            task,
            warnings,
            isValid: true
        });
    }

    return results;
};
