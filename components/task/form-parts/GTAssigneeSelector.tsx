
import React from 'react';
import { Users, Swords, Check } from 'lucide-react';
import { User, AssigneeType } from '../../../types';
import UserStatusBadge from '../../UserStatusBadge';
import { isWithinInterval } from 'date-fns';

interface GTAssigneeSelectorProps {
    assigneeType: AssigneeType;
    setAssigneeType: (type: AssigneeType) => void;
    assigneeIds: string[];
    setAssigneeIds: (ids: string[]) => void;
    targetPosition: string;
    setTargetPosition: (pos: string) => void;
    activeUsers: User[];
    toggleUserSelection: (userId: string) => void;
    startDate: string;
    endDate: string;
}

const GTAssigneeSelector: React.FC<GTAssigneeSelectorProps> = ({
    assigneeType, setAssigneeType, assigneeIds, setAssigneeIds,
    targetPosition, setTargetPosition, activeUsers, toggleUserSelection,
    startDate, endDate
}) => {
    
    // Helper to check user availability
    const isUserUnavailable = (user: User) => {
        if (!startDate || !endDate) return false;
        try {
            const taskStart = new Date(startDate);
            const taskEnd = new Date(endDate);
            
            if (user.workStatus === 'SICK') return true;
            
            if (user.leaveStartDate && user.leaveEndDate) {
                if (isWithinInterval(taskEnd, { start: user.leaveStartDate, end: user.leaveEndDate })) {
                    return true;
                }
            }
        } catch (e) { return false; }
        return false;
    };

    return (
        <div className="bg-white p-5 rounded-[2rem] border-2 border-indigo-50 shadow-lg relative overflow-hidden group hover:border-indigo-100 transition-all duration-500">
            <label className="block text-xl font-black text-indigo-900 mb-6 flex items-center tracking-tight relative z-10">
                <span className="text-3xl mr-2 animate-bounce shadow-sm rounded-full bg-yellow-100 p-1">⚡️</span> 
                ใครรับจบงานนี้? <span className="text-sm font-normal text-indigo-400 ml-2">(Assignee)</span>
            </label>

            {/* Toggles */}
            <div className="flex gap-4 mb-6 relative z-10">
                    <button
                    type="button"
                    onClick={() => { setAssigneeType('INDIVIDUAL'); setAssigneeIds([]); setTargetPosition(''); }}
                    className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'INDIVIDUAL' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30'}`}
                >
                    <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'INDIVIDUAL' ? 'bg-indigo-200 text-indigo-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                        <Users className="w-6 h-6" />
                    </div>
                    <span className="text-base font-black">Solo (ฉายเดี่ยว) 🦸</span>
                </button>
                
                <button
                    type="button"
                    onClick={() => { setAssigneeType('TEAM'); setAssigneeIds([]); setTargetPosition(''); }}
                    className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'TEAM' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30'}`}
                >
                    <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'TEAM' ? 'bg-emerald-200 text-emerald-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                        <Users className="w-6 h-6" />
                    </div>
                    <span className="text-base font-black">Team (ช่วยกัน) 🤝</span>
                </button>
            </div>

            {/* User Grid */}
            <div className="flex flex-wrap gap-4 justify-center sm:justify-start relative z-10 min-h-[80px]">
                {activeUsers.map((user) => {
                    const isSelected = assigneeIds.includes(user.id);
                    const isUnavailable = isUserUnavailable(user);
                    return (
                        <div 
                            key={user.id} 
                            role="button"
                            onClick={() => toggleUserSelection(user.id)} 
                            className={`relative flex flex-col items-center gap-2 p-2 transition-all cursor-pointer duration-300 group/u ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                        >
                            <div className="relative">
                                <div className={`w-14 h-14 rounded-full p-1 transition-colors duration-300 ${isSelected ? (assigneeType === 'TEAM' ? 'bg-emerald-400' : 'bg-indigo-400') : 'bg-transparent'}`}>
                                    <img src={user.avatarUrl} className={`w-full h-full rounded-full object-cover border-2 border-white ${isUnavailable ? 'grayscale' : ''}`} />
                                </div>
                                {isSelected && (
                                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white text-white animate-bounce shadow-sm ${assigneeType === 'TEAM' ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                                        <Check className="w-3 h-3 stroke-[4px]" />
                                    </div>
                                )}
                                {isUnavailable && (
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full shadow-sm p-0.5">
                                        <UserStatusBadge user={user} size="sm" />
                                    </div>
                                )}
                            </div>
                            <span className={`font-bold text-xs px-2 py-0.5 rounded-full transition-colors duration-300 ${isSelected ? (assigneeType === 'TEAM' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700') : 'text-gray-400 bg-gray-50'}`}>
                                {user.name.split(' ')[0]}
                            </span>
                        </div>
                    )
                })}
            </div>

            {assigneeType === 'INDIVIDUAL' && assigneeIds.length > 0 && (
                <div className="mt-5 animate-in slide-in-from-top-4 fade-in bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 flex items-center shadow-inner">
                    <div className="p-2 bg-white rounded-xl mr-3 shadow-sm text-indigo-500">
                        <Swords className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-indigo-400 mb-1 uppercase">Role in this mission</label>
                        <input 
                            type="text" 
                            value={targetPosition} 
                            onChange={e => setTargetPosition(e.target.value)} 
                            className="w-full bg-transparent text-base font-black text-indigo-800 placeholder:text-indigo-300 outline-none" 
                            placeholder="รับบทเป็นตำแหน่งอะไร? (เช่น PM)..." 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GTAssigneeSelector;
