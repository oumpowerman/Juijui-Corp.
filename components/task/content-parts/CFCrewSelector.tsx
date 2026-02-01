
import React from 'react';
import { Users, Check } from 'lucide-react';
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

    return (
        <div className="space-y-4">
            <label className="block text-base font-black text-gray-700 flex items-center">
                <Users className="w-5 h-5 mr-2 text-indigo-500" /> ทีมงาน (Crew)
            </label>
            
            <div className="grid grid-cols-1 gap-4">
                {[
                    { label: 'Idea Owner 💡', list: ideaOwnerIds, setter: setIdeaOwnerIds, bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', hoverBorder: 'hover:border-yellow-300' },
                    { label: 'Editor ✂️', list: editorIds, setter: setEditorIds, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', hoverBorder: 'hover:border-purple-300' },
                    { label: 'Support 🤝', list: assigneeIds, setter: setAssigneeIds, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', hoverBorder: 'hover:border-gray-300' }
                ].map((role) => (
                    <div key={role.label} className={`${role.bg} rounded-2xl p-4 border-2 ${role.border} ${role.hoverBorder} transition-colors group`}>
                        <div className="flex justify-between items-center mb-3">
                            <span className={`text-xs font-black uppercase tracking-wide ${role.text}`}>{role.label}</span>
                            <span className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full font-bold text-gray-500">{role.list.length} คน</span>
                        </div>
                        
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
                                        <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover bg-white" />
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
                ))}
            </div>
        </div>
    );
};

export default CFCrewSelector;
