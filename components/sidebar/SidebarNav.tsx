import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MenuGroup, User, ViewMode } from '../../types';
import { SidebarThemeStyles } from './types';
import { SidebarMenuItem } from './SidebarMenuItem';

interface SidebarNavProps {
  menuGroups: MenuGroup[];
  isAdmin: boolean;
  isCollapsed: boolean;
  currentView: ViewMode;
  themeClasses: SidebarThemeStyles;
  currentUser: User;
  unreadChatCount: number;
  onNavigate: (view: ViewMode) => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  menuGroups,
  isAdmin,
  isCollapsed,
  currentView,
  themeClasses,
  currentUser,
  unreadChatCount,
  onNavigate
}) => {
  // State for Accordion groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'WORKSPACE': true,
    'PRODUCTION': true,
    'OFFICE': true,
    'ADMIN': false
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto sidebar-scroll py-4 scrollbar-hide">
      {menuGroups.map((group) => {
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
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] sidebar-item-text">
                    {group.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 sidebar-item-text">
                  {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
              </button>
            ) : (
              <div className="w-full flex justify-center py-2 text-slate-200 relative group/icon">
                {/* Divider when collapsed */}
                <div className="w-10 h-px bg-slate-100/30"></div>
                
                {/* Tooltip for Group Name */}
                <div className="absolute left-full ml-2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/icon:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {group.title}
                </div>
              </div>
            )}

            {/* Group Items */}
            <div className={`overflow-hidden transition-all duration-500 ${isCollapsed || isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
              <div className={`space-y-1.5 mt-2 ${isCollapsed ? 'px-3' : 'px-4'}`}>
                {group.items.map((item) => (
                  <SidebarMenuItem
                    key={item.view}
                    item={item}
                    isActive={currentView === item.view}
                    isCollapsed={isCollapsed}
                    themeClasses={themeClasses}
                    currentUser={currentUser}
                    unreadChatCount={unreadChatCount}
                    onClick={() => onNavigate(item.view)}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
