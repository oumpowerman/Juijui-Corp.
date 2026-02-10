import React, { useState, useMemo } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Users, MessageCircle, Target, TrendingUp, Coffee, ScanEye, Film, ClipboardList, BookOpen, Settings2, Database, Briefcase, ShieldCheck, LogOut, Edit, Sparkles, BarChart3, Megaphone, FileText, Presentation, ChevronDown, ChevronRight, Building2, Clapperboard, Terminal, Clock, DollarSign, Crown, Monitor } from 'lucide-react';
import { User, ViewMode, MenuGroup } from '../types';
import { useSidebarBadges } from '../hooks/useSidebarBadges';

interface SidebarProps {
  currentUser: User;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  onEditProfile: () => void;
  onAddTask: () => void;
  unreadChatCount: number;
  systemUnreadCount?: number; 
  isCollapsed: boolean;
  onToggleCollapse: (val: boolean) => void;
}

// Notification Pill Component
const NotificationPill = ({ count, color = 'bg-red-500' }: { count: number, color?: string }) => {
    if (count <= 0) return null;
    return (
        <span className={`
            min-w-[18px] h-[18px] flex items-center justify-center 
            text-[9px] font-black text-white rounded-full border-2 border-white shadow-sm z-20 ${color} animate-pulse
        `}>
            {count > 99 ? '99+' : count}
        </span>
    );
};

