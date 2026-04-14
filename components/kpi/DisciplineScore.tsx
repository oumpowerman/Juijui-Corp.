
import React, { useState } from 'react';
import { KPIStats, KPIConfig, DisciplineAuditLog } from '../../types';
import { Clock, ShieldAlert, Skull, AlertCircle, Calendar, Info, ChevronRight, Zap } from 'lucide-react';
import { useKPI } from '../../hooks/useKPI';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import DisciplineDetailModal from './DisciplineDetailModal';
import { motion } from 'framer-motion';

interface DisciplineScoreProps {
    stats: KPIStats;
    config: KPIConfig;
    userId: string;
    monthKey: string;
}

const DisciplineScore: React.FC<DisciplineScoreProps> = ({ stats, config, userId, monthKey }) => {
    const { fetchDisciplineAuditLogs } = useKPI();
    const [selectedCategory, setSelectedCategory] = useState<'LATE' | 'ABSENT' | 'TASK_OVERDUE' | 'MISSED_DUTY' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<DisciplineAuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Calculate Penalties
    const lateDeduction = stats.attendanceLate * config.penaltyLate;
    const dutyDeduction = stats.dutyMissed * config.penaltyMissedDuty;
    const absentDeduction = stats.attendanceAbsent * config.penaltyAbsent;
    const taskLateDeduction = stats.taskOverdue * 5;
    
    const totalDeduction = lateDeduction + dutyDeduction + absentDeduction + taskLateDeduction;
    const maxScore = 100; // Base 100% for this section
    const finalScore = Math.max(0, maxScore - totalDeduction);

    const handleCategoryClick = async (category: 'LATE' | 'ABSENT' | 'TASK_OVERDUE' | 'MISSED_DUTY') => {
        setSelectedCategory(category);
        setIsModalOpen(true);
        
        if (auditLogs.length === 0) {
            setIsLoading(true);
            try {
                const logs = await fetchDisciplineAuditLogs(userId, new Date(monthKey));
                setAuditLogs(logs);
            } catch (err) {
                console.error('Failed to fetch audit logs', err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 h-fit relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-full -mr-8 -mt-8 blur-2xl transition-transform duration-700 group-hover:scale-110"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center text-xl tracking-tight">
                        <ShieldAlert className="w-6 h-6 mr-3 text-orange-500 animate-pulse" />
                        คะแนนวินัย (Discipline)
                    </h3>
                    <p className="text-sm font-bold text-gray-400 mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> ประจำเดือน {format(new Date(monthKey), 'MMMM yyyy', { locale: th })}
                    </p>
                </div>
                <div className="text-right">
                    <motion.span 
                        key={finalScore}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className={`text-4xl font-bold block ${finalScore < 50 ? 'text-red-500' : 'text-emerald-600'}`}
                    >
                        {finalScore.toFixed(0)}
                    </motion.span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">/ 100 Points</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
                <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick('LATE')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50/50 transition-all group text-left shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-yellow-100 text-yellow-600 rounded-xl group-hover:rotate-12 transition-transform shadow-sm"><Clock className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">มาสาย</p>
                            <p className="text-sm font-bold text-gray-400">{stats.attendanceLate} ครั้ง</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-red-500">-{lateDeduction}%</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-yellow-400 transition-colors" />
                    </div>
                </motion.button>

                <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick('MISSED_DUTY')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all group text-left shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 text-red-600 rounded-xl group-hover:rotate-12 transition-transform shadow-sm"><Skull className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">พลาดเวร</p>
                            <p className="text-sm font-bold text-gray-400">{stats.dutyMissed} ครั้ง</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-red-500">-{dutyDeduction}%</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-400 transition-colors" />
                    </div>
                </motion.button>

                <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick('TASK_OVERDUE')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group text-left shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl group-hover:rotate-12 transition-transform shadow-sm"><AlertCircle className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">งานเลท</p>
                            <p className="text-sm font-bold text-gray-400">{stats.taskOverdue} ครั้ง</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-red-500">-{taskLateDeduction}%</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-400 transition-colors" />
                    </div>
                </motion.button>

                <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategoryClick('ABSENT')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-100 transition-all group text-left shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-200 text-gray-600 rounded-xl group-hover:rotate-12 transition-transform shadow-sm"><Info className="w-5 h-5" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">ขาดงาน</p>
                            <p className="text-sm font-bold text-gray-400">{stats.attendanceAbsent} ครั้ง</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-red-500">-{absentDeduction}%</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                </motion.button>
            </div>

            <div className="mt-8 p-4 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 opacity-10">
                    <Zap className="w-12 h-12 text-indigo-500" />
                </div>
                <div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm relative z-10">
                    <Info className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-indigo-600 leading-relaxed relative z-10">
                    จิ้มที่แต่ละหมวดหมู่เพื่อดูรายละเอียดประวัติการหักคะแนนย้อนหลังได้เลยครับ
                </p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 text-[11px] font-bold text-gray-400 text-center uppercase tracking-widest">
                * Weight: {config.weightAttendance}% of Total Grade
            </div>

            {/* Detail Modal */}
            <DisciplineDetailModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={selectedCategory}
                logs={auditLogs}
                monthKey={monthKey}
            />
        </motion.div>
    );
};

export default DisciplineScore;
