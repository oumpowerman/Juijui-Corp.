
import React, { useState } from 'react';
import { Task, Channel, User, MasterOption, ViewMode } from '../types';
import AdminDashboard from './dashboard/AdminDashboard';
import MemberDashboard from './dashboard/MemberDashboard';
import { LayoutDashboard, UserCircle } from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onNavigate: (view: ViewMode) => void;
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  unreadCount?: number; 
  onEditProfile: () => void;
  masterOptions?: MasterOption[];
  onRefreshMasterData?: () => Promise<void>;
  onRefreshProfile?: () => Promise<any>;
  onFetchAllData?: () => void;
  isFetching?: boolean;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const isAdmin = props.currentUser.role === 'ADMIN';
  const [viewMode, setViewMode] = useState<'ADMIN' | 'MEMBER'>(isAdmin ? 'ADMIN' : 'MEMBER');

  const renderDashboard = () => {
    if (viewMode === 'ADMIN' && isAdmin) {
      return <AdminDashboard {...props} />;
    }

    return (
      <MemberDashboard 
        {...props} 
        masterOptions={props.masterOptions || []} 
        onNavigate={props.onNavigate}
        onRefreshProfile={props.onRefreshProfile}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {isAdmin && (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">View Mode:</span>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('ADMIN')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'ADMIN'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutDashboard size={14} />
                Admin Overview
              </button>
              <button
                onClick={() => setViewMode('MEMBER')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'MEMBER'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <UserCircle size={14} />
                My Dashboard
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-400 italic">
            Logged in as Admin
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