// Menu Groups Definition
export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม', icon: LayoutGrid },
      { view: 'CALENDAR', label: 'ปฏิทิน & บอร์ด', icon: CalendarIcon }, 
      { view: 'CHAT', label: 'ห้องแชท', icon: MessageCircle },
      { view: 'TEAM', label: 'ทีมงาน', icon: Users },
      { view: 'WEEKLY', label: 'ภารกิจ', icon: Target },
      { view: 'GOALS', label: 'เป้าหมาย', icon: TrendingUp }, 
    ]
  },
  {
    id: 'PRODUCTION',
    title: 'Production',
    icon: Clapperboard,
    items: [
      { view: 'SCRIPT_HUB', label: 'เขียนบท', icon: FileText },
      { view: 'MEETINGS', label: 'ห้องประชุม', icon: Presentation },
      { view: 'STOCK', label: 'คลังคลิป', icon: Film },
      { view: 'CHECKLIST', label: 'จัดเป๋า', icon: ClipboardList },
    ]
  },
  {
    id: 'OFFICE',
    title: 'Office',
    icon: Building2,
    items: [
      { view: 'ATTENDANCE', label: 'ลงเวลาทำงาน', icon: Clock },
      { view: 'LEADERBOARD', label: 'Hall of Fame', icon: Crown }, 
      { view: 'DUTY', label: 'ตารางเวร', icon: Coffee },
      { view: 'KPI', label: 'ประเมินผล', icon: BarChart3 }, 
      { view: 'FEEDBACK', label: 'Voice of Team', icon: Megaphone },
      { view: 'WIKI', label: 'คู่มือ', icon: BookOpen },
      { view: 'ASSETS', label: 'ทะเบียนทรัพย์สิน', icon: Monitor },
      { view: 'FINANCE', label: 'ระบบบัญชี', icon: DollarSign },
    ]
  },
  {
    id: 'ADMIN',
    title: 'Admin',
    icon: ShieldCheck,
    adminOnly: true,
    items: [
      { view: 'QUALITY_GATE', label: 'ห้องตรวจงาน', icon: ScanEye },
      { view: 'CHANNELS', label: 'จัดการช่องทาง', icon: Settings2 },
      { view: 'MASTER_DATA', label: 'ตั้งค่าระบบ', icon: Database },
      { view: 'SYSTEM_GUIDE', label: 'คู่มือระบบ (Logic)', icon: Terminal }, 
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, 
  currentView, 
  onNavigate, 
  onLogout, 
  onEditProfile, 
  unreadChatCount,
  systemUnreadCount = 0,
  isCollapsed,
  onToggleCollapse
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const { badges } = useSidebarBadges(currentUser);

  // State for Accordion
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
      'WORKSPACE': true,
      'PRODUCTION': true,
      'OFFICE': false,
      'ADMIN': false
  });

  const toggleGroup = (groupId: string) => {
      setExpandedGroups(prev => ({
          ...prev,
          [groupId]: !prev[groupId]
      }));
  };

  const handleMenuItemClick = (view: ViewMode) => {
      onNavigate(view);
  };

  // Helper to get badge count for a specific view
  const getBadgeForView = (view: ViewMode) => {
      if (view === 'CHAT') return unreadChatCount;
      if (view === 'DASHBOARD') return systemUnreadCount;
      if (view === 'QUALITY_GATE') return badges.qualityGate;
      if (view === 'FEEDBACK') return badges.feedback;
      if (view === 'DUTY') return badges.myDuty;
      // Show Member Approval count on Team menu for Admins
      if (view === 'TEAM' && isAdmin) return badges.memberApproval;
      return 0;
  };

  // Helper to get total badge count for a group
  const getGroupBadgeTotal = (groupItems: { view: ViewMode }[]) => {
      return groupItems.reduce((acc, item) => acc + getBadgeForView(item.view), 0);
  };

  return (
    <aside 
      onMouseEnter={() => onToggleCollapse(false)}
      onMouseLeave={() => onToggleCollapse(true)}
      className={`
        hidden lg:flex flex-col h-full bg-white border-r border-gray-200 shadow-xl shrink-0 z-50 sidebar-transition relative
        ${isCollapsed ? 'w-[88px] sidebar-collapsed' : 'w-[280px] sidebar-expanded'}
      `}
    >
      {/* 1. Brand Logo Area */}
      <div className={`flex items-center bg-gradient-to-r from-white to-slate-50/50 overflow-hidden ${isCollapsed ? 'px-5 py-8 justify-center' : 'px-8 py-8'}`}>
        <div className={`
          bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white shrink-0 sidebar-icon
          ${isCollapsed ? 'w-12 h-12' : 'w-12 h-12 mr-4'}
        `}>
          <Sparkles className="w-7 h-7 stroke-[2.5px]" />
        </div>
        <div className="sidebar-item-text">
          <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">Juijui</h1>
          <p className="text-[11px] font-black text-indigo-500 tracking-widest mt-1 uppercase">Planner</p>
        </div>
      </div>

      {/* 2. Menu Area */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-4 scrollbar-hide">
        {MENU_GROUPS.map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          
          const isExpanded = expandedGroups[group.id];
          const GroupIcon = group.icon;
          const groupTotalBadge = getGroupBadgeTotal(group.items);

          return (
            <div key={group.id} className="mb-6">
              {/* Group Header */}
              {!isCollapsed ? (
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-6 py-2 text-slate-400 hover:text-indigo-600 transition-all group/header"
                >
                    <div className="flex items-center gap-3">
                        <GroupIcon className="w-4 h-4 opacity-70" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] sidebar-item-text">
                          {group.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 sidebar-item-text">
                        {/* Show aggregated badge on group header if collapsed */}
                        {!isExpanded && groupTotalBadge > 0 && (
                             <NotificationPill count={groupTotalBadge} color="bg-indigo-500" />
                        )}
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </div>
                </button>
              ) : (
                <div className="w-full flex justify-center py-2 text-slate-200 relative group/icon">
                   {/* Divider or Mini Icon when collapsed */}
                   <div className="w-10 h-px bg-slate-100"></div>
                   
                   {/* Tooltip for Group Name (Optional Enhancement) */}
                   <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 pointer-events-none whitespace-nowrap z-50">
                       {group.title}
                   </div>
                </div>
              )}

              {/* Group Items */}
              <div className={`overflow-hidden transition-all duration-500 ${isCollapsed || isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
                  <div className={`space-y-1.5 mt-2 ${isCollapsed ? 'px-3' : 'px-4'}`}>
                    {group.items.map((item) => {
                      const isActive = currentView === item.view;
                      const Icon = item.icon;
                      const badgeCount = getBadgeForView(item.view);

                      return (
                        <button
                          key={item.view}
                          onClick={() => handleMenuItemClick(item.view)}
                          className={`
                            w-full flex items-center rounded-2xl transition-all duration-300 relative group/btn overflow-visible
                            ${isCollapsed ? 'justify-center py-3.5' : 'px-4 py-3'}
                            ${isActive 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                              : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-700'}
                          `}
                          title={isCollapsed ? item.label : ''}
                        >
                          <div className="relative shrink-0">
                                <Icon className={`sidebar-icon ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? 'text-white' : 'text-slate-400 group-hover/btn:text-indigo-600'}`} />
                                
                                {/* Collapsed Badge (Attached to Icon) */}
                                {isCollapsed && badgeCount > 0 && (
                                     <div className="absolute -top-1.5 -right-1.5">
                                         <NotificationPill count={badgeCount} />
                                     </div>
                                )}
                          </div>
                          
                          <span className={`sidebar-item-text flex-1 text-left text-sm font-bold tracking-tight ml-3.5`}>
                             {item.label}
                          </span>
                          
                          {/* Expanded Badge (Pill on Right) */}
                          {!isCollapsed && badgeCount > 0 && (
                             <div className="sidebar-item-text ml-auto">
                                <NotificationPill count={badgeCount} color={isActive ? 'bg-white text-indigo-600' : 'bg-red-500'} />
                             </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. User Footer */}
      <div className={`border-t border-gray-100 bg-slate-50/50 p-4 transition-all`}>
        <div 
          className={`flex items-center rounded-[1.25rem] hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-slate-200 hover:shadow-lg ${isCollapsed ? 'justify-center p-1' : 'gap-3 p-2.5'}`} 
          onClick={onEditProfile}
        >
          <div className="relative shrink-0 sidebar-icon">
            <img src={currentUser.avatarUrl} alt="User" className={`${isCollapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover border-2 border-white shadow-sm`} />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          <div className="sidebar-item-text flex-1 min-w-0">
            <p className="text-sm font-black text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-xs font-bold text-indigo-500 truncate uppercase tracking-tighter opacity-80">{currentUser.position || 'Member'}</p>
          </div>
          
          {!isCollapsed && (
            <div className="sidebar-item-text">
                <Edit className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500" />
            </div>
          )}
        </div>
        
        <button 
          onClick={onLogout}
          className={`
            w-full flex items-center justify-center gap-2 font-black transition-all uppercase tracking-[0.2em]
            ${isCollapsed ? 'mt-4 py-3 text-red-300 hover:text-red-500' : 'mt-4 py-3 text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl'}
          `}
          title={isCollapsed ? 'ลงชื่อออก' : ''}
        >
          <LogOut className={`${isCollapsed ? 'w-6 h-6' : 'w-3.5 h-3.5'}`} /> 
          <span className="sidebar-item-text">ลงชื่อออก</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;