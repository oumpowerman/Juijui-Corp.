import {
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
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
}

export const getCustomUnitLabel = (unit?: ChecklistCustomIntervalUnit): string => {
    if (unit === 'DAYS') return 'วัน';
    if (unit === 'WEEKS') return 'สัปดาห์';
    return 'เดือน';
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

    // 2. MONTHLY (ประจำทุกเดือน)
    if (cycle === 'MONTHLY') {
        const periodLabel = `${currentMonthName} ${buddhistYear}`;
        const autoCaseTitle = `${basePrefix} - ${periodLabel}`;
        const monthStart = startOfMonth(referenceDate);
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

        return {
            isRecurring: true,
            cycleKey,
            cycleStartDate: monthStart,
            cadenceLabel: 'ประจำทุกเดือน',
            periodLabel: `ประจำเดือน${periodLabel}`,
            isCompletedInCurrentCycle: isDone,
            statusBadgeText: isDone
                ? '✅ เดือนนี้ส่งแล้ว'
                : '⏰ รอบเดือนนี้ยังไม่ได้ส่ง',
            statusShortBadgeText: isDone
                ? '✅ เดือนนี้ส่งแล้ว'
                : '⏰ รอบเดือนนี้ยังไม่ได้ส่ง',
            autoCaseTitle,
            latestRecord,
            currentCycleRecord,
            nextDueDate: null
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

        return {
            isRecurring: true,
            cycleKey,
            cycleStartDate: weekStart,
            cadenceLabel: 'ประจำทุกสัปดาห์',
            periodLabel,
            isCompletedInCurrentCycle: isDone,
            statusBadgeText: isDone
                ? '✅ สัปดาห์นี้ส่งแล้ว'
                : '⏰ รอบสัปดาห์นี้ยังไม่ได้ส่ง',
            statusShortBadgeText: isDone
                ? '✅ สัปดาห์นี้ส่งแล้ว'
                : '⏰ รอบสัปดาห์นี้ยังไม่ได้ส่ง',
            autoCaseTitle,
            latestRecord,
            currentCycleRecord,
            nextDueDate: null
        };
    }

    // 4. DAILY (ประจำทุกวัน)
    if (cycle === 'DAILY') {
        const dayStart = startOfDay(referenceDate);
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
            nextDueDate: null
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

    return {
        isRecurring: true,
        cycleKey,
        cycleStartDate,
        cadenceLabel,
        periodLabel,
        isCompletedInCurrentCycle: isDone,
        statusBadgeText: isDone
            ? `✅ รอบนี้ส่งแล้ว (${cadenceLabel}${nextDueStr ? ` · รอบถัดไป ${nextDueStr}` : ''})`
            : `⏰ รอบ${cadenceLabel}ยังไม่ได้ส่ง`,
        statusShortBadgeText: isDone
            ? `✅ ส่งแล้ว (${cadenceLabel})`
            : `⏰ รอส่ง (${cadenceLabel})`,
        autoCaseTitle,
        latestRecord,
        currentCycleRecord,
        nextDueDate
    };
};
