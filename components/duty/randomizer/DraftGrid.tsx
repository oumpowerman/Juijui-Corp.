
import React, { useState } from 'react';
import { Duty, User } from '../../../types';
import { format } from 'date-fns';
import { Users, MoreHorizontal, UserCircle2, ArrowRightLeft, X } from 'lucide-react';

interface DraftGridProps {
    groupedDuties: { date: Date; duties: Duty[] }[];
    users: User[];
    onReplaceUser: (dutyIndex: number, newUserId: string) => void;
    onRemoveDay: (date: Date) => void;
    onSwapInit: (dutyIndex: number) => void;
    swapSourceIndex: number | null;
}

const DraftGrid: React.FC<DraftGridProps> = ({ 
    groupedDuties, users, onReplaceUser, onRemoveDay, onSwapInit, swapSourceIndex 
}) => {
    // Flatten duties map to find absolute index for swap
    const getDutyAbsoluteIndex = (dateIndex: number, dutyIndexInGroup: number) => {
        let count = 0;
        for (let i = 0; i < dateIndex; i++) {
            count += groupedDuties[i].duties.length;
        }
        return count + dutyIndexInGroup;
    };

    return (
        <div className="space-y-4">
            {groupedDuties.map((group, groupIdx) => (
                <div 
                    key={group.date.toISOString()} 
                    className="flex flex-row gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:border-indigo-200 transition-all group/card relative"
                >
                    <button 
                        onClick={() => onRemoveDay(group.date)}
                        className="absolute -top-2 -right-2 bg-white text-gray-300 hover:text-red-500 shadow-sm border border-gray-100 rounded-full p-1 opacity-0 group-hover/card:opacity-100 transition-opacity"
                        title="ลบวันนี้ออก"
                    >
                        <X className="w-3 h-3" />
                    </button>

                    {/* Date Column */}
                    <div className="flex flex-col items-center justify-center min-w-[70px] bg-white rounded-xl border border-gray-200 p-2 h-fit self-start shadow-sm">
                        <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">{format(group.date, 'EEE')}</span>
                        <span className="block text-xl font-black text-indigo-600">{format(group.date, 'd')}</span>
                    </div>

                    {/* Duties Column */}
                    <div className="flex-1 flex flex-col gap-2 justify-center">
                        {group.duties.map((duty, idx) => {
                            const absIndex = getDutyAbsoluteIndex(groupIdx, idx);
                            const user = users.find(u => u.id === duty.assigneeId);
                            const isSwapSource = swapSourceIndex === absIndex;

                            return (
                                <div key={absIndex} className={`flex items-center justify-between p-2 rounded-xl transition-all border-2 ${isSwapSource ? 'border-indigo-500 bg-indigo-50 animate-pulse' : 'border-transparent hover:bg-white hover:border-gray-200'}`}>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="relative group/avatar cursor-pointer" onClick={() => onSwapInit(absIndex)}>
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 border-2 border-white shadow-sm">
                                                    {user?.name.charAt(0)}
                                                </div>
                                            )}
                                            {/* Swap Indicator Overlay */}
                                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-white">
                                                <ArrowRightLeft className="w-4 h-4" />
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1">
                                            {/* Name Selector */}
                                            <select 
                                                className="text-sm font-bold text-gray-800 bg-transparent outline-none cursor-pointer hover:text-indigo-600 w-full"
                                                value={user?.id || ''}
                                                onChange={(e) => onReplaceUser(absIndex, e.target.value)}
                                            >
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-gray-500 font-medium">{duty.title}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-gray-300">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            {groupedDuties.length === 0 && <div className="text-center py-10 text-gray-400">ยังไม่มีเวรที่สุ่ม (ลองกดปุ่มด้านล่าง)</div>}
        </div>
    );
};

export default DraftGrid;
