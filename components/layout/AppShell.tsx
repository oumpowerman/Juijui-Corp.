
import React, { useState } from 'react';
import { Sparkles, Bell } from 'lucide-react';
import Sidebar from '../Sidebar';
import MobileNavigation from '../MobileNavigation';
import ConnectionStatus from '../ConnectionStatus';
import { User, ViewMode, TaskType } from '../../types';

interface AppShellProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onLogout: () => void | Promise<void>;
    onEditProfile: () => void;
    onAddTask: (type?: TaskType) => void;
    chatUnreadCount: number;
    systemUnreadCount: number;
    isNotificationOpen: boolean;
    onToggleNotification: () => void;
    children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({
    currentUser,
    currentView,
    onNavigate,
    onLogout,
    onEditProfile,
    onAddTask,
    chatUnreadCount,
    systemUnreadCount,
    isNotificationOpen,
    onToggleNotification,
    children
}) => {
    // State for Collapsible Sidebar on Desktop (Default to Collapsed for clean look, expand on hover)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans relative">
            {/* Network Status Monitor */}
            <ConnectionStatus />

            {/* Desktop Sidebar with Auto-Logic */}
            <Sidebar 
                currentUser={currentUser}
                currentView={currentView}
                onNavigate={onNavigate}
                onLogout={onLogout}
                onEditProfile={onEditProfile}
                onAddTask={() => onAddTask()}
                unreadChatCount={chatUnreadCount}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={(val: boolean) => setIsSidebarCollapsed(val)}
            />

            {/* Main Content Area: Use min-w-0 to prevent flex item from overflowing */}
            <main className={`flex-1 flex flex-col min-w-0 h-full relative z-0 transition-all duration-500`}>
                {/* Mobile Header (Hidden on LG) */}
                <header className="h-20 bg-white/90 backdrop-blur-md border-b border-gray-200/60 flex lg:hidden items-center justify-between px-6 sticky top-0 z-10 shrink-0 shadow-sm">
                    <div className="flex items-center">
                        <div className="mr-4 p-1 text-gray-600">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-indigo-200 shadow-lg">
                                <Sparkles className="text-white w-6 h-6" />
                            </div>
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-gray-900 tracking-tight">Juijui Planner</h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={onToggleNotification}
                            className="relative p-2.5 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-xl transition-all active:scale-90"
                        >
                            <Bell className="w-6 h-6" />
                            {systemUnreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Main Content Scroll Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 pb-24 lg:pb-10">
                    <div className="w-full max-w-[1920px] mx-auto h-full">
                        {children}
                    </div>
                </div>
                
                {/* Mobile Navigation Bar */}
                <MobileNavigation 
                    currentUser={currentUser}
                    currentView={currentView}
                    onNavigate={onNavigate}
                    onAddTask={onAddTask} 
                    onLogout={onLogout}
                    onEditProfile={onEditProfile}
                    unreadChatCount={chatUnreadCount} 
                />
            </main>
        </div>
    );
};

export default AppShell;
