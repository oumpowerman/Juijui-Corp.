import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Inbox, Package, Eye, Wrench, Check, Plus, X, Ban, Orbit, Sparkles, SlidersHorizontal,
    Users, UserCheck, Flame, Clock, ListTodo, Zap, CheckCircle2
} from 'lucide-react';
import NotificationBellBtn from '../NotificationBellBtn';
import { COLOR_THEMES } from '../../constants';
import { ChipConfig, Channel, User, Task } from '../../types';
import { getHexFromColorClass, getUserPastelTheme } from '../../utils/color';


interface CalendarSecondaryHeaderProps {
    show: boolean;
    onClose: () => void;
    
    // Mode context
    viewMode?: 'CONTENT' | 'TASK' | 'PLAN';
    currentUser?: User;
    
    // Filters logic (CONTENT Mode)
    activeChipIds: string[];
    toggleChip: (id: string) => void;
    customChips: ChipConfig[];
    channels: Channel[];
    users?: User[];
    onManageFilters: () => void;
    onOpenCosmicFilter: () => void;
    activeFiltersCount?: number;
    
    // Filters logic (TASK Mode)
    tasks?: Task[];
    taskAssigneeScope?: 'ONLY_ME' | 'ALL' | string;
    onTaskAssigneeScopeChange?: (scope: 'ONLY_ME' | 'ALL' | string) => void;
    selectedTaskStatuses?: string[];
    onToggleTaskStatus?: (status: string) => void;
    isUrgentOnly?: boolean;
    onToggleUrgentOnly?: () => void;
    isDueSoonOnly?: boolean;
    onToggleDueSoonOnly?: () => void;
    
    // Tools logic
    unreadCount: number;
    onOpenNotifications?: () => void;
    onOpenSettings: () => void;
    onToggleWorkbox?: () => void;
    onToggleStock: () => void;
    isWorkboxOpen: boolean;
    isStockOpen: boolean;

    // Cross-Mode Plan Overlay logic
    showPlanOverlay?: boolean;
    onTogglePlanOverlay?: () => void;
    
    // Layout logic
    taskDisplayMode: 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL';
    setTaskDisplayMode: (mode: 'MINIMAL' | 'DOT' | 'EMOJI' | 'FULL') => void;
    isExpanded?: boolean;
}

