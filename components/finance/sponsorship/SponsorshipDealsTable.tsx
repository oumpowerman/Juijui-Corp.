import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Coins, 
    Building2, 
    CheckCircle2, 
    Clock, 
    Calendar, 
    FileText, 
    ArrowUpRight, 
    Loader2, 
    Sparkles, 
    Video 
} from 'lucide-react';
import { SponsorshipDealItem } from './types';
import SponsorshipPagination from './SponsorshipPagination';

interface SponsorshipDealsTableProps {
    deals: SponsorshipDealItem[];
    isLoading: boolean;
    onSelectTask?: (taskId: string) => void;
}

const PAGE_SIZE = 10;

export const SponsorshipDealsTable: React.FC<SponsorshipDealsTableProps> = ({
    deals,
    isLoading,
    onSelectTask,
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Reset to page 1 whenever deal list changes
    useEffect(() => {
        setCurrentPage(1);
    }, [deals.length]);

    const paginatedDeals = useMemo(() => {
        const startIndex = (currentPage - 1) * PAGE_SIZE;
        return deals.slice(startIndex, startIndex + PAGE_SIZE);
    }, [deals, currentPage]);

    if (isLoading) {
        return (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-xs">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">กำลังโหลดรายการดีลสปอนเซอร์...</p>
            </div>
        );
    }

    if (deals.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-16 text-center space-y-2 bg-white rounded-3xl border border-slate-200 shadow-xs"
            >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2">
                    <Coins className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700">ไม่พบรายการดีลสปอนเซอร์</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    เมื่อคุณสร้างหรือแก้ไขคอนเทนต์พร้อมระบุสปอนเซอร์ รายการและสถานะการชำระเงินจะมาปรากฏที่นี่อัตโนมัติ
                </p>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                <th className="py-4 px-5">ลูกค้า / สปอนเซอร์</th>
                                <th className="py-4 px-4">ชื่องานคอนเทนต์</th>
                                <th className="py-4 px-4 text-right">มูลค่าดีล</th>
                                <th className="py-4 px-4 text-center">สถานะการชำระ</th>
                                <th className="py-4 px-4">เงื่อนไข / Note</th>
                                <th className="py-4 px-4 text-right">ใบแจ้งหนี้ / Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            <AnimatePresence mode="popLayout">
                                {paginatedDeals.map((deal, index) => {
                                    const isPaid = deal.paymentStatus === 'PAID' || deal.isPaid;
                                    const rowKey = deal.id ? `deal-${deal.id}-${index}` : `deal-idx-${index}`;

                                    return (
                                        <motion.tr 
                                            key={rowKey}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                                            className="hover:bg-amber-50/30 transition-colors group"
                                        >
                                            {/* Client Info */}
                                            <td className="py-4 px-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-amber-200 transition-colors">
                                                        {deal.client?.logoUrl ? (
                                                            <img 
                                                                src={deal.client.logoUrl} 
                                                                alt={deal.client?.name} 
                                                                className="w-full h-full object-contain p-1" 
                                                                onError={(e) => {
                                                                    (e.target as HTMLElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 truncate group-hover:text-amber-600 transition-colors">
                                                            {deal.client?.name || 'ไม่มีชื่อลูกค้า'}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 truncate">
                                                            {deal.client?.contactPerson || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Task / Content Title */}
                                            <td className="py-4 px-4 max-w-xs">
                                                {deal.task ? (
                                                    <div>
                                                        <p 
                                                            className="font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1 flex items-center gap-1.5"
                                                            onClick={() => onSelectTask?.(deal.task!.id)}
                                                            title="คลิกเพื่อดูรายละเอียดงาน"
                                                        >
                                                            <Video className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                            <span className="truncate">{deal.task.title}</span>
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                                                                {deal.task.status}
                                                            </span>
                                                            {deal.task.plannedDate && (
                                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                                    <Calendar className="w-2.5 h-2.5 text-slate-400" />
                                                                    {new Date(deal.task.plannedDate).toLocaleDateString('th-TH')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic text-[11px]">งานถูกลบหรือไม่มีข้อมูล</span>
                                                )}
                                            </td>

                                            {/* Deal Value */}
                                            <td className="py-4 px-4 text-right">
                                                <span className="font-black text-sm text-slate-900">
                                                    ฿{(deal.dealValue || 0).toLocaleString()}
                                                </span>
                                            </td>

                                            {/* Payment Status */}
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black ${
                                                    isPaid 
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                }`}>
                                                    {isPaid ? (
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                    ) : (
                                                        <Clock className="w-3 h-3 text-amber-600" />
                                                    )}
                                                    {isPaid ? 'PAID' : 'UNPAID'}
                                                </span>
                                            </td>

                                            {/* Requirements / Notes */}
                                            <td className="py-4 px-4 max-w-[200px]">
                                                <p className="text-slate-600 text-[11px] truncate" title={deal.requirements}>
                                                    {deal.requirements || '—'}
                                                </p>
                                            </td>

                                            {/* Invoice / Actions */}
                                            <td className="py-4 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {deal.invoiceUrl ? (
                                                        <motion.a
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            href={deal.invoiceUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors inline-flex items-center gap-1 text-[11px] font-bold"
                                                            title="เปิดใบแจ้งหนี้ / Invoice"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            <span>Invoice</span>
                                                            <ArrowUpRight className="w-3 h-3" />
                                                        </motion.a>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-300 font-medium">ไม่มีใบแจ้งหนี้</span>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <SponsorshipPagination
                currentPage={currentPage}
                totalItems={deals.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="ดีล"
            />
        </div>
    );
};

export default SponsorshipDealsTable;
