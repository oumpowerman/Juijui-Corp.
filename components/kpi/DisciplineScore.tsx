
import React from 'react';
import { KPIStats, KPIConfig } from '../../types';
import { Clock, ShieldAlert, Skull } from 'lucide-react';

interface DisciplineScoreProps {
    stats: KPIStats;
    config: KPIConfig;
}

const DisciplineScore: React.FC<DisciplineScoreProps> = ({ stats, config }) => {
    // Calculate Penalties
    const lateDeduction = stats.attendanceLate * config.penaltyLate;
    const dutyDeduction = stats.dutyMissed * config.penaltyMissedDuty;
    const absentDeduction = stats.attendanceAbsent * config.penaltyAbsent;
    
    const totalDeduction = lateDeduction + dutyDeduction + absentDeduction;
    const maxScore = 100; // Base 100% for this section
    const finalScore = Math.max(0, maxScore - totalDeduction);

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <ShieldAlert className="w-5 h-5 mr-2 text-orange-500" />
                    คะแนนวินัย (Discipline)
                </h3>
                <span className={`text-2xl font-black ${finalScore < 50 ? 'text-red-500' : 'text-green-600'}`}>
                    {finalScore.toFixed(0)}<span className="text-sm text-gray-400 font-medium">/100</span>
                </span>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Clock className="w-4 h-4" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-700">มาสาย (Late)</p>
                            <p className="text-[10px] text-gray-400">{stats.attendanceLate} ครั้ง (หักครั้งละ {config.penaltyLate}%)</p>
                        </div>
                    </div>
                    <span className="font-bold text-red-500">-{lateDeduction}%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Skull className="w-4 h-4" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-700">ขาดเวร (Missed Duty)</p>
                            <p className="text-[10px] text-gray-400">{stats.dutyMissed} ครั้ง (หักครั้งละ {config.penaltyMissedDuty}%)</p>
                        </div>
                    </div>
                    <span className="font-bold text-red-500">-{dutyDeduction}%</span>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                * คะแนนส่วนนี้จะถูกนำไปคูณน้ำหนัก {config.weightAttendance}% ในเกรดรวม
            </div>
        </div>
    );
};

export default DisciplineScore;
