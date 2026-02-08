
import React from 'react';
import { User, KPIRecord, KPIConfig } from '../../types';
import { GraduationCap, Briefcase } from 'lucide-react';
import { differenceInMonths } from 'date-fns';

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
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full opacity-50 pointer-events-none"></div>

            <div className="flex-1 flex gap-4">
                <div className="relative shrink-0">
                    <img src={user.avatarUrl} className="w-20 h-20 rounded-2xl object-cover border-4 border-gray-100 shadow-sm" alt={user.name} />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shadow-sm">
                        {user.employmentType || 'MEMBER'}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-800">{user.name}</h2>
                    <p className="text-gray-500 text-sm mb-2">{user.position}</p>
                    <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${record?.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {record?.status || 'PENDING'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="w-px bg-gray-100 hidden md:block"></div>

            {/* Tracker Widget */}
            <div className="flex-1 flex flex-col justify-center">
                {(isIntern || isProbation) ? (
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                            <GraduationCap className="w-4 h-4 mr-1 text-indigo-500" /> 
                            {isIntern ? 'Internship Journey' : 'Probation Tracker'}
                        </h4>
                        <div className="flex items-end gap-2 mb-1">
                            <span className="text-3xl font-black text-indigo-600">{monthsWorked}</span>
                            <span className="text-sm font-bold text-gray-400 mb-1">/ 4 Months</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((monthsWorked/4)*100, 100)}%` }}></div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
                            <Briefcase className="w-4 h-4 mr-1 text-emerald-500" /> 
                            Total Performance
                        </h4>
                        <div className="flex items-end gap-2 mb-1">
                            <span className={`text-4xl font-black ${gradeData.final >= 80 ? 'text-emerald-600' : gradeData.final >= 60 ? 'text-indigo-600' : 'text-gray-700'}`}>
                                {gradeData.final}
                            </span>
                            <span className="text-sm font-bold text-gray-400 mb-1">/ 100</span>
                        </div>
                        <div className="flex gap-1 text-[9px] text-gray-400 font-medium">
                            <span className="bg-gray-50 px-1.5 py-0.5 rounded">OKR {gradeData.breakdown.okrScore}% ({config.weightOkr}%)</span>
                            <span className="bg-gray-50 px-1.5 py-0.5 rounded">Behav {gradeData.breakdown.behaviorScore}% ({config.weightBehavior}%)</span>
                            <span className="bg-gray-50 px-1.5 py-0.5 rounded">Disc {gradeData.breakdown.attendanceScore}% ({config.weightAttendance}%)</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KPISummaryCard;
