import React from 'react';
import { LogOut, Edit } from 'lucide-react';
import { User } from '../../types';
import { SidebarThemeStyles } from './types';
import AIStatusBadge from '../common/AIStatusBadge';
import { BRAND_CONFIG } from '../../config/brand';

interface SidebarUserFooterProps {
  currentUser: User;
  isCollapsed: boolean;
  isDarkTheme: boolean;
  themeClasses: SidebarThemeStyles;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const SidebarUserFooter: React.FC<SidebarUserFooterProps> = ({
  currentUser,
  isCollapsed,
  isDarkTheme,
  themeClasses,
  onEditProfile,
  onLogout
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'BUSY': return 'bg-red-500';
      case 'SICK': return 'bg-orange-500';
      case 'VACATION': return 'bg-blue-500';
      case 'MEETING': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <>
      {/* AI Status Area */}
      {BRAND_CONFIG.showSidebarAiStatusMode !== 2 && (
        <div className={`px-4 py-2 mb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <AIStatusBadge collapsed={isCollapsed} />
        </div>
      )}

      {/* User Footer Card & Logout */}
      <div className={`${themeClasses.footer} p-4 transition-all`}>
        <div 
          className={`flex items-center rounded-[1.25rem] ${themeClasses.userCard} transition-all cursor-pointer group border border-transparent ${
            isCollapsed ? 'justify-center p-1' : 'gap-3 p-2.5'
          }`} 
          onClick={onEditProfile}
        >
          <div className="relative shrink-0 sidebar-icon">
            <img 
              src={currentUser.avatarUrl} 
              alt="User" 
              className={`${isCollapsed ? 'w-12 h-12' : 'w-10 h-10'} rounded-full object-cover border-2 ${
                isDarkTheme ? 'border-white/10' : 'border-white'
              } shadow-sm`} 
            />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getStatusColor(currentUser.workStatus || 'ONLINE')} border-2 ${
              isDarkTheme ? 'border-slate-900' : 'border-white'
            } rounded-full`}></div>
          </div>
          
          <div className="sidebar-item-text flex-1 min-w-0">
            <p className={`text-sm font-bold ${isDarkTheme ? 'text-white' : 'text-slate-800'} truncate`}>
              {currentUser.name}
            </p>
            <p className="text-xs font-bold text-indigo-500 truncate uppercase tracking-tighter opacity-80">
              {currentUser.position || 'Member'}
            </p>
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
            w-full flex items-center justify-center gap-2 font-bold transition-all uppercase tracking-[0.2em]
            ${isCollapsed 
              ? 'mt-4 py-3 text-red-300 hover:text-red-500' 
              : `mt-4 py-3 text-[10px] ${isDarkTheme ? 'text-slate-600 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'} rounded-xl`
            }
          `}
          title={isCollapsed ? 'ลงชื่อออก' : ''}
        >
          <LogOut className={`${isCollapsed ? 'w-6 h-6' : 'w-3.5 h-3.5'}`} /> 
          <span className="sidebar-item-text">ลงชื่อออก</span>
        </button>
      </div>
    </>
  );
};
