
import React, { useState, useRef, useEffect } from 'react';
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

const DISSOLVE_EASE = [0.22, 1, 0.36, 1] as const;

const Dashboard: React.FC<DashboardProps> = (props) => {
  const isAdmin = props.currentUser.role === 'ADMIN';
  const initialMode = isAdmin ? 'ADMIN' : 'MEMBER';
  const [viewMode, setViewMode] = useState<'ADMIN' | 'MEMBER'>(initialMode);
  const [selectedMode, setSelectedMode] = useState<'ADMIN' | 'MEMBER'>(initialMode);
  const [isHovered, setIsHovered] = useState(false);
  const [isMelting, setIsMelting] = useState(false);

  const swapTimerRef = useRef<number | null>(null);
  const endTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      if (endTimerRef.current) window.clearTimeout(endTimerRef.current);
    };
  }, []);

  const handleModeChange = (nextMode: 'ADMIN' | 'MEMBER') => {
    if (nextMode === selectedMode) return;

    if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
    if (endTimerRef.current) window.clearTimeout(endTimerRef.current);

    // 1. Immediately update pill UI & start melting the current screen
    setSelectedMode(nextMode);
    setIsMelting(true);

    // 2. Swap the actual dashboard component only after the current screen has melted (360ms)
    swapTimerRef.current = window.setTimeout(() => {
      setViewMode(nextMode);
    }, 360);

    // 3. Unveil & unblur to reveal the new dashboard (740ms total)
    endTimerRef.current = window.setTimeout(() => {
      setIsMelting(false);
    }, 740);
  };

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
    <div className="flex flex-col min-h-full relative">
      {isAdmin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsHovered(!isHovered);
            }}
            animate={{ 
              width: isHovered ? 260 : 44,
              height: 44,
              borderRadius: isHovered ? "16px" : "9999px"
            }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="pointer-events-auto flex items-center justify-center bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] ring-1 ring-black/5 overflow-hidden cursor-pointer"
          >
            <AnimatePresence mode="wait">
              {!isHovered ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                  onClick={() => handleModeChange(selectedMode === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                  className="flex items-center justify-center w-full h-full"
                  title="Hover or click to switch role"
                >
                  {selectedMode === 'ADMIN' ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm">
                      <LayoutDashboard size={16} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white shadow-sm">
                      <UserCircle size={16} />
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-1 p-1 w-full h-full"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeChange('ADMIN');
                    }}
                    className={`relative flex-1 h-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors duration-300 z-10 ${
                      selectedMode === 'ADMIN' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {selectedMode === 'ADMIN' && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <LayoutDashboard size={14} className="relative z-20" />
                    <span className="relative z-20">Admin</span>
                    {selectedMode === 'ADMIN' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-30"
                      >
                        <Sparkles size={8} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                      </motion.div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleModeChange('MEMBER');
                    }}
                    className={`relative flex-1 h-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors duration-300 z-10 ${
                      selectedMode === 'MEMBER' ? 'text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {selectedMode === 'MEMBER' && (
                      <motion.div
                        layoutId="active-pill"
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 rounded-xl shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                    )}
                    <UserCircle size={14} className="relative z-20" />
                    <span className="relative z-20">Member</span>
                    {selectedMode === 'MEMBER' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-30"
                      >
                        <Sparkles size={8} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                      </motion.div>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      {/* Two-Stage Screen Melt & Dissolve Curtain (No parent filter/transform, preserving Sidebar fixed background) */}
      <AnimatePresence>
        {isMelting && (
          <motion.div
            key="dashboard-melt-curtain"
            initial={{
              opacity: 0,
              backdropFilter: 'blur(0px) saturate(1)',
            }}
            animate={{
              opacity: 1,
              backdropFilter: 'blur(26px) saturate(1.4)',
              transition: { duration: 0.35, ease: DISSOLVE_EASE },
            }}
            exit={{
              opacity: 0,
              backdropFilter: 'blur(0px) saturate(1)',
              transition: { duration: 0.38, ease: DISSOLVE_EASE },
            }}
            className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
          >
            {/* Pastel Mist Veil */}
            <motion.div
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{
                opacity: 0.78,
                scale: 1,
                transition: { duration: 0.35, ease: DISSOLVE_EASE },
              }}
              exit={{
                opacity: 0,
                scale: 0.98,
                transition: { duration: 0.38, ease: DISSOLVE_EASE },
              }}
              className={`absolute inset-0 ${
                selectedMode === 'ADMIN'
                  ? 'bg-gradient-to-br from-indigo-100/85 via-purple-100/75 to-pink-100/85'
                  : 'bg-gradient-to-br from-rose-100/85 via-pink-100/75 to-amber-100/85'
              }`}
            />

            {/* Floating Mode Indicator Pill inside the Melt Mist */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.28, ease: DISSOLVE_EASE },
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 1.04,
                transition: { duration: 0.28, ease: DISSOLVE_EASE },
              }}
              className={`relative px-5 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xl border shadow-xl flex items-center gap-2.5 ${
                selectedMode === 'ADMIN'
                  ? 'border-indigo-200/80 text-indigo-700 shadow-indigo-200/40'
                  : 'border-pink-200/80 text-rose-600 shadow-rose-200/40'
              }`}
            >
              {selectedMode === 'ADMIN' ? (
                <LayoutDashboard className="w-4 h-4 text-indigo-500 animate-pulse" />
              ) : (
                <UserCircle className="w-4 h-4 text-rose-500 animate-pulse" />
              )}
              <span className="text-xs font-bold tracking-wide">
                {selectedMode === 'ADMIN' ? 'Admin Dashboard' : 'Member Dashboard'}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex-1 overflow-auto">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Dashboard;
