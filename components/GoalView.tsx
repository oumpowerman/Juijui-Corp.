
import React, { useState } from 'react';
import { Goal, Channel, Platform, User } from '../types';
import { useGoals } from '../hooks/useGoals';
import { PLATFORM_ICONS } from '../constants';
import { Plus, Target, Calendar, Trophy, TrendingUp, RefreshCw, X, ArrowRight, Wallet, Flame, Users, Sparkles, Coins, Star } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import MentorTip from './MentorTip';

interface GoalViewProps {
    channels: Channel[];
    users: User[];
    currentUser: User;
}

const GoalView: React.FC<GoalViewProps> = ({ channels, users, currentUser }) => {
    const { goals, addGoal, updateGoalValue, deleteGoal, toggleOwner, toggleBoost } = useGoals(currentUser);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
    const [targetValue, setTargetValue] = useState<number>(1000);
    const [currentValue, setCurrentValue] = useState<number>(0);
    const [deadline, setDeadline] = useState('');
    const [channelId, setChannelId] = useState('');
    const [rewardXp, setRewardXp] = useState(500);
    const [rewardCoin, setRewardCoin] = useState(100);

    // Update Modal State
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [newValue, setNewValue] = useState<number>(0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !targetValue || !deadline) return;

        addGoal({
            title,
            platform,
            targetValue: Number(targetValue),
            currentValue: Number(currentValue),
            deadline: new Date(deadline),
            channelId: channelId || undefined,
            isArchived: false,
            rewardXp: Number(rewardXp),
            rewardCoin: Number(rewardCoin),
        });

        setIsModalOpen(false);
        setTitle('');
        setTargetValue(1000);
        setCurrentValue(0);
        setDeadline('');
        setRewardXp(500);
        setRewardCoin(100);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if(editingGoal) {
            updateGoalValue(editingGoal.id, Number(newValue));
            setEditingGoal(null);
        }
    };

    const getDaysLeft = (deadline: Date) => {
        const days = differenceInDays(deadline, new Date());
        if (days < 0) return { text: `${Math.abs(days)} วันที่แล้ว`, color: 'text-red-500 bg-red-50' };
        if (days === 0) return { text: 'วันนี้!', color: 'text-orange-500 bg-orange-50' };
        return { text: `อีก ${days} วัน`, color: 'text-indigo-500 bg-indigo-50' };
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-24">
            <MentorTip variant="pink" messages={[
                "ใหม่! 'Goal Guardians' กำหนดคนรับผิดชอบหลักของเป้าหมายได้แล้ว",
                "เพื่อนๆ ในทีมสามารถกดปุ่ม 🔥 Boost เพื่อส่งกำลังใจให้เจ้าของโปรเจกต์ได้",
                "เป้าหมายที่มีคนช่วยกันดูแล มีโอกาสสำเร็จมากกว่า 80% เลยนะ!"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
                        <span className="text-4xl mr-2">🚀</span> Mission Control (Goals)
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">
                        ภารกิจพิชิตยอดและเป้าหมายของทีม
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 group"
                >
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" /> 
                    สร้างภารกิจใหม่
                </button>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                    const daysLeft = getDaysLeft(goal.deadline);
                    const channel = channels.find(c => c.id === goal.channelId);
                    const PlatformIcon = PLATFORM_ICONS[goal.platform] || PLATFORM_ICONS['OTHER'];
                    
                    const isBoostedByMe = goal.boosts.includes(currentUser.id);
                    const isOwner = goal.owners.includes(currentUser.id);

                    return (
                        <div key={goal.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            
                            {/* Background Accents */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-bl-[4rem] opacity-50 pointer-events-none transition-transform group-hover:scale-110" />
                            
                            {/* 1. Header: Platform & Channel */}
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border ${percent >= 100 ? 'bg-green-100 border-green-200 text-green-600' : 'bg-white border-gray-100 text-gray-400'}`}>
                                        {percent >= 100 ? <Trophy className="w-7 h-7 animate-bounce" /> : <PlatformIcon className="w-7 h-7" />}
                                    </div>
                                    <div>
                                        {channel && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border mb-1 inline-block ${channel.color}`}>
                                                {channel.name}
                                            </span>
                                        )}
                                        <h3 className="font-bold text-lg text-gray-800 line-clamp-1 leading-tight" title={goal.title}>{goal.title}</h3>
                                    </div>
                                </div>
                                
                                {/* Guardians Stack */}
                                <div className="flex -space-x-2">
                                    {goal.owners.map(uid => {
                                        const u = users.find(user => user.id === uid);
                                        if(!u) return null;
                                        return (
                                            <img key={uid} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" title={`Guardian: ${u.name}`} />
                                        )
                                    })}
                                    <button 
                                        onClick={() => toggleOwner(goal.id, currentUser.id, isOwner)}
                                        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-colors ${isOwner ? 'bg-red-100 text-red-500 hover:bg-red-200' : 'bg-gray-100 text-gray-400 hover:bg-indigo-100 hover:text-indigo-500'}`}
                                        title={isOwner ? "Leave Mission" : "Become Guardian"}
                                    >
                                        {isOwner ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* 2. Progress Circle & Stats */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Current</p>
                                    <p className="text-3xl font-black text-gray-800 tracking-tight">{goal.currentValue.toLocaleString()}</p>
                                </div>
                                
                                {/* Circular Progress (CSS Conic) */}
                                <div className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-inner" style={{ background: `conic-gradient(${percent >= 100 ? '#22c55e' : '#6366f1'} ${percent * 3.6}deg, #f3f4f6 0deg)` }}>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xs font-black text-gray-700">
                                        {percent}%
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Target</p>
                                    <p className="text-xl font-bold text-gray-500">{goal.targetValue.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* 3. Rewards & Deadline */}
                            <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl border border-gray-100 mb-4">
                                <div className="flex gap-3">
                                    <div className="flex items-center text-xs font-bold text-orange-600" title="Team XP Reward">
                                        <Star className="w-3 h-3 mr-1 fill-orange-500 text-orange-500" /> +{goal.rewardXp} XP
                                    </div>
                                    <div className="flex items-center text-xs font-bold text-yellow-600" title="Team Coin Reward">
                                        <Coins className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" /> +{goal.rewardCoin}
                                    </div>
                                </div>
                                <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${daysLeft.color}`}>
                                    {daysLeft.text}
                                </div>
                            </div>

                            {/* 4. Actions Footer */}
                            <div className="mt-auto flex items-center gap-2">
                                <button 
                                    onClick={() => toggleBoost(goal.id, isBoostedByMe)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${isBoostedByMe ? 'bg-orange-100 text-orange-600 shadow-inner' : 'bg-white border border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200'}`}
                                >
                                    <Flame className={`w-4 h-4 ${isBoostedByMe ? 'fill-orange-500' : ''}`} /> 
                                    {goal.boosts.length} เชียร์
                                </button>

                                <button 
                                    onClick={() => { setEditingGoal(goal); setNewValue(goal.currentValue); }}
                                    className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" /> อัปเดตผล
                                </button>
                                
                                {currentUser.role === 'ADMIN' && (
                                    <button onClick={() => deleteGoal(goal.id)} className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Add New Goal Card */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="border-3 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all min-h-[300px] group"
                >
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:scale-110 transition-all shadow-sm">
                        <Plus className="w-10 h-10 stroke-[3px]" />
                    </div>
                    <span className="font-black text-lg">เพิ่มภารกิจใหม่</span>
                    <span className="text-sm mt-1 opacity-70 font-medium">Create New Mission</span>
                </button>
            </div>

            {/* --- CREATE MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 border border-gray-200">
                        <div className="bg-indigo-600 p-6 text-white">
                            <h3 className="text-xl font-black flex items-center">
                                <Target className="w-6 h-6 mr-2 text-yellow-300" /> สร้างภารกิจใหม่ (New Mission)
                            </h3>
                            <p className="text-indigo-200 text-xs mt-1">กำหนดเป้าหมายที่ท้าทายให้ทีมพิชิต</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">ชื่อภารกิจ</label>
                                <input type="text" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 font-bold text-gray-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" placeholder="เช่น ผู้ติดตามครบ 100k..." value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Platform</label>
                                    <select className="w-full border-2 border-gray-100 rounded-xl px-3 py-3 font-bold text-gray-600 outline-none focus:border-indigo-500 bg-white" value={platform} onChange={e => setPlatform(e.target.value as any)}>
                                        <option value="ALL">รวมทุกช่อง</option>
                                        <option value="YOUTUBE">YouTube</option>
                                        <option value="FACEBOOK">Facebook</option>
                                        <option value="TIKTOK">TikTok</option>
                                        <option value="INSTAGRAM">Instagram</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">ช่อง (Channel)</label>
                                    <select className="w-full border-2 border-gray-100 rounded-xl px-3 py-3 font-bold text-gray-600 outline-none focus:border-indigo-500 bg-white" value={channelId} onChange={e => setChannelId(e.target.value)}>
                                        <option value="">ไม่ระบุ</option>
                                        {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">เป้าหมาย (Target)</label>
                                        <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-right font-black text-indigo-600" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">ปัจจุบัน (Current)</label>
                                        <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-right font-bold text-gray-600" value={currentValue} onChange={e => setCurrentValue(Number(e.target.value))} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1">เส้นตาย (Deadline)</label>
                                    <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 font-bold text-gray-600" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                                <label className="block text-xs font-black text-yellow-700 mb-2 uppercase flex items-center"><Sparkles className="w-3 h-3 mr-1" /> รางวัลเมื่อสำเร็จ (Rewards)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center bg-white p-2 rounded-lg border border-yellow-100">
                                        <span className="text-xs font-bold text-orange-500 mr-2">XP</span>
                                        <input type="number" value={rewardXp} onChange={e => setRewardXp(Number(e.target.value))} className="w-full text-sm font-bold text-gray-700 outline-none text-right" />
                                    </div>
                                    <div className="flex items-center bg-white p-2 rounded-lg border border-yellow-100">
                                        <span className="text-xs font-bold text-yellow-500 mr-2">Coin</span>
                                        <input type="number" value={rewardCoin} onChange={e => setRewardCoin(Number(e.target.value))} className="w-full text-sm font-bold text-gray-700 outline-none text-right" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95">สร้างภารกิจ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- UPDATE MODAL --- */}
            {editingGoal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 text-center relative border-4 border-white ring-1 ring-gray-100">
                        <button onClick={() => setEditingGoal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 shadow-inner">
                            <TrendingUp className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 mb-1">อัปเดตความคืบหน้า</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium">{editingGoal.title}</p>
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="relative">
                                <div className="absolute top-0 left-0 text-xs font-bold text-gray-400 uppercase">Current Value</div>
                                <input 
                                    type="number" 
                                    className="w-full border-b-2 border-indigo-100 px-4 py-2 text-4xl font-black text-center text-indigo-600 focus:border-indigo-500 focus:ring-0 outline-none bg-transparent" 
                                    value={newValue} 
                                    onChange={e => setNewValue(Number(e.target.value))} 
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95">บันทึกผล</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalView;
