
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Users, MessageCircle, Target, TrendingUp, Coffee, ScanEye, Film, ClipboardList, BookOpen, Settings2, Database, ChevronRight, ChevronLeft, ChevronDown, Sparkles, LogOut, Briefcase, Wrench, ShieldCheck, Edit } from 'lucide-react';
import { User, ViewMode } from '../types';

interface MenuItem {
  view: ViewMode;
  label: string;
  icon: any;
}

interface MenuGroup {
  id: string;
  title: string;
  icon: any;
  items: MenuItem[];
  adminOnly?: boolean;
}

// Menu Configuration
export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม (Overview)', icon: LayoutGrid },
      { view: 'CALENDAR', label: 'ปฏิทิน & บอร์ด', icon: CalendarIcon }, 
      { view: 'CHAT', label: 'ห้องแชท (Chat)', icon: MessageCircle },
      { view: 'TEAM', label: 'ทีมงาน (Team)', icon: Users },
      { view: 'WEEKLY', label: 'ภารกิจ (Quests)', icon: Target },
      { view: 'GOALS', label: 'เป้าหมาย (Goals)', icon: TrendingUp }, 
    ]
  },
  {
    id: 'TOOLS',
    title: 'Tools',
    icon: Wrench,
    items: [
      { view: 'DUTY', label: 'ตารางเวร (Duty)', icon: Coffee },
      { view: 'QUALITY_GATE', label: 'ห้องตรวจงาน (QC)', icon: ScanEye },
      { view: 'STOCK', label: 'คลังคลิป (Stock)', icon: Film },
      { view: 'CHECKLIST', label: 'จัดเป๋า (Checklist)', icon: ClipboardList },
      { view: 'WIKI', label: 'คู่มือ (Wiki)', icon: BookOpen },
    ]
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { view: 'CHANNELS', label: 'จัดการช่องทาง', icon: Settings2 },
      { view: 'MASTER_DATA', label: 'ตั้งค่าระบบ', icon: Database },
    ]
  }
];

interface NavItemProps {
    view: ViewMode;
    icon: any;
    label: string;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    collapsed?: boolean;
    badgeCount?: number;
}
  
const NavItem: React.FC<NavItemProps> = ({ view, icon: Icon, label, currentView, onNavigate, collapsed = false, badgeCount }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => onNavigate(view)}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center py-3 rounded-xl transition-all duration-200 group relative mb-1 text-sm ${
          isActive
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/20' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        } ${collapsed ? 'justify-center px-2' : 'px-4'}`}
      >
        <div className="relative">
            <Icon className={`w-4 h-4 min-w-[16px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
            {badgeCount && badgeCount > 0 ? (
                <div className={`absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center border-2 border-[#0f172a] ${collapsed ? 'right-[-8px]' : ''}`}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                </div>
            ) : null}
        </div>
        {!collapsed && (
          <span className="ml-3 font-medium hidden lg:block tracking-wide truncate">{label}</span>
        )}
        {isActive && (
          <div className={`absolute left-0 w-1 h-5 bg-white rounded-r-full hidden lg:block ${collapsed ? 'h-2 w-1 left-0.5 rounded-full' : '-ml-3'}`} />
        )}
      </button>
    );
};

