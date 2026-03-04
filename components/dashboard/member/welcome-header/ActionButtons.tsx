
import React from 'react';
import { FileBarChart, BatteryCharging, ShoppingBag } from 'lucide-react';
import NotificationBellBtn from '../../../NotificationBellBtn';
import { User } from '../../../../types';

interface ActionButtonsProps {
    user: User;
    unreadNotifications: number;
    onOpenReport: () => void;
    onOpenWorkload: () => void;
    onOpenShop: () => void;
    onOpenNotifications: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ 
    user, 
    unreadNotifications, 
    onOpenReport, 
    onOpenWorkload, 
    onOpenShop, 
    onOpenNotifications 
}) => {
    return (
        <div className="flex gap-2">
             {/* Report Button */}
             <button 
                onClick={onOpenReport}
                className="p-3 bg-white border border-gray-200 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center w-[50px] group"
                title="สรุปผลงาน (My Report)"
            >
                <FileBarChart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

             {/* Workload Monitor Button */}
             <button 
                onClick={onOpenWorkload}
                className="p-3 bg-white border border-gray-200 text-teal-500 hover:text-teal-700 hover:bg-teal-50 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center w-[50px] group"
                title="เช็คภาระงาน (Workload)"
            >
                <BatteryCharging className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Wallet / Shop Button */}
            <button 
                onClick={onOpenShop}
                className="flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex flex-col items-center justify-center min-w-[80px] group"
            >
                <ShoppingBag className="w-5 h-5 mb-1 group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-bold">{user.availablePoints} Pts</span>
            </button>

            {/* Notification Bell */}
            <NotificationBellBtn 
                onClick={onOpenNotifications}
                unreadCount={unreadNotifications}
                className="w-[50px] justify-center"
            />
        </div>
    );
};

export default ActionButtons;
