export interface OvertimeSummary {
    normal: number;   // 1.5x (NORMAL_DAY)
    holiday: number;  // 2.0x (HOLIDAY)
    special: number;  // 3.0x (HOLIDAY_OVERTIME)
    total: number;
}

export const OT_TYPE_DESCRIPTIONS: Record<'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME', string> = {
    NORMAL_DAY: "ค่าล่วงเวลาในวันทำงานปกติ (1.5 เท่า)",
    HOLIDAY: "ค่าทำงานในวันหยุด ตามเวลาปกติ (2.0 เท่า)",
    HOLIDAY_OVERTIME: "ค่าล่วงเวลาในวันหยุด เกินเวลาปกติ (3.0 เท่า)"
};

export interface ProcessedOtRequest {
    id: string;
    date: Date;
    durationHours: number;
    reason?: string | null;
    type: 'NORMAL_DAY' | 'HOLIDAY' | 'HOLIDAY_OVERTIME';
    startTime: string;
    endTime: string;
    source: string;
}

export interface MatchedOtRequest extends ProcessedOtRequest {
    actualScannedHours: number;
    scanStatus: 'NOT_FOUND' | 'EARLY' | 'OK' | 'FIXED';
    checkoutDisplay: string;
    reqHours: number;
}
