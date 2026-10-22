import { ShootRoundKey } from '../../../types';

export const ROUND_ORDER: ShootRoundKey[] = ['PACK_OUT', 'PACK_BACK', 'RETURN_STORAGE'];
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const getDefaultYearMonth = (): string => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
};

export const formatDateTime = (iso?: string): string => {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

export const formatTimeOnly = (iso?: string): string => {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '-';
    }
};

export const buildPageNumbers = (
    currentPage: number,
    totalPages: number
): (number | 'ELLIPSIS')[] => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ELLIPSIS')[] = [1];
    if (currentPage > 3) {
        pages.push('ELLIPSIS');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let p = start; p <= end; p++) {
        pages.push(p);
    }
    if (currentPage < totalPages - 2) {
        pages.push('ELLIPSIS');
    }
    pages.push(totalPages);
    return pages;
};
