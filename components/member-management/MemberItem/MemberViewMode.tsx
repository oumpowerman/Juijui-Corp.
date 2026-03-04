import React from 'react';
import { User } from '../../../types';
import { Heart, Trophy, Coins, Briefcase, Check, AlertCircle, Layers, Gavel, Edit2, Power, Trash2, Activity } from 'lucide-react';
import { TabType } from '../constants';

interface MemberViewModeProps {
    user: User;
    currentTab: TabType;
    taskCount: number;
    currentUser: User;
    onEditClick: (user: User) => void;
    onToggleStatus: (userId: string, currentStatus: boolean) => void;
    onRemoveMember: (userId: string) => void;
    onGmAdjustClick: (user: User) => void;
}

export const MemberViewMode: React.FC<MemberViewModeProps> = ({
    user,
    currentTab,
    taskCount,
    currentUser,
    onEditClick,
    onToggleStatus,
    onRemoveMember,
    onGmAdjustClick
}) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-base font-bold ${user.isActive ? 'text-gray-800' : 'text-gray-500'}`}>{user.name}</h4>
                    {user.role === 'ADMIN' && <span className="bg-yellow-100 text-yellow-700 text-[9px] px-2 py-0.5 rounded-full font-bold border border-yellow-200 uppercase">ADMIN</span>}
                </div>
                
                {currentTab === 'GAME_MASTER' ? (
                    <div className="grid grid-cols-3 gap-2 mt-2 animate-in fade-in">
                        {/* HP Widget */}
                        <div className={`p-2 rounded-xl border flex items-center gap-2 ${((user.hp / user.maxHp) * 100) < 30 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-gray-200'}`}>
                            <div className="p-1.5 bg-red-100 rounded-lg text-red-500">
                                <Heart className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-0.5">
                                    <span>HP</span>
                                    <span className={user.hp <= 0 ? 'text-red-600' : ''}>{user.hp}/{user.maxHp}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${((user.hp / user.maxHp) * 100) > 70 ? 'bg-green-500' : ((user.hp / user.maxHp) * 100) > 30 ? 'bg-orange-500' : 'bg-red-500'}`} 
                                        style={{ width: `${Math.max(0, Math.min(100, (user.hp / user.maxHp) * 100))}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* XP Widget */}
                        <div className="p-2 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                            <div className="p-1.5 bg-yellow-100 rounded-lg text-yellow-600">
                                <Trophy className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">Level {user.level}</p>
                                <p className="text-xs font-black text-gray-700 leading-none">{user.xp.toLocaleString()} XP</p>
                            </div>
                        </div>

                        {/* Wallet Widget */}
                        <div className="p-2 rounded-xl border border-gray-200 bg-white flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                                <Coins className="w-3.5 h-3.5 fill-current" />
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mb-0.5">Wallet</p>
                                <p className="text-xs font-black text-gray-700 leading-none">{user.availablePoints.toLocaleString()} JP</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 mt-1">
                        {(user.baseSalary ?? 0) > 0 ? (
                            <span className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-black uppercase tracking-wider" title="ข้อมูลเงินเดือนพร้อม">
                                <Check className="w-3 h-3 mr-1.5"/> Payroll Ready
                            </span>
                        ) : (
                            <span className="flex items-center text-orange-500 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 font-black uppercase tracking-wider" title="ยังไม่ระบุเงินเดือน">
                                <AlertCircle className="w-3 h-3 mr-1.5"/> No Salary
                            </span>
                        )}
                        
                        <span className={`flex items-center px-2.5 py-1 rounded-lg border font-black uppercase tracking-wider ${taskCount > 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            <Layers className="w-3 h-3 mr-1.5" />
                            {taskCount} Active Tasks
                        </span>

                        <span className="flex items-center bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200 font-black uppercase tracking-wider">
                            <Activity className="w-3 h-3 mr-1.5" />
                            {user.isActive ? 'Online' : 'Offline'}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {currentTab === 'GAME_MASTER' ? (
                    <button onClick={() => onGmAdjustClick(user)} className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-100 transition-all flex items-center"><Gavel className="w-4 h-4 mr-1.5"/> Adjust</button>
                ) : (
                    <>
                        <button onClick={() => onEditClick(user)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="แก้ไขข้อมูล"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onToggleStatus(user.id, user.isActive)} className={`p-2 rounded-xl transition-all ${user.isActive ? 'text-gray-400 hover:text-orange-500 hover:bg-orange-50' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}><Power className="w-4 h-4" /></button>
                        {currentUser.id !== user.id && <button onClick={() => onRemoveMember(user.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>}
                    </>
                )}
            </div>
        </div>
    );
};
