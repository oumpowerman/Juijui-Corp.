
import React from 'react';
import { AppNotification } from '../../types';
import NotificationItem from './NotificationItem';
import { CheckCircle2, Sparkles, History } from 'lucide-react';

export type NotificationTab = 'ALL' | 'URGENT' | 'PEOPLE' | 'SYSTEM';

interface NotificationListProps {
    notifications: AppNotification[];
    activeTab: NotificationTab;
    onItemClick: (notif: AppNotification) => void;
    onDismiss: (id: string) => void;
    onAction?: (id: string, action: 'APPROVE' | 'REJECT') => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ 
    notifications, activeTab, onItemClick, onDismiss, onAction 
}) => {

    // 1. Filter Logic
    const filtered = notifications.filter(n => {
        if (activeTab === 'URGENT') return n.type === 'OVERDUE' || n.type === 'GAME_PENALTY' || n.type === 'SYSTEM_LOCK_PENALTY';
        if (activeTab === 'PEOPLE') return n.type === 'APPROVAL_REQ' || n.type === 'NEW_ASSIGNMENT' || n.type === 'REVIEW';
        if (activeTab === 'SYSTEM') return n.type === 'GAME_REWARD' || n.type === 'INFO';
        return true; // ALL
    });

    // 2. Grouping Logic (New vs Earlier)
    // Only apply grouping if in 'ALL' or 'SYSTEM' tab. For Urgent/People, we usually want flat list priority.
    const unreadList = filtered.filter(n => !n.isRead);
    const readList = filtered.filter(n => n.isRead);

    // Empty State
    if (filtered.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                    <CheckCircle2 className="w-10 h-10 text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-700 text-lg">
                    {activeTab === 'URGENT' ? 'ไม่มีงานด่วน' : 'ไม่มีการแจ้งเตือน'}
                </h4>
                <p className="text-sm mt-1 text-gray-400">
                    {activeTab === 'URGENT' ? 'พักผ่อนได้สบายใจหายห่วง!' : 'ทุกอย่างเรียบร้อยดีครับ'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-4">
             {/* UNREAD GROUP */}
             {unreadList.length > 0 && (
                <div className="space-y-1">
                    {/* Header only visible if we have both groups or if it's the ALL tab */}
                    {(activeTab === 'ALL' || readList.length > 0) && (
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-4 py-2 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> ใหม่ล่าสุด (New)
                        </h5>
                    )}
                    {unreadList.map(notif => (
                        <NotificationItem 
                            key={notif.id} 
                            notif={notif} 
                            onClick={() => onItemClick(notif)} 
                            onDismiss={onDismiss}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}

            {/* READ GROUP */}
            {readList.length > 0 && (
                <div className="space-y-1">
                     {/* Divider only if there are unread items above */}
                     {unreadList.length > 0 && (
                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 py-2 flex items-center gap-2 border-t border-gray-100 mt-2 pt-4">
                            <History className="w-3 h-3" /> ก่อนหน้านี้ (Earlier)
                        </h5>
                     )}
                    {readList.map(notif => (
                        <NotificationItem 
                            key={notif.id} 
                            notif={notif} 
                            onClick={() => onItemClick(notif)} 
                            onDismiss={onDismiss}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationList;
