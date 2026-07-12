export const getHexFromColorClass = (colorClass: string | undefined): string => {
    const raw = colorClass || '';
    if (raw.startsWith('#')) return raw; // หากเป็น Hex อยู่แล้วใช้ได้เลย
    
    if (raw.includes('emerald')) return '#10b981';
    if (raw.includes('green')) return '#22c55e';
    if (raw.includes('teal')) return '#14b8a6';
    if (raw.includes('sky')) return '#0ea5e9';
    if (raw.includes('blue')) return '#3b82f6';
    if (raw.includes('indigo')) return '#6366f1';
    if (raw.includes('violet')) return '#8b5cf6';
    if (raw.includes('purple')) return '#a855f7';
    if (raw.includes('fuchsia')) return '#d946ef';
    if (raw.includes('pink')) return '#ec4899';
    if (raw.includes('rose')) return '#f43f5e';
    if (raw.includes('red')) return '#ef4444';
    if (raw.includes('orange')) return '#f97316';
    if (raw.includes('amber')) return '#f59e0b';
    if (raw.includes('yellow')) return '#eab308';
    if (raw.includes('lime')) return '#84cc16';
    if (raw.includes('cyan')) return '#06b6d4';
    if (raw.includes('slate')) return '#64748b';
    if (raw.includes('gray') || raw.includes('grey')) return '#6b7280';
    if (raw.includes('zinc')) return '#71717a';
    if (raw.includes('neutral')) return '#737373';
    if (raw.includes('stone')) return '#78716c';
    
    return '#78716c'; // สี Stone Fallback
};
