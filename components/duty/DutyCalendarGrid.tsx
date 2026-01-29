
import React from 'react';
import { format, isToday, isSameDay } from 'date-fns';
import { Coffee, Plus, Trash2, CalendarDays } from 'lucide-react';
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
    
    onStartAdd: (day: Date) => void;
    onCancelAdd: () => void;
    onAdd: () => void;
    setNewDutyTitle: (val: string) => void;
    setAssigneeId: (val: string) => void;
    
    onToggleDuty: (id: string) => void;
    onDeleteDuty: (id: string) => void;
    onSubmitProof: (dutyId: string, file: File, userName: string) => Promise<boolean>;
    onRequestSwap: (duty: Duty) => void; // New Prop passed down
}

const DutyCalendarGrid: React.FC<DutyCalendarGridProps> = ({
    weekDays, duties, users, currentUser,
    isAddMode, newDutyTitle, assigneeId,
    onStartAdd, onCancelAdd, onAdd, setNewDutyTitle, setAssigneeId,
    onToggleDuty, onDeleteDuty, onSubmitProof, onRequestSwap
}) => {
    const activeUsers = users.filter(u => u.isActive);

    const getDutiesForDay = (date: Date) => {
        return duties.filter(d => isSameDay(d.date, date));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {weekDays.slice(0, 5).map(day => { // Show Mon-Fri primarily
                const dayDuties = getDutiesForDay(day);
                const isCurrentDay = isToday(day);
                
                return (
                    <div 
                        key={day.toString()} 
                        className={`
                            rounded-[1.5rem] flex flex-col h-full min-h-[300px] transition-all
                            ${isCurrentDay 
                                ? 'bg-indigo-50 border-2 border-indigo-200 shadow-lg ring-2 ring-indigo-100 ring-offset-2 scale-[1.02] z-10' 
                                : 'bg-white border border-gray-200 shadow-sm hover:border-indigo-200'
                            }
                        `}
                    >
                        {/* Day Header */}
                        <div className={`
                            p-4 border-b flex flex-col items-center justify-center text-center
                            ${isCurrentDay ? 'border-indigo-100 bg-white/50 rounded-t-[1.5rem]' : 'border-gray-50 bg-gray-50/50 rounded-t-[1.5rem]'}
                        `}>
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{format(day, 'EEEE')}</p>
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-sm
                                ${isCurrentDay ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}
                            `}>
                                {format(day, 'd')}
                            </div>
                            {isCurrentDay && <span className="text-[10px] font-bold text-indigo-500 mt-1">Today</span>}
                        </div>

                        {/* Duty List */}
                        <div className="p-3 flex-1 space-y-3 relative">
                            {dayDuties.length === 0 && !isAddMode && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 opacity-60">
                                    <Coffee className="w-12 h-12 mb-2" />
                                    <p className="text-xs font-bold">Chill Day</p>
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
                                        onRequestSwap={onRequestSwap}
                                    />
                                );
                            })}

                            {/* Add Form Inline */}
                            {isAddMode && isSameDay(isAddMode, day) ? (
                                <div className="bg-white border-2 border-indigo-400 rounded-2xl p-3 shadow-lg animate-in zoom-in-95 relative z-20">
                                    <input 
                                        autoFocus
                                        className="w-full text-sm font-bold border-b-2 border-indigo-100 pb-1 mb-2 outline-none focus:border-indigo-500 text-indigo-900 placeholder:text-indigo-200"
                                        placeholder="ทำอะไรดี?"
                                        value={newDutyTitle}
                                        onChange={e => setNewDutyTitle(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && onAdd()}
                                    />
                                    <div className="flex gap-2">
                                        <select 
                                            className="flex-1 text-xs bg-indigo-50 rounded-lg p-1.5 outline-none cursor-pointer font-bold text-indigo-700"
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
                                            className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button onClick={onCancelAdd} className="text-gray-400 hover:text-red-500 p-1.5">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => onStartAdd(day)}
                                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:text-indigo-500 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100"
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
