
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, ArrowRight, LayoutGrid, Calendar, Users, MessageCircle, FileText, Presentation, Film, ClipboardList, Clock, Coffee, ScanEye, BarChart3, Megaphone, BookOpen, Settings2, Command, X, Hash, User as UserIcon } from 'lucide-react';
import { Task, User, ViewMode } from '../../types';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: ViewMode) => void;
    tasks: Task[];
    users: User[];
    onOpenTask: (task: Task) => void;
    onOpenProfile: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
    isOpen, onClose, onNavigate, tasks, users, onOpenTask, onOpenProfile 
}) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // --- 1. DATA SOURCE ---
    const menuItems = [
        { label: 'Dashboard (ภาพรวม)', icon: LayoutGrid, action: () => onNavigate('DASHBOARD'), type: 'Navigation' },
        { label: 'Calendar (ปฏิทิน)', icon: Calendar, action: () => onNavigate('CALENDAR'), type: 'Navigation' },
        { label: 'My Team (ทีมงาน)', icon: Users, action: () => onNavigate('TEAM'), type: 'Navigation' },
        { label: 'Chat (ห้องแชท)', icon: MessageCircle, action: () => onNavigate('CHAT'), type: 'Navigation' },
        { label: 'Script Hub (เขียนบท)', icon: FileText, action: () => onNavigate('SCRIPT_HUB'), type: 'Navigation' },
        { label: 'Meetings (ห้องประชุม)', icon: Presentation, action: () => onNavigate('MEETINGS'), type: 'Navigation' },
        { label: 'Stock (คลังคลิป)', icon: Film, action: () => onNavigate('STOCK'), type: 'Navigation' },
        { label: 'Checklist (จัดเป๋า)', icon: ClipboardList, action: () => onNavigate('CHECKLIST'), type: 'Navigation' },
        { label: 'Attendance (ลงเวลา)', icon: Clock, action: () => onNavigate('ATTENDANCE'), type: 'Navigation' },
        { label: 'Duty (ตารางเวร)', icon: Coffee, action: () => onNavigate('DUTY'), type: 'Navigation' },
        { label: 'Quality Gate (ตรวจงาน)', icon: ScanEye, action: () => onNavigate('QUALITY_GATE'), type: 'Navigation' },
        { label: 'My Profile (ข้อมูลส่วนตัว)', icon: UserIcon, action: onOpenProfile, type: 'Settings' },
    ];

    // --- 2. FILTER LOGIC ---
    const filteredItems = useMemo(() => {
        if (!query) return menuItems.slice(0, 5); // Show top menu by default

        const lowerQuery = query.toLowerCase();
        
        // Filter Menu
        const matchedMenu = menuItems.filter(item => 
            item.label.toLowerCase().includes(lowerQuery)
        );

        // Filter Tasks (Limit 5)
        const matchedTasks = tasks
            .filter(t => t.title.toLowerCase().includes(lowerQuery))
            .slice(0, 5)
            .map(t => ({
                label: t.title,
                icon: Hash,
                action: () => onOpenTask(t),
                type: 'Task'
            }));

        // Filter Users (Limit 3)
        const matchedUsers = users
            .filter(u => u.name.toLowerCase().includes(lowerQuery))
            .slice(0, 3)
            .map(u => ({
                label: u.name,
                icon: UserIcon,
                action: () => {}, // In future: Open user profile modal
                type: 'User'
            }));

        return [...matchedMenu, ...matchedTasks, ...matchedUsers];
    }, [query, tasks, users]);

    // --- 3. KEYBOARD HANDLING ---
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    filteredItems[selectedIndex].action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Backdrop Click */}
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-200">
                {/* Search Input */}
                <div className="flex items-center px-4 py-4 border-b border-gray-100">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-lg outline-none text-gray-800 placeholder:text-gray-300 bg-transparent font-medium"
                        placeholder="พิมพ์เพื่อค้นหา หรือสั่งงาน..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                    />
                    <div className="hidden md:flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ESC</span>
                    </div>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
                    {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            ไม่พบผลลัพธ์สำหรับ "{query}"
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredItems.map((item, index) => {
                                const Icon = item.icon;
                                const isSelected = index === selectedIndex;
                                return (
                                    <div
                                        key={index}
                                        onClick={() => { item.action(); onClose(); }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`
                                            flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all
                                            ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-indigo-200' : 'text-gray-300'}`}>
                                                {item.type}
                                            </span>
                                            {isSelected && <ArrowRight className="w-4 h-4 text-white animate-pulse" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
                    <div className="flex gap-3">
                        <span><b className="text-gray-600">↑↓</b> เลือก</span>
                        <span><b className="text-gray-600">Enter</b> ไป</span>
                    </div>
                    <span>Juijui Planner Command</span>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CommandPalette;
