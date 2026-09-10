import React from 'react';
import { motion } from 'framer-motion';
import { User, ViewMode } from '../../types';
import SidebarBadge from '../SidebarBadge';
import { SidebarMenuItemConfig, SidebarThemeStyles } from './types';

interface SidebarMenuItemProps {
  item: SidebarMenuItemConfig;
  isActive: boolean;
  isCollapsed: boolean;
  themeClasses: SidebarThemeStyles;
  currentUser: User;
  unreadChatCount: number;
  onClick: () => void;
}

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({
  item,
  isActive,
  isCollapsed,
  themeClasses,
  currentUser,
  unreadChatCount,
  onClick
}) => {
  const Icon = item.icon;

  return (
    <motion.button
      whileHover={{ x: isCollapsed ? 0 : 4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
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
          className={`absolute inset-0 z-0 ${themeClasses.activePill} shadow-sm`}
          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
        />
      )}

      {/* Active Indicator Bar */}
      {isActive && (
        <motion.div 
          layoutId="active-bar"
          className={`absolute left-0 top-1/4 bottom-1/4 w-1 ${themeClasses.activeBar} rounded-r-full z-10`}
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        />
      )}

      {/* Hover Background (When not active) */}
      {!isActive && (
        <div className={`absolute inset-0 z-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 ${themeClasses.hoverBg}`} />
      )}

      <div className={`relative shrink-0 z-10 transition-colors duration-300 ${isActive ? themeClasses.itemActiveColor : ''}`}>
        <Icon className={`sidebar-icon ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${isActive ? themeClasses.activeIcon : themeClasses.idleIcon}`} />
        
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
      
      <span className={`sidebar-item-text flex-1 text-left text-sm font-bold tracking-tight ml-3.5 relative z-10 transition-colors duration-300 ${isActive ? themeClasses.itemActiveColor : ''}`}>
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
};
