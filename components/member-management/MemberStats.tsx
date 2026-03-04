import React from 'react';
import { User } from '../../types';

interface MemberStatsProps {
    users: User[];
    activeCount: number;
    adminCount: number;
}

export const MemberStats: React.FC<MemberStatsProps> = ({ users, activeCount, adminCount }) => {
    return (
        <div className="px-8 py-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">{users.length}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Members</p>
                    <p className="text-sm font-bold text-gray-700">สมาชิกทั้งหมด</p>
                </div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black">{activeCount}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Active</p>
                    <p className="text-sm font-bold text-gray-700">พร้อมทำงาน</p>
                </div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-black">{adminCount}</div>
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Admins</p>
                    <p className="text-sm font-bold text-gray-700">ผู้ดูแลระบบ</p>
                </div>
            </div>
        </div>
    );
};
