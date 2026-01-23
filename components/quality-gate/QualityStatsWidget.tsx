
import React from 'react';
import { ReviewSession } from '../../types';
import { CheckCircle2, AlertTriangle, Clock, Activity } from 'lucide-react';
import { isToday } from 'date-fns';

interface QualityStatsWidgetProps {
    reviews: ReviewSession[];
}

const QualityStatsWidget: React.FC<QualityStatsWidgetProps> = ({ reviews }) => {
    const pendingCount = reviews.filter(r => r.status === 'PENDING').length;
    const passedToday = reviews.filter(r => r.status === 'PASSED' && isToday(new Date(r.scheduledAt))).length;
    const reviseCount = reviews.filter(r => r.status === 'REVISE').length;
    const overdueCount = reviews.filter(r => r.status === 'PENDING' && new Date(r.scheduledAt) < new Date() && !isToday(new Date(r.scheduledAt))).length;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-yellow-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-yellow-600 uppercase">รอตรวจ (Pending)</span>
                    <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                        <Clock className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-3xl font-black text-gray-800 mt-2">{pendingCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-green-600 uppercase">ผ่านวันนี้ (Passed)</span>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-3xl font-black text-gray-800 mt-2">{passedToday}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-red-600 uppercase">สั่งแก้ (Revise)</span>
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Activity className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-3xl font-black text-gray-800 mt-2">{reviseCount}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-orange-600 uppercase">เลยกำหนด (Overdue)</span>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                    </div>
                </div>
                <p className="text-3xl font-black text-gray-800 mt-2">{overdueCount}</p>
            </div>
        </div>
    );
};

export default QualityStatsWidget;
