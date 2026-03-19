
import React, { useState, Suspense, lazy } from 'react';
import { User, Task, Channel, MasterOption, ViewMode } from '../types';
import { Loader2, LayoutDashboard, User as UserIcon } from 'lucide-react';

// Lazy load dashboards to save bandwidth and initial bundle size
const AdminDashboard = lazy(() => import('./dashboard/AdminDashboard'));
const MemberDashboard = lazy(() => import('./dashboard/MemberDashboard'));

interface DashboardProps {
    tasks: Task[];
    channels: Channel[];
    users: User[];
    currentUser: User;
    masterOptions: MasterOption[];
    onEditTask: (task: Task) => void;
    onNavigateToCalendar?: () => void;
    onOpenSettings: () => void;
    onOpenNotifications?: () => void;
    unreadCount?: number;
    onEditProfile: () => void;
    onRefreshMasterData?: () => Promise<void>;
    onFetchAllData?: () => void;
    isFetching?: boolean;
    onRefreshProfile?: () => Promise<any>;
    onNavigate?: (view: ViewMode) => void;
    onUpdateTask?: (task: Task) => void;
}

const Dashboard: React.FC<DashboardProps> = (props) => {
    const isAdmin = props.currentUser.role === 'ADMIN';
    // Default to ADMIN view if user is admin, otherwise MEMBER
    const [viewMode, setViewMode] = useState<'ADMIN' | 'MEMBER'>(isAdmin ? 'ADMIN' : 'MEMBER');

    // If not admin, strictly show MemberDashboard
    if (!isAdmin) {
        return (
            <Suspense fallback={<DashboardLoader />}>
                <MemberDashboard {...props as any} />
            </Suspense>
        );
    }

    return (
        <div className="relative h-full flex flex-col">
            {/* Admin View Switcher - Floating Toggle */}
            <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2">
                <button 
                    onClick={() => setViewMode(viewMode === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md border-2 border-indigo-100 rounded-full shadow-xl shadow-indigo-200/50 hover:border-indigo-400 hover:scale-105 transition-all group"
                    title={viewMode === 'ADMIN' ? 'สลับไปมุมมองสมาชิก' : 'กลับไปมุมมองแอดมิน'}
                >
                    <div className={`p-1.5 rounded-lg transition-colors ${viewMode === 'ADMIN' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {viewMode === 'ADMIN' ? <UserIcon className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        {viewMode === 'ADMIN' ? 'Member View' : 'Admin View'}
                    </span>
                </button>
            </div>

            <Suspense fallback={<DashboardLoader />}>
                {viewMode === 'ADMIN' ? (
                    <AdminDashboard {...props as any} />
                ) : (
                    <MemberDashboard {...props as any} />
                )}
            </Suspense>
        </div>
    );
};

const DashboardLoader = () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50/50 flex-col">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">กำลังโหลดแดชบอร์ด...</p>
    </div>
);

export default Dashboard;
