
import React, { useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, ScanEye, Settings, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { AppNotification, Task } from '../types';
import { format } from 'date-fns';

interface NotificationPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: AppNotification[];
    tasks: Task[];
    onOpenTask: (task: Task) => void;
    onOpenSettings: () => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
    isOpen, onClose, notifications, tasks, onOpenTask, onOpenSettings 
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);

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

    return (
        <div 
            ref={popoverRef}
            className="absolute top-16 right-4 md:right-10 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in zoom-in-95 origin-top-right"
        >
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-indigo-600" />
                    การแจ้งเตือน ({notifications.length})
                </h3>
                <button 
                    onClick={() => { onOpenSettings(); onClose(); }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                    title="ตั้งค่าการแจ้งเตือน"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                        <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">ไม่มีการแจ้งเตือนใหม่</p>
                        <p className="text-xs">ทุกอย่างเรียบร้อยดีครับ 👍</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                onClick={() => handleItemClick(notif)}
                                className={`
                                    p-4 hover:bg-gray-50 cursor-pointer transition-colors group relative
                                    ${notif.type === 'OVERDUE' ? 'bg-red-50/30' : ''}
                                `}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 shrink-0 p-2 rounded-full h-fit
                                        ${notif.type === 'OVERDUE' ? 'bg-red-100 text-red-600' : 
                                          notif.type === 'UPCOMING' ? 'bg-orange-100 text-orange-600' :
                                          notif.type === 'REVIEW' ? 'bg-purple-100 text-purple-600' :
                                          'bg-blue-100 text-blue-600'}
                                    `}>
                                        {notif.type === 'OVERDUE' && <AlertTriangle className="w-4 h-4" />}
                                        {notif.type === 'UPCOMING' && <Clock className="w-4 h-4" />}
                                        {notif.type === 'REVIEW' && <ScanEye className="w-4 h-4" />}
                                        {notif.type === 'INFO' && <Info className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-bold truncate pr-2
                                                ${notif.type === 'OVERDUE' ? 'text-red-700' : 'text-gray-800'}
                                            `}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 shrink-0">
                                                {format(new Date(), 'd MMM')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                                            {notif.message}
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPopover;
