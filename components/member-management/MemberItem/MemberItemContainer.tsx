import React from 'react';
import { User } from '../../../types';

interface MemberItemContainerProps {
    user: User;
    children: React.ReactNode;
}

export const MemberItemContainer: React.FC<MemberItemContainerProps> = ({ user, children }) => {
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start gap-5 transition-all hover:border-indigo-200 hover:shadow-md group">
            {/* Avatar */}
            <div className="relative shrink-0">
                <img 
                    src={user.avatarUrl} 
                    className={`w-14 h-14 rounded-full object-cover border-4 ${user.isActive ? 'border-green-100' : 'border-gray-100 grayscale'}`} 
                    alt={user.name} 
                />
            </div>

            {/* Info & Form Area */}
            <div className="flex-1 w-full">
                {children}
            </div>
        </div>
    );
};
