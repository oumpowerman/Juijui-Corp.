import React from 'react';
import { motion } from 'framer-motion';

interface InventoryStatsGridProps {
    stats: {
        total: number;
        topPillar: string;
        topCategory: string;
        health: string;
    };
}

const InventoryStatsGrid: React.FC<InventoryStatsGridProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40"
            >
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">ปริมาณคอนเทนต์ในคลัง</h4>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total} รายการ</p>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40"
            >
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">เสาหลักที่โดดเด่น</h4>
                <p className="text-2xl font-bold text-indigo-600 tracking-tight truncate">{stats.topPillar}</p>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }} 
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40"
            >
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">หมวดหมู่หลัก</h4>
                <p className="text-2xl font-bold text-emerald-600 tracking-tight truncate">{stats.topCategory}</p>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }} 
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40"
            >
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">สุขภาพของสัดส่วนคอนเทนต์</h4>
                <p className={`text-2xl font-bold tracking-tight ${stats.total > 15 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {stats.health === 'Healthy' ? 'สมดุลดี' : 'ควรเพิ่มคอนเทนต์'}
                </p>
            </motion.div>
        </div>
    );
};

export default InventoryStatsGrid;
