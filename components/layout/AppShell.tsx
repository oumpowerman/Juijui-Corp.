import React, { useState } from 'react';
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans text-gray-900">
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
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={setIsSidebarCollapsed}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <div className="flex-1 overflow-auto scrollbar-hide p-4 md:p-6 pb-24 lg:pb-6">
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
                unreadChatCount={chatUnreadCount}
            />
        </div>
    );
};

export default AppShell;