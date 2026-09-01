import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, 
    Building2, 
    User as UserIcon, 
    Phone, 
    Mail, 
    DollarSign, 
    CheckCircle2, 
    Clock, 
    FileText, 
    ExternalLink, 
    Calendar, 
    Video, 
    Search, 
    ChevronRight,
    ArrowUpRight,
    Tag,
    Receipt
} from 'lucide-react';
import { Client } from '../../../types/task';
import { Channel } from '../../../types';
import { SponsorshipDealItem, ClientDealStats } from './types';
import { format, isValid } from 'date-fns';
import { th } from 'date-fns/locale';

interface SponsorshipClientDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    deals: SponsorshipDealItem[];
    stats: ClientDealStats;
    channels?: Channel[];
    onSelectTask?: (taskId: string) => void;
    onEditClient?: (client: Client) => void;
}

const SponsorshipClientDetailModal: React.FC<SponsorshipClientDetailModalProps> = ({
    isOpen,
    onClose,
    client,
    deals = [],
    stats,
    channels = [],
    onSelectTask,
    onEditClient,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');

    // Handle ESC key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const channelMap = useMemo(() => {
        const map = new Map<string, Channel>();
        channels.forEach(ch => map.set(ch.id, ch));
        return map;
    }, [channels]);

    const filteredDeals = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return deals.filter(deal => {
            const matchesQuery = !query || (
                (deal.task?.title && deal.task.title.toLowerCase().includes(query)) ||
                (deal.requirements && deal.requirements.toLowerCase().includes(query))
            );

            const isPaid = deal.paymentStatus === 'PAID' || deal.isPaid;
            const matchesStatus = 
                statusFilter === 'ALL' ? true :
                statusFilter === 'PAID' ? isPaid :
                !isPaid;

            return matchesQuery && matchesStatus;
        });
    }, [deals, searchQuery, statusFilter]);

    if (!isOpen || !client || typeof document === 'undefined') return null;

    const paidPercent = stats.totalValue > 0 
        ? Math.round((stats.paidValue / stats.totalValue) * 100) 
        : 0;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (!isValid(d)) return '-';
        return format(d, 'd MMM yyyy', { locale: th });
    };

    return createPortal(
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-6 md:p-8 font-kanit overflow-y-auto">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-10 my-auto"
            >
                {/* 1. Header Section */}
                <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-200/80 shrink-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                                {client.logoUrl ? (
                                    <img 
                                        src={client.logoUrl} 
                                        alt={client.name} 
                                        className="w-full h-full object-contain p-1.5"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
                                        {client.name}
                                    </h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/70 shrink-0">
                                        สปอนเซอร์
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        {client.contactPerson || 'ไม่ระบุผู้ติดต่อ'}
                                    </span>
                                    {client.phone && (
                                        <a href={`tel:${client.phone}`} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            {client.phone}
                                        </a>
                                    )}
                                    {client.email && (
                                        <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            {client.email}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {onEditClient && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onEditClient(client);
                                    }}
                                    className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl border border-slate-200/80 transition-colors cursor-pointer hidden sm:block"
                                >
                                    แก้ไขข้อมูล
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 2. Financial Summary KPI Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 sm:mt-5">
                        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                ยอดรวมที่เคยจ้าง
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base sm:text-lg font-bold text-slate-800">
                                    ฿{stats.totalValue.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                คอนเทนต์ทั้งหมด
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base sm:text-lg font-bold text-indigo-600">
                                    {stats.totalDeals}
                                </span>
                                <span className="text-xs font-medium text-slate-400">คลิป</span>
                            </div>
                        </div>

                        <div className="bg-emerald-50/70 p-3 sm:p-3.5 rounded-2xl border border-emerald-200/70 shadow-2xs">
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ชำระแล้ว
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base sm:text-lg font-bold text-emerald-700">
                                    ฿{stats.paidValue.toLocaleString()}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-600">({paidPercent}%)</span>
                            </div>
                        </div>

                        <div className="bg-amber-50/70 p-3 sm:p-3.5 rounded-2xl border border-amber-200/70 shadow-2xs">
                            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> ค้างชำระ
                            </span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-base sm:text-lg font-bold text-amber-700">
                                    ฿{stats.unpaidValue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Toolbar & Filter Section */}
                <div className="p-3 sm:p-4 bg-slate-50/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-indigo-500" />
                            รายการคลิปที่เคยจ้าง ({filteredDeals.length})
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-1 max-w-md justify-end">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[140px]">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาตามชื่อคลิป หรือเงื่อนไข..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center bg-white rounded-xl p-0.5 border border-slate-200 shrink-0">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    statusFilter === 'ALL'
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                onClick={() => setStatusFilter('PAID')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    statusFilter === 'PAID'
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-500 hover:text-emerald-700'
                                }`}
                            >
                                จ่ายแล้ว
                            </button>
                            <button
                                onClick={() => setStatusFilter('UNPAID')}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                                    statusFilter === 'UNPAID'
                                        ? 'bg-amber-600 text-white'
                                        : 'text-slate-500 hover:text-amber-700'
                                }`}
                            >
                                รอจ่าย
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Deals List Section */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                    {filteredDeals.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 space-y-2">
                            <Video className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                            <p className="text-sm font-bold text-slate-600">ไม่พบคอนเทนต์ที่ตรงกับเงื่อนไข</p>
                            <p className="text-xs text-slate-400">ยังไม่มีประวัติการจ้างงานหรือไม่มีรายการที่ตรงกับการค้นหา</p>
                        </div>
                    ) : (
                        filteredDeals.map((deal, idx) => {
                            const isPaid = deal.paymentStatus === 'PAID' || deal.isPaid;
                            const channel = deal.task?.channelId ? channelMap.get(deal.task.channelId) : null;
                            const platforms = deal.task?.targetPlatforms || [];
                            const cardKey = deal.id ? `client-deal-${deal.id}-${idx}` : `client-deal-idx-${idx}`;

                            return (
                                <motion.div
                                    key={cardKey}
                                    layout
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => {
                                        if (deal.taskId && onSelectTask) {
                                            onSelectTask(deal.taskId);
                                        }
                                    }}
                                    className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                                >
                                    {/* Left: Content Info */}
                                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <Video className="w-5 h-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                                    {deal.task?.title || 'คอนเทนต์ไม่มีชื่อ'}
                                                </h4>
                                                {channel && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200/60">
                                                        {channel.name}
                                                    </span>
                                                )}
                                                {deal.task?.status && (
                                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[10px] font-medium border border-slate-200/60">
                                                        {deal.task.status}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Details & Dates */}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                                {deal.task?.plannedDate && (
                                                    <span className="flex items-center gap-1 text-slate-500">
                                                        <Calendar className="w-3 h-3 text-slate-400" />
                                                        {formatDate(deal.task.plannedDate)}
                                                    </span>
                                                )}

                                                {platforms.length > 0 && (
                                                    <span className="flex items-center gap-1 text-slate-500">
                                                        <Tag className="w-3 h-3 text-slate-400" />
                                                        {platforms.join(', ')}
                                                    </span>
                                                )}

                                                {deal.invoiceUrl && (
                                                    <a 
                                                        href={deal.invoiceUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
                                                    >
                                                        <Receipt className="w-3 h-3" /> ใบแจ้งหนี้
                                                        <ArrowUpRight className="w-2.5 h-2.5" />
                                                    </a>
                                                )}
                                            </div>

                                            {deal.requirements && (
                                                <p className="text-xs text-slate-600 bg-slate-50/80 rounded-lg p-2 mt-2 border border-slate-100 line-clamp-2">
                                                    <span className="font-semibold text-slate-700">เงื่อนไข:</span> {deal.requirements}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Value, Payment Status & Action CTA */}
                                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                                        <div className="text-left md:text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                ยอดเงิน
                                            </p>
                                            <p className="text-base font-bold text-slate-800">
                                                ฿{deal.dealValue.toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                                isPaid 
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {isPaid ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                        จ่ายแล้ว
                                                    </>
                                                ) : (
                                                    <>
                                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                        รอชำระ
                                                    </>
                                                )}
                                            </span>

                                            <button 
                                                type="button"
                                                className="p-2 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                                                title="เปิดดูรายละเอียดคอนเทนต์ (Content Detail)"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* 5. Footer */}
                <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                    <span className="truncate pr-2">
                        คลิกที่รายการคลิปเพื่อเปิดดูหน้าจอ <strong>ContentDetail</strong> ของคลิปนั้น
                    </span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
                    >
                        ปิดหน้าต่าง
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default SponsorshipClientDetailModal;
