import { MasterOption, Channel } from '../../../../types';

/**
 * Content Stock Template generators (CSV & JSON).
 */

export const generateContentStockCSVTemplate = (
    masterOptions?: MasterOption[],
    channels?: Channel[]
): string => {
    const headers = [
        'Title',
        'Channel',
        'Format',
        'Pillar',
        'Category',
        'Storage Path',
        'Status',
        'Assignee',
        'Shoot Date',
        'Due Date',
        'Description',
        'Tags'
    ];

    const sampleChannel = channels && channels.length > 0 ? channels[0].name : 'กินกับก้อย';
    const sampleFormat = masterOptions?.find(o => o.type === 'FORMAT')?.label || 'Short';
    const samplePillar = masterOptions?.find(o => o.type === 'PILLAR')?.label || 'Review';
    const sampleCategory = masterOptions?.find(o => o.type === 'CATEGORY')?.label || 'Food & Beverage';

    const exampleRow = [
        '"คลิปแนะนำเมนูใหม่ คาเฟ่ลับอารีย์"',
        `"${sampleChannel}"`,
        `"${sampleFormat}"`,
        `"${samplePillar}"`,
        `"${sampleCategory}"`,
        '"https://drive.google.com/drive/folders/demo"',
        '"Stock"',
        '"somchai@example.com"',
        '"2025-04-10"',
        '"2025-04-15"',
        '"ถ่ายทำรีวิวขนมหวาน 3 เมนูไฮไลท์"',
        '"คาเฟ่, อารีย์, รีวิวขนม"'
    ];

    return '\uFEFF' + headers.join(',') + '\n' + exampleRow.join(',') + '\n';
};

export const generateContentStockJSONTemplate = (
    masterOptions?: MasterOption[],
    channels?: Channel[]
): string => {
    const sampleChannel = channels && channels.length > 0 ? channels[0].name : 'กินกับก้อย';
    const sampleFormat = masterOptions?.find(o => o.type === 'FORMAT')?.label || 'Short';
    const samplePillar = masterOptions?.find(o => o.type === 'PILLAR')?.label || 'Review';
    const sampleCategory = masterOptions?.find(o => o.type === 'CATEGORY')?.label || 'Food & Beverage';

    const template = [
        {
            title: "คลิปแนะนำเมนูใหม่ คาเฟ่ลับอารีย์",
            channel: sampleChannel,
            format: sampleFormat,
            pillar: samplePillar,
            category: sampleCategory,
            storage_path: "https://drive.google.com/drive/folders/demo",
            status: "Stock",
            assignee: "somchai@example.com",
            shoot_date: "2025-04-10",
            due_date: "2025-04-15",
            description: "ถ่ายทำรีวิวขนมหวาน 3 เมนูไฮไลท์ พร้อมช็อต B-Roll สวยๆ",
            tags: ["คาเฟ่", "อารีย์", "รีวิวขนม"]
        }
    ];

    return JSON.stringify(template, null, 2);
};
