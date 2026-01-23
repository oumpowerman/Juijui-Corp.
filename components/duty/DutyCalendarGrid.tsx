
import React from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import { Coffee, Plus, Trash2 } from 'lucide-react';
import { User, Duty } from '../../types';
import DutyCard from './DutyCard';

interface DutyCalendarGridProps {
    weekDays: Date[];
    duties: Duty[];
    users: User[];
    currentUser: User;
    isAddMode: Date | null;
    newDutyTitle: string;
    assigneeId: string;
    
    // Handlers
    onStartAdd: (day: Date) => void;
    onCancelAdd: () => void;
    onAdd: () => void;
    setNewDutyTitle: (val: string) => void;
    setAssigneeId: (val: string) => void;
    
    onToggleDuty: (id: string) => void;
    onDeleteDuty: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
}

const DutyCalendarGrid: React.FC<DutyCalendarGridProps> = ({
    weekDays, duties, users, currentUser,
    isAddMode, newDutyTitle, assigneeId,
    onStartAdd, onCancelAdd, onAdd, setNewDutyTitle, setAssigneeId,
    onToggleDuty, onDeleteDuty, onSubmitProof
}) => {
    const activeUsers = users.filter(u => u.isActive);

    const getDutiesForDay = (date: Date) => {
        return duties.filter(d => isSameDay(d.date, date));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weekDays.map(day => {
                const dayDuties = getDutiesForDay(day);
                const isCurrentDay = isToday(day);
                const isWeekendDay = day.getDay() === 0 || day.getDay() === 6;

                return (
                    <div key={day.toString()} className={`rounded-2xl border flex flex-col h-full min-h-[250px] transition-all ${isCurrentDay ? 'bg-indigo-50/50 border-indigo-200 shadow-md ring-1 ring-indigo-100' : isWeekendDay ? 'bg-gray-50/50 border-gray-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                        {/* Day Header */}
                        <div className={`p-4 border-b flex justify-between items-center ${isCurrentDay ? 'border-indigo-100 bg-indigo-100/50' : 'border-gray-100 bg-gray-50'}`}>
                            <div>
                                <p className={`text-xs font-bold uppercase ${isWeekendDay ? 'text-red-400' : 'text-gray-500'}`}>{format(day, 'EEEE')}</p>
                                <p className={`text-lg font-black ${isCurrentDay ? 'text-indigo-600' : 'text-gray-800'}`}>{format(day, 'd MMM')}</p>
                            </div>
                            {isCurrentDay && <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Today</span>}
                        </div>

                        {/* Duty List */}
                        <div className="p-4 flex-1 space-y-3">
                            {dayDuties.length === 0 && !isAddMode && (
                                <div className="text-center py-8 opacity-40">
                                    <Coffee className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                                    <p className="text-xs font-bold text-gray-400">วันนี้ชิวๆ ไม่มีเวร</p>
                                </div>
                            )}

                            {dayDuties.map(duty => {
                                const assignee = users.find(u => u.id === duty.assigneeId);
                                const isCurrentUser = currentUser.id === duty.assigneeId;

                                return (
                                    <DutyCard 
                                        key={duty.id}
                                        duty={duty}
                                        assignee={assignee}
                                        isCurrentUser={isCurrentUser}
                                        onToggle={onToggleDuty}
                                        onDelete={onDeleteDuty}
                                        onSubmitProof={onSubmitProof}
                                    />
                                );
                            })}

                            {/* Add Form Inline */}
                            {isAddMode && isSameDay(isAddMode, day) ? (
                                <div className="bg-white border-2 border-indigo-100 rounded-xl p-3 shadow-md animate-in zoom-in-95">
                                    <input 
                                        autoFocus
                                        className="w-full text-sm font-bold border-b border-gray-100 pb-1 mb-2 outline-none focus:border-indigo-500"
                                        placeholder="ทำอะไรดี? (เช่น กวาดพื้น)"
                                        value={newDutyTitle}
                                        onChange={e => setNewDutyTitle(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <select 
                                            className="flex-1 text-xs bg-gray-50 rounded-lg p-1 outline-none cursor-pointer"
                                            value={assigneeId}
                                            onChange={e => setAssigneeId(e.target.value)}
                                        >
                                            <option value="" disabled>เลือกคน</option>
                                            {activeUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={onAdd}
                                            disabled={!newDutyTitle || !assigneeId}
                                            className="bg-indigo-600 text-white p-1.5 rounded-lg disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button onClick={onCancelAdd} className="text-gray-400 p-1.5">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => onStartAdd(day)}
                                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-white transition-all flex items-center justify-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> เพิ่มเวร
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DutyCalendarGrid;
