
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell, AlertTriangle, Clock, ScanEye, Settings, CheckCircle2, Info, X, Trash2, CheckSquare, FileSignature, Trophy, HeartCrack, Coins, Heart, Star } from 'lucide-react';
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

const NotificationItem: React.FC<{ notif: AppNotification; onClick: () => void; onDismiss?: (id: string) => void; }> = ({ notif, onClick, onDismiss }) => {
    // Helper to render stats badges
    const renderStats = () => {
        if (!notif.metadata) return null;
        const { hp, xp, coins } = notif.metadata;
        
        return (
            <div className="flex gap-2 mt-1.5 flex-wrap">
                {hp !== 0 && hp !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${hp > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <Heart className="w-3 h-3 mr-1" /> {hp > 0 ? '+' : ''}{hp} HP
                    </span>
                )}
                {xp !== 0 && xp !== undefined && (
                    <span className="text-[10px] font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded flex items-center border border-yellow-100">
                        <Star className="w-3 h-3 mr-1" /> {xp > 0 ? '+' : ''}{xp} XP
                    </span>
                )}
                {coins !== 0 && coins !== undefined && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded flex items-center border border-indigo-100">
                        <Coins className="w-3 h-3 mr-1" /> {coins > 0 ? '+' : ''}{coins} JP
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="relative group hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0 p-1">
            <div 
                onClick={onClick}
                className="p-3 cursor-pointer flex gap-4 items-start rounded-xl"
            >
                <div className={`mt-1 shrink-0 p-2.5 rounded-xl h-fit shadow-sm ring-1 ring-inset ring-black/5
                    ${notif.type === 'OVERDUE' ? 'bg-red-100 text-red-600' : 
                      notif.type === 'UPCOMING' ? 'bg-orange-100 text-orange-600' :
                      notif.type === 'REVIEW' ? 'bg-purple-100 text-purple-600' :
                      notif.type === 'APPROVAL_REQ' ? 'bg-pink-100 text-pink-600' :
                      notif.type === 'NEW_ASSIGNMENT' ? 'bg-blue-100 text-blue-600' :
                      notif.type === 'GAME_REWARD' ? 'bg-yellow-100 text-yellow-600' :
                      notif.type === 'GAME_PENALTY' ? 'bg-rose-100 text-rose-600' :
                      'bg-gray-100 text-gray-600'}
                `}>
                    {notif.type === 'OVERDUE' && <AlertTriangle className="w-5 h-5" />}
                    {notif.type === 'UPCOMING' && <Clock className="w-5 h-5" />}
                    {notif.type === 'REVIEW' && <ScanEye className="w-5 h-5" />}
                    {notif.type === 'APPROVAL_REQ' && <FileSignature className="w-5 h-5" />}
                    {notif.type === 'GAME_REWARD' && <Trophy className="w-5 h-5 fill-yellow-500 text-yellow-600" />}
                    {notif.type === 'GAME_PENALTY' && <HeartCrack className="w-5 h-5" />}
                    {(notif.type === 'INFO' || notif.type === 'NEW_ASSIGNMENT') && <Info className="w-5 h-5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-bold truncate mb-0.5 ${notif.type === 'OVERDUE' || notif.type === 'GAME_PENALTY' ? 'text-red-700' : 'text-gray-800'}`}>
                            {notif.title}
                        </h4>
                        {!notif.isRead && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 ml-2" />}
                    </div>
                    
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 font-medium">
                        {notif.message}
                    </p>
                    
                    {/* Render Rich Stats if available */}
                    {renderStats()}

                    <div className="flex justify-between items-center mt-2">
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                            {format(new Date(notif.date), 'HH:mm')} • {format(new Date(notif.date), 'd MMM')}
                        </p>
                        {notif.metadata?.subText && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                {notif.metadata.subText}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {onDismiss && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="ลบ"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

const NotificationPopover: React.FC<NotificationPopoverProps> = ({ 
    isOpen, onClose, notifications, tasks, onOpenTask, onOpenSettings, onDismiss, onMarkAllRead 
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('ALL');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !mounted) return null;

    const portalRoot = document.getElementById('portal-root') || document.body;

    const handleItemClick = (notification: AppNotification) => {
        if (notification.taskId) {
            const task = tasks.find(t => t.id === notification.taskId);
            if (task) {
                onOpenTask(task);
                onClose();
            }
        } else if (notification.type === 'APPROVAL_REQ') {
             // Future: Navigate to Attendance Tab
             onClose();
        }
    };

    // Filter Logic
    const criticalTypes = ['OVERDUE', 'REVIEW', 'APPROVAL_REQ', 'GAME_PENALTY'];
    
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'ALERTS') {
            return criticalTypes.includes(n.type);
        }
        return true;
    });

    // Grouping for 'ALL' tab
    const criticalGroup = filteredNotifications.filter(n => criticalTypes.includes(n.type));
    const otherGroup = filteredNotifications.filter(n => !criticalTypes.includes(n.type));
    
    const showGroups = activeTab === 'ALL' && criticalGroup.length > 0;

    return createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ring-1 ring-gray-200">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100 shadow-sm">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-gray-800 text-lg">การแจ้งเตือน</h3>
                            <p className="text-xs text-gray-400 font-bold">{notifications.length} รายการ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && onMarkAllRead && (
                             <button 
                                onClick={onMarkAllRead}
                                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                title="ล้างทั้งหมด (Mark all as read)"
                             >
                                 <CheckSquare className="w-5 h-5" />
                             </button>
                        )}
                        <button 
                            onClick={() => { onOpenSettings(); onClose(); }}
                            className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-2 bg-white flex gap-6 border-b border-gray-100 shrink-0">
                    <button 
                        onClick={() => setActiveTab('ALL')}
                        className={`pb-3 text-sm font-bold transition-all border-b-[3px] ${activeTab === 'ALL' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                    >
                        ทั้งหมด (All)
                    </button>
                    <button 
                        onClick={() => setActiveTab('ALERTS')}
                        className={`pb-3 text-sm font-bold transition-all border-b-[3px] flex items-center gap-1.5 ${activeTab === 'ALERTS' ? 'text-red-500 border-red-500' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                    >
                        <AlertTriangle className="w-4 h-4" /> ด่วน ({criticalGroup.length})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-gray-200">
                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                <CheckCircle2 className="w-10 h-10 text-gray-300" />
                            </div>
                            <h4 className="font-bold text-gray-700 text-lg">เงียบสงบดีจัง!</h4>
                            <p className="text-sm mt-1">ไม่มีการแจ้งเตือนในหมวดนี้</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {showGroups ? (
                                <>
                                    {/* Critical Section */}
                                    <div className="bg-red-50/50 px-4 py-2 border-b border-red-100 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm">
                                        <AlertTriangle className="w-3 h-3 text-red-500" />
                                        <span className="text-xs font-bold text-red-600 uppercase">Need Attention</span>
                                    </div>
                                    <div className="px-3">
                                        {criticalGroup.map(notif => (
                                            <NotificationItem 
                                                key={notif.id} 
                                                notif={notif} 
                                                onClick={() => handleItemClick(notif)} 
                                                onDismiss={onDismiss}
                                            />
                                        ))}
                                    </div>

                                    {/* Other Section */}
                                    {otherGroup.length > 0 && (
                                        <>
                                            <div className="bg-gray-50/80 px-4 py-2 border-y border-gray-100 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm mt-2">
                                                <Clock className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs font-bold text-gray-500 uppercase">Recent Updates</span>
                                            </div>
                                            <div className="px-3">
                                                {otherGroup.map(notif => (
                                                    <NotificationItem 
                                                        key={notif.id} 
                                                        notif={notif} 
                                                        onClick={() => handleItemClick(notif)} 
                                                        onDismiss={onDismiss}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="px-3 pt-2">
                                    {filteredNotifications.map(notif => (
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
        </div>,
        portalRoot
    );
};

export default NotificationPopover;
