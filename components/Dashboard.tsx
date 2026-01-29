
import React from 'react';
import { Task, Channel, User, MasterOption, ViewMode } from '../types';
import AdminDashboard from './dashboard/AdminDashboard';
import MemberDashboard from './dashboard/MemberDashboard';

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onNavigate: (view: ViewMode) => void; // Added for generic navigation
  onOpenSettings: () => void;
  onOpenNotifications?: () => void;
  onEditProfile: () => void;
  masterOptions?: MasterOption[];
  onRefreshMasterData?: () => Promise<void>;
  onFetchAllData?: () => void;
  isFetching?: boolean;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
  const isAdmin = props.currentUser.role === 'ADMIN';

  // If Admin, show the full Admin Dashboard (Overview)
  if (isAdmin) {
      return <AdminDashboard {...props} />;
  }

  // If Member, show the new Member Dashboard (Personalized)
  return (
    <MemberDashboard 
      {...props} 
      masterOptions={props.masterOptions || []} 
      onNavigate={props.onNavigate}
    />
  );
};

export default Dashboard;
