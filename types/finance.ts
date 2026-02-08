
import { Task } from './task';

export type TransactionType = 'INCOME' | 'EXPENSE';
export type AssetType = 'NONE' | 'CONSUMABLE' | 'FIXED_ASSET';

export interface FinanceTransaction {
    id: string;
    type: TransactionType;
    categoryKey: string;
    amount: number;
    date: Date;
    name: string;
    description?: string;
    projectId?: string;
    shootTripId?: string;
    assetType: AssetType;
    receiptUrl?: string;
    createdBy: string;
    createdAt: Date;
    
    // Tax Fields
    vatRate?: number;
    vatAmount?: number;
    whtRate?: number;
    whtAmount?: number;
    netAmount?: number;
    taxInvoiceNo?: string;
    entityName?: string;
    taxId?: string;

    // Specific Payment Target
    targetUserId?: string;

    // Virtual / Joined fields
    projectTitle?: string;
    creator?: { name: string; avatarUrl: string };
    targetUser?: { name: string; avatarUrl: string };
    categoryLabel?: string;
    categoryColor?: string;
}

export interface FinanceStats {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    chartData: { name: string; value: number; color: string }[];
}

export interface ShootTrip {
    id: string;
    title: string;
    locationName: string;
    date: Date;
    status: 'PLANNED' | 'COMPLETED';
    totalCost?: number;
    clipCount?: number;
    avgCostPerClip?: number;
    expenses?: FinanceTransaction[];
    contents?: Task[];
}

// --- PAYROLL V5 (Enhanced) ---
export type CycleStatus = 'DRAFT' | 'WAITING_REVIEW' | 'READY_TO_PAY' | 'PAID';
export type SlipStatus = 'PENDING' | 'ACKNOWLEDGED' | 'DISPUTED' | 'PAID';

export interface DeductionItem {
    date: string;
    type: 'LATE' | 'ABSENT' | 'MISSED_DUTY';
    amount: number;
    details?: string;
}

export interface PayrollCycle {
    id: string;
    monthKey: string; // YYYY-MM
    status: CycleStatus;
    totalPayout: number;
    dueDate?: Date;
    createdBy?: string;
    finalizedBy?: string;
    createdAt: Date;
}

export interface PayrollSlip {
    id: string;
    cycleId: string;
    userId: string;
    
    // Earnings
    baseSalary: number;
    otHours: number;
    otPay: number;
    bonus: number;
    commission: number;
    allowance: number;
    totalIncome: number;

    // Deductions
    tax: number;
    sso: number;
    leaveDeduction: number;
    lateDeduction: number;
    advancePayment: number;
    totalDeduction: number;
    
    // Snapshot for audit trail
    deductionSnapshot?: DeductionItem[];

    // Net
    netTotal: number;
    
    note?: string;
    status: SlipStatus;
    disputeReason?: string;
    transferSlipUrl?: string;
    acknowledgedAt?: Date;
    
    // Virtual
    user?: { name: string; avatarUrl: string; position: string; bankAccount?: string; bankName?: string };
}
