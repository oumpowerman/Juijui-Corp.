export interface OvertimeSummary {
    normal: number;   // 1.5x (NORMAL_DAY)
    holiday: number;  // 2.0x (HOLIDAY)
    special: number;  // 3.0x (HOLIDAY_OVERTIME)
    total: number;
}

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
    scanStatus: 'NOT_FOUND' | 'EARLY' | 'OK';
    checkoutDisplay: string;
    reqHours: number;
}
