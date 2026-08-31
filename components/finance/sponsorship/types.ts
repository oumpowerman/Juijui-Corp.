import { Client } from '../../../types/task';

export interface SponsorshipDealItem {
    id: string;
    taskId: string;
    clientId?: string;
    isSponsored: boolean;
    dealValue: number;
    requirements?: string;
    paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
    isPaid: boolean;
    invoiceUrl?: string;
    createdAt?: string;
    updatedAt?: string;
    client?: Client | null;
    task?: {
        id: string;
        title: string;
        status: string;
        type?: string;
        plannedDate?: string;
        publishedAt?: string;
        channelId?: string;
        targetPlatforms?: string[];
    } | null;
}

export interface SponsorshipMetrics {
    totalRevenue: number;
    paidRevenue: number;
    unpaidRevenue: number;
    totalPartners: number;
    activeDealsCount: number;
}

export interface ClientDealStats {
    totalDeals: number;
    totalValue: number;
    paidValue: number;
    unpaidValue: number;
}
