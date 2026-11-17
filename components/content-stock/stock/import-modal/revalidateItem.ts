import { ParsedStockItemPreview } from '../../../../services/stockImportValidator';
import { Channel, User, MasterOption } from '../../../../types';
import { parseTimeString, timeStringToMinutes } from '../../../../services/csvService';

export const revalidateStockItem = (
    item: ParsedStockItemPreview,
    users: User[] = [],
    channels: Channel[] = [],
    masterOptions: MasterOption[] = []
): ParsedStockItemPreview => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Title
    const cleanTitle = (item.title || '').trim();
    if (!cleanTitle) {
        errors.push('ไม่มีชื่อหัวข้อ (Content Topic)');
    }

    // 2. Validate Status
    const status = item.status || 'TODO';
    const statusOption = masterOptions.find(o => o.type === 'STATUS' && o.key === status);
    const statusLabel = statusOption?.label || status;

    // 3. Validate Channel
    let channelId = item.channelId;
    let channelName = item.channelName;
    if (channelId) {
        const found = channels.find(c => c.id === channelId);
        if (found) {
            channelName = found.name;
        } else if (item.rawChannelName) {
            warnings.push(`ไม่พบช่อง "${item.rawChannelName}" ในระบบ`);
        }
    } else if (item.rawChannelName) {
        const foundByName = channels.find(c =>
            c.name.toLowerCase().includes(item.rawChannelName.toLowerCase()) ||
            item.rawChannelName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (foundByName) {
            channelId = foundByName.id;
            channelName = foundByName.name;
        } else {
            warnings.push(`ไม่พบช่อง "${item.rawChannelName}" ในระบบ (ปล่อยว่าง)`);
        }
    }

    // 4. Validate Publish Time
    let normalizedScheduledTime: string | null = null;
    if (item.scheduledTime) {
        const timeRes = parseTimeString(item.scheduledTime);
        if (!timeRes.isValid) {
            errors.push(timeRes.error || `รูปแบบเวลาเผยแพร่ไม่ถูกต้อง ("${item.scheduledTime}")`);
        } else {
            normalizedScheduledTime = timeRes.value;
        }
    }

    if (item.isUnscheduled && normalizedScheduledTime) {
        warnings.push(`ระบุเวลาเผยแพร่ไว้ (${normalizedScheduledTime} น.) แต่ยังไม่ได้ใส่วันเผยแพร่ (คงสถานะ Unscheduled)`);
    }

    // 5. Validate Shoot Times
    let normalizedShootStart: string | null = null;
    let normalizedShootEnd: string | null = null;
    let shootTimeHasError = false;

    if (item.shootTimeStart) {
        const startRes = parseTimeString(item.shootTimeStart);
        if (!startRes.isValid) {
            errors.push(`เวลาเริ่มถ่ายทำไม่ถูกต้อง ("${item.shootTimeStart}") กรุณาใช้รูปแบบ HH:mm`);
            shootTimeHasError = true;
        } else {
            normalizedShootStart = startRes.value;
        }
    }

    if (item.shootTimeEnd) {
        const endRes = parseTimeString(item.shootTimeEnd);
        if (!endRes.isValid) {
            errors.push(`เวลาเลิกถ่ายทำไม่ถูกต้อง ("${item.shootTimeEnd}") กรุณาใช้รูปแบบ HH:mm`);
            shootTimeHasError = true;
        } else {
            normalizedShootEnd = endRes.value;
        }
    }

    if (!shootTimeHasError && normalizedShootStart && normalizedShootEnd) {
        if (timeStringToMinutes(normalizedShootEnd) < timeStringToMinutes(normalizedShootStart)) {
            errors.push(`เวลาเลิกถ่ายทำ (${normalizedShootEnd}) ต้องไม่น้อยกว่าเวลาเริ่มถ่ายทำ (${normalizedShootStart})`);
        }
    }

    if (!item.shootDate && (normalizedShootStart || normalizedShootEnd)) {
        warnings.push('ระบุช่วงเวลาถ่ายทำไว้แล้ว แต่ยังไม่ได้ใส่วันถ่ายทำ');
    }

    // 6. Validate Users (Owner, Editor, Sub)
    const ownerNames: string[] = [];
    (item.ownerIds || []).forEach(uid => {
        const u = users.find(x => x.id === uid);
        if (u) ownerNames.push(u.name);
    });

    const editorNames: string[] = [];
    (item.editorIds || []).forEach(uid => {
        const u = users.find(x => x.id === uid);
        if (u) editorNames.push(u.name);
    });

    const subNames: string[] = [];
    (item.subIds || []).forEach(uid => {
        const u = users.find(x => x.id === uid);
        if (u) subNames.push(u.name);
    });

    // 7. Formats & Pillars & Categories
    const formatKey = item.format || null;
    const pillarKey = item.pillar || null;
    const categoryKey = item.category || null;

    const isValid = errors.length === 0;

    const targetDate = item.publishDate || new Date();
    const shootDateObj = item.shootDate || null;

    const payload: Record<string, any> = {
        title: cleanTitle,
        description: item.idea || '',
        status: status,
        channel_id: channelId,
        start_date: targetDate.toISOString(),
        end_date: targetDate.toISOString(),
        is_unscheduled: item.isUnscheduled,
        scheduled_time: normalizedScheduledTime || null,
        shoot_date: shootDateObj ? shootDateObj.toISOString() : null,
        shoot_time_start: normalizedShootStart || null,
        shoot_time_end: normalizedShootEnd || null,
        content_formats: formatKey ? [formatKey] : [],
        pillar: pillarKey,
        category: categoryKey,
        remark: item.remark || '',
        target_platform: item.targetPlatforms || [],
        idea_owner_ids: item.ownerIds || [],
        editor_ids: item.editorIds || [],
        assignee_ids: item.subIds || []
    };

    if (item.storagePath) {
        payload.local_path = item.storagePath;
    }

    return {
        ...item,
        title: cleanTitle,
        status,
        statusLabel,
        channelId,
        channelName,
        scheduledTime: normalizedScheduledTime ?? item.scheduledTime ?? null,
        shootDate: shootDateObj,
        shootTimeStart: normalizedShootStart ?? item.shootTimeStart ?? null,
        shootTimeEnd: normalizedShootEnd ?? item.shootTimeEnd ?? null,
        ownerNames,
        editorNames,
        subNames,
        isValid,
        errors,
        warnings,
        payload
    };
};
