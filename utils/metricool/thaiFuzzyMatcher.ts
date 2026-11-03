import { differenceInCalendarDays } from 'date-fns';
import { Task } from '../../types';

/**
 * Normalizes non-breaking spaces (\u00A0) and zero-width spaces into standard spaces
 */
export function normalizeSpaces(input: string): string {
    if (!input) return '';
    return input.replace(/[\u00A0\u200B\uFEFF]+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
}

/**
 * Strips inline/trailing hashtags and non-breaking spaces from a Metricool title
 * so CalendarView cards get a clean clip title (e.g. "5 อันดับน้าค่อมฮาๆ")
 * while hashtags remain preserved in `description` and `tags`.
 */
export function cleanMetricoolTitle(rawTitle: string): string {
    if (!rawTitle) return '';
    const spaceCleaned = normalizeSpaces(rawTitle);
    const firstNonEmptyLine =
        spaceCleaned
            .split(/\r?\n/)
            .map(line => line.replace(/#[^\s#]+/g, '').replace(/\s{2,}/g, ' ').trim())
            .find(Boolean) || '';

    if (firstNonEmptyLine) {
        return firstNonEmptyLine.length > 90
            ? firstNonEmptyLine.slice(0, 90).trim() + '...'
            : firstNonEmptyLine;
    }

    const fallback = spaceCleaned.replace(/#/g, '').trim();
    return fallback.length > 90 ? fallback.slice(0, 90).trim() + '...' : fallback;
}

/**
 * Normalizes text for exact comparison (lowercase, remove hashtags, emojis, punctuation)
 */
export function normalizeTitleText(input: string): string {
    if (!input) return '';
    return normalizeSpaces(input)
        .toLowerCase()
        .replace(/#[^\s#]+/g, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '')
        .trim();
}

/**
 * Strips Thai vowels & tone marks (`ั ิ ี ึ ื ุ ู ็ ่ ้ ๊ ๋ ์ ำ ะ า เ แ โ ใ ไ`)
 * so that missing vowels or tone typos still match the consonant skeleton!
 */
export function toThaiConsonantSkeleton(input: string): string {
    const base = normalizeTitleText(input);
    return base.replace(/[\u0E30-\u0E3A\u0E40-\u0E4E]/g, '');
}

/**
 * Computes Sørensen–Dice coefficient on character bigrams (0 to 1)
 */
export function computeBigramSimilarity(a: string, b: string): number {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) {
        return a === b ? 1 : 0;
    }

    const bigramsA = new Map<string, number>();
    for (let i = 0; i < a.length - 1; i++) {
        const bg = a.slice(i, i + 2);
        bigramsA.set(bg, (bigramsA.get(bg) || 0) + 1);
    }

    let intersection = 0;
    for (let i = 0; i < b.length - 1; i++) {
        const bg = b.slice(i, i + 2);
        const count = bigramsA.get(bg) || 0;
        if (count > 0) {
            bigramsA.set(bg, count - 1);
            intersection++;
        }
    }

    return (2.0 * intersection) / (a.length - 1 + (b.length - 1));
}

/**
 * Computes Levenshtein edit distance similarity (0 to 1) between two strings
 */
export function computeLevenshteinSimilarity(a: string, b: string): number {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    if (a === b) return 1;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = i - 1;
        dp[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const temp = dp[j];
            if (a[i - 1] === b[j - 1]) {
                dp[j] = prev;
            } else {
                dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
            }
            prev = temp;
        }
    }

    return Math.max(0, 1 - dp[b.length] / maxLen);
}

/**
 * Calculates overall Thai-aware similarity score (0 to 100) between a CSV row title/caption
 * and an existing CalendarView Task.
 */
export function scoreThaiTaskMatch(
    csvTitle: string,
    csvCaption: string,
    csvDate: Date,
    task: Task
): { score: number; matchType: 'EXACT' | 'THAI_FUZZY' | 'NONE'; reason: string } {
    const taskDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    const dayDiff = Math.abs(differenceInCalendarDays(csvDate, taskDate));

    // Only consider tasks within +/- 5 days
    if (dayDiff > 5) {
        return { score: 0, matchType: 'NONE', reason: '' };
    }

    const normCsvTitle = normalizeTitleText(csvTitle);
    const normTaskTitle = normalizeTitleText(task.title);

    if (!normCsvTitle || !normTaskTitle) {
        return { score: 0, matchType: 'NONE', reason: '' };
    }

    // 1. Exact normalized match on same day (or +/- 2 days)
    if (normCsvTitle === normTaskTitle && dayDiff <= 2) {
        return {
            score: dayDiff === 0 ? 100 : 96,
            matchType: 'EXACT',
            reason:
                dayDiff === 0
                    ? 'ชื่อคลิปและวันที่ตรงกัน 100%'
                    : `ชื่อคลิปตรงกัน 100% (ขยับวัน ${dayDiff} วัน)`
        };
    }

    // 2. Thai Consonant Skeleton Match (handles missing vowels/tone marks!)
    const skelCsv = toThaiConsonantSkeleton(csvTitle);
    const skelTask = toThaiConsonantSkeleton(task.title);

    if (skelCsv.length >= 4 && skelCsv === skelTask && dayDiff <= 3) {
        return {
            score: dayDiff === 0 ? 95 : 90,
            matchType: 'THAI_FUZZY',
            reason: 'โครงพยัญชนะไทยตรงกัน (ตรวจพบสระหรือวรรณยุกต์ตกหล่นเล็กน้อย)'
        };
    }

    // 3. Substring containment (e.g. Task title is inside CSV caption or vice versa)
    const normCaption = normalizeTitleText(csvCaption);
    if (
        normTaskTitle.length >= 6 &&
        (normCsvTitle.includes(normTaskTitle) ||
            normTaskTitle.includes(normCsvTitle) ||
            normCaption.includes(normTaskTitle))
    ) {
        if (dayDiff <= 2) {
            return {
                score: dayDiff === 0 ? 89 : 84,
                matchType: 'THAI_FUZZY',
                reason: 'ชื่อการ์ดงานปรากฏอยู่ในพาดหัว/แคปชันของ Metricool ในช่วงวันเดียวกัน'
            };
        }
    }

    // 4. Combined Levenshtein + Skeleton similarity
    const fullLev = computeLevenshteinSimilarity(normCsvTitle, normTaskTitle);
    const skelLev = skelCsv && skelTask ? computeLevenshteinSimilarity(skelCsv, skelTask) : 0;
    const bigramSim = computeBigramSimilarity(normCsvTitle, normTaskTitle);

    const bestTextSim = Math.max(fullLev, skelLev * 0.97, bigramSim);
    const datePenalty = dayDiff * 0.05;
    const finalScore = Math.round(Math.max(0, (bestTextSim - datePenalty) * 100));

    if (finalScore >= 75) {
        return {
            score: finalScore,
            matchType: 'THAI_FUZZY',
            reason: `ชื่อคล้ายคลึงกัน ${finalScore}%${
                dayDiff === 0 ? ' (วันเดียวกัน)' : ` (ห่างกัน ${dayDiff} วัน)`
            }`
        };
    }

    return { score: finalScore, matchType: 'NONE', reason: '' };
}