interface SidebarProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onLogout: () => void;
    onEditProfile: () => void;
    unreadChatCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, onNavigate, onLogout, onEditProfile, unreadChatCount }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['WORKSPACE']);
    const isAdmin = currentUser.role === 'ADMIN';

    // Auto expand group when navigating
    useEffect(() => {
        const parentGroup = MENU_GROUPS.find(g => g.items.some(i => i.view === currentView));
        if (parentGroup && !expandedGroups.includes(parentGroup.id)) {
            setExpandedGroups(prev => [...prev, parentGroup.id]);
        }
    }, [currentView]);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => 
            prev.includes(groupId) 
            ? prev.filter(id => id !== groupId) 
            : [...prev, groupId]
        );
    };

    const safeName = currentUser.name || 'Unknown';

    return (
        <aside 
            className={`
                hidden lg:flex bg-[#0f172a] text-white flex-col transition-all duration-300 ease-in-out shadow-xl z-20 relative
                ${isSidebarCollapsed ? 'w-24' : 'w-72'}
            `}
        >
            <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute -right-3 top-20 bg-white text-indigo-600 p-1.5 rounded-full shadow-lg border border-gray-100 z-30 hover:bg-indigo-50 hover:text-indigo-800 transition-all hover:scale-110 active:scale-95"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>

            <div className={`h-20 flex items-center border-b border-slate-800/50 shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start px-6'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                <Sparkles className="text-white w-6 h-6" />
            </div>
            {!isSidebarCollapsed && (
                <div className="ml-3 overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                    <h1 className="font-bold text-lg tracking-tight leading-none text-white">Juijui Planner</h1>
                    <p className="text-[10px] text-indigo-400 font-medium tracking-wider mt-0.5">CREATOR EDITION</p>
                </div>
            )}
            </div>

            <nav className="flex-1 py-6 px-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
            {MENU_GROUPS.map((group) => {
                if (group.adminOnly && !isAdmin) return null;
                
                const isExpanded = expandedGroups.includes(group.id);
                
                return (
                    <div key={group.id} className="border-b border-slate-800/50 pb-2 last:border-0">
                        <button 
                            onClick={() => toggleGroup(group.id)}
                            className={`w-full flex items-center py-2 text-slate-500 hover:text-slate-300 transition-colors ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-3'}`}
                            title={isSidebarCollapsed ? group.title : undefined}
                        >
                            <div className={`flex items-center gap-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                                {isSidebarCollapsed ? (
                                    <group.icon className="w-4 h-4 text-slate-600" /> 
                                ) : (
                                    <span className="text-xs font-bold uppercase tracking-wider">{group.title}</span>
                                )}
                            </div>
                            {!isSidebarCollapsed && (
                                isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                            )}
                        </button>
                        
                        <div className={`space-y-1 mt-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            {group.items.map(item => (
                                <NavItem 
                                    key={item.view} 
                                    view={item.view} 
                                    icon={item.icon} 
                                    label={item.label} 
                                    currentView={currentView}
                                    onNavigate={onNavigate}
                                    collapsed={isSidebarCollapsed}
                                    badgeCount={item.view === 'CHAT' ? unreadChatCount : 0}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
            </nav>

            <div className={`border-t border-slate-800 bg-[#0f172a] shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'p-2' : 'p-4 flex justify-between items-center'}`}>
                <div 
                    onClick={onEditProfile}
                    className={`flex items-center rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group/profile relative ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-start p-2 flex-1 mr-2'}`}
                    title="แก้ไขข้อมูลส่วนตัว"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-sm font-bold shadow-md border-2 border-slate-700 overflow-hidden relative shrink-0">
                    {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} className="w-full h-full object-cover" /> : safeName.charAt(0).toUpperCase()}
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/profile:opacity-100 transition-opacity">
                        <Edit className="w-4 h-4 text-white" />
                    </div>
                    </div>
                    
                    {!isSidebarCollapsed && (
                        <div className="ml-3 overflow-hidden whitespace-nowrap">
                        <div className="flex items-center gap-1">
                            <p className="text-sm font-bold text-gray-200 truncate group-hover/profile:text-white transition-colors">{safeName.split(' ')[0]}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isAdmin ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            {isAdmin ? 'CEO' : 'TEAM'}
                            </span>
                        </div>
                        <p className="text-xs text-indigo-400 truncate">แก้ไขโปรไฟล์</p>
                        </div>
                    )}
                </div>

                {!isSidebarCollapsed && (
                    <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 transition-colors" title="ออกจากระบบ">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
