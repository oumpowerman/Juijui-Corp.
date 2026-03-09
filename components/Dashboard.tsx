
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, Channel, User, MasterOption, ViewMode } from '../types';
import AdminDashboard from './dashboard/AdminDashboard';
import MemberDashboard from './dashboard/MemberDashboard';
import { LayoutDashboard, UserCircle, Sparkles } from 'lucide-react';

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
    <div className="flex flex-col h-full relative">
      {isAdmin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pointer-events-auto flex items-center p-1 bg-white/40 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-[0_8px_32px_rgba(99,102,241,0.2)] ring-1 ring-black/5 overflow-hidden"
          >
            <div className="relative flex items-center gap-1 p-0.5">
              <button
                onClick={() => setViewMode('ADMIN')}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-xl transition-all duration-500 z-10 ${
                  viewMode === 'ADMIN' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {viewMode === 'ADMIN' && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <LayoutDashboard size={18} className={`relative z-20 ${viewMode === 'ADMIN' ? 'animate-bounce' : ''}`} />
                <span className="relative z-20">Admin</span>
                {viewMode === 'ADMIN' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 z-30"
                  >
                    <Sparkles size={12} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                  </motion.div>
                )}
              </button>

              <button
                onClick={() => setViewMode('MEMBER')}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-black rounded-xl transition-all duration-500 z-10 ${
                  viewMode === 'MEMBER' ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {viewMode === 'MEMBER' && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <UserCircle size={18} className={`relative z-20 ${viewMode === 'MEMBER' ? 'animate-bounce' : ''}`} />
                <span className="relative z-20">Member</span>
                {viewMode === 'MEMBER' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 z-30"
                  >
                    <Sparkles size={12} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                  </motion.div>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
