
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Settings, X, CheckSquare, Zap, Users, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppNotification, Task, ViewMode } from '../types';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { LeaveRequest } from '../types/attendance';
import NotificationList, { NotificationTab } from './notification/NotificationList';

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    tasks: Task[];
    onOpenTask: (task: Task) => void;
    onOpenSettings: () => void;
    onDismiss?: (id: string) => void;
    onMarkRead?: (id: string) => void;
    onMarkAllRead?: () => void;
    onNavigate: (view: ViewMode, queryParams?: Record<string, string>) => void; 
    onViewDetail?: (notification: AppNotification) => void;
    onApproveLeave?: (
        request: LeaveRequest, 
        customOtHours?: number, 
        customStartTime?: string, 
        customEndTime?: string
    ) => Promise<void>;
    onRejectLeave?: (id: string, reason: string) => Promise<void>;
    leaveRequests?: LeaveRequest[];
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
    isOpen, onClose, notifications, tasks, onOpenTask, onOpenSettings, onDismiss, onMarkRead, onMarkAllRead, onNavigate,
    onViewDetail, onApproveLeave, onRejectLeave, leaveRequests = []
}) => {
    const { showAlert } = useGlobalDialog();
    const [activeTab, setActiveTab] = useState<NotificationTab>('ALL');
    const contentRef = useRef<HTMLDivElement>(null);

    // Close on backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleItemClick = (notification: AppNotification) => {
        const isAttendanceNotif = notification.actionLink === 'ATTENDANCE' || 
                                  notification.type === 'APPROVAL_REQ' || 
                                  (notification.id && notification.id.startsWith('leave_'));

        if (isAttendanceNotif) {
            // Explicitly sync and mark individual DB notification as read on click
            if (onMarkRead && notification.id && !notification.id.includes('_')) {
                onMarkRead(notification.id);
            }

            // Extract raw request ID
            let rawId = '';
            if (notification.id && notification.id.startsWith('leave_')) {
                rawId = notification.id.replace('leave_', '');
            } else if (notification.taskId) {
                rawId = notification.taskId;
            } else if (notification.id) {
                const uuidMatch = notification.id.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
                if (uuidMatch) rawId = uuidMatch[0];
            }

            onNavigate('ATTENDANCE', { tab: 'APPROVALS', highlightReqId: rawId });
            onClose(); // Close the popover since we are navigating to another view
        } else if (onViewDetail) {
            // Open detail modal and do NOT close the popover so it remains open behind the modal!
            onViewDetail(notification);
        } else {
            // Explicitly sync and mark individual DB notification as read on click
            if (onMarkRead && notification.id && !notification.id.includes('_')) {
                onMarkRead(notification.id);
            }

            if (notification.taskId) {
                // Case 1: Open Task
                const task = tasks.find(t => t.id === notification.taskId);
                if (task) {
                    onOpenTask(task);
                    onClose();
                }
            } else if (notification.actionLink) {
                // Case 2: Navigate to specific module (e.g. FINANCE, ATTENDANCE)
                onNavigate(notification.actionLink as ViewMode);
                onClose();
            }
        }
    };
    
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
        // Optimistic UI: Dismiss immediately for snappiness
        if (onDismiss) onDismiss(id);
        
        setIsActionLoading(id);

        if (id.startsWith('leave_')) {
            const leaveId = id.replace('leave_', '');
            const request = leaveRequests.find(r => r.id === leaveId);
            
            try {
                if (action === 'APPROVE') {
                    if (request && onApproveLeave) {
                        await onApproveLeave(request);
                    }
                } else {
                    if (onRejectLeave) {
                        await onRejectLeave(leaveId, 'Rejected via notification');
                    }
                }
            } catch (err) {
                console.error("Action failed:", err);
            } finally {
                setIsActionLoading(null);
            }
        } else {
            setIsActionLoading(null);
            await showAlert(`${action} Notification ${id} (Mock Action)`);
        }
    };

    const portalRoot = document.getElementById('portal-root') || document.body;

    // Calc Counts for Badges
    const urgentCount = notifications.filter(n => (n.type === 'OVERDUE' || n.type === 'GAME_PENALTY') && !n.isRead).length;
    const peopleCount = notifications.filter(n => (n.type === 'APPROVAL_REQ') && !n.isRead).length;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={handleBackdropClick}
                >
                    <motion.div 
                        ref={contentRef}
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
                        className="bg-white w-full max-w-lg h-[80vh] sm:h-[650px] max-h-[85vh] rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border-4 border-white ring-1 ring-gray-200"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0 z-20 relative">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-200">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg tracking-tight">การแจ้งเตือน</h3>
                                    <p className="text-sm text-gray-400 font-medium flex items-center gap-1">
                                        {notifications.filter(n => !n.isRead).length} เรื่องใหม่
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {notifications.length > 0 && onMarkAllRead && (
                                     <button 
                                        onClick={onMarkAllRead}
                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                        title="อ่านทั้งหมด"
                                     >
                                         <CheckSquare className="w-5 h-5" />
                                     </button>
                                )}
                                <button 
                                    onClick={() => { onOpenSettings(); onClose(); }}
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-1"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="px-6 pt-2 pb-2 bg-white flex gap-2 border-b border-gray-100 shrink-0 z-10 overflow-x-auto scrollbar-hide">
                            <button 
                                onClick={() => setActiveTab('ALL')}
                                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 border ${
                                    activeTab === 'ALL' 
                                        ? 'text-white border-transparent' 
                                        : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                <span className="relative z-10">ทั้งหมด</span>
                                {activeTab === 'ALL' && (
                                    <motion.div 
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-gray-800 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab('URGENT')}
                                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 border flex items-center gap-1 ${
                                    activeTab === 'URGENT' 
                                        ? 'text-white border-transparent' 
                                        : 'text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500'
                                }`}
                            >
                                <Zap className="w-3 h-3 relative z-10" />
                                <span className="relative z-10">ด่วน</span>
                                {urgentCount > 0 && (
                                    <span className={`relative z-10 text-[9px] px-1.5 rounded-full transition-colors duration-200 ${activeTab === 'URGENT' ? 'bg-white text-red-500' : 'bg-red-500 text-white'}`}>
                                        {urgentCount}
                                    </span>
                                )}
                                {activeTab === 'URGENT' && (
                                    <motion.div 
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-red-500 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab('PEOPLE')}
                                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 border flex items-center gap-1 ${
                                    activeTab === 'PEOPLE' 
                                        ? 'text-white border-transparent' 
                                        : 'text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-500'
                                }`}
                            >
                                <Users className="w-3 h-3 relative z-10" />
                                <span className="relative z-10">คน</span>
                                {peopleCount > 0 && (
                                    <span className={`relative z-10 text-[9px] px-1.5 rounded-full transition-colors duration-200 ${activeTab === 'PEOPLE' ? 'bg-white text-green-500' : 'bg-green-500 text-white'}`}>
                                        {peopleCount}
                                    </span>
                                )}
                                {activeTab === 'PEOPLE' && (
                                    <motion.div 
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-green-500 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                             <button 
                                onClick={() => setActiveTab('SYSTEM')}
                                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 border flex items-center gap-1 ${
                                    activeTab === 'SYSTEM' 
                                        ? 'text-white border-transparent' 
                                        : 'text-gray-500 border-gray-200 hover:bg-blue-50 hover:text-blue-500'
                                }`}
                            >
                                <Info className="w-3 h-3 relative z-10" />
                                <span className="relative z-10">ระบบ</span>
                                {activeTab === 'SYSTEM' && (
                                    <motion.div 
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 bg-blue-500 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2 scrollbar-thin scrollbar-thumb-gray-200">
                            <NotificationList 
                                notifications={notifications}
                                activeTab={activeTab}
                                onItemClick={handleItemClick}
                                onDismiss={onDismiss || (() => {})}
                                onAction={handleAction}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        portalRoot
    );
};

export default NotificationPopover;
