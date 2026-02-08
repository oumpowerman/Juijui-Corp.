
import React from 'react';
import { User, KPIRecord } from '../../types';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { X, Printer } from 'lucide-react';

interface KPIExportSlipProps {
    user: User;
    record: KPIRecord;
    grade: string;
    bonus: number;
    month: string;
    onClose: () => void;
}

const KPIExportSlip: React.FC<KPIExportSlipProps> = ({ user, record, grade, bonus, month, onClose }) => {
    
    const breakdown = record.finalScoreBreakdown || { okrScore: 0, behaviorScore: 0, attendanceScore: 0 };
    const stats = record.statsSnapshot || { taskCompleted: 0, attendanceLate: 0, dutyMissed: 0 };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 print:p-0 print:bg-white print:absolute print:inset-0">
            {/* Controls (Hidden on Print) */}
            <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg">
                    <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button onClick={onClose} className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Slip Paper */}
            <div className="bg-white w-full max-w-2xl p-8 md:p-12 rounded-none md:rounded-lg shadow-2xl print:shadow-none print:w-full print:max-w-none h-auto max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible">
                
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-6 mb-6">
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-widest">Performance Review Slip</h1>
                    <p className="text-gray-500 font-bold mt-1">Juijui Planner Co., Ltd.</p>
                    <p className="text-sm text-gray-400 mt-2">Period: {month}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Employee</p>
                        <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                        <p className="text-sm text-gray-600">{user.position}</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Score</p>
                        <h2 className="text-4xl font-black text-indigo-600">{record.totalScore} <span className="text-lg text-gray-400">/ 100</span></h2>
                        <div className="inline-block bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded mt-1">Grade {grade}</div>
                    </div>
                </div>

                {/* Breakdown Table */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-100 text-left text-xs text-gray-400 uppercase font-black">
                                <th className="py-2">Category</th>
                                <th className="py-2 text-right">Weight</th>
                                <th className="py-2 text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium text-gray-700">
                            <tr className="border-b border-gray-50">
                                <td className="py-3">Performance (OKRs)</td>
                                <td className="py-3 text-right text-gray-400">50%</td>
                                <td className="py-3 text-right font-bold">{breakdown.okrScore}</td>
                            </tr>
                            <tr className="border-b border-gray-50">
                                <td className="py-3">Behavior & Values</td>
                                <td className="py-3 text-right text-gray-400">30%</td>
                                <td className="py-3 text-right font-bold">{breakdown.behaviorScore}</td>
                            </tr>
                            <tr className="border-b border-gray-50">
                                <td className="py-3">Discipline & Attendance</td>
                                <td className="py-3 text-right text-gray-400">20%</td>
                                <td className="py-3 text-right font-bold">{breakdown.attendanceScore}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 font-bold">
                                <td className="py-3 pl-2">Total</td>
                                <td className="py-3"></td>
                                <td className="py-3 text-right pr-2">{record.totalScore}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Stats Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-8 text-xs text-gray-600 grid grid-cols-3 gap-4 border border-gray-200">
                     <div className="text-center border-r border-gray-200">
                         <span className="block font-bold text-gray-800 text-lg">{stats.taskCompleted}</span>
                         Tasks Done
                     </div>
                     <div className="text-center border-r border-gray-200">
                         <span className="block font-bold text-red-500 text-lg">{stats.attendanceLate}</span>
                         Late Arrivals
                     </div>
                     <div className="text-center">
                         <span className="block font-bold text-orange-500 text-lg">{stats.dutyMissed}</span>
                         Missed Duty
                     </div>
                </div>

                {/* Bonus Section */}
                <div className="flex justify-between items-center bg-green-50 p-6 rounded-xl border border-green-200 mb-12">
                    <div>
                        <h4 className="font-bold text-green-800 text-lg">Incentive Reward</h4>
                        <p className="text-xs text-green-600">Gamification Bonus</p>
                    </div>
                    <div className="text-right">
                         <span className="text-2xl font-black text-green-700">+{bonus.toLocaleString()}</span>
                         <span className="text-xs font-bold text-green-600 block uppercase">Coins / JP</span>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 mt-auto pt-8">
                    <div className="text-center">
                        <div className="border-b border-gray-300 h-10 mb-2"></div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Employee Signature</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-gray-300 h-10 mb-2"></div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Approver Signature</p>
                    </div>
                </div>

                <div className="text-center mt-12 text-[10px] text-gray-300">
                    Generated by Juijui Planner System on {format(new Date(), 'dd/MM/yyyy HH:mm')}
                </div>
            </div>
        </div>
    );
};

export default KPIExportSlip;
