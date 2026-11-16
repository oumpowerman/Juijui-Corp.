import React, { useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import { User } from '../../../types';

type CrewRoleTab = 'IDEA_OWNER' | 'EDITOR' | 'SUPPORT';

interface QuickTripCrewPickerProps {
    users: User[];
    ideaOwnerIds: string[];
    editorIds: string[];
    assigneeIds: string[];
    onChangeIdeaOwnerIds: React.Dispatch<React.SetStateAction<string[]>>;
    onChangeEditorIds: React.Dispatch<React.SetStateAction<string[]>>;
    onChangeAssigneeIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const ROLE_TABS: Array<{
    key: CrewRoleTab;
    label: string;
    activeClass: string;
    badgeClass: string;
}> = [
    {
        key: 'IDEA_OWNER',
        label: 'Idea Owner',
        activeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        badgeClass: 'bg-amber-500 text-white',
    },
    {
        key: 'EDITOR',
        label: 'Editor',
        activeClass: 'bg-purple-100 text-purple-800 border-purple-200',
        badgeClass: 'bg-purple-500 text-white',
    },
    {
        key: 'SUPPORT',
        label: 'Support',
        activeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        badgeClass: 'bg-sky-500 text-white',
    },
];

const QuickTripCrewPicker: React.FC<QuickTripCrewPickerProps> = ({
    users,
    ideaOwnerIds,
    editorIds,
    assigneeIds,
    onChangeIdeaOwnerIds,
    onChangeEditorIds,
    onChangeAssigneeIds,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeRole, setActiveRole] = useState<CrewRoleTab>('IDEA_OWNER');

    const totalAssigned = new Set([...ideaOwnerIds, ...editorIds, ...assigneeIds]).size;

    const getRoleState = (role: CrewRoleTab) => {
        if (role === 'IDEA_OWNER') return { list: ideaOwnerIds, setter: onChangeIdeaOwnerIds };
        if (role === 'EDITOR') return { list: editorIds, setter: onChangeEditorIds };
        return { list: assigneeIds, setter: onChangeAssigneeIds };
    };

    const { list: activeList, setter: activeSetter } = getRoleState(activeRole);

    const toggleMember = (userId: string) => {
        activeSetter((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div className="mt-3 rounded-2xl border border-indigo-100/90 bg-white/80 overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-full min-h-[40px] px-3.5 py-2 flex items-center justify-between gap-2 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50/60 transition-colors cursor-pointer"
            >
                <span className="flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">
                        {totalAssigned > 0
                            ? `แจ้งเตือนทีมงานที่เกี่ยวข้อง (${totalAssigned} คน)`
                            : 'เลือกทีมงานรับแจ้งเตือน (ไม่บังคับ)'}
                    </span>
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-indigo-400 shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {isExpanded && (
                <div className="px-3.5 pb-3 pt-1 border-t border-indigo-100/70 space-y-2.5 bg-[#FDFBFF]">
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {ROLE_TABS.map((tab) => {
                            const count = getRoleState(tab.key).list.length;
                            const isActive = activeRole === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveRole(tab.key)}
                                    className={`min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        isActive
                                            ? tab.activeClass
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    {count > 0 && (
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] leading-none font-bold ${tab.badgeClass}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {users.length === 0 ? (
                        <p className="text-[11px] text-slate-400 py-1">ไม่พบรายชื่อทีมงานในองค์กร</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-thin pr-1">
                            {users.map((u) => {
                                const isSelected = activeList.includes(u.id);
                                return (
                                    <button
                                        key={`${activeRole}-${u.id}`}
                                        type="button"
                                        onClick={() => toggleMember(u.id)}
                                        className={`min-h-[36px] pl-1.5 pr-2.5 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-2xs'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40'
                                        }`}
                                    >
                                        <img
                                            src={u.avatarUrl}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            className="w-5 h-5 rounded-full object-cover bg-slate-100 shrink-0"
                                        />
                                        <span className="truncate max-w-[100px]">{u.name.split(' ')[0]}</span>
                                        {isSelected && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuickTripCrewPicker;
