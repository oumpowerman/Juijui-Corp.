
export type ReportStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TribunalReport {
    id: string;
    reporter_id: string;
    target_id?: string;
    category: string;
    description: string;
    evidence_file_id?: string;
    evidence_url?: string;
    status: ReportStatus;
    admin_feedback?: string;
    reward_hp?: number;
    reward_points?: number;
    penalty_hp?: number;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
}

export interface TribunalConfig {
    enabled: boolean;
    reward_hp: number;
    reward_points: number;
    penalty_hp: number;
    false_report_penalty_hp: number;
    categories: {
        id: string;
        label: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }[];
}
