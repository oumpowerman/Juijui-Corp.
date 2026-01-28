
import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, Calendar, Search } from 'lucide-react';
import { Duty, User } from '../../types';
import { format, isAfter, isSameDay } from 'date-fns';

interface SwapRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceDuty: Duty | null;
    allDuties: Duty[];
    users: User[];
    currentUser: User;
    onConfirmSwap: (targetDutyId: string) => void;
}

const SwapRequestModal: React.FC<SwapRequestModalProps> = ({ 
    isOpen, onClose, sourceDuty, allDuties, users, currentUser, onConfirmSwap 
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

    // Filter logic: 
    // 1. Must not be my own duty
    // 2. Must be in the future (or today)
    // 3. Must not be done
    const availableTargets = useMemo(() => {
        if (!sourceDuty) return [];
        const today = new Date();
        today.setHours(0,0,0,0);

        return allDuties.filter(d => 
            d.assigneeId !== currentUser.id && // Not mine
            !d.isDone && // Not done
            (isAfter(new Date(d.date), today) || isSameDay(new Date(d.date), today)) && // Future
            d.id !== sourceDuty.id // Not the source itself (redundant but safe)
        ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [allDuties, currentUser.id, sourceDuty]);

    // Search Filter
    const filteredTargets = availableTargets.filter(d => {
        const assignee = users.find(u => u.id === d.assigneeId);
        const nameMatch = assignee?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const titleMatch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || titleMatch;
    });

    const handleConfirm = () => {
        if (selectedTargetId) {
            onConfirmSwap(selectedTargetId);
            onClose();
            setSelectedTargetId(null);
        }
    };

    if (!isOpen || !sourceDuty) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border-4 border-indigo-50">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-indigo-100 bg-indigo-50 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-black text-indigo-900 flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> ขอแลกเวร (Swap Request)
                        </h3>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">
                            เวรของคุณ: <b>{sourceDuty.title}</b> ({format(new Date(sourceDuty.date), 'd MMM')})
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full text-indigo-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อเพื่อน หรือวันที่..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/30">
                    {filteredTargets.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p>ไม่พบเวรที่สามารถแลกได้</p>
                        </div>
                    ) : (
                        filteredTargets.map(duty => {
                            const assignee = users.find(u => u.id === duty.assigneeId);
                            const isSelected = selectedTargetId === duty.id;

                            return (
                                <div 
                                    key={duty.id}
                                    onClick={() => setSelectedTargetId(duty.id)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                                        ${isSelected 
                                            ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                                            : 'bg-white border-transparent hover:border-indigo-100 shadow-sm'}
                                    `}
                                >
                                    {/* Avatar */}
                                    <div className="shrink-0">
                                        {assignee?.avatarUrl ? (
                                            <img src={assignee.avatarUrl} className="w-10 h-10 rounded-full border border-gray-200" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">
                                                {assignee?.name?.[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-gray-900">{assignee?.name}</span>
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {format(new Date(duty.date), 'd MMM')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">{duty.title}</p>
                                    </div>

                                    {/* Radio Indicator */}
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedTargetId}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <ArrowRightLeft className="w-4 h-4" /> ส่งคำขอแลกเวร
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SwapRequestModal;
