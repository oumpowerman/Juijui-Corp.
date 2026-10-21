import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    differenceInCalendarDays,
    addDays,
    addWeeks,
    addMonths,
    isSameDay,
    isWithinInterval,
    format
} from 'date-fns';
import {
    CompanyChecklist,
    SavedChecklistRecord,
    ChecklistCustomIntervalUnit
} from '../../../types';

const THAI_MONTH_FULL = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม'
];

const THAI_MONTH_SHORT = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.'
];

/**
 * Formats a Date or ISO timestamp into Thai Short Date + Time:
 * e.g. "21 ต.ค. 69 เวลา 14:30 น."
 */
export const formatChecklistTimestamp = (
    dateInput?: Date | string | number | null
): string => {
    if (!dateInput) return '';
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return '';

    const day = d.getDate();
    const monthShort = THAI_MONTH_SHORT[d.getMonth()] || '';
    const buddhistYearShort = String((d.getFullYear() + 543) % 100).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day} ${monthShort} ${buddhistYearShort} เวลา ${hours}:${minutes} น.`;
};

export interface ChecklistCadenceEvaluation {
    isRecurring: boolean;
    cycleKey: string;
    cycleStartDate: Date;
    cadenceLabel: string;
    periodLabel: string;
    isCompletedInCurrentCycle: boolean;
    statusBadgeText: string;
    statusShortBadgeText: string;
    autoCaseTitle: string;
    latestRecord: SavedChecklistRecord | null;
    currentCycleRecord: SavedChecklistRecord | null;
    nextDueDate: Date | null;
    // Advance Notice Additions
    isDueSoon?: boolean;
    daysUntilDue?: number;
    alertCategory?: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE';
}

export const getCustomUnitLabel = (unit?: ChecklistCustomIntervalUnit): string => {
    if (unit === 'DAYS') return 'วัน';
    if (unit === 'WEEKS') return 'สัปดาห์';
    return 'เดือน';
};

export const getAdvanceDaysCount = (
    val: number = 3,
    unit: 'DAYS' | 'WEEKS' | 'MONTHS' = 'DAYS'
): number => {
    if (unit === 'WEEKS') return val * 7;
    if (unit === 'MONTHS') return val * 30;
    return val;
};

export const evaluateChecklistCadence = (
    preset: CompanyChecklist,
    savedRecords: SavedChecklistRecord[] = [],
    referenceDate: Date = new Date()
): ChecklistCadenceEvaluation => {
    const cycle = preset.resetCycle || 'ONCE';
    const basePrefix = (preset.defaultCasePrefix || preset.title).trim();

    // Filter and sort records for this preset (newest first)
    const presetRecords = savedRecords
        .filter(r => r.checklistId === preset.id)
        .sort(
            (a, b) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

    // Zero-Bandwidth O(1) Fallback: If preset has lastSubmittedAt stamped on workspace metadata
    if (preset.lastSubmittedAt) {
        const stampedDate = new Date(preset.lastSubmittedAt);
        if (!isNaN(stampedDate.getTime())) {
            const topRecordTime = presetRecords[0]
                ? new Date(presetRecords[0].submittedAt).getTime()
                : 0;
            if (stampedDate.getTime() > topRecordTime) {
                const syntheticRecord: SavedChecklistRecord = {
                    id: preset.lastRecordId || `stamp-${preset.id}`,
                    checklistId: preset.id,
                    checklistTitle: preset.title,
                    caseTitle: preset.lastCaseTitle || preset.title,
                    submittedBy: 'user',
                    submittedByName: preset.lastSubmittedByName || 'ทีมงาน',
                    submittedAt: stampedDate,
                    checkedCount: 0,
                    totalCount: 0,
                    snapshotSections: []
                };
                presetRecords.unshift(syntheticRecord);
            }
        }
    }

    const latestRecord = presetRecords[0] || null;
    const buddhistYear = referenceDate.getFullYear() + 543;
    const currentMonthName = THAI_MONTH_FULL[referenceDate.getMonth()];

    // 1. ONCE (ตามเคสงานทั่วไป / Ad-hoc)
    if (cycle === 'ONCE') {
        return {
            isRecurring: false,
            cycleKey: 'ONCE',
            cycleStartDate: startOfDay(referenceDate),
            cadenceLabel: 'ตามเคสงานทั่วไป',
            periodLabel: 'บันทึกแยกตามเคสงาน',
            isCompletedInCurrentCycle: false,
            statusBadgeText: 'ตามเคสงานทั่วไป',
            statusShortBadgeText: 'ตามเคสงาน',
            autoCaseTitle: preset.defaultCasePrefix
                ? `${preset.defaultCasePrefix.trim()} `
                : '',
            latestRecord,
            currentCycleRecord: null,
            nextDueDate: null
        };
    }

    // 2. SEMI_MONTHLY (ประจำกลางเดือนและสิ้นเดือน: 1-15 และ 16-สิ้นเดือน)
    if (cycle === 'SEMI_MONTHLY') {
        const curDay = referenceDate.getDate();
        const isFirstHalf = curDay <= 15;
        const monthStart = startOfMonth(referenceDate);
        const monthEnd = endOfMonth(referenceDate);
        const endDay = monthEnd.getDate(); // 28, 29, 30, or 31

        const halfKey = isFirstHalf ? 'H1' : 'H2';
        const cycleKey = `SEMI_MONTHLY_${format(monthStart, 'yyyy-MM')}_${halfKey}`;

        const periodLabel = isFirstHalf
            ? `รอบกลางเดือน (1-15 ${currentMonthName} ${buddhistYear})`
            : `รอบสิ้นเดือน (16-${endDay} ${currentMonthName} ${buddhistYear})`;

        const autoCaseTitle = isFirstHalf
            ? `${basePrefix} - ${currentMonthName} ${buddhistYear} (รอบกลางเดือน 1-15)`
            : `${basePrefix} - ${currentMonthName} ${buddhistYear} (รอบสิ้นเดือน 16-${endDay})`;

        // Due date: H1 is 15th, H2 is end of month
        const nextDueDate = isFirstHalf
            ? endOfDay(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 15))
            : monthEnd;

        const cycleStartDate = isFirstHalf
            ? monthStart
            : startOfDay(new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 16));

        // Find record submitted in the current half-month
        const currentCycleRecord =
            presetRecords.find(r => {
                const d = new Date(r.submittedAt);
                if (isNaN(d.getTime())) return false;
                if (
                    d.getMonth() !== referenceDate.getMonth() ||
                    d.getFullYear() !== referenceDate.getFullYear()
                ) {
                    return false;
                }
                const recordDay = d.getDate();
                return isFirstHalf ? recordDay <= 15 : recordDay > 15;
            }) || null;

        const isDone = !!currentCycleRecord;
        let isDueSoon = false;
        let daysUntilDue = 0;
        let alertCategory: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' = 'UP_TO_DATE';

        const halfName = isFirstHalf ? 'รอบกลางเดือน' : 'รอบสิ้นเดือน';
        let statusBadgeText = isDone ? `✅ ${halfName}ส่งแล้ว` : `⏰ ${halfName}ยังไม่ได้ส่ง`;
        let statusShortBadgeText = isDone ? `✅ ${halfName}ส่งแล้ว` : `⏰ ${halfName}ยังไม่ได้ส่ง`;

        if (!isDone) {
            if (preset.advanceNoticeEnabled) {
                const advDays = getAdvanceDaysCount(
                    preset.advanceNoticeValue || 3,
                    preset.advanceNoticeUnit || 'DAYS'
                );
                daysUntilDue = Math.max(0, differenceInCalendarDays(nextDueDate, referenceDate));
                if (daysUntilDue <= advDays) {
                    isDueSoon = true;
                    alertCategory = 'DUE_SOON';
                    statusBadgeText = `⏳ ใกล้ครบกำหนด${halfName} (อีก ${daysUntilDue} วัน)`;
                    statusShortBadgeText = `⏳ อีก ${daysUntilDue} วัน (${halfName})`;
                } else {
                    alertCategory = 'UP_TO_DATE';
                }
            } else {
                alertCategory = 'OVERDUE';
            }
        }

        return {
            isRecurring: true,
            cycleKey,
            cycleStartDate,
            cadenceLabel: 'กลางเดือนและสิ้นเดือน',
            periodLabel,
            isCompletedInCurrentCycle: isDone,
            statusBadgeText,
            statusShortBadgeText,
            autoCaseTitle,
            latestRecord,
            currentCycleRecord,
            nextDueDate,
            isDueSoon,
            daysUntilDue: isDueSoon ? daysUntilDue : undefined,
            alertCategory
        };
    }

    // 3. MONTHLY (ประจำทุกเดือน)
    if (cycle === 'MONTHLY') {
        const periodLabel = `${currentMonthName} ${buddhistYear}`;
        const autoCaseTitle = `${basePrefix} - ${periodLabel}`;
        const monthStart = startOfMonth(referenceDate);
        const nextDueDate = endOfMonth(referenceDate);
        const cycleKey = `MONTHLY_${format(monthStart, 'yyyy-MM')}`;

        const currentCycleRecord =
            presetRecords.find(r => {
                const d = new Date(r.submittedAt);
                return (
                    !isNaN(d.getTime()) &&
                    d.getMonth() === referenceDate.getMonth() &&
                    d.getFullYear() === referenceDate.getFullYear()
                );
            }) || null;

        const isDone = !!currentCycleRecord;
        let isDueSoon = false;
        let daysUntilDue = 0;
        let alertCategory: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' = 'UP_TO_DATE';
        let statusBadgeText = isDone ? '✅ เดือนนี้ส่งแล้ว' : '⏰ รอบเดือนนี้ยังไม่ได้ส่ง';
        let statusShortBadgeText = isDone ? '✅ เดือนนี้ส่งแล้ว' : '⏰ รอบเดือนนี้ยังไม่ได้ส่ง';

        if (!isDone) {
            if (preset.advanceNoticeEnabled) {
                const advDays = getAdvanceDaysCount(preset.advanceNoticeValue || 3, preset.advanceNoticeUnit || 'DAYS');
                daysUntilDue = Math.max(0, differenceInCalendarDays(nextDueDate, referenceDate));
                if (daysUntilDue <= advDays) {
                    isDueSoon = true;
                    alertCategory = 'DUE_SOON';
                    statusBadgeText = `⏳ ใกล้ครบกำหนดเดือนนี้ (อีก ${daysUntilDue} วัน)`;
                    statusShortBadgeText = `⏳ อีก ${daysUntilDue} วัน`;
                } else {
                    alertCategory = 'UP_TO_DATE';
                }
            } else {
                alertCategory = 'OVERDUE';
            }
        }

        return {
            isRecurring: true,
            cycleKey,
            cycleStartDate: monthStart,
            cadenceLabel: 'ประจำทุกเดือน',
            periodLabel: `ประจำเดือน${periodLabel}`,
            isCompletedInCurrentCycle: isDone,
            statusBadgeText,
            statusShortBadgeText,
            autoCaseTitle,
            latestRecord,
            currentCycleRecord,
            nextDueDate,
            isDueSoon,
            daysUntilDue: isDueSoon ? daysUntilDue : undefined,
            alertCategory
        };
    }

    // 3. WEEKLY (ประจำทุกสัปดาห์: จันทร์ - อาทิตย์)
    if (cycle === 'WEEKLY') {
        const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });
        const cycleKey = `WEEKLY_${format(weekStart, 'yyyy-MM-dd')}`;
        const startStr = weekStart.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short'
        });
        const endStr = weekEnd.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const periodLabel = `สัปดาห์ ${startStr} – ${endStr}`;
        const autoCaseTitle = `${basePrefix} - ${periodLabel}`;

        const currentCycleRecord =
            presetRecords.find(r => {
                const d = new Date(r.submittedAt);
                return (
                    !isNaN(d.getTime()) &&
                    isWithinInterval(d, { start: weekStart, end: weekEnd })
                );
            }) || null;

        const isDone = !!currentCycleRecord;
        let isDueSoon = false;
        let daysUntilDue = 0;
        let alertCategory: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' = 'UP_TO_DATE';
        let statusBadgeText = isDone ? '✅ สัปดาห์นี้ส่งแล้ว' : '⏰ รอบสัปดาห์นี้ยังไม่ได้ส่ง';
        let statusShortBadgeText = isDone ? '✅ สัปดาห์นี้ส่งแล้ว' : '⏰ รอบสัปดาห์นี้ยังไม่ได้ส่ง';

        if (!isDone) {
            if (preset.advanceNoticeEnabled) {
                const advDays = getAdvanceDaysCount(preset.advanceNoticeValue || 2, preset.advanceNoticeUnit || 'DAYS');
                daysUntilDue = Math.max(0, differenceInCalendarDays(weekEnd, referenceDate));
                if (daysUntilDue <= advDays) {
                    isDueSoon = true;
                    alertCategory = 'DUE_SOON';
                    statusBadgeText = `⏳ ใกล้ครบกำหนดสัปดาห์นี้ (อีก ${daysUntilDue} วัน)`;
                    statusShortBadgeText = `⏳ อีก ${daysUntilDue} วัน`;
                } else {
                    alertCategory = 'UP_TO_DATE';
                }
            } else {
                alertCategory = 'OVERDUE';
            }
        }

        return {
            isRecurring: true,
            cycleKey,
            cycleStartDate: weekStart,
            cadenceLabel: 'ประจำทุกสัปดาห์',
            periodLabel,
            isCompletedInCurrentCycle: isDone,
            statusBadgeText,
            statusShortBadgeText,
            autoCaseTitle,
            latestRecord,
            currentCycleRecord,
            nextDueDate: weekEnd,
            isDueSoon,
            daysUntilDue: isDueSoon ? daysUntilDue : undefined,
            alertCategory
        };
    }

    // 4. DAILY (ประจำทุกวัน)
    if (cycle === 'DAILY') {
        const dayStart = startOfDay(referenceDate);
        const dayEnd = endOfDay(referenceDate);
        const cycleKey = `DAILY_${format(dayStart, 'yyyy-MM-dd')}`;
        const todayStr = referenceDate.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const periodLabel = `ประจำวันที่ ${todayStr}`;
        const autoCaseTitle = `${basePrefix} - ${todayStr}`;

        const currentCycleRecord =
            presetRecords.find(r => {
                const d = new Date(r.submittedAt);
                return !isNaN(d.getTime()) && isSameDay(d, referenceDate);
            }) || null;

        const isDone = !!currentCycleRecord;

        return {
            isRecurring: true,
            cycleKey,
            cycleStartDate: dayStart,
            cadenceLabel: 'ประจำทุกวัน',
            periodLabel,
            isCompletedInCurrentCycle: isDone,
            statusBadgeText: isDone ? '✅ วันนี้ส่งแล้ว' : '⏰ รอบวันนี้ยังไม่ได้ส่ง',
            statusShortBadgeText: isDone
                ? '✅ วันนี้ส่งแล้ว'
                : '⏰ รอบวันนี้ยังไม่ได้ส่ง',
            autoCaseTitle,
            latestRecord,
            currentCycleRecord,
            nextDueDate: dayEnd,
            alertCategory: isDone ? 'UP_TO_DATE' : 'OVERDUE'
        };
    }

    // 5. CUSTOM (กำหนดความถี่เอง เช่น ทุก 3 เดือน / ทุก 15 วัน / ทุก 2 สัปดาห์)
    const intervalCount = Math.max(1, preset.customIntervalCount || 3);
    const intervalUnit: ChecklistCustomIntervalUnit =
        preset.customIntervalUnit || 'MONTHS';
    const unitLabel = getCustomUnitLabel(intervalUnit);
    const cadenceLabel = `ทุก ${intervalCount} ${unitLabel}`;

    const periodLabel =
        intervalUnit === 'MONTHS'
            ? `รอบ ${currentMonthName} ${buddhistYear} (${cadenceLabel})`
            : `รอบ ${referenceDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
              })} (${cadenceLabel})`;

    const autoCaseTitle = `${basePrefix} - ${periodLabel}`;

    let isDone = false;
    let nextDueDate: Date | null = null;
    let currentCycleRecord: SavedChecklistRecord | null = null;
    let cycleStartDate =
        intervalUnit === 'MONTHS'
            ? startOfMonth(referenceDate)
            : startOfDay(referenceDate);

    if (latestRecord) {
        const lastDate = new Date(latestRecord.submittedAt);
        if (!isNaN(lastDate.getTime())) {
            if (intervalUnit === 'DAYS') {
                nextDueDate = startOfDay(addDays(lastDate, intervalCount));
            } else if (intervalUnit === 'WEEKS') {
                nextDueDate = startOfDay(addWeeks(lastDate, intervalCount));
            } else {
                nextDueDate = startOfMonth(addMonths(lastDate, intervalCount));
            }

            if (
                referenceDate.getTime() < endOfDay(nextDueDate).getTime() &&
                referenceDate.getTime() < nextDueDate.getTime()
            ) {
                isDone = true;
                currentCycleRecord = latestRecord;
            } else {
                cycleStartDate = nextDueDate;
            }
        }
    }

    const cycleKey = `CUSTOM_${intervalCount}${intervalUnit}_${format(cycleStartDate, 'yyyy-MM-dd')}`;

    const nextDueStr = nextDueDate
        ? nextDueDate.toLocaleDateString('th-TH', {
              day: 'numeric',
              month: 'short',
              year: '2-digit'
          })
        : '';

    let isDueSoon = false;
    let daysUntilDue = 0;
    let alertCategory: 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE' = 'UP_TO_DATE';
    let statusBadgeText = isDone
        ? `✅ รอบนี้ส่งแล้ว (${cadenceLabel}${nextDueStr ? ` · รอบถัดไป ${nextDueStr}` : ''})`
        : `⏰ รอบ${cadenceLabel}ยังไม่ได้ส่ง`;
    let statusShortBadgeText = isDone
        ? `✅ ส่งแล้ว (${cadenceLabel})`
        : `⏰ รอส่ง (${cadenceLabel})`;

    if (!isDone) {
        if (nextDueDate && referenceDate.getTime() >= nextDueDate.getTime()) {
            alertCategory = 'OVERDUE';
        } else if (nextDueDate && preset.advanceNoticeEnabled) {
            const advDays = getAdvanceDaysCount(preset.advanceNoticeValue || 3, preset.advanceNoticeUnit || 'DAYS');
            daysUntilDue = Math.max(0, differenceInCalendarDays(nextDueDate, referenceDate));
            if (daysUntilDue <= advDays) {
                isDueSoon = true;
                alertCategory = 'DUE_SOON';
                statusBadgeText = `⏳ ใกล้ครบกำหนด (${cadenceLabel} · อีก ${daysUntilDue} วัน)`;
                statusShortBadgeText = `⏳ อีก ${daysUntilDue} วัน`;
            } else {
                alertCategory = 'UP_TO_DATE';
            }
        } else {
            alertCategory = 'OVERDUE';
        }
    }

    return {
        isRecurring: true,
        cycleKey,
        cycleStartDate,
        cadenceLabel,
        periodLabel,
        isCompletedInCurrentCycle: isDone,
        statusBadgeText,
        statusShortBadgeText,
        autoCaseTitle,
        latestRecord,
        currentCycleRecord,
        nextDueDate,
        isDueSoon,
        daysUntilDue: isDueSoon ? daysUntilDue : undefined,
        alertCategory
    };
};
