
import React from 'react';
import { Goal, Channel, User } from '../../types';
import { PLATFORM_ICONS } from '../../constants';
import { differenceInDays, format } from 'date-fns';
import { MoreHorizontal, Plus, RefreshCw, Trophy, AlertCircle, Coins, Star, Flame, Zap, Heart } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { motion, AnimatePresence } from 'framer-motion';

interface GoalCardProps {
    goal: Goal;
    channel?: Channel;
    users: User[];
    currentUser: User;
    onUpdate: (goal: Goal) => void;
    onToggleOwner: (goalId: string, userId: string, isOwner: boolean) => void;
    onToggleBoost: (goalId: string, isBoosted: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
    goal, channel, users, currentUser, onUpdate, onToggleOwner, onToggleBoost, onDelete, onEdit 
}) => {
    const { showConfirm } = useGlobalDialog();
    
    // Calculations
    const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    const isCompleted = percent >= 100;
    const PlatformIcon = PLATFORM_ICONS[goal.platform] || PLATFORM_ICONS['OTHER'];
    
    // Date Logic
    const daysLeft = differenceInDays(new Date(goal.deadline), new Date());
    const isOverdue = daysLeft < 0 && !isCompleted;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 3 && !isCompleted;
    
    // User Logic
    const isOwner = goal.owners.includes(currentUser.id);
    const isBoosted = goal.boosts.includes(currentUser.id);

    // Dynamic Styles
    let progressBarColor = 'bg-gradient-to-r from-indigo-500 to-indigo-400';
    let statusColor = 'text-indigo-600 bg-indigo-50 border-indigo-100';
    let statusText = `${daysLeft} วันที่เหลือ`;
    let StatusIcon = null;

    if (isCompleted) {
        progressBarColor = 'bg-gradient-to-r from-emerald-500 to-emerald-400';
        statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
        statusText = 'สำเร็จแล้ว!';
        StatusIcon = <Trophy className="w-3 h-3" />;
    } else if (isOverdue) {
        progressBarColor = 'bg-slate-400';
        statusColor = 'text-slate-600 bg-slate-100 border-slate-200';
        statusText = 'เลยกำหนด';
        StatusIcon = <AlertCircle className="w-3 h-3" />;
    } else if (isExpiringSoon) {
        progressBarColor = 'bg-gradient-to-r from-rose-500 to-orange-400';
        statusColor = 'text-rose-600 bg-rose-50 border-rose-100';
        statusText = `เหลือเพียง ${daysLeft} วัน! ลุยเลยทีม!`;
        StatusIcon = <Flame className="w-3 h-3" />;
    }

    const handleDelete = async () => {
        if (await showConfirm(`ต้องการลบเป้าหมาย "${goal.title}" หรือไม่?`, 'ยืนยันการลบ')) {
            onDelete(goal.id);
        }
    };

    return (
        <motion.div 
            layout
            className={`
                bg-white rounded-[2rem] border transition-all flex flex-col h-full group relative overflow-hidden
                ${isCompleted ? 'border-emerald-200 shadow-sm' : isOverdue ? 'border-slate-200 opacity-80' : isExpiringSoon ? 'border-rose-200 shadow-md shadow-rose-50' : 'border-slate-200 shadow-sm'}
                hover:shadow-xl hover:border-indigo-200 transition-all duration-500
            `}
        >
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 -mr-16 -mt-16 pointer-events-none ${isCompleted ? 'bg-emerald-400' : isExpiringSoon ? 'bg-rose-400' : 'bg-indigo-400'}`}></div>
            
            {/* Modern Abstract Pattern - Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <pattern id={`grid-${goal.id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${goal.id})`} />
                </svg>
            </div>
            
            {/* Top Bar Status Line */}
            <div className={`h-1.5 w-full ${progressBarColor} transition-all duration-1000 opacity-80`}></div>

            <div className="p-6 flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center border transition-all shadow-sm
                            ${isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : isOverdue ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-500'}
                        `}>
                            <PlatformIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1.5">
                                {channel && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${channel.color}`}>
                                        {channel.name}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${statusColor} ${isExpiringSoon ? 'animate-pulse' : ''}`}>
                                    {StatusIcon} {statusText}
                                </span>
                            </div>
                            <h3 className={`font-bold text-lg tracking-tight line-clamp-1 ${isOverdue ? 'text-slate-400 line-through' : 'text-slate-900'}`} title={goal.title}>
                                {goal.title}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Menu Actions */}
                    <div className="relative group/menu">
                        <button className="p-2 text-gray-300 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 hidden group-hover/menu:block z-30 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => onEdit(goal)} className="w-full text-left px-5 py-3 text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5" /> แก้ไข (Edit)
                            </button>
                            <button onClick={handleDelete} className="w-full text-left px-5 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> ลบ (Delete)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-3">
                        <div className={`text-4xl font-bold tracking-tighter ${isCompleted ? 'text-emerald-600' : isOverdue ? 'text-slate-400' : isExpiringSoon ? 'text-rose-600' : 'text-indigo-600'}`}>
                            {percent}<span className="text-xl text-slate-300 font-bold ml-0.5">%</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Current Progress</p>
                            <p className="text-sm font-bold text-slate-700">
                                {goal.currentValue.toLocaleString()} <span className="text-slate-300 mx-1">/</span> {goal.targetValue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${progressBarColor} relative overflow-hidden`}
                        >
                            {/* Shimmer Effect for active goals */}
                            {!isCompleted && !isOverdue && (
                                <motion.div 
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 h-full"
                                />
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Boosts / Cheers Section - Grand Display */}
                <div className="mb-6 flex items-center gap-3">
                    <button 
                        onClick={() => onToggleBoost(goal.id, isBoosted)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all active:scale-90
                            ${isBoosted 
                                ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' 
                                : 'bg-white border border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500'}
                        `}
                    >
                        <Heart className={`w-4 h-4 ${isBoosted ? 'fill-white' : ''}`} />
                        {isBoosted ? 'เชียร์แล้ว!' : 'ส่งพลังเชียร์'}
                    </button>
                    
                    <div className="flex -space-x-2 overflow-hidden">
                        {goal.boosts.slice(0, 5).map(uid => {
                            const u = users.find(user => user.id === uid);
                            if (!u) return null;
                            return (
                                <motion.img 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    key={uid} 
                                    src={u.avatarUrl} 
                                    className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 object-cover shadow-sm" 
                                    title={`${u.name} ส่งพลังเชียร์!`} 
                                />
                            );
                        })}
                        {goal.boosts.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm">
                                +{goal.boosts.length - 5}
                            </div>
                        )}
                    </div>
                    {goal.boosts.length > 0 && (
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest animate-bounce">
                            {goal.boosts.length} Boosts! 🔥
                        </span>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-50">
                    {/* Guardians */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {goal.owners.map(uid => {
                                const u = users.find(user => user.id === uid);
                                if (!u) return null;
                                return (
                                    <img key={uid} src={u.avatarUrl} className="w-9 h-9 rounded-2xl border-2 border-white bg-slate-200 object-cover shadow-sm" title={u.name} />
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => onToggleOwner(goal.id, currentUser.id, isOwner)}
                            className={`w-9 h-9 rounded-2xl border-2 border-white flex items-center justify-center text-xs transition-all shadow-sm ${isOwner ? 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}
                            title={isOwner ? "Leave Team" : "Join Team"}
                        >
                            {isOwner ? '-' : <Plus className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Incentives Badge */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Rewards</span>
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center text-xs font-bold text-amber-600">
                                <Star className="w-3.5 h-3.5 text-amber-400 mr-1 fill-amber-400" /> {goal.rewardXp}
                            </div>
                            <div className="w-px h-3 bg-slate-200"></div>
                            <div className="flex items-center text-xs font-bold text-amber-600">
                                <Coins className="w-3.5 h-3.5 text-amber-500 mr-1 fill-amber-500" /> {goal.rewardCoin}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Button */}
            {!isCompleted && (
                <button 
                    onClick={() => onUpdate(goal)}
                    className={`
                        w-full py-4 text-xs font-bold transition-all flex items-center justify-center gap-2 border-t
                        ${isExpiringSoon ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-indigo-600 hover:text-white'}
                    `}
                >
                    <Zap className="w-4 h-4" /> อัปเดตความคืบหน้า
                </button>
            )}
             {isCompleted && (
                <div className="w-full py-4 bg-emerald-50 text-emerald-600 text-xs font-bold border-t border-emerald-100 flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4" /> ภารกิจสำเร็จลุล่วง!
                </div>
            )}
        </motion.div>
    );
};

export default GoalCard;

