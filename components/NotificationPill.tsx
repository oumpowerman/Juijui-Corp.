
import React from 'react';

interface NotificationPillProps {
    count: number;
    color?: string;
    collapsed?: boolean;
    className?: string;
}

const NotificationPill: React.FC<NotificationPillProps> = ({ 
    count, 
    color = 'bg-red-500', 
    collapsed,
    className 
}) => {
    if (count <= 0) return null;
    
    return (
        <span className={`
            min-w-[18px] h-[18px] flex items-center justify-center 
            text-[9px] font-black text-white rounded-full border-2 border-white shadow-sm z-20 
            ${className || color} 
            ${collapsed ? 'animate-none' : 'animate-pulse'}
        `}>
            {count > 99 ? '99+' : count}
        </span>
    );
};

export default NotificationPill;
