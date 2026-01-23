import React from 'react';
import { User } from '../types';
import { WORK_STATUS_CONFIG } from '../constants';
import { isWithinInterval } from 'date-fns';

interface UserStatusBadgeProps {
    user: User;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ user, showLabel = false, size = 'sm' }) => {
    // 1. Determine Effective Status
    let status = user.workStatus || 'ONLINE';
    
    // Auto-detect Vacation/Sick based on dates
    const today = new Date();
    if (user.leaveStartDate && user.leaveEndDate) {
        if (isWithinInterval(today, { start: user.leaveStartDate, end: user.leaveEndDate })) {
            // Priority: If manually set to SICK, keep SICK. Otherwise assume VACATION if not specified.
            if (status !== 'SICK') status = 'VACATION';
        }
    }

    const config = WORK_STATUS_CONFIG[status] || WORK_STATUS_CONFIG['ONLINE'];

    const sizeClasses = {
        sm: 'w-2.5 h-2.5 text-[8px]',
        md: 'w-4 h-4 text-xs',
        lg: 'w-6 h-6 text-sm'
    };

    return (
        <div className="flex items-center gap-1.5" title={config.label}>
            <div className={`${sizeClasses[size]} flex items-center justify-center rounded-full shadow-sm`}>
                {config.icon}
            </div>
            {showLabel && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${config.color}`}>
                    {config.label.split('(')[0]}
                </span>
            )}
        </div>
    );
};

export default UserStatusBadge;
