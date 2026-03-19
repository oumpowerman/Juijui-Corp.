
import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import MobileNavigation from '../MobileNavigation';
import ConnectionStatus from '../ConnectionStatus';
import { User, ViewMode, TaskType } from '../../types';
import { useSidebarBadges } from '../../hooks/useSidebarBadges';

interface AppShellProps {
    currentUser: User;
    currentView: ViewMode;
    onNavigate: (view: ViewMode) => void;
    onLogout: () => void | Promise<void>;
    onEditProfile: () => void;
    onAddTask: (type?: TaskType) => void;
    onOpenTask: (task: any) => void;
    chatUnreadCount: number;
    systemUnreadCount: number;
    isNotificationOpen: boolean;
    onToggleNotification: () => void;
    tasks: any[];
    allUsers: User[];
    children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ 
    currentUser, 
    currentView, 
    onNavigate, 
    onLogout, 
    onEditProfile, 
    onAddTask, 
    onOpenTask,
    chatUnreadCount,
    systemUnreadCount,
    isNotificationOpen,
    onToggleNotification,
    tasks,
    allUsers,
    children 
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const { badges } = useSidebarBadges(currentUser);

    const isDarkTheme = currentView === 'QUALITY_GATE' || currentView === 'GOALS';

    return (
        <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${isDarkTheme ? 'bg-slate-950 text-white' : 'bg-[#f8fafc] text-gray-900'}`}>
            <ConnectionStatus />
            
            {/* Desktop Sidebar */}
            <Sidebar 
                currentUser={currentUser}
                currentView={currentView}
                onNavigate={onNavigate}
                onLogout={onLogout}
                onEditProfile={onEditProfile}
                onAddTask={() => onAddTask()}
                unreadChatCount={chatUnreadCount}
                systemUnreadCount={systemUnreadCount} // Added
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
                badges={badges}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className={`flex-1 overflow-auto scrollbar-hide ${isDarkTheme ? 'p-0' : 'p-4 md:p-6 pb-24 lg:pb-6'}`}>
                    {children}
                </div>
            </main>

            {/* Mobile Navigation */}
            <MobileNavigation 
                currentUser={currentUser}
                currentView={currentView}
                onNavigate={onNavigate}
                onAddTask={onAddTask}
                onLogout={onLogout}
                onEditProfile={onEditProfile}
                onOpenTask={onOpenTask}
                unreadChatCount={chatUnreadCount}
                tasks={tasks}
                users={allUsers}
                badges={badges}
            />
        </div>
    );
};

export default AppShell;
