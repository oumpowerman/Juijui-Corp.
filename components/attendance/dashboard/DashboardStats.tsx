
import React from 'react';
import { Users, Clock, HeartPulse, BarChart3, UserX } from 'lucide-react';
import { User } from '../../../types';

interface DashboardStatsProps {
    totalCheckins: number;
    totalLates: number;
    lateRate: number;
    totalAbsents: number;
    totalLeaves: number;
    activeUsersCount: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
    totalCheckins,
    totalLates,
    lateRate,
    totalAbsents,
    totalLeaves,
    activeUsersCount
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Total Check-ins</p>
                    <h3 className="text-3xl font-black text-indigo-900">{totalCheckins}</h3>
                </div>
                <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm"><Users className="w-6 h-6"/></div>
            </div>
            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-orange-400 uppercase">Late Arrivals</p>
                    <h3 className="text-3xl font-black text-orange-900">{totalLates} <span className="text-xs text-orange-400 font-bold">({lateRate}%)</span></h3>
                </div>
                <div className="p-3 bg-white rounded-xl text-orange-500 shadow-sm"><Clock className="w-6 h-6"/></div>
            </div>
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-red-400 uppercase">Total Absents</p>
                    <h3 className="text-3xl font-black text-red-900">{totalAbsents}</h3>
                </div>
                <div className="p-3 bg-white rounded-xl text-red-500 shadow-sm"><UserX className="w-6 h-6"/></div>
            </div>
            <div className="bg-pink-50 p-5 rounded-2xl border border-pink-100 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-pink-400 uppercase">Total Leaves</p>
                    <h3 className="text-3xl font-black text-pink-900">{totalLeaves}</h3>
                </div>
                <div className="p-3 bg-white rounded-xl text-pink-500 shadow-sm"><HeartPulse className="w-6 h-6"/></div>
            </div>
        </div>
    );
};

export default DashboardStats;
