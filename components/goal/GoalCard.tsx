
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
    let progressBarColor = 'bg-indigo-600';
    let statusColor = 'text-blue-600 bg-blue-50 border-blue-100';
    let statusText = `${daysLeft} วันที่เหลือ`;
    let StatusIcon = null;

    if (isCompleted) {
        progressBarColor = 'bg-emerald-500';
        statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
        statusText = 'สำเร็จแล้ว!';
        StatusIcon = <Trophy className="w-3 h-3" />;
    } else if (isOverdue) {
        progressBarColor = 'bg-slate-500';
        statusColor = 'text-slate-600 bg-slate-100 border-slate-200';
        statusText = 'เลยกำหนด';
        StatusIcon = <AlertCircle className="w-3 h-3" />;
    } else if (isExpiringSoon) {
        progressBarColor = 'bg-orange-500';
        statusColor = 'text-orange-600 bg-orange-50 border-orange-100 animate-pulse';
        statusText = `เหลือเพียง ${daysLeft} วัน!`;
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
                bg-white rounded-[2.5rem] border-2 transition-all flex flex-col h-full group relative overflow-hidden
                ${isCompleted ? 'border-emerald-100 shadow-emerald-50' : isOverdue ? 'border-slate-200 opacity-80' : isExpiringSoon ? 'border-orange-200 shadow-orange-50' : 'border-gray-100 shadow-indigo-50'}
                hover:shadow-2xl hover:-translate-y-1
            `}
        >
            {/* Watermark Icon - Background */}
            <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-1000 pointer-events-none rotate-12">
                <PlatformIcon className="w-48 h-48" />
            </div>
            
            {/* Top Bar Status Line */}
            <div className={`h-2 w-full ${progressBarColor} transition-all duration-1000`}></div>

            <div className="p-6 flex-1 flex flex-col relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm
                            ${isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : isOverdue ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-400 group-hover:border-indigo-100 group-hover:text-indigo-500'}
                        `}>
                            <PlatformIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {channel && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${channel.color}`}>
                                        {channel.name}
                                    </span>
                                )}
                                <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${statusColor}`}>
                                    {StatusIcon} {statusText}
                                </span>
                            </div>
                            <h3 className={`font-black text-lg tracking-tight line-clamp-1 ${isOverdue ? 'text-slate-400 line-through' : 'text-gray-800'}`} title={goal.title}>
                                {goal.title}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Menu Actions */}
                    <div className="relative group/menu">
                        <button className="p-2 text-gray-300 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-all">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 hidden group-hover/menu:block z-30 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => onEdit(goal)} className="w-full text-left px-5 py-3 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5" /> แก้ไข (Edit)
                            </button>
                            <button onClick={handleDelete} className="w-full text-left px-5 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> ลบ (Delete)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-3">
                        <div className={`text-4xl font-black tracking-tighter ${isCompleted ? 'text-emerald-600' : isOverdue ? 'text-slate-400' : isExpiringSoon ? 'text-orange-600' : 'text-indigo-600'}`}>
                            {percent}<span className="text-xl text-gray-300 font-black ml-0.5">%</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Current Progress</p>
                            <p className="text-sm font-black text-gray-700">
                                {goal.currentValue.toLocaleString()} <span className="text-gray-300 mx-1">/</span> {goal.targetValue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner p-1">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full shadow-sm ${progressBarColor} relative`}
                        >
                            <div className="absolute top-0 right-0 w-2 h-full bg-white/20"></div>
                        </motion.div>
                    </div>
                </div>

                {/* Boosts / Cheers Section - Grand Display */}
                <div className="mb-6 flex items-center gap-3">
                    <button 
                        onClick={() => onToggleBoost(goal.id, isBoosted)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs transition-all active:scale-90
                            ${isBoosted 
                                ? 'bg-red-500 text-white shadow-lg shadow-red-200' 
                                : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-500'}
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
                                    className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 object-cover shadow-sm" 
                                    title={`${u.name} ส่งพลังเชียร์!`} 
                                />
                            );
                        })}
                        {goal.boosts.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm">
                                +{goal.boosts.length - 5}
                            </div>
                        )}
                    </div>
                    {goal.boosts.length > 0 && (
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest animate-bounce">
                            {goal.boosts.length} Boosts! 🔥
                        </span>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-50">
                    {/* Guardians */}
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {goal.owners.map(uid => {
                                const u = users.find(user => user.id === uid);
                                if (!u) return null;
                                return (
                                    <img key={uid} src={u.avatarUrl} className="w-9 h-9 rounded-2xl border-2 border-white bg-gray-200 object-cover shadow-sm" title={u.name} />
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => onToggleOwner(goal.id, currentUser.id, isOwner)}
                            className={`w-9 h-9 rounded-2xl border-2 border-white flex items-center justify-center text-xs transition-all shadow-sm ${isOwner ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white'}`}
                            title={isOwner ? "Leave Team" : "Join Team"}
                        >
                            {isOwner ? '-' : <Plus className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Incentives Badge */}
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Rewards</span>
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center text-xs font-black text-amber-600">
                                <Star className="w-3.5 h-3.5 text-amber-400 mr-1 fill-amber-400" /> {goal.rewardXp}
                            </div>
                            <div className="w-px h-3 bg-gray-200"></div>
                            <div className="flex items-center text-xs font-black text-yellow-600">
                                <Coins className="w-3.5 h-3.5 text-yellow-500 mr-1 fill-yellow-500" /> {goal.rewardCoin}
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
                        w-full py-4 text-xs font-black transition-all flex items-center justify-center gap-2 border-t
                        ${isExpiringSoon ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-600 hover:text-white' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-indigo-600 hover:text-white'}
                    `}
                >
                    <Zap className="w-4 h-4" /> อัปเดตความคืบหน้า
                </button>
            )}
             {isCompleted && (
                <div className="w-full py-4 bg-emerald-50 text-emerald-600 text-xs font-black border-t border-emerald-100 flex items-center justify-center gap-2">
                    <Trophy className="w-4 h-4" /> ภารกิจสำเร็จลุล่วง!
                </div>
            )}
        </motion.div>
    );
};

export default GoalCard;