const CalendarSecondaryHeader: React.FC<CalendarSecondaryHeaderProps> = ({
    show, onClose,
    viewMode = 'CONTENT',
    currentUser,
    activeChipIds, toggleChip, customChips, channels, users = [], onManageFilters, onOpenCosmicFilter,
    activeFiltersCount = 0,
    tasks = [],
    taskAssigneeScope = 'ONLY_ME',
    onTaskAssigneeScopeChange,
    selectedTaskStatuses = [],
    onToggleTaskStatus,
    isUrgentOnly = false,
    onToggleUrgentOnly,
    isDueSoonOnly = false,
    onToggleDueSoonOnly,
    unreadCount, onOpenNotifications, onOpenSettings, onToggleWorkbox, onToggleStock,
    isWorkboxOpen, isStockOpen,
    showPlanOverlay = true,
    onTogglePlanOverlay,
    taskDisplayMode, setTaskDisplayMode,
    isExpanded = false
}) => {
    const [isViewMenuOpen, setIsViewMenuOpen] = React.useState(false);

    // Calculate pending/active tasks per user for Task Mode badges
    const userTaskCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        tasks.forEach(t => {
            if (t.status !== 'DONE' && t.status !== 'CANCELLED' && t.assigneeIds) {
                t.assigneeIds.forEach(uid => {
                    counts[uid] = (counts[uid] || 0) + 1;
                });
            }
        });
        return counts;
    }, [tasks]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        height: { type: 'spring', stiffness: 180, damping: 25, mass: 0.8 },
                        opacity: { duration: 0.25, ease: 'easeInOut' }
                    }}
                    className={`
                        z-30 ${isViewMenuOpen ? 'overflow-visible' : 'overflow-hidden'}
                        ${isExpanded 
                            ? 'bg-transparent border-t border-slate-100/60' 
                            : 'bg-white/80 backdrop-blur-2xl border-x border-b border-white/60 rounded-b-[2.5rem] -mt-1'
                        }
                    `}
                >
                    <div className="w-full px-4 lg:px-8 py-5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            
                            {/* --- FILTERS SECTION --- */}
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 mask-fade-right flex-1">
                                    
                                    {/* ========================================================================= */}
                                    {/* MODE 1: TASK MODE FILTERS (Member Avatars & Workload Quick Chips) */}
                                    {/* ========================================================================= */}
                                    {viewMode === 'TASK' ? (
                                        <>
                                            {/* Scope 1: Everyone / All Team */}
                                            <button
                                                onClick={() => onTaskAssigneeScopeChange && onTaskAssigneeScopeChange('ALL')}
                                                className={`
                                                    px-3.5 py-1.5 rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 whitespace-nowrap shrink-0 active:scale-95 border flex items-center gap-1.5 shadow-2xs
                                                    ${taskAssigneeScope === 'ALL'
                                                        ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-transparent shadow-[0_4px_14px_rgba(14,165,233,0.25)]' 
                                                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-white hover:text-sky-600 hover:border-sky-300'}
                                                `}
                                                title="แสดงงานของทุกคนในทีมทั้งหมด"
                                            >
                                                <Users className="w-3.5 h-3.5 stroke-[2.5px]" />
                                                <span>ทั้งทีม</span>
                                            </button>

                                            {/* Scope 2: My Tasks */}
                                            <button
                                                onClick={() => onTaskAssigneeScopeChange && onTaskAssigneeScopeChange('ONLY_ME')}
                                                className={`
                                                    px-3.5 py-1.5 rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all duration-200 whitespace-nowrap shrink-0 active:scale-95 border flex items-center gap-1.5 shadow-2xs
                                                    ${taskAssigneeScope === 'ONLY_ME' || (currentUser && taskAssigneeScope === currentUser.id)
                                                        ? 'bg-sky-500 text-white border-sky-500 shadow-[0_4px_14px_rgba(14,165,233,0.25)]' 
                                                        : 'bg-white text-stone-600 border-stone-200 hover:bg-white hover:text-sky-600 hover:border-sky-300'}
                                                `}
                                                title="แสดงเฉพาะงานที่มอบหมายให้ฉัน"
                                            >
                                                <UserCheck className="w-3.5 h-3.5 stroke-[2.5px]" />
                                                <span>งานของฉัน</span>
                                                {currentUser && userTaskCounts[currentUser.id] > 0 && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                                                        taskAssigneeScope === 'ONLY_ME' || (currentUser && taskAssigneeScope === currentUser.id)
                                                            ? 'bg-white text-sky-600'
                                                            : 'bg-sky-100 text-sky-700'
                                                    }`}>
                                                        {userTaskCounts[currentUser.id]}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Pinned Team Member Chips (Strictly only pinned users) */}
                                            {(() => {
                                                const pinnedAssigneeChips = (customChips || []).filter(c => c.type === 'ASSIGNEE');
                                                const displayedUsers = pinnedAssigneeChips
                                                    .map(c => users.find(u => u.id === c.value))
                                                    .filter(Boolean) as User[];

                                                return (
                                                    <>
                                                        {displayedUsers.map(user => {
                                                            const isCurrent = currentUser?.id === user.id;
                                                            const isSelected = taskAssigneeScope === user.id || (isCurrent && taskAssigneeScope === 'ONLY_ME');
                                                            const userTheme = getUserPastelTheme(user.id);
                                                            const pendingCount = userTaskCounts[user.id] || 0;
                                                            const displayName = user.nickname || user.name.split(' ')[0];

                                                            return (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => {
                                                                        if (onTaskAssigneeScopeChange) {
                                                                            if (isSelected && taskAssigneeScope !== 'ALL') {
                                                                                onTaskAssigneeScopeChange('ALL');
                                                                            } else {
                                                                                onTaskAssigneeScopeChange(isCurrent ? 'ONLY_ME' : user.id);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`
                                                                        group pl-1.5 pr-3 py-1 rounded-full text-[10px] font-black transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 border
                                                                        ${isSelected
                                                                            ? 'bg-white shadow-md ring-2 ring-offset-1 ring-indigo-500/80 border-indigo-300 text-indigo-900'
                                                                            : 'bg-white/80 hover:bg-white text-stone-600 border-stone-200 hover:border-stone-300 shadow-2xs'}
                                                                    `}
                                                                    title={`${user.name} (${user.position || 'สมาชิกทีม'})`}
                                                                >
                                                                    {/* Avatar Icon / Image */}
                                                                    <div className="relative shrink-0">
                                                                        {user.avatarUrl ? (
                                                                            <img
                                                                                src={user.avatarUrl}
                                                                                alt={user.name}
                                                                                className="w-7 h-7 rounded-full object-cover border-2 shadow-2xs"
                                                                                style={{ borderColor: userTheme.borderHex }}
                                                                            />
                                                                        ) : (
                                                                            <div
                                                                                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shadow-2xs border-2"
                                                                                style={{
                                                                                    backgroundColor: userTheme.bgHex,
                                                                                    color: userTheme.textHex,
                                                                                    borderColor: userTheme.borderHex
                                                                                }}
                                                                            >
                                                                                {displayName.slice(0, 2).toUpperCase()}
                                                                            </div>
                                                                        )}

                                                                        {/* Selected check ring indicator */}
                                                                        {isSelected && (
                                                                            <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5 shadow-2xs border border-white">
                                                                                <Check className="w-2 h-2 stroke-[4px]" />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <span className="truncate max-w-[90px]">
                                                                        {displayName}
                                                                        {isCurrent && <span className="ml-1 opacity-60 text-[9px] font-normal">(ฉัน)</span>}
                                                                    </span>

                                                                    {/* Task Count Mini Badge */}
                                                                    {pendingCount > 0 && (
                                                                        <span 
                                                                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full transition-colors ${
                                                                                isSelected 
                                                                                    ? 'bg-indigo-600 text-white' 
                                                                                    : 'bg-stone-100 text-stone-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                                                            }`}
                                                                        >
                                                                            {pendingCount}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}

                                                        {/* Quick Pin / Manage Button */}
                                                        <button
                                                            onClick={onOpenCosmicFilter || onManageFilters}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-stone-400 hover:text-stone-700 bg-stone-100/70 hover:bg-stone-200/80 border border-dashed border-stone-300 transition-all shrink-0 active:scale-95"
                                                            title="เปิดหน้าต่างเพื่อเลือกปักหมุดสมาชิก (Pin to Bar)"
                                                        >
                                                            <Plus className="w-3 h-3 text-stone-400" />
                                                            <span>ปักหมุดสมาชิก</span>
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </>
                                    ) : (
                                        /* ========================================================================= */
                                        /* MODE 2: CONTENT MODE FILTERS (Channels, Formats, Pillars, Custom Chips) */
                                        /* ========================================================================= */
                                        <>
                                            <button
                                                onClick={() => toggleChip('ALL')}
                                                className={`
                                                    px-4 py-2 rounded-2xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 whitespace-nowrap shrink-0 active:scale-95 border relative overflow-hidden group
                                                    ${activeChipIds.length === 0
                                                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-transparent shadow-[0_4px_14px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.35)] hover:-translate-y-0.5' 
                                                        : 'bg-stone-50 text-stone-500 border-stone-200 hover:bg-white hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm hover:-translate-y-0.5'}
                                                `}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeChipIds.length === 0 ? 'bg-white animate-pulse' : 'bg-stone-400 group-hover:bg-indigo-500'}`} />
                                                    ทั้งหมด
                                                </span>
                                            </button>

                                            {customChips.map((chip) => {
                                                const theme = COLOR_THEMES.find(t => t.id === chip.colorTheme) || COLOR_THEMES[0];
                                                const isActive = activeChipIds.includes(chip.id);
                                                const isExclude = chip.mode === 'EXCLUDE';
                                                
                                                let channelLogo = null;
                                                let chColor = (theme as any).hex || '#fff';
                                                let isAssignee = false;
                                                if (chip.type === 'CHANNEL') {
                                                    const ch = channels.find(c => c.id === chip.value);
                                                    if (ch?.logoUrl) {
                                                        channelLogo = ch.logoUrl;
                                                        if (ch.color && ch.color !== '#000000' && ch.color !== '#000') {
                                                            chColor = ch.color;
                                                        }
                                                    }
                                                } else if (chip.type === 'ASSIGNEE') {
                                                    isAssignee = true;
                                                    const u = users.find(user => user.id === chip.value);
                                                    if (u?.avatarUrl) {
                                                        channelLogo = u.avatarUrl;
                                                    }
                                                    chColor = '#6366f1';
                                                }

                                                const isLogoChip = !!channelLogo;
                                                const resolvedColor = chip.colorTheme ? getHexFromColorClass(chip.colorTheme) : undefined;
                                                const isHexColor = !isLogoChip && !isExclude && !!resolvedColor;
                                                const baseClasses = isLogoChip
                                                    ? (isActive 
                                                        ? 'bg-transparent border-transparent shadow-none' 
                                                        : 'bg-transparent border-transparent shadow-none opacity-60 hover:opacity-100')
                                                    : (isExclude 
                                                        ? (isActive 
                                                            ? 'bg-red-500 text-white border-red-500 shadow-md ring-2 ring-offset-2 ring-red-100' 
                                                            : 'bg-white text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200')
                                                        : (isHexColor
                                                            ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md'
                                                            : (isActive 
                                                                ? `${theme.activeBg} text-white border-transparent shadow-lg ring-2 ring-offset-2 ring-transparent` 
                                                                : `bg-white ${theme.text} border-gray-200 hover:border-${theme.id}-200 hover:-translate-y-0.5`)));

                                                return (
                                                    <button
                                                        key={chip.id}
                                                        onClick={() => toggleChip(chip.id)}
                                                        className={`
                                                            ${isLogoChip ? 'p-1' : 'px-4 py-2'} rounded-full text-[10px] font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95
                                                            ${baseClasses}
                                                            ${!isLogoChip ? 'shadow-sm border' : ''}
                                                            relative
                                                        `}
                                                        style={isHexColor ? {
                                                            backgroundColor: isActive ? resolvedColor : '#fafaf9',
                                                            color: isActive ? '#ffffff' : resolvedColor,
                                                            borderColor: isActive ? 'transparent' : `${resolvedColor}40`,
                                                            boxShadow: isActive 
                                                                ? `0 4px 14px ${resolvedColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)` 
                                                                : '0 1px 2px rgba(0, 0, 0, 0.02)',
                                                        } : undefined}
                                                    >
                                                        {isExclude && <Ban className="w-3 h-3 stroke-[3px]" />}
                                                        {channelLogo ? (
                                                            <div className="relative">
                                                                <img 
                                                                    src={channelLogo} 
                                                                    alt={chip.label} 
                                                                    className={`w-9 h-9 rounded-full object-cover transition-all duration-500 ${isActive ? (isAssignee ? 'scale-110 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : 'scale-110') : 'hover:scale-105'}`}
                                                                    style={{ 
                                                                        filter: isActive 
                                                                            ? `drop-shadow(0 0 6px ${isAssignee ? '#6366f1' : chColor})`
                                                                            : 'none',
                                                                        border: isActive ? `2px solid ${chColor}` : 'none'
                                                                    }}
                                                                    title={chip.label} 
                                                                />
                                                                {isActive && !isExclude && (
                                                                    <div 
                                                                        className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100"
                                                                        style={{ color: chColor }}
                                                                    >
                                                                        <Check className="w-2.5 h-2.5 stroke-[4px]" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5">
                                                                {isHexColor && (
                                                                    <span 
                                                                        className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                                                                        style={{ 
                                                                            backgroundColor: isActive ? '#ffffff' : resolvedColor,
                                                                            opacity: isActive ? 1 : 0.7 
                                                                        }} 
                                                                    />
                                                                )}
                                                                {chip.label.toUpperCase()}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* Advanced Cosmic Unified Filter Modal Button (Only in CONTENT mode) */}
                                    {viewMode === 'CONTENT' && (
                                        <button 
                                            onClick={onOpenCosmicFilter}
                                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 active:scale-95 text-[10px] font-black tracking-wide uppercase group relative overflow-visible ${
                                                activeFiltersCount > 0
                                                    ? 'bg-gradient-to-r from-indigo-50 to-violet-50/90 border-indigo-300 text-indigo-600 shadow-[0_4px_16px_rgba(99,102,241,0.16)] ring-4 ring-indigo-100/40'
                                                    : 'bg-gradient-to-r from-stone-50 to-indigo-50/40 border-stone-200 hover:border-indigo-300/80 text-stone-700 hover:text-indigo-600 shadow-[0_2px_10px_rgba(120,113,108,0.03)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.12)]'
                                            }`}
                                            title="ตัวกรองรายละเอียด (ช่อง, รูปแบบ, สถานะ)"
                                        >
                                            {activeFiltersCount > 0 && (
                                                <span className="absolute inset-0 rounded-2xl bg-indigo-400/10 animate-ping pointer-events-none scale-105" />
                                            )}

                                            <SlidersHorizontal className={`w-3.5 h-3.5 transition-all duration-300 ${
                                                activeFiltersCount > 0 
                                                    ? 'text-indigo-500 group-hover:rotate-45' 
                                                    : 'text-stone-500 group-hover:text-indigo-500 group-hover:rotate-12'
                                            }`} />
                                            
                                            <span>ตัวกรองละเอียด</span>

                                            {activeFiltersCount > 0 && (
                                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white text-indigo-600 border border-indigo-200/60 shadow-sm transition-transform duration-200 group-hover:scale-110">
                                                    {activeFiltersCount}
                                                </span>
                                            )}
                                        </button>
                                    )}

                                    {/* Cross-Mode Plan Overlay Toggle (Only in CONTENT & TASK modes) */}
                                    {onTogglePlanOverlay && viewMode !== 'PLAN' && (
                                        <button
                                            onClick={onTogglePlanOverlay}
                                            className={`
                                                flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[10px] font-black tracking-wide uppercase transition-all duration-300 shrink-0 active:scale-95
                                                ${showPlanOverlay
                                                    ? 'bg-fuchsia-50/90 text-fuchsia-800 border-2 border-dashed border-fuchsia-400 shadow-[0_2px_12px_rgba(217,70,239,0.18)] hover:bg-fuchsia-100 hover:border-fuchsia-500'
                                                    : 'bg-stone-50 text-stone-400 border border-stone-200 hover:bg-white hover:text-stone-700 hover:border-stone-300'
                                                }
                                            `}
                                            title={showPlanOverlay ? 'คลิกเพื่อซ่อนการแสดงผลแพลนและรูทีนร่วม' : 'คลิกเพื่อเปิดแสดงผลแพลนและรูทีนร่วมด้วย (เส้นประ)'}
                                        >
                                            <Sparkles className={`w-3.5 h-3.5 transition-transform ${showPlanOverlay ? 'text-fuchsia-600 scale-110' : 'text-stone-400'}`} />
                                            <span>ซ้อนแพลน & รูทีน</span>
                                            {showPlanOverlay && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* --- TOOLS SECTION --- */}
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-2 p-1.5 bg-white/90 rounded-[1.25rem] border border-gray-200 shadow-sm">
                                    {/* Notifications */}
                                    <NotificationBellBtn 
                                        onClick={onOpenNotifications || onOpenSettings}
                                        unreadCount={unreadCount}
                                    />

                                    {/* Workbox */}
                                    {onToggleWorkbox && (
                                        <button 
                                            onClick={onToggleWorkbox}
                                            className={`p-2.5 rounded-xl transition-all ${isWorkboxOpen ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-transparent text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                                            title="Workbox"
                                        >
                                            <Inbox className="w-4 h-4" />
                                        </button>
                                    )}

                                    {/* Stock */}
                                    <button 
                                        onClick={onToggleStock}
                                        className={`p-2.5 rounded-xl transition-all ${isStockOpen ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-transparent text-slate-400 hover:text-amber-600 hover:bg-slate-50'}`}
                                        title="คลังงาน"
                                    >
                                        <Package className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-4 bg-gray-200 mx-1" />

                                    {/* Density Selector */}
                                    <div className="relative">
                                        <button 
                                            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                                            className={`p-2.5 rounded-xl transition-all ${isViewMenuOpen ? 'bg-sky-50 text-sky-600' : 'bg-transparent text-slate-400 hover:text-sky-600 hover:bg-slate-50'}`}
                                            title="Density"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        
                                        <AnimatePresence>
                                            {isViewMenuOpen && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsViewMenuOpen(false)} />
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                        className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 origin-top-right"
                                                    >
                                                        <p className="text-[10px] font-black text-slate-400 px-3 py-1.5 uppercase tracking-wider">Visual Density</p>
                                                        <div className="space-y-1">
                                                            {['MINIMAL', 'DOT', 'EMOJI', 'FULL'].map((mode) => (
                                                                <button
                                                                    key={mode}
                                                                    onClick={() => { setTaskDisplayMode(mode as any); setIsViewMenuOpen(false); }}
                                                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-black transition-all ${taskDisplayMode === mode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                                                                >
                                                                    {mode}
                                                                    {taskDisplayMode === mode && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Settings */}
                                    <button 
                                        onClick={onOpenSettings}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all"
                                        title="การตั้งค่า"
                                    >
                                        <Wrench className="w-4 h-4" />
                                    </button>
                                </div>

                                <button 
                                    onClick={onClose}
                                    className="w-11 h-11 flex items-center justify-center bg-white border border-gray-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-2xl transition-all active:scale-90 shadow-sm"
                                    title="ปิดเครื่องมือ"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CalendarSecondaryHeader;

