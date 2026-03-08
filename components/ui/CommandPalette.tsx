
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Hash, ChevronRight, Plus, User as UserIcon, LogOut } from 'lucide-react';
import { User, ViewMode, Task, TaskType, MenuGroup } from '../../types';

interface CommandPaletteProps {
    currentUser: User;
    tasks: Task[];
    menuGroups: MenuGroup[];
    onNavigate: (view: ViewMode) => void;
    onAddTask: (type?: TaskType) => void;
    onEditProfile: () => void;
    onLogout: () => void;
    onOpenTask: (task: Task) => void;
    onClose: () => void;
    isActive: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
    currentUser,
    tasks,
    menuGroups,
    onNavigate,
    onAddTask,
    onEditProfile,
    onLogout,
    onOpenTask,
    onClose,
    isActive
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isActive) {
            const timer = setTimeout(() => searchInputRef.current?.focus(), 300);
            return () => clearTimeout(timer);
        } else {
            searchInputRef.current?.blur();
        }
    }, [isActive]);

    const allMenuItems = useMemo(() => {
        const items: any[] = [];
        const isAdmin = currentUser?.role === 'ADMIN';

        menuGroups.forEach(group => {
            if (group.adminOnly && !isAdmin) return;
            group.items.forEach(item => {
                items.push({
                    id: `nav-${item.view}`,
                    label: item.label,
                    icon: item.icon,
                    action: () => { onNavigate(item.view); onClose(); },
                    type: 'Navigation',
                    group: group.title,
                    color: group.id === 'WORKSPACE' ? 'text-blue-500' : 
                           group.id === 'PRODUCTION' ? 'text-pink-500' :
                           group.id === 'OFFICE' ? 'text-emerald-500' : 'text-slate-500'
                });
            });
        });

        items.push({ id: 'action-add-task', label: 'สร้างงานใหม่ (Add Task)', icon: Plus, action: () => { onAddTask(); onClose(); }, type: 'Action', group: 'Quick Actions', color: 'text-indigo-600' });
        items.push({ id: 'action-profile', label: 'แก้ไขโปรไฟล์ (Edit Profile)', icon: UserIcon, action: () => { onEditProfile(); onClose(); }, type: 'Action', group: 'Quick Actions', color: 'text-indigo-600' });
        items.push({ id: 'action-logout', label: 'ออกจากระบบ (Logout)', icon: LogOut, action: onLogout, type: 'Action', group: 'Quick Actions', color: 'text-red-500' });

        return items;
    }, [currentUser, menuGroups, onNavigate, onAddTask, onEditProfile, onLogout, onClose]);

    const filteredSearchItems = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) {
            const suggested = allMenuItems.filter(item => ['DASHBOARD', 'CALENDAR', 'CHAT', 'TEAM'].some(v => item.id === `nav-${v}`));
            const actions = allMenuItems.filter(item => item.type === 'Action');
            return [...suggested, ...actions];
        }
        
        const matchedMenu = allMenuItems.filter(item => item.label.toLowerCase().includes(query) || item.group?.toLowerCase().includes(query));
        const matchedTasks = tasks.filter(t => t.title.toLowerCase().includes(query)).slice(0, 5).map(t => ({
            id: `task-${t.id}`, 
            label: t.title, 
            icon: Hash, 
            action: () => { onOpenTask(t); onClose(); }, 
            type: 'Task', 
            group: 'Tasks', 
            color: 'text-gray-400'
        }));
        return [...matchedMenu, ...matchedTasks];
    }, [searchQuery, allMenuItems, tasks, onOpenTask, onClose]);

    return (
        <div className="w-full h-full flex flex-col bg-white touch-action-pan-y" style={{ touchAction: 'pan-y' }}>
            {/* Search Header */}
            <div className="p-4 border-b border-gray-100 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        ref={searchInputRef}
                        type="text"
                        placeholder="ค้นหาเมนู หรืองาน..."
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-4 pb-32 scrollbar-hide" style={{ touchAction: 'pan-y' }}>
                {filteredSearchItems.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <Search className="w-12 h-12 text-gray-100 mb-4" />
                        <p className="text-gray-400 text-sm font-bold">ไม่พบผลลัพธ์</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Array.from(new Set(filteredSearchItems.map(i => i.group))).map(groupName => {
                            const groupItems = filteredSearchItems.filter(i => i.group === groupName);
                            return (
                                <div key={groupName} className="space-y-2">
                                    <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                                        {groupName}
                                    </h5>
                                    <div className="space-y-1">
                                        {groupItems.map(item => (
                                            <button 
                                                key={item.id}
                                                onClick={item.action}
                                                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-all border border-transparent active:border-gray-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                                                        <item.icon className={`w-4 h-4 ${item.color || 'text-gray-500'}`} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommandPalette;
