export const cleanContentForTiming = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/\[.*?\]/g, '') // Remove [Stage Directions]
        .replace(/\(.*?\)/g, '') // Remove (Parenthetical Notes)
        .replace(/<strong>.*?:?<\/strong>:?\s*/g, '') // Remove Bold Character Names (handles : inside or outside)
        .replace(/<[^>]*>?/gm, '') // Remove HTML Tags
        .replace(/^[^\n:]+:\s*/gm, '') // Remove "Name: " at start of lines (fallback)
        .trim();
};

export const estimateDurationSeconds = (html: string): number => {
    const cleanedText = cleanContentForTiming(html);
    return Math.ceil(cleanedText.length / 12);
};
