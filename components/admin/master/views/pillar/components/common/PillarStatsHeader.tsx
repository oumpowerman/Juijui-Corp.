import React from 'react';
import { Tv, Layers, LayoutTemplate, Globe } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { PillarStats } from '../../types';

interface PillarStatsHeaderProps {
    stats: PillarStats;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: -12 },
    show: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            type: 'spring', 
            damping: 20, 
            stiffness: 260 
        } 
    }
};

export const PillarStatsHeader: React.FC<PillarStatsHeaderProps> = ({ stats }) => {
    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
            <motion.div 
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
            >
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">ช่องที่ตั้งค่าแล้ว</p>
                    <h4 className="text-xl font-black text-gray-800 mt-0.5">
                        {stats.channelsWithPillars} <span className="text-xs font-normal text-gray-400">/ {stats.totalChannels} ช่อง</span>
                    </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Tv className="w-5 h-5" />
                </div>
            </motion.div>

            <motion.div 
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
            >
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pillars (แกนหลัก)</p>
                    <h4 className="text-xl font-black text-indigo-600 mt-0.5">
                        {stats.totalPillars} <span className="text-xs font-normal text-emerald-600">({stats.activePillars} เปิดใช้)</span>
                    </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Layers className="w-5 h-5" />
                </div>
            </motion.div>

            <motion.div 
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
            >
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Categories (หมวดหมู่)</p>
                    <h4 className="text-xl font-black text-purple-600 mt-0.5">
                        {stats.totalCategories} <span className="text-xs font-normal text-emerald-600">({stats.activeCategories} เปิดใช้)</span>
                    </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
                    <LayoutTemplate className="w-5 h-5" />
                </div>
            </motion.div>

            <motion.div 
                variants={itemVariants}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
            >
                <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Global / ส่วนกลาง</p>
                    <h4 className="text-xl font-black text-amber-600 mt-0.5">
                        {stats.globalPillarsCount} <span className="text-xs font-normal text-gray-400">Pillars</span>
                    </h4>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Globe className="w-5 h-5" />
                </div>
            </motion.div>
        </motion.div>
    );
};
export default PillarStatsHeader;

