/**
 * Content Stock Template generators (CSV & JSON).
 */

export const generateContentStockCSVTemplate = (): string => {
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

    const exampleRow = [
        '"คลิปแนะนำเมนูใหม่ คาเฟ่ลับอารีย์"',
        '"กินกับก้อย"',
        '"Short"',
        '"Review"',
        '"Food & Beverage"',
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

export const generateContentStockJSONTemplate = (): string => {
    const template = [
        {
            title: "คลิปแนะนำเมนูใหม่ คาเฟ่ลับอารีย์",
            channel: "กินกับก้อย",
            format: "Short",
            pillar: "Review",
            category: "Food & Beverage",
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
