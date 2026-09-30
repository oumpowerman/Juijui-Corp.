/**
 * Helper to parse multi-line bulk paste text into { title, description }[]
 * Supports formats:
 * - "หัวข้อ: คำอธิบาย"
 * - "หัวข้อ - คำอธิบาย"
 * - "1. หัวข้อ: คำอธิบาย"
 * - "• หัวข้อ"
 */
export const parseBulkItemsText = (rawText: string): { title: string; description: string }[] => {
    const lines = rawText
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);

    const results: { title: string; description: string }[] = [];

    for (const line of lines) {
        // Strip leading bullets or numbering like "1. ", "1) ", "- ", "• ", "☑️ "
        const cleaned = line.replace(/^(\d+[\.\)]\s*|[-•*☑️✓✔]\s*)+/, '').trim();
        if (!cleaned) continue;

        // Check for ":" or " - " separator between title and description
        const colonIdx = cleaned.indexOf(':');
        const dashIdx = cleaned.indexOf(' - ');

        if (colonIdx > 0 && (dashIdx === -1 || colonIdx < dashIdx)) {
            const title = cleaned.slice(0, colonIdx).trim();
            const description = cleaned.slice(colonIdx + 1).trim();
            if (title) results.push({ title, description });
        } else if (dashIdx > 0) {
            const title = cleaned.slice(0, dashIdx).trim();
            const description = cleaned.slice(dashIdx + 3).trim();
            if (title) results.push({ title, description });
        } else {
            results.push({ title: cleaned, description: '' });
        }
    }

    return results;
};
