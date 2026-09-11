
import React from 'react';
import { Users, Swords, Check, AlertTriangle, UserX, X } from 'lucide-react';
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
    allUsers?: User[];
    toggleUserSelection: (userId: string) => void;
    startDate: string;
    endDate: string;
    isReadOnly?: boolean;
}

const GTAssigneeSelector: React.FC<GTAssigneeSelectorProps> = ({
    assigneeType, setAssigneeType, assigneeIds, setAssigneeIds,
    targetPosition, setTargetPosition, activeUsers, allUsers, toggleUserSelection,
    startDate, endDate, isReadOnly = false
}) => {
    
    // Check for assignees who are no longer active
    const inactiveAssignees = React.useMemo(() => {
        if (!assigneeIds || assigneeIds.length === 0) return [];
        const activeIdSet = new Set(activeUsers.map(u => u.id));
        return assigneeIds
            .filter(id => !activeIdSet.has(id))
            .map(id => {
                const user = (allUsers || []).find(u => u.id === id);
                return {
                    id,
                    name: user?.name || `ผู้ใช้เดิม (${id.slice(0, 8)}...)`,
                    avatarUrl: user?.avatarUrl,
                    position: user?.position,
                };
            });
    }, [assigneeIds, activeUsers, allUsers]);

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
        <div className={`bg-white p-5 rounded-[2rem] border-2 border-indigo-50 shadow-lg relative overflow-hidden group hover:border-indigo-100 transition-all duration-500 ${isReadOnly ? 'bg-slate-50/50 grayscale-[0.2]' : ''}`}>
            <label className="block text-xl font-bold text-indigo-900 mb-4 flex items-center tracking-tight relative z-10">
                <span className="text-3xl mr-2 animate-bounce shadow-sm rounded-full bg-yellow-100 p-1">⚡️</span> 
                ใครรับจบงานนี้? <span className="text-sm font-normal text-indigo-400 ml-2">(Assignee)</span>
            </label>

            {/* Inactive Assignee Warning Banner */}
            {inactiveAssignees.length > 0 && (
                <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-amber-900 shadow-sm animate-in fade-in slide-in-from-top-2 relative z-10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-200/80 rounded-xl text-amber-800 shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                                    ผู้รับผิดชอบเดิมพ้นสภาพ (Inactive)
                                </span>
                            </div>
                            <p className="text-sm font-bold text-amber-950 mt-1">
                                ⚠️ ผู้รับผิดชอบเดิม: <span className="text-amber-800 font-extrabold">{inactiveAssignees.map(u => u.name).join(', ')}</span>
                                <span className="font-normal text-amber-800 block sm:inline sm:ml-1.5 text-xs sm:text-sm">
                                    (พ้นสภาพ/ไม่ Active แล้ว - กรุณาเลือกผู้รับผิดชอบใหม่ หรือกดปลดชื่อออก)
                                </span>
                            </p>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                {inactiveAssignees.map(u => (
                                    <div key={u.id} className="flex items-center gap-1.5 bg-white border border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold text-amber-900 shadow-xs">
                                        {u.avatarUrl ? (
                                            <img src={u.avatarUrl} className="w-4 h-4 rounded-full object-cover grayscale" alt="" />
                                        ) : (
                                            <UserX className="w-3.5 h-3.5 text-amber-600" />
                                        )}
                                        <span>{u.name}</span>
                                        {!isReadOnly && (
                                            <button
                                                type="button"
                                                onClick={() => setAssigneeIds(assigneeIds.filter(id => id !== u.id))}
                                                className="ml-1 text-amber-600 hover:text-rose-600 hover:bg-rose-50 rounded-full p-0.5 transition-colors cursor-pointer"
                                                title="ปลดผู้รับผิดชอบนี้ออก"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const activeIdSet = new Set(activeUsers.map(u => u.id));
                                            setAssigneeIds(assigneeIds.filter(id => activeIdSet.has(id)));
                                        }}
                                        className="text-xs font-bold text-amber-800 hover:text-amber-950 underline underline-offset-2 ml-1 cursor-pointer"
                                    >
                                        ปลดชื่อที่ Inactive ทั้งหมดออก
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggles */}
            <div className={`flex gap-4 mb-6 relative z-10 ${isReadOnly ? 'opacity-80' : ''}`}>
                    <button
                    type="button"
                    onClick={() => { if(!isReadOnly) { setAssigneeType('INDIVIDUAL'); setAssigneeIds([]); setTargetPosition(''); } }}
                    disabled={isReadOnly}
                    className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'INDIVIDUAL' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                >
                    <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'INDIVIDUAL' ? 'bg-indigo-200 text-indigo-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                        <Users className="w-6 h-6" />
                    </div>
                    <span className="text-base font-bold">Solo (ฉายเดี่ยว) 🦸</span>
                </button>
                
                <button
                    type="button"
                    onClick={() => { if(!isReadOnly) { setAssigneeType('TEAM'); setAssigneeIds([]); setTargetPosition(''); } }}
                    disabled={isReadOnly}
                    className={`flex-1 flex flex-col items-center justify-center py-4 px-2 rounded-2xl transition-all duration-300 border-2 ${assigneeType === 'TEAM' ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md -translate-y-1' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30'} ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                >
                    <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${assigneeType === 'TEAM' ? 'bg-emerald-200 text-emerald-700 scale-110' : 'bg-gray-100 text-gray-400'}`}>
                        <Users className="w-6 h-6" />
                    </div>
                    <span className="text-base font-bold">Team (ช่วยกัน) 🤝</span>
                </button>
            </div>

            {/* User Grid */}
            <div className={`flex flex-wrap gap-4 justify-center sm:justify-start relative z-10 min-h-[80px] ${isReadOnly ? 'opacity-90' : ''}`}>
                {activeUsers.map((user) => {
                    const isSelected = assigneeIds.includes(user.id);
                    const isUnavailable = isUserUnavailable(user);
                    return (
                        <div 
                            key={user.id} 
                            role="button"
                            onClick={() => !isReadOnly && toggleUserSelection(user.id)} 
                            className={`relative flex flex-col items-center gap-2 p-2 transition-all duration-300 group/u ${isSelected ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'} ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                            <span className={`font-medium text-md px-1 py-0.5 rounded-full transition-colors duration-300 ${isSelected ? (assigneeType === 'TEAM' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700') : 'text-gray-400 bg-gray-50'}`}>
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
                            disabled={isReadOnly}
                            value={targetPosition} 
                            onChange={e => setTargetPosition(e.target.value)} 
                            className={`w-full bg-transparent text-base font-black text-indigo-800 placeholder:text-indigo-300 outline-none ${isReadOnly ? 'cursor-not-allowed' : ''}`} 
                            placeholder="รับบทเป็นตำแหน่งอะไร? (เช่น PM)..." 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GTAssigneeSelector;
