
import React from 'react';
import { User, KPIRecord, KPIConfig } from '../../types';
import { GraduationCap, Briefcase, Sparkles, Award } from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import { motion } from 'framer-motion';

interface KPISummaryCardProps {
    user: User;
    record?: KPIRecord;
    gradeData: {
        final: number;
        breakdown: { okrScore: number; behaviorScore: number; attendanceScore: number };
    };
    config: KPIConfig;
}

const KPISummaryCard: React.FC<KPISummaryCardProps> = ({ user, record, gradeData, config }) => {
    const monthsWorked = user.startDate ? differenceInMonths(new Date(), new Date(user.startDate)) : 0;
    const isIntern = user.employmentType === 'INTERN';
    const isProbation = user.employmentType === 'PROBATION';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100 border border-gray-100 flex flex-col md:flex-row gap-8 relative overflow-hidden group"
        >
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-50/30 rounded-tr-full -ml-8 -mb-8 blur-2xl"></div>

            <div className="flex-1 flex gap-6 relative z-10">
                <div className="relative shrink-0">
                    <motion.div 
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        className="relative"
                    >
                        <img src={user.avatarUrl} className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl ring-1 ring-gray-100" alt={user.name} />
                        <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-bold uppercase shadow-lg border-2 border-white tracking-widest">
                            {user.employmentType || 'MEMBER'}
                        </div>
                    </motion.div>
                </div>
                <div className="flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{user.name}</h2>
                    <p className="text-indigo-500 font-bold text-sm mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> {user.position}
                    </p>
                    <div className="flex gap-2">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm border ${record?.status === 'PAID' ? 'bg-green-500 text-white border-green-400' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {record?.status || 'PENDING'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-px bg-gray-100 hidden md:block h-20 self-center"></div>

            {/* Tracker Widget */}
            <div className="flex-1 flex flex-col justify-center relative z-10">
                {(isIntern || isProbation) ? (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center">
                            <GraduationCap className="w-4 h-4 mr-2 text-indigo-500" /> 
                            {isIntern ? 'Internship Journey' : 'Probation Tracker'}
                        </h4>
                        <div className="flex items-end gap-2">
                            <span className="text-5xl font-bold text-indigo-600 leading-none">{monthsWorked}</span>
                            <span className="text-sm font-bold text-gray-400 mb-1">/ 4 Months</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((monthsWorked/4)*100, 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-inner"
                            ></motion.div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center">
                            <Award className="w-4 h-4 mr-2 text-emerald-500" /> 
                            Total Performance
                        </h4>
                        <div className="flex items-end gap-2">
                            <motion.span 
                                key={gradeData.final}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className={`text-6xl font-bold leading-none drop-shadow-sm ${gradeData.final >= 80 ? 'text-emerald-500' : gradeData.final >= 60 ? 'text-indigo-600' : 'text-gray-800'}`}
                            >
                                {gradeData.final}
                            </motion.span>
                            <span className="text-sm font-bold text-gray-400 mb-2">/ 100</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-indigo-100">OKR {gradeData.breakdown.okrScore}%</span>
                            <span className="bg-pink-50 text-pink-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-pink-100">BEHAV {gradeData.breakdown.behaviorScore}%</span>
                            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-100">DISC {gradeData.breakdown.attendanceScore}%</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default KPISummaryCard;
