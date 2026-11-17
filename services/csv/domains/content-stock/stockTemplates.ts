import { MasterOption, Channel } from '../../../../types';

/**
 * Content Stock Template generators (CSV & JSON).
 */

export const generateContentStockCSVTemplate = (
    masterOptions?: MasterOption[],
    channels?: Channel[]
): string => {
    const headers = [
        'Content Topic',
        'Channel',
        'Status',
        'Publish Date',
        'Publish Time',
        'Shoot Date',
        'Shoot Time',
        'Format',
        'Pillar',
        'Category',
        'Owner',
        'Edit',
        'Sub',
        'Post / Platform',
        'IDEA',
        'Remark',
        'Storage Path'
    ];

    const sampleChannel = channels && channels.length > 0 ? channels[0].name : 'Juijui Vlog';
    const sampleFormat = masterOptions?.find(o => o.type === 'FORMAT')?.label || 'Short Form';
    const samplePillar = masterOptions?.find(o => o.type === 'PILLAR')?.label || 'Review';
    const sampleCategory = masterOptions?.find(o => o.type === 'CATEGORY')?.label || 'Food & Beverage';

    const exampleRow = [
        '"คลิปแนะนำเมนูใหม่ คาเฟ่ลับอารีย์"',
        `"${sampleChannel}"`,
        '"TODO"',
        '"15/10/2026"',
        '"18:30"',
        '"10/10/2026"',
        '"09:00-12:00"',
        `"${sampleFormat}"`,
        `"${samplePillar}"`,
        `"${sampleCategory}"`,
        '"สมชาย"',
        '"บอย"',
        '"somchai@example.com"',
        '"YT, TT, FB, IG"',
        '"ถ่ายทำรีวิวขนมหวาน 3 เมนูไฮไลท์ พร้อมช็อต B-Roll สวยๆ"',
        '"เน้นภาพแสงธรรมชาติ"',
        '"https://drive.google.com/drive/folders/demo"'
    ];

    return '\uFEFF' + headers.join(',') + '\n' + exampleRow.join(',') + '\n';
};

export const generateContentStockJSONTemplate = (
    masterOptions?: MasterOption[],
    channels?: Channel[]
): string => {
    const sampleChannel = channels && channels.length > 0 ? channels[0].name : 'Juijui Vlog';
    const sampleFormat = masterOptions?.find(o => o.type === 'FORMAT')?.label || 'Short Form';
    const samplePillar = masterOptions?.find(o => o.type === 'PILLAR')?.label || 'Review';
    const sampleCategory = masterOptions?.find(o => o.type === 'CATEGORY')?.label || 'Food & Beverage';

    const template = [
        {
            title: "คลิปแนะนำเมนูใหม่ คาเฟ่ลับอารีย์",
            channel: sampleChannel,
            status: "TODO",
            publish_date: "15/10/2026",
            publish_time: "18:30",
            shoot_date: "10/10/2026",
            shoot_time: "09:00-12:00",
            format: sampleFormat,
            pillar: samplePillar,
            category: sampleCategory,
            owner: "สมชาย",
            edit: "บอย",
            sub: "somchai@example.com",
            target_platform: "YT, TT, FB, IG",
            idea: "ถ่ายทำรีวิวขนมหวาน 3 เมนูไฮไลท์ พร้อมช็อต B-Roll สวยๆ",
            remark: "เน้นภาพแสงธรรมชาติ",
            storage_path: "https://drive.google.com/drive/folders/demo"
        }
    ];

    return JSON.stringify(template, null, 2);
};
