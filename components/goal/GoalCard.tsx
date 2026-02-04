
import React from 'react';
import { Goal, Channel, User } from '../../types';
import { PLATFORM_ICONS } from '../../constants';
import { differenceInDays, format } from 'date-fns';
import { MoreHorizontal, Plus, RefreshCw, Trophy, AlertCircle, Coins, Star } from 'lucide-react';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface GoalCardProps {
    goal: Goal;
    channel?: Channel;
    users: User[];
    currentUser: User;
    onUpdate: (goal: Goal) => void;
    onToggleOwner: (goalId: string, userId: string, isOwner: boolean) => void;
    onDelete: (id: string) => void;
    onEdit: (goal: Goal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ 
    goal, channel, users, currentUser, onUpdate, onToggleOwner, onDelete, onEdit 
}) => {
    const { showConfirm } = useGlobalDialog();
    
    // Calculations
    const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    const isCompleted = percent >= 100;
    const PlatformIcon = PLATFORM_ICONS[goal.platform] || PLATFORM_ICONS['OTHER'];
    
    // Date Logic
    const daysLeft = differenceInDays(new Date(goal.deadline), new Date());
    const isOverdue = daysLeft < 0 && !isCompleted;
    
    // User Logic
    const isOwner = goal.owners.includes(currentUser.id);

    // Dynamic Styles
    const progressBarColor = isCompleted ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-indigo-600';
    const statusColor = isCompleted ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : isOverdue ? 'text-red-600 bg-red-50 border-red-100' : 'text-blue-600 bg-blue-50 border-blue-100';
    const statusText = isCompleted ? 'Achieved' : isOverdue ? 'Overdue' : `${daysLeft} Days Left`;

    const handleDelete = async () => {
        if (await showConfirm(`ต้องการลบเป้าหมาย "${goal.title}" หรือไม่?`, 'ยืนยันการลบ')) {
            onDelete(goal.id);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden">
            
            {/* Top Bar Status Line */}
            <div className={`h-1 w-full ${progressBarColor}`}></div>

            <div className="p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-500">
                            <PlatformIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                {channel && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${channel.color}`}>
                                        {channel.name}
                                    </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${statusColor}`}>
                                    {statusText}
                                </span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mt-1 line-clamp-1" title={goal.title}>
                                {goal.title}
                            </h3>
                        </div>
                    </div>
                    
                    {/* Menu Actions */}
                    <div className="relative group/menu">
                        <button className="p-1 text-gray-300 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 hidden group-hover/menu:block z-20 overflow-hidden animate-in fade-in zoom-in-95">
                            <button onClick={() => onEdit(goal)} className="w-full text-left px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                                แก้ไข (Edit)
                            </button>
                            <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                                ลบ (Delete)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                <div className="mb-5">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-3xl font-black text-gray-800 tracking-tight">
                            {percent}<span className="text-lg text-gray-400 font-bold">%</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase">Progress</p>
                            <p className="text-sm font-bold text-gray-600">
                                {goal.currentValue.toLocaleString()} <span className="text-gray-400">/ {goal.targetValue.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${progressBarColor}`} 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                    {/* Guardians */}
                    <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                            {goal.owners.map(uid => {
                                const u = users.find(user => user.id === uid);
                                if (!u) return null;
                                return (
                                    <img key={uid} src={u.avatarUrl} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 object-cover" title={u.name} />
                                );
                            })}
                        </div>
                        <button 
                            onClick={() => onToggleOwner(goal.id, currentUser.id, isOwner)}
                            className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] transition-colors shadow-sm ${isOwner ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500'}`}
                            title={isOwner ? "Leave" : "Join"}
                        >
                            {isOwner ? '-' : '+'}
                        </button>
                    </div>

                    {/* Incentives Badge */}
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                        <div className="flex items-center text-[10px] font-bold text-gray-500">
                            <Star className="w-3 h-3 text-orange-400 mr-1 fill-orange-400" /> {goal.rewardXp}
                        </div>
                        <div className="w-px h-3 bg-gray-300"></div>
                        <div className="flex items-center text-[10px] font-bold text-gray-500">
                            <Coins className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" /> {goal.rewardCoin}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Button */}
            {!isCompleted && (
                <button 
                    onClick={() => onUpdate(goal)}
                    className="w-full py-3 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 text-xs font-bold border-t border-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> อัปเดตความคืบหน้า
                </button>
            )}
             {isCompleted && (
                <div className="w-full py-3 bg-emerald-50 text-emerald-600 text-xs font-bold border-t border-emerald-100 flex items-center justify-center gap-2">
                    <Trophy className="w-3.5 h-3.5" /> เป้าหมายสำเร็จ!
                </div>
            )}
        </div>
    );
};

export default GoalCard;
