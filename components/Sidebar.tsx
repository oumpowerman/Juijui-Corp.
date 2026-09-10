import React, { useMemo, useState, useEffect } from 'react';
import { useMasterDataContext } from '../context/MasterDataContext';
import { SidebarProps } from './sidebar/types';
import { MENU_GROUPS } from './sidebar/menuConfig';
import { getSidebarThemeStyles } from './sidebar/sidebarThemes';
import { SidebarBrand } from './sidebar/SidebarBrand';
import { SidebarNav } from './sidebar/SidebarNav';
import { SidebarUserFooter } from './sidebar/SidebarUserFooter';

export { MENU_GROUPS } from './sidebar/menuConfig';
export type { SidebarProps, SidebarThemeStyles, MenuGroup, SidebarMenuItemConfig } from './sidebar/types';

const Sidebar: React.FC<SidebarProps> = ({ 
  currentUser, 
  currentView, 
  onNavigate, 
  onLogout, 
  onEditProfile, 
  unreadChatCount,
  isCollapsed,
  onToggleCollapse,
  onLogoTrigger
}) => {
  const isAdmin = currentUser.role === 'ADMIN';
  const { masterOptions } = useMasterDataContext();

  // Active custom views from Sidebar Control Center configuration
  const activeViews = useMemo(() => {
    const config = masterOptions.find(o => o.type === 'SIDEBAR_CONFIG' && o.key === 'ACTIVE_MENUS');
    if (!config) return null;
    try {
      return JSON.parse(config.label) as string[];
    } catch (e) {
      console.error("Failed to parse sidebar config", e);
      return null;
    }
  }, [masterOptions]);

  const filteredMenuGroups = useMemo(() => {
    if (!activeViews || activeViews.length === 0) return MENU_GROUPS;
    return MENU_GROUPS.map(group => {
      const visibleItems = group.items.filter(item => activeViews.includes(item.view));
      return {
        ...group,
        items: visibleItems
      };
    }).filter(group => group.items.length > 0);
  }, [activeViews]);

  // Dynamic seasonal and social theme detection
  const [activeBgTheme, setActiveBgTheme] = useState<string>(() => {
    if (typeof window !== 'undefined' && (window as any).__activeBackgroundTheme) {
      return (window as any).__activeBackgroundTheme;
    }
    const savedChannelTheme = typeof window !== 'undefined' ? localStorage.getItem('channel_social_theme') : null;
    if (savedChannelTheme) return savedChannelTheme;
    return (currentUser as any)?.equippedBgId || 'bg-pastel-wave';
  });

  const isDarkTheme = currentView === 'QUALITY_GATE' || currentView === 'GOALS' || (currentView === 'CHANNELS' && activeBgTheme === 'midnight-studio');

  useEffect(() => {
    const handleBgChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.theme) {
        setActiveBgTheme(detail.theme);
      }
    };
    window.addEventListener('app-background-changed', handleBgChange);
    return () => {
      window.removeEventListener('app-background-changed', handleBgChange);
    };
  }, []);

  const themeClasses = useMemo(() => {
    return getSidebarThemeStyles(activeBgTheme, isDarkTheme, currentView);
  }, [activeBgTheme, isDarkTheme, currentView]);

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
      <SidebarBrand 
        isCollapsed={isCollapsed}
        themeClasses={themeClasses}
        onLogoTrigger={onLogoTrigger}
      />

      {/* 2. Menu Navigation */}
      <SidebarNav 
        menuGroups={filteredMenuGroups}
        isAdmin={isAdmin}
        isCollapsed={isCollapsed}
        currentView={currentView}
        themeClasses={themeClasses}
        currentUser={currentUser}
        unreadChatCount={unreadChatCount}
        onNavigate={onNavigate}
      />

      {/* 3. User Footer & Status */}
      <SidebarUserFooter 
        currentUser={currentUser}
        isCollapsed={isCollapsed}
        isDarkTheme={isDarkTheme}
        themeClasses={themeClasses}
        onEditProfile={onEditProfile}
        onLogout={onLogout}
      />
    </aside>
  );
};

export default Sidebar;
