import React from 'react';
import { 
    Heart, 
    Sliders, 
    Power, 
    Trash2, 
    Loader2, 
    History
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { User } from '../../../../../types';
import { MemberHpAdjustDrawer } from './MemberHpAdjustDrawer';

interface MemberControlCardProps {
    user: User;
    isAdjusting: boolean;
    onToggleAdjust: () => void;
    onSaveAdjustment: (user: User, amount: number, reason: string) => Promise<boolean>;
    onToggleStatus: (user: User) => void;
    onDeleteMember: (userId: string) => void;
    onViewHistory: (user: User) => void;
    isTogglingStatus: boolean;
}

export const MemberControlCard: React.FC<MemberControlCardProps> = ({
    user,
    isAdjusting,
    onToggleAdjust,
    onSaveAdjustment,
    onToggleStatus,
    onDeleteMember,
    onViewHistory,
    isTogglingStatus
}) => {
    const currentHp = user.hp ?? 100;
    const maxHp = user.maxHp ?? 100;
    const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));

    let hpBgColor = 'bg-emerald-500';
    let hpTextColor = 'text-emerald-700';
    if (hpPercent <= 20) {
        hpBgColor = 'bg-red-500';
        hpTextColor = 'text-red-700';
    } else if (hpPercent <= 50) {
        hpBgColor = 'bg-amber-500';
        hpTextColor = 'text-amber-700';
    }

    return (
        <div className={`p-4 rounded-2xl border ${
            user.isActive 
                ? 'bg-white border-gray-200/80 hover:border-gray-300 shadow-2xs' 
                : 'bg-gray-50/80 border-gray-200 opacity-75'
        }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Avatar & Basic Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                        {user.avatarUrl ? (
                            <img 
                                src={user.avatarUrl} 
                                alt={user.name} 
                                className="w-11 h-11 rounded-2xl object-cover border border-gray-100 shadow-2xs"
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200 shadow-2xs">
                                {user.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                            user.isActive ? 'bg-emerald-500' : 'bg-gray-400'
                        }`} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-gray-900 truncate">
                                {user.name}
                            </h4>
                            {user.role === 'ADMIN' && (
                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold">
                                    Admin
                                </span>
                            )}
                            {!user.isActive && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold">
                                    พักงาน
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                            {user.position || user.email || 'ไม่มีตำแหน่ง'}
                        </p>
                    </div>
                </div>

                {/* Right: HP Bar & Action Controls */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* HP Indicator */}
                    <div className="flex flex-col items-start sm:items-end min-w-[85px]">
                        <div className="flex items-center gap-1.5 text-xs font-black">
                            <Heart className={`w-3.5 h-3.5 ${hpTextColor} fill-current`} />
                            <span className={hpTextColor}>{currentHp}</span>
                            <span className="text-[10px] text-gray-400">/ {maxHp}</span>
                        </div>
                        <div className="w-20 sm:w-24 h-2 bg-gray-100 rounded-full overflow-hidden mt-1 border border-gray-200/60">
                            <div 
                                className={`h-full ${hpBgColor} transition-all duration-300 rounded-full`}
                                style={{ width: `${hpPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                        {/* History Log Button */}
                        <button
                            type="button"
                            onClick={() => onViewHistory(user)}
                            className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer shadow-2xs"
                            title="ดูประวัติการปรับแต้มและ HP"
                        >
                            <History className="w-4 h-4" />
                        </button>

                        {/* HP Adjust Trigger Button */}
                        <button
                            type="button"
                            onClick={onToggleAdjust}
                            className={`p-2 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs ${
                                isAdjusting
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20'
                                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            }`}
                            title="ปรับแต่ง HP"
                        >
                            <Sliders className="w-4 h-4" />
                            <span className="hidden sm:inline">ปรับ HP</span>
                        </button>

                        {/* Toggle Active / Inactive Switch */}
                        <button
                            type="button"
                            onClick={() => onToggleStatus(user)}
                            disabled={isTogglingStatus}
                            className={`p-2 rounded-xl border transition-colors flex items-center justify-center cursor-pointer shadow-2xs ${
                                user.isActive 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={user.isActive ? "กดเพื่อพักงาน (Deactivate)" : "กดเพื่อเปิดใช้งาน (Activate)"}
                        >
                            {isTogglingStatus ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Power className="w-4 h-4" />
                            )}
                        </button>

                        {/* Delete Member Button */}
                        <button
                            type="button"
                            onClick={() => onDeleteMember(user.id)}
                            className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-200 transition-colors cursor-pointer shadow-2xs"
                            title="ลบสมาชิกออกจากระบบ"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Inline Drawer for HP Adjust with AnimatePresence */}
            <AnimatePresence initial={false}>
                {isAdjusting && (
                    <MemberHpAdjustDrawer 
                        user={user}
                        onClose={onToggleAdjust}
                        onSaveAdjustment={onSaveAdjustment}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
