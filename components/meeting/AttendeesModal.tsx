import React from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Check } from 'lucide-react';
import { User, MasterOption } from '../../types';

interface AttendeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    attendees: string[];
    onToggleAttendee: (id: string) => void;
    masterOptions: MasterOption[];
}

const AttendeesModal: React.FC<AttendeesModalProps> = ({ isOpen, onClose, users, attendees, onToggleAttendee, masterOptions }) => {
    if (!isOpen) return null;

    // Filter and sort master options for positions
    const positionOptions = masterOptions
        .filter(o => o.type === 'POSITION')
        .sort((a, b) => a.sortOrder - b.sortOrder);
    
    // Helper to get department/position
    const getUserPosition = (u: User) => u.position || 'General';

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white/70 backdrop-blur-2xl w-full max-w-lg rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 border border-white/50 relative">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/50 bg-white/40 flex justify-between items-center shrink-0">
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <span className="bg-white/80 text-indigo-600 p-2 rounded-2xl shadow-inner">
                            <Users className="w-6 h-6" />
                        </span>
                        เลือกผู้เข้าประชุม
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-white/50 hover:bg-white text-gray-400 hover:text-red-500 rounded-full transition-all shadow-sm"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white/30 scrollbar-thin scrollbar-thumb-gray-300/50">
                    {positionOptions.map(pos => {
                        const posUsers = users.filter(u => getUserPosition(u) === pos.label);
                        if (posUsers.length === 0) return null;

                        return (
                            <div key={pos.id} className="mb-8">
                                <h4 className="text-[12px] font-kanit font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 ml-1">{pos.label}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {posUsers.map(user => {
                                        const isSelected = attendees.includes(user.id);
                                        return (
                                            <button
                                                key={user.id}
                                                onClick={() => onToggleAttendee(user.id)}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300
                                                    ${isSelected 
                                                        ? 'bg-white/90 border-indigo-200 shadow-[0_8px_20px_-5px_rgba(79,70,229,0.3)] ring-1 ring-indigo-100' 
                                                        : 'bg-white/40 border-white/50 hover:bg-white/80 hover:border-white hover:shadow-lg'}
                                                `}
                                            >
                                                <div className="relative">
                                                    <img src={user.avatarUrl} className="w-10 h-10 rounded-full shadow-md" />
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{user.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Fallback for users without a matching position */}
                    {users.filter(u => !positionOptions.find(p => p.label === getUserPosition(u))).length > 0 && (
                        <div className="mb-8">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 ml-1">อื่นๆ</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {users.filter(u => !positionOptions.find(p => p.label === getUserPosition(u))).map(user => {
                                    const isSelected = attendees.includes(user.id);
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => onToggleAttendee(user.id)}
                                            className={`
                                                flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300
                                                ${isSelected 
                                                    ? 'bg-white/90 border-indigo-200 shadow-[0_8px_20px_-5px_rgba(79,70,229,0.3)] ring-1 ring-indigo-100' 
                                                    : 'bg-white/40 border-white/50 hover:bg-white/80 hover:border-white hover:shadow-lg'}
                                            `}
                                        >
                                            <div className="relative">
                                                <img src={user.avatarUrl} className="w-10 h-10 rounded-full shadow-md" />
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <Check className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{user.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/50 bg-white/40 shrink-0 text-center">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 w-full"
                    >
                        ตกลง
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AttendeesModal;
