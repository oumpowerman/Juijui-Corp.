import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Search, Shield, User as UserIcon, Pin } from 'lucide-react';
import { User, ChipConfig } from '../../../types';
import { getUserPastelTheme } from '../../../utils/color';

interface AssigneeFilterGridProps {
    users: User[];
    selectedAssigneeIds: string[];
    toggleAssignee: (userId: string) => void;
    taskCountsByUser?: Record<string, number>;
    customChips?: ChipConfig[];
    onSaveChip?: (chip: ChipConfig) => void;
    onDeleteChip?: (id: string) => void;
}

const AssigneeFilterGrid: React.FC<AssigneeFilterGridProps> = ({
    users = [],
    selectedAssigneeIds = [],
    toggleAssignee,
    taskCountsByUser = {},
    customChips = [],
    onSaveChip,
    onDeleteChip
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users.filter(user => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(q) ||
            (user.nickname && user.nickname.toLowerCase().includes(q)) ||
            (user.position && user.position.toLowerCase().includes(q)) ||
            (user.role && user.role.toLowerCase().includes(q))
        );
    });

    if (users.length === 0) {
        return (
            <div className="py-16 text-center text-stone-400 font-medium">
                ไม่พบรายชื่อสมาชิกในระบบ
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Search Box & Quick Guidance */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ค้นหาชื่อสมาชิก, ชื่อเล่น, ตำแหน่ง หรือแผนก..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded-md hover:bg-stone-100"
                        >
                            ล้าง
                        </button>
                    )}
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 px-1">
                    <Pin className="w-3.5 h-3.5 text-amber-500" />
                    <span>กดไอคอนหมุดเพื่อนำสมาชิกไปแสดงที่แถบชิปด้านหน้า</span>
                </div>
            </div>

            {/* Grid of Team Members */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1"
            >
                {filteredUsers.map(user => {
                    const isSelected = selectedAssigneeIds.includes(user.id);
                    const userTheme = getUserPastelTheme(user.id);
                    const count = taskCountsByUser[user.id] || 0;
                    const isPinned = customChips.some(c => c.type === 'ASSIGNEE' && c.value === user.id);

                    return (
                        <div
                            key={user.id}
                            onClick={() => toggleAssignee(user.id)}
                            className={`group relative p-3.5 rounded-2xl border-2 cursor-pointer select-none flex items-center justify-between transition-all duration-200 ${
                                isSelected
                                    ? 'border-indigo-600 bg-indigo-50/70 shadow-md shadow-indigo-600/10'
                                    : 'border-stone-200 bg-white hover:border-indigo-200 hover:shadow-xs'
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0 pr-12">
                                {/* Avatar with Color Ring */}
                                <div className="relative shrink-0">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 shadow-2xs"
                                            style={{ borderColor: userTheme.borderHex }}
                                        />
                                    ) : (
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs border-2"
                                            style={{
                                                backgroundColor: userTheme.bgHex,
                                                color: userTheme.textHex,
                                                borderColor: userTheme.borderHex
                                            }}
                                        >
                                            {user.nickname ? user.nickname.slice(0, 2) : user.name.slice(0, 2).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Selected Check icon badge */}
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm border border-white">
                                            <Check className="w-2.5 h-2.5 stroke-[3.5px]" />
                                        </div>
                                    )}
                                </div>

                                {/* User Details */}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-stone-800 truncate">
                                            {user.nickname ? `${user.nickname} (${user.name})` : user.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        {user.position && (
                                            <span className="text-[10px] font-medium text-stone-500 truncate bg-stone-100 px-1.5 py-0.5 rounded-md">
                                                {user.position}
                                            </span>
                                        )}
                                        {user.role && (
                                            <span className="text-[9px] font-bold uppercase text-stone-400 tracking-wider">
                                                {user.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Section: Task Count Badge & Pin Action */}
                            <div className="flex items-center gap-2 shrink-0">
                                {count > 0 && (
                                    <span
                                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border transition-all ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white border-transparent'
                                                : 'bg-stone-100 text-stone-600 border-stone-200 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}

                                {/* Pin Button */}
                                {onSaveChip && onDeleteChip && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const existing = customChips.find(c => c.type === 'ASSIGNEE' && c.value === user.id);
                                            if (existing) {
                                                onDeleteChip(existing.id);
                                            } else {
                                                onSaveChip({
                                                    id: `chip_usr_${user.id}`,
                                                    label: user.nickname || user.name.split(' ')[0],
                                                    type: 'ASSIGNEE',
                                                    value: user.id,
                                                    colorTheme: userTheme.accentHex,
                                                    scope: 'TASK',
                                                    mode: 'INCLUDE'
                                                });
                                            }
                                        }}
                                        className={`p-1.5 rounded-xl border transition-all active:scale-90 ${
                                            isPinned 
                                                ? 'bg-amber-50 border-amber-300 text-amber-500 shadow-2xs ring-1 ring-amber-300/40' 
                                                : 'bg-white border-stone-200 text-stone-300 hover:text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                                        }`}
                                        title={isPinned ? 'ถอนการปักหมุดแถบด่วน' : 'ปักหมุดสมาชิกที่แถบด่วน (Pin to Bar)'}
                                    >
                                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </motion.div>
        </div>
    );
};

export default AssigneeFilterGrid;
