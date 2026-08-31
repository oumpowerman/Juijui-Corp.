import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Coins, CheckCircle2, Clock, Building2, Plus, ArrowUpRight } from 'lucide-react';
import { SponsorshipMetrics } from './types';

interface SponsorshipMetricsCardsProps {
    metrics: SponsorshipMetrics;
    totalDealsCount: number;
    onAddClient: () => void;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, y: 15, scale: 0.98 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24
        }
    },
};

export const SponsorshipMetricsCards: React.FC<SponsorshipMetricsCardsProps> = ({
    metrics,
    totalDealsCount,
    onAddClient,
}) => {
    const paidPercentage = metrics.totalRevenue > 0 
        ? Math.min(100, Math.round((metrics.paidRevenue / metrics.totalRevenue) * 100)) 
        : 0;

    const avgPerClient = metrics.totalPartners > 0 
        ? Math.round(metrics.totalRevenue / metrics.totalPartners) 
        : 0;

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
            {/* Card 1: Total Sponsorship Revenue */}
            <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden flex flex-col justify-between"
            >
                <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
                    <Coins className="w-28 h-28 -mr-6 -mt-6" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                            <Coins className="w-5 h-5 text-white" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs tracking-wider">
                            TOTAL DEALS
                        </span>
                    </div>
                    <p className="text-amber-100 text-xs font-bold uppercase tracking-wider">มูลค่าดีลสปอนเซอร์รวม</p>
                    <h3 className="text-2xl sm:text-3xl font-bold mt-1 tracking-tight">
                        ฿{metrics.totalRevenue.toLocaleString()}
                    </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-amber-100/90 font-medium relative z-10">
                    <span>จากทั้งหมด {totalDealsCount} ดีล</span>
                    <span className="font-bold">{metrics.totalPartners} แบรนด์</span>
                </div>
            </motion.div>

            {/* Card 2: Paid Revenue */}
            <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden flex flex-col justify-between group"
            >
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                            PAID
                        </span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">รับเงินเรียบร้อยแล้ว</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">
                        ฿{metrics.paidRevenue.toLocaleString()}
                    </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>สัดส่วนการชำระ</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                        {paidPercentage}%
                    </span>
                </div>
            </motion.div>

            {/* Card 3: Pending / Unpaid Revenue */}
            <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm relative overflow-hidden flex flex-col justify-between group"
            >
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                            PENDING
                        </span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">ยอดค้างชำระ / รอเงินเข้า</p>
                    <h3 className="text-2xl font-bold text-amber-600 mt-1 tracking-tight">
                        ฿{metrics.unpaidRevenue.toLocaleString()}
                    </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>ดีลที่รอชำระ</span>
                    <span className="font-bold text-amber-600">{metrics.activeDealsCount} รายการ</span>
                </div>
            </motion.div>

            {/* Card 4: Total Partners */}
            <motion.div
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden flex flex-col justify-between group"
            >
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <motion.button 
                            whileTap={{ scale: 0.92 }}
                            whileHover={{ scale: 1.08 }}
                            onClick={onAddClient}
                            className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-200 transition-colors"
                            title="เพิ่มลูกค้าใหม่"
                        >
                            <Plus className="w-4 h-4" />
                        </motion.button>
                    </div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">พาร์ตเนอร์ / ลูกค้าทั้งหมด</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1 tracking-tight">
                        {metrics.totalPartners} <span className="text-sm font-semibold text-slate-400">แบรนด์</span>
                    </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>เฉลี่ยต่อแบรนด์</span>
                    <span className="font-bold text-indigo-600">
                        ฿{avgPerClient.toLocaleString()}
                    </span>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SponsorshipMetricsCards;
