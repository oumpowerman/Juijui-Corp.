
import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellBtnProps {
    onClick: () => void;
    unreadCount?: number;
    className?: string;
    title?: string;
}

const NotificationBellBtn: React.FC<NotificationBellBtnProps> = ({ 
    onClick, 
    unreadCount = 0, 
    className = '',
    title = "การแจ้งเตือน"
}) => {
    return (
        <button 
            data-notification-trigger="true"
            onClick={(e) => {
                e.stopPropagation(); 
                onClick();
            }}
            className={`
                relative p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 
                border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95 
                flex items-center justify-center
                ${className}
            `}
            title={title}
        >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-wiggle text-indigo-600' : ''}`} />
            
            {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
};

export default NotificationBellBtn;
