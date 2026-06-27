
import React, { useState, useMemo } from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Users, MessageCircle, Target, TrendingUp, Coffee, ScanEye, Film, ClipboardList, BookOpen, Settings2, Database, Briefcase, ShieldCheck, LogOut, Edit, Sparkles, BarChart3, Megaphone, FileText, Presentation, ChevronDown, ChevronRight, Building2, Clapperboard, Terminal, Clock, DollarSign, Crown, Monitor, Share2, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { User, ViewMode, MenuGroup } from '../types';
import SidebarBadge from './SidebarBadge';
import NotificationPill from './NotificationPill';
import AIStatusBadge from './common/AIStatusBadge';

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


// Menu Groups Definition
export const MENU_GROUPS: MenuGroup[] = [
  {
    id: 'WORKSPACE',
    title: 'Workspace',
    icon: Briefcase,
    items: [
      { view: 'DASHBOARD', label: 'ภาพรวม', icon: LayoutGrid },
      { view: 'ROADMAP', label: 'แผนงาน', icon: Map },
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
      { view: 'ContentStock', label: 'คลังคลิป', icon: Film },
      { view: 'ANALYTICS', label: 'วิเคราะห์ข้อมูล', icon: BarChart3 },
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

  // Theme Logic
  const isDarkTheme = currentView === 'QUALITY_GATE' || currentView === 'GOALS';
  
  // Dynamic seasonal theme detection
  const activeBgId = (currentUser as any).equippedBgId || 'bg-pastel-wave';

  const seasonStyle = useMemo(() => {
    switch (activeBgId) {
      case 'bg-season-summer':
        return {
          logoArea: 'from-amber-400/5 via-amber-400/2 to-transparent',
          footer: 'border-t border-amber-500/10 bg-transparent',
          userCard: 'hover:bg-amber-500/10 hover:border-amber-500/20 hover:shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)]',
          text: 'text-amber-900/85',
          subtext: 'text-amber-800/70',
          iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-600 backdrop-blur-md shadow-sm hover:bg-amber-500/15'
        };
      case 'bg-season-snow':
        return {
          logoArea: 'from-sky-300/6 via-sky-300/2 to-transparent',
          footer: 'border-t border-sky-500/10 bg-transparent',
          userCard: 'hover:bg-sky-500/10 hover:border-sky-500/20 hover:shadow-[0_4px_20px_-4px_rgba(14,165,233,0.15)]',
          text: 'text-sky-900/85',
          subtext: 'text-sky-800/70',
          iconBg: 'bg-sky-500/10 border border-sky-500/20 text-sky-600 backdrop-blur-md shadow-sm hover:bg-sky-500/15'
        };
      case 'bg-season-rain':
        return {
          logoArea: 'from-slate-500/10 via-slate-500/3 to-transparent',
          footer: 'border-t border-slate-700/20 bg-transparent',
          userCard: 'hover:bg-slate-700/30 hover:border-slate-600/40 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]',
          text: 'text-slate-200/90',
          subtext: 'text-slate-400/80',
          iconBg: 'bg-slate-500/20 border border-slate-500/30 text-slate-300 backdrop-blur-md shadow-sm hover:bg-slate-500/25'
        };
      case 'bg-season-autumn':
        return {
          logoArea: 'from-orange-400/5 via-orange-400/2 to-transparent',
          footer: 'border-t border-orange-500/10 bg-transparent',
          userCard: 'hover:bg-orange-500/10 hover:border-orange-500/20 hover:shadow-[0_4px_20px_-4px_rgba(249,115,22,0.15)]',
          text: 'text-orange-900/85',
          subtext: 'text-orange-800/70',
          iconBg: 'bg-orange-500/10 border border-orange-500/20 text-orange-600 backdrop-blur-md shadow-sm hover:bg-orange-500/15'
        };
      default:
        return {
          logoArea: isDarkTheme ? 'from-white/3 via-white/1 to-transparent' : 'from-indigo-500/4 via-indigo-500/1 to-transparent',
          footer: isDarkTheme ? 'border-t border-white/5 bg-transparent' : 'border-t border-slate-200/50 bg-transparent',
          userCard: isDarkTheme 
            ? 'hover:bg-white/5 hover:border-white/10 hover:shadow-[0_4px_20px_-4px_rgba(255,255,255,0.05)]' 
            : 'hover:bg-indigo-500/5 hover:border-indigo-500/10 hover:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.1)]',
          text: isDarkTheme ? 'text-slate-200/90' : 'text-slate-800/90',
          subtext: isDarkTheme ? 'text-slate-400/80' : 'text-slate-500/80',
          iconBg: isDarkTheme 
            ? 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-md shadow-sm hover:bg-white/10' 
            : 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 backdrop-blur-md shadow-sm hover:bg-indigo-500/10'
        };
    }
  }, [activeBgId, isDarkTheme]);

  const themeClasses = {
      aside: isDarkTheme
        ? 'bg-slate-950/20 backdrop-blur-2xl border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
        : 'bg-white/20 backdrop-blur-2xl border-r border-white/30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]',
      text: seasonStyle.text,
      subtext: seasonStyle.subtext,
      groupHeader: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-500 hover:text-indigo-600',
      itemIdle: isDarkTheme ? 'text-slate-400 hover:text-indigo-300' : 'text-slate-600 hover:text-indigo-700',
      itemActive: isDarkTheme ? 'text-indigo-300' : 'text-indigo-700',
      footer: seasonStyle.footer,
      userCard: seasonStyle.userCard,
      logoArea: seasonStyle.logoArea,
      iconBg: seasonStyle.iconBg
  };

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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ONLINE': return 'bg-green-500';
      case 'BUSY': return 'bg-red-500';
      case 'SICK': return 'bg-orange-500';
      case 'VACATION': return 'bg-blue-500';
      case 'MEETING': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <aside 
      onMouseEnter={() => onToggleCollapse(false)}
      onMouseLeave={() => onToggleCollapse(true)}
      className={`
        hidden lg:flex flex-col h-full ${themeClasses.aside} shrink-0 z-50 sidebar-transition relative
        ${isCollapsed ? 'w-[88px] sidebar-collapsed' : 'w-[280px] sidebar-expanded'}
      `}
    >
      {/* 1. Brand Logo Area */}
      <div className={`flex items-center bg-gradient-to-b ${themeClasses.logoArea} overflow-hidden ${isCollapsed ? 'px-5 py-8 justify-center' : 'px-8 py-8'}`}>
        <motion.div 
          initial={{ rotate: -10, scale: 0.9, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`
            ${themeClasses.iconBg} rounded-2xl flex items-center justify-center shrink-0 sidebar-icon relative overflow-hidden group transition-all duration-300
            ${isCollapsed ? 'w-12 h-12' : 'w-12 h-12 mr-4'}
          `}
        >
          <Sparkles className="w-7 h-7 stroke-[2.5px] relative z-10 transition-transform duration-300 group-hover:scale-110" />
          <motion.div 
            animate={{ 
              x: ['-100%', '200%'],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: "linear" 
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
          />
        </motion.div>
        
        {!isCollapsed && (
          <div className="sidebar-item-text">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                }
              }}
              className="flex items-center"
            >
              {"Kontent".split('').map((char, i) => (
                <motion.span
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 5 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className={`text-xl font-black ${themeClasses.text} tracking-tight leading-none font-inter drop-shadow-sm`}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="flex items-center gap-1.5 mt-1"
            >
              <div className="h-[2px] w-4 bg-indigo-500 rounded-full" />
              <p className="text-[10px] font-black text-indigo-500 tracking-[0.3em] uppercase font-inter">OS</p>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent rounded-full" />
            </motion.div>
          </div>
        )}
      </div>

      {/* 2. Menu Area */}
      <div className="flex-1 overflow-y-auto sidebar-scroll py-4 scrollbar-hide">
        {MENU_GROUPS.map((group) => {
          if (group.adminOnly && !isAdmin) return null;
          
          const isExpanded = expandedGroups[group.id];
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="mb-6">
              {/* Group Header */}
              {!isCollapsed ? (
                <button 
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-6 py-2 ${themeClasses.groupHeader} transition-all group/header`}
                >
                    <div className="flex items-center gap-3">
                        <GroupIcon className="w-4 h-4 opacity-70" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.15em] sidebar-item-text">
                          {group.title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 sidebar-item-text">
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

                      return (
                        <motion.button
                          key={item.view}
                          whileHover={{ x: isCollapsed ? 0 : 4 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleMenuItemClick(item.view)}
                          className={`
                            w-full flex items-center rounded-2xl transition-all duration-300 relative group/btn overflow-hidden
                            ${isCollapsed ? 'justify-center py-3.5' : 'px-4 py-3'}
                            ${isActive ? themeClasses.itemActive : themeClasses.itemIdle}
                          `}
                          title={isCollapsed ? item.label : ''}
                        >
                          {/* Active Background Pill */}
                          {isActive && (
                            <motion.div 
                                layoutId="active-pill"
                                className={`absolute inset-0 z-0 ${isDarkTheme ? 'bg-indigo-500/20 border border-indigo-400/20' : 'bg-indigo-50 border border-indigo-100'} shadow-sm`}
                                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                            />
                          )}

                          {/* Active Indicator Bar */}
                          {isActive && (
                            <motion.div 
                                layoutId="active-bar"
                                className={`absolute left-0 top-1/4 bottom-1/4 w-1 ${isDarkTheme ? 'bg-indigo-400' : 'bg-indigo-500'} rounded-r-full z-10`}
                                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                            />
                          )}

                          {/* Hover Background (When not active) */}
                          {!isActive && (
                            <div className={`absolute inset-0 z-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 ${isDarkTheme ? 'bg-white/5' : 'bg-slate-100'}`} />
                          )}

                          <div className={`relative shrink-0 z-10 transition-colors duration-300 ${isActive ? (isDarkTheme ? 'text-indigo-300' : 'text-indigo-600') : ''}`}>
                                <Icon className={`sidebar-icon ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? (isDarkTheme ? 'text-indigo-300' : 'text-indigo-600') : 'text-slate-400 group-hover/btn:text-indigo-600'}`} />
                                
                                {isCollapsed && (
                                     <div className="absolute -top-1.5 -right-1.5">
                                         <SidebarBadge 
                                            view={item.view as ViewMode} 
                                            currentUser={currentUser} 
                                            collapsed={true} 
                                            count={item.view === 'CHAT' ? unreadChatCount : undefined}
                                         />
                                     </div>
                                )}
                          </div>
                          
                          <span className={`sidebar-item-text flex-1 text-left text-sm font-bold tracking-tight ml-3.5 relative z-10 transition-colors duration-300 ${isActive ? (isDarkTheme ? 'text-indigo-300' : 'text-indigo-600') : ''}`}>
                             {item.label}
                          </span>
                          
                          {!isCollapsed && (
                             <div className="sidebar-item-text ml-auto relative z-10">
                                <SidebarBadge 
                                    view={item.view as ViewMode} 
                                    currentUser={currentUser} 
                                    count={item.view === 'CHAT' ? unreadChatCount : undefined}
                                />
                             </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2.5 AI Status Area */}
      <div className={`px-4 py-2 mb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <AIStatusBadge collapsed={isCollapsed} />
      </div>

      {/* 3. User Footer */}
      <div className={`${themeClasses.footer} p-4 transition-all`}>
        <div 
          className={`flex items-center rounded-[1.25rem] ${themeClasses.userCard} transition-all cursor-pointer group border border-transparent ${isCollapsed ? 'justify-center p-1' : 'gap-3 p-2.5'}`} 
          onClick={onEditProfile}
        >
          <div className="relative shrink-0 sidebar-icon">
            <img src={currentUser.avatarUrl} alt="User" className={`${isCollapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover border-2 ${isDarkTheme ? 'border-white/10' : 'border-white'} shadow-sm`} />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(currentUser.workStatus || 'ONLINE')} border-2 ${isDarkTheme ? 'border-slate-900' : 'border-white'} rounded-full`}></div>
          </div>
          
          <div className="sidebar-item-text flex-1 min-w-0">
            <p className={`text-sm font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'} truncate`}>{currentUser.name}</p>
            <p className="text-xs font-bold text-indigo-500 truncate uppercase tracking-tighter opacity-80">{currentUser.position || 'Member'}</p>
          </div>
          
          {!isCollapsed && (
            <div className="sidebar-item-text">
                <Edit className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-slate-600' : 'text-slate-300'} group-hover:text-indigo-500`} />
            </div>
          )}
        </div>
        
        <button 
          onClick={onLogout}
          className={`
            w-full flex items-center justify-center gap-2 font-black transition-all uppercase tracking-[0.2em]
            ${isCollapsed ? 'mt-4 py-3 text-red-300 hover:text-red-500' : `mt-4 py-3 text-[10px] ${isDarkTheme ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'} rounded-xl`}
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
