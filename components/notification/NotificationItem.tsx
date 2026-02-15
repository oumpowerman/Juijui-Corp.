
import React from 'react';
import { 
    AlertTriangle, Clock, ScanEye, FileSignature, Trophy, 
    HeartCrack, Info, Trash2, Heart, Coins, Check, X, User, Wallet, Lock, ShieldAlert
} from 'lucide-react';
import { AppNotification } from '../../types';
import { format } from 'date-fns';

interface NotificationItemProps {
    notif: AppNotification;
    onClick: () => void;
    onDismiss?: (id: string) => void;
    onAction?: (id: string, action: 'APPROVE' | 'REJECT') => void; // New prop for actions
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notif, onClick, onDismiss, onAction }) => {
    const isUnread = !notif.isRead;
    const isUrgent = notif.type === 'OVERDUE' || notif.type === 'GAME_PENALTY' || notif.type === 'SYSTEM_LOCK_PENALTY';
    const isApproval = notif.type === 'APPROVAL_REQ';
    const isFinance = notif.actionLink === 'FINANCE' || (notif.title && notif.title.includes('เงินเดือน'));
    
    // Dynamic Styles
    let containerStyle = "p-3 cursor-pointer flex gap-3 items-start rounded-xl transition-all duration-200 relative group border";
    
    if (notif.type === 'SYSTEM_LOCK_PENALTY') {
        containerStyle += " bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100";
    } else if (isFinance) {
        containerStyle += " bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50";
    } else if (isApproval) {
         containerStyle += " bg-amber-50/50 border-amber-200 hover:bg-amber-100/50";
    } else if (isUnread) {
        if (isUrgent) {
            containerStyle += " bg-red-50 border-l-4 border-l-red-500 border-y-red-100 border-r-red-100 shadow-sm";
        } else {
            containerStyle += " bg-indigo-50/60 border-l-4 border-l-indigo-500 border-y-indigo-100 border-r-indigo-100 shadow-sm hover:bg-indigo-100/50";
        }
    } else {
        containerStyle += " bg-white hover:bg-gray-50 border-transparent opacity-80 hover:opacity-100 hover:border-gray-200";
    }

    const getIconBoxStyle = () => {
        if (isFinance) return 'bg-emerald-100 text-emerald-600';
        switch (notif.type) {
            case 'SYSTEM_LOCK_PENALTY': return 'bg-red-600 text-white animate-pulse shadow-md shadow-red-200';
            case 'OVERDUE': return 'bg-red-100 text-red-600 animate-pulse';
            case 'UPCOMING': return 'bg-orange-100 text-orange-600';
            case 'REVIEW': return 'bg-purple-100 text-purple-600';
            case 'APPROVAL_REQ': return 'bg-amber-100 text-amber-600';
            case 'NEW_ASSIGNMENT': return 'bg-blue-100 text-blue-600';
            case 'GAME_REWARD': return 'bg-yellow-100 text-yellow-600';
            case 'GAME_PENALTY': return 'bg-rose-100 text-rose-600';
            default: return 'bg-gray-100 text-gray-500';
        }
    };

    const getIcon = () => {
        if (isFinance) return <Wallet className="w-5 h-5" />;
        switch (notif.type) {
            case 'SYSTEM_LOCK_PENALTY': return <ShieldAlert className="w-5 h-5" />;
            case 'OVERDUE': return <AlertTriangle className="w-5 h-5" />;
            case 'UPCOMING': return <Clock className="w-5 h-5" />;
            case 'REVIEW': return <ScanEye className="w-5 h-5" />;
            case 'APPROVAL_REQ': return <User className="w-5 h-5" />;
            case 'GAME_REWARD': return <Trophy className="w-5 h-5 fill-current" />;
            case 'GAME_PENALTY': return <HeartCrack className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    }

    return (
        <div className="px-2 py-1">
            <div onClick={onClick} className={containerStyle}>
                
                {/* Icon */}
                <div className={`mt-0.5 shrink-0 p-2 rounded-xl h-fit shadow-sm ${getIconBoxStyle()}`}>
                    {getIcon()}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-sm font-bold truncate mb-0.5 ${notif.type === 'SYSTEM_LOCK_PENALTY' ? 'text-red-800' : isFinance ? 'text-emerald-800' : isUrgent ? 'text-red-700' : isApproval ? 'text-amber-800' : isUnread ? 'text-indigo-900' : 'text-gray-700'}`}>
                            {notif.title}
                        </h4>
                        {isUnread && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 shadow-sm ring-2 ring-white"></span>}
                    </div>
                    
                    <p className={`text-xs leading-relaxed line-clamp-2 font-medium ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notif.message}
                    </p>
                    
                    {/* Metadata Badges (Game Stats) */}
                    {notif.metadata && (
                         <div className="flex flex-wrap gap-1.5 mt-2">
                             {(notif.metadata.hp !== undefined && notif.metadata.hp !== 0) && (
                                 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center ${notif.metadata.hp > 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                     <Heart className={`w-2.5 h-2.5 mr-1 ${notif.metadata.hp < 0 ? 'fill-red-500 text-red-500' : ''}`} />
                                     {notif.metadata.hp > 0 ? '+' : ''}{notif.metadata.hp} HP
                                 </span>
                             )}
                             {(notif.metadata.coins !== undefined && notif.metadata.coins !== 0) && (
                                 <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-yellow-50 text-yellow-700 border-yellow-100 flex items-center">
                                     <Coins className="w-2.5 h-2.5 mr-1 text-yellow-600" />
                                     {notif.metadata.coins > 0 ? '+' : ''}{notif.metadata.coins} JP
                                 </span>
                             )}
                         </div>
                    )}

                    {/* Action Buttons for Approval */}
                    {isApproval && onAction && !isFinance && (
                        <div className="flex gap-2 mt-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAction(notif.id, 'APPROVE'); }}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all"
                            >
                                <Check className="w-3 h-3" /> อนุมัติ
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAction(notif.id, 'REJECT'); }}
                                className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all"
                            >
                                <X className="w-3 h-3" /> ปฏิเสธ
                            </button>
                        </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-1.5 font-bold uppercase tracking-wide">
                        {format(new Date(notif.date), 'HH:mm')} • {format(new Date(notif.date), 'd MMM')}
                    </p>
                </div>

                 {/* Dismiss Action (Top Right Hover) */}
                {onDismiss && !isApproval && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
                        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all z-20"
                        title="ลบการแจ้งเตือน"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationItem;
