import { User, ViewMode, TaskType } from '../../types';

export interface SidebarMenuItemConfig {
  view: ViewMode;
  label: string;
  icon: any;
  mobileLabel?: string;
}

export interface MenuGroup {
  id: string;
  title: string;
  icon: any;
  adminOnly?: boolean;
  items: SidebarMenuItemConfig[];
}

export interface SidebarThemeStyles {
  aside: string;
  text: string;
  subtext: string;
  groupHeader: string;
  itemIdle: string;
  itemActive: string;
  itemActiveColor: string;
  activeIcon: string;
  idleIcon: string;
  activePill: string;
  activeBar: string;
  hoverBg: string;
  brandAccentBg: string;
  brandAccentText: string;
  brandAccentGradient: string;
  footer: string;
  userCard: string;
  logoArea: string;
  iconBg: string;
}

export interface SidebarProps {
  currentUser: User;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onLogout: () => void;
  onEditProfile: () => void;
  onAddTask?: (type?: TaskType) => void;
  unreadChatCount: number;
  systemUnreadCount?: number;
  isCollapsed: boolean;
  onToggleCollapse: (val: boolean) => void;
  onLogoTrigger?: () => void;
}
