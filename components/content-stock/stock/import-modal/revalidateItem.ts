import { ParsedStockItemPreview } from '../../../../services/stockImportValidator';
import { Channel, User, MasterOption } from '../../../../types';

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
    let status = item.status || 'TODO';
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

    // 4. Validate Users (Owner, Editor, Sub)
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

    // 5. Formats & Pillars & Categories
    const formatKey = item.format || null;
    const pillarKey = item.pillar || null;
    const categoryKey = item.category || null;

    const isValid = errors.length === 0;

    const targetDate = item.publishDate || (item.isUnscheduled ? new Date() : new Date());

    const payload = {
        title: cleanTitle,
        description: item.idea || '',
        status: status,
        channel_id: channelId,
        start_date: targetDate.toISOString(),
        end_date: targetDate.toISOString(),
        is_unscheduled: item.isUnscheduled,
        priority: 'MEDIUM',
        content_formats: formatKey ? [formatKey] : [],
        pillar: pillarKey,
        category: categoryKey,
        remark: item.remark || '',
        target_platform: item.targetPlatforms || [],
        idea_owner_ids: item.ownerIds || [],
        editor_ids: item.editorIds || [],
        assignee_ids: item.subIds || []
    };

    return {
        ...item,
        title: cleanTitle,
        status,
        statusLabel,
        channelId,
        channelName,
        ownerNames,
        editorNames,
        subNames,
        isValid,
        errors,
        warnings,
        payload
    };
};
