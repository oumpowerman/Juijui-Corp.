/**
 * Intern Candidates Template generators (CSV & JSON).
 */

export const generateInternCSVTemplate = (): string => {
    const headers = [
        'first_name',
        'last_name',
        'nickname',
        'gender',
        'email',
        'phone',
        'university',
        'faculty',
        'major',
        'position',
        'start_date',
        'end_date',
        'portfolio_url',
        'resume_url',
        'status',
        'interview_score',
        'skill_tags',
        'notes'
    ];

    const exampleRow = [
        '"สมชาย"',
        '"ใจดี"',
        '"กาย"',
        '"ชาย"',
        '"somchai.j@example.com"',
        '"0812345678"',
        '"จุฬาลงกรณ์มหาวิทยาลัย"',
        '"คณะนิเทศศาสตร์"',
        '"สาขาวิชาวารสารสนเทศและสื่อใหม่"',
        '"Video Editor"',
        '"2025-06-01"',
        '"2025-10-31"',
        '"https://behance.net/somchai"',
        '"https://drive.google.com/resume.pdf"',
        '"applied"',
        '"85"',
        '"Premiere Pro, After Effects, DaVinci"',
        '"ผ่านการสัมภาษณ์รอบแรก ทัศนคติดีมาก"'
    ];

    return '\uFEFF' + headers.join(',') + '\n' + exampleRow.join(',') + '\n';
};

export const generateInternJSONTemplate = (): string => {
    const template = [
        {
            first_name: "สมชาย",
            last_name: "ใจดี",
            nickname: "กาย",
            gender: "ชาย",
            email: "somchai.j@example.com",
            phone: "0812345678",
            university: "จุฬาลงกรณ์มหาวิทยาลัย",
            faculty: "คณะนิเทศศาสตร์",
            major: "สาขาวิชาวารสารสนเทศและสื่อใหม่",
            position: "Video Editor",
            start_date: "2025-06-01",
            end_date: "2025-10-31",
            portfolio_url: "https://behance.net/somchai",
            resume_url: "https://drive.google.com/resume.pdf",
            status: "applied",
            interview_score: 85,
            skill_tags: ["Premiere Pro", "After Effects", "DaVinci"],
            notes: "ผ่านการสัมภาษณ์รอบแรก ทัศนคติดีมาก ตัดต่อคลิปสั้นคล่อง"
        }
    ];

    return JSON.stringify(template, null, 2);
};
