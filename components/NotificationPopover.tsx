import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Bell, AlertTriangle, Clock, ScanEye, Settings, ArrowRight, CheckCircle2, Info, X, Trash2, CheckSquare } from 'lucide-react';
import { AppNotification, Task } from '../types';
import { format, isToday } from 'date-fns';

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    tasks: Task[];
    onOpenTask: (task: Task) => void;
    onOpenSettings: () => void;
    onDismiss?: (id: string) => void;
    onMarkAllRead?: () => void;
}

type Tab = 'ALL' | 'ALERTS';

// Sub-component prop definition
interface NotificationItemProps {
    notif: AppNotification;
    onClick: () => void;
    onDismiss?: (id: string) => void;
}

// Sub-component for individual item
const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onClick, onDismiss }) => {
    return (
        <div className="relative group hover:bg-white transition-colors border-b border-gray-50 last:border-0">
            <div 
                onClick={onClick}
                className="p-4 cursor-pointer flex gap-4 items-start pr-12"
            >
                <div className={`mt-1 shrink-0 p-2.5 rounded-xl h-fit shadow-sm
                    ${notif.type === 'OVERDUE' ? 'bg-red-100 text-red-600' : 
                      notif.type === 'UPCOMING' ? 'bg-orange-100 text-orange-600' :
                      notif.type === 'REVIEW' ? 'bg-purple-100 text-purple-600' :
                      notif.type === 'NEW_ASSIGNMENT' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'}
                `}>
                    {notif.type === 'OVERDUE' && <AlertTriangle className="w-5 h-5" />}
                    {notif.type === 'UPCOMING' && <Clock className="w-5 h-5" />}
                    {notif.type === 'REVIEW' && <ScanEye className="w-5 h-5" />}
                    {(notif.type === 'INFO' || notif.type === 'NEW_ASSIGNMENT') && <Info className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-bold truncate mb-0.5 ${notif.type === 'OVERDUE' ? 'text-red-700' : 'text-gray-800'}`}>
                        {notif.title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 font-medium">
                        {notif.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wide">
                        {format(new Date(notif.date), 'HH:mm')} • {format(new Date(notif.date), 'd MMM')}
                    </p>
                </div>
            </div>

            {/* Dismiss Button (Visible on Hover) */}
            {onDismiss && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                    className="absolute top-1/2 -translate-y-1/2 right-2 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Dismiss"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
    isOpen, onClose, notifications, tasks, onOpenTask, onOpenSettings, onDismiss, onMarkAllRead 
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<Tab>('ALL');

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleItemClick = (notification: AppNotification) => {
        if (notification.taskId) {
            const task = tasks.find(t => t.id === notification.taskId);
            if (task) {
                onOpenTask(task);
                onClose();
            }
        }
    };

    // Filter Logic
    const displayedNotifications = notifications.filter(n => {
        if (activeTab === 'ALERTS') {
            return n.type === 'OVERDUE' || n.type === 'REVIEW';
        }
        return true;
    });

    // Grouping Logic
    const groupedNotifications = useMemo(() => {
        const groups: Record<string, AppNotification[]> = {
            'High Priority': [],
            'Today': [],
            'Earlier': []
        };

        displayedNotifications.forEach(n => {
            if (n.type === 'OVERDUE' || n.type === 'REVIEW') {
                groups['High Priority'].push(n);
            } else if (isToday(new Date(n.date))) {
                groups['Today'].push(n);
            } else {
                groups['Earlier'].push(n);
            }
        });

        return groups;
    }, [displayedNotifications]);

    return (
        <div 
            ref={popoverRef}
            className="absolute top-16 right-4 md:right-8 w-[380px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right ring-4 ring-black/5"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-white flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                        <Bell className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800 text-sm">Notifications</h3>
                        <p className="text-[10px] text-gray-400 font-bold">{notifications.length} Unread</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {notifications.length > 0 && onMarkAllRead && (
                         <button 
                            onClick={onMarkAllRead}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Mark all as read"
                         >
                             <CheckSquare className="w-4 h-4" />
                         </button>
                    )}
                    <button 
                        onClick={() => { onOpenSettings(); onClose(); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-3 pb-0 bg-gray-50/50 flex gap-4 border-b border-gray-100">
                <button 
                    onClick={() => setActiveTab('ALL')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 ${activeTab === 'ALL' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                >
                    All Updates
                </button>
                <button 
                    onClick={() => setActiveTab('ALERTS')}
                    className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${activeTab === 'ALERTS' ? 'text-red-500 border-red-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                >
                    <AlertTriangle className="w-3 h-3" /> Alerts
                </button>
            </div>

            {/* List */}
            <div className="max-h-[450px] overflow-y-auto bg-gray-50/30 scrollbar-thin scrollbar-thumb-gray-200">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h4 className="font-bold text-gray-700">All Caught Up!</h4>
                        <p className="text-xs mt-1">ไม่มีการแจ้งเตือนใหม่ สบายใจได้</p>
                    </div>
                ) : (
                    <div className="pb-4">
                        {/* High Priority Section */}
                        {groupedNotifications['High Priority'].length > 0 && (
                            <div className="mb-2">
                                <div className="px-5 py-2 text-[10px] font-black text-red-400 uppercase tracking-wider bg-red-50/50 border-y border-red-50 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Requires Attention
                                </div>
                                {groupedNotifications['High Priority'].map(notif => (
                                    <NotificationItem 
                                        key={notif.id} 
                                        notif={notif} 
                                        onClick={() => handleItemClick(notif)} 
                                        onDismiss={onDismiss}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Today Section */}
                        {groupedNotifications['Today'].length > 0 && (
                            <div className="mb-2">
                                <div className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-100/50 border-y border-gray-100 sticky top-0 backdrop-blur-sm z-10">
                                    Today
                                </div>
                                {groupedNotifications['Today'].map(notif => (
                                    <NotificationItem 
                                        key={notif.id} 
                                        notif={notif} 
                                        onClick={() => handleItemClick(notif)} 
                                        onDismiss={onDismiss}
                                    />
                                ))}
                            </div>
                        )}

                         {/* Earlier Section */}
                         {groupedNotifications['Earlier'].length > 0 && (
                            <div className="mb-2">
                                <div className="px-5 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-100/50 border-y border-gray-100 sticky top-0 backdrop-blur-sm z-10">
                                    Earlier
                                </div>
                                {groupedNotifications['Earlier'].map(notif => (
                                    <NotificationItem 
                                        key={notif.id} 
                                        notif={notif} 
                                        onClick={() => handleItemClick(notif)} 
                                        onDismiss={onDismiss}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPopover;