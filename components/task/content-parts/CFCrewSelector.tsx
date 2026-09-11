
import React from 'react';
import { Users, Check, AlertTriangle, X } from 'lucide-react';
import { User } from '../../../types';

interface CFCrewSelectorProps {
    users: User[];
    ideaOwnerIds: string[];
    editorIds: string[];
    assigneeIds: string[];
    setIdeaOwnerIds: React.Dispatch<React.SetStateAction<string[]>>;
    setEditorIds: React.Dispatch<React.SetStateAction<string[]>>;
    setAssigneeIds: React.Dispatch<React.SetStateAction<string[]>>;
    toggleUserSelection: (userId: string, currentList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => void;
}

const CFCrewSelector: React.FC<CFCrewSelectorProps> = ({ 
    users, ideaOwnerIds, editorIds, assigneeIds, 
    setIdeaOwnerIds, setEditorIds, setAssigneeIds, toggleUserSelection 
}) => {
    
    const activeUsers = users.filter(u => u.isActive);
    const activeIdSet = React.useMemo(() => new Set(activeUsers.map(u => u.id)), [activeUsers]);

    return (
        <div className="space-y-4">
            <label className="block text-base font-bold text-gray-700 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" /> ทีมงาน (Crew)
            </label>
            
            <div className="grid grid-cols-1 gap-4">
                {[
                    { label: 'Idea Owner 💡', list: ideaOwnerIds, setter: setIdeaOwnerIds, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', hoverBorder: 'hover:border-yellow-300' },
                    { label: 'Editor ✂️', list: editorIds, setter: setEditorIds, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', hoverBorder: 'hover:border-purple-300' },
                    { label: 'Support 🤝', list: assigneeIds, setter: setAssigneeIds, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', hoverBorder: 'hover:border-gray-300' }
                ].map((role) => {
                    // Identify any assigned users in this role that are inactive
                    const inactiveInRole = role.list
                        .filter(id => !activeIdSet.has(id))
                        .map(id => {
                            const u = users.find(user => user.id === id);
                            return { id, name: u?.name || `User (${id.slice(0, 6)}...)` };
                        });

                    return (
                        <div key={role.label} className={`${role.bg} rounded-2xl p-4 border-2 ${role.border} ${role.hoverBorder} transition-colors group`}>
                            <div className="flex justify-between items-center mb-3">
                                <span className={`text-xs font-bold uppercase tracking-wide ${role.text}`}>{role.label}</span>
                                <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full font-bold text-gray-500">{role.list.length} คน</span>
                            </div>

                            {/* Inactive Notice if present */}
                            {inactiveInRole.length > 0 && (
                                <div className="mb-3 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-xl p-2 text-xs flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                        <span className="truncate">
                                            <strong>พ้นสภาพ/ไม่ Active:</strong> {inactiveInRole.map(u => u.name).join(', ')}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => role.setter(role.list.filter(id => activeIdSet.has(id)))}
                                        className="shrink-0 bg-white/80 hover:bg-white text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-300 text-[10px] flex items-center gap-0.5 cursor-pointer shadow-xs"
                                        title="ปลดคนที่ไม่ Active ออก"
                                    >
                                        <X className="w-3 h-3" /> ปลดออก
                                    </button>
                                </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                                {activeUsers.map(user => {
                                    const isSelected = role.list.includes(user.id);
                                    return (
                                        <button 
                                            key={`${role.label}-${user.id}`} 
                                            type="button" 
                                            onClick={() => toggleUserSelection(user.id, role.list, role.setter)} 
                                            className={`
                                                relative w-10 h-10 rounded-full border-2 transition-all duration-300
                                                ${isSelected 
                                                    ? 'border-white ring-2 ring-indigo-400 scale-110 z-10 shadow-md' 
                                                    : 'border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105'
                                                }
                                            `}
                                            title={user.name}
                                        >
                                            <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover bg-white" referrerPolicy="no-referrer" alt="" />
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                                    <Check className="w-2 h-2 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CFCrewSelector;
