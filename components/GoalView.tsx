
import React, { useState } from 'react';
import { Goal, Channel, Platform } from '../types';
import { useGoals } from '../hooks/useGoals';
import { PLATFORM_ICONS } from '../constants';
import { Plus, Target, Calendar, Trophy, TrendingUp, RefreshCw, X, ArrowRight, Wallet } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import MentorTip from './MentorTip';

interface GoalViewProps {
    channels: Channel[];
}

const GoalView: React.FC<GoalViewProps> = ({ channels }) => {
    const { goals, addGoal, updateGoalValue, deleteGoal } = useGoals();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
    const [targetValue, setTargetValue] = useState<number>(1000);
    const [currentValue, setCurrentValue] = useState<number>(0);
    const [deadline, setDeadline] = useState('');
    const [channelId, setChannelId] = useState('');

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
            isArchived: false
        });

        setIsModalOpen(false);
        // Reset form
        setTitle('');
        setTargetValue(1000);
        setCurrentValue(0);
        setDeadline('');
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
        if (days < 0) return { text: `${Math.abs(days)} วันที่แล้ว`, color: 'text-red-500' };
        if (days === 0) return { text: 'วันนี้!', color: 'text-orange-500' };
        return { text: `อีก ${days} วัน`, color: 'text-indigo-500' };
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-gradient-to-r from-emerald-400 to-green-500';
        if (percent >= 75) return 'bg-gradient-to-r from-indigo-400 to-purple-500';
        if (percent >= 50) return 'bg-gradient-to-r from-blue-400 to-indigo-500';
        return 'bg-gradient-to-r from-orange-400 to-pink-500';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <MentorTip variant="pink" messages={[
                "ตั้งเป้าหมายที่ 'ท้าทาย' แต่ 'เป็นไปได้' (SMART Goal) จะช่วยให้ทีมมีไฟ!",
                "ระบบยังไม่เชื่อม API อัตโนมัติ เพื่อความปลอดภัย ให้กดปุ่ม 'อัปเดต' เพื่อกรอกเลขล่าสุดเองนะครับ"
            ]} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        เป้าหมาย & การเติบโต 🚀 (Goals)
                    </h1>
                    <p className="text-gray-500 mt-1">
                        ติดตามยอดผู้ติดตาม และความสำเร็จตามระยะเวลาที่กำหนด
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" /> ตั้งเป้าหมายใหม่
                </button>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {goals.map(goal => {
                    const progress = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                    const daysLeft = getDaysLeft(goal.deadline);
                    const channel = channels.find(c => c.id === goal.channelId);
                    const PlatformIcon = PLATFORM_ICONS[goal.platform] || PLATFORM_ICONS['OTHER'];

                    return (
                        <div key={goal.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all">
                            {/* Background Progress Hint */}
                            <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gray-100">
                                <div className={`h-full ${getProgressColor(progress)}`} style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${progress >= 100 ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                                        {progress >= 100 ? <Trophy className="w-6 h-6" /> : <PlatformIcon className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{goal.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {channel && <span className={`px-2 py-0.5 rounded ${channel.color.replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 text-')}`}>{channel.name}</span>}
                                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/> {format(goal.deadline, 'd MMM yy')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-lg bg-gray-50 ${daysLeft.color}`}>
                                    {daysLeft.text}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-end justify-between mb-2">
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Current</p>
                                    <p className="text-2xl font-black text-gray-800">{goal.currentValue.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Target</p>
                                    <p className="text-xl font-bold text-gray-600 flex items-center justify-end">
                                        {goal.targetValue.toLocaleString()} 
                                        <Target className="w-4 h-4 ml-1 text-indigo-400" />
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar Visual */}
                            <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(progress)}`} style={{ width: `${progress}%` }}></div>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex gap-2">
                                <button 
                                    onClick={() => { setEditingGoal(goal); setNewValue(goal.currentValue); }}
                                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" /> อัปเดตยอด
                                </button>
                                <button 
                                    onClick={() => deleteGoal(goal.id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Add Card */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all min-h-[250px] group"
                >
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 group-hover:scale-110 transition-all shadow-sm">
                        <Plus className="w-8 h-8 stroke-[3px]" />
                    </div>
                    <span className="font-bold text-lg">เพิ่มเป้าหมายใหม่</span>
                </button>
            </div>

            {/* --- CREATE MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <Target className="w-6 h-6 mr-2 text-indigo-600" /> ตั้งเป้าหมายใหม่
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">ชื่อเป้าหมาย</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-2" placeholder="เช่น ผู้ติดตามครบ 100k" value={title} onChange={e => setTitle(e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Platform</label>
                                    <select className="w-full border border-gray-200 rounded-xl px-4 py-2" value={platform} onChange={e => setPlatform(e.target.value as any)}>
                                        <option value="ALL">รวมทุกช่อง</option>
                                        <option value="YOUTUBE">YouTube</option>
                                        <option value="FACEBOOK">Facebook</option>
                                        <option value="TIKTOK">TikTok</option>
                                        <option value="INSTAGRAM">Instagram</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ของช่องไหน?</label>
                                    <select className="w-full border border-gray-200 rounded-xl px-4 py-2" value={channelId} onChange={e => setChannelId(e.target.value)}>
                                        <option value="">ไม่ระบุ</option>
                                        {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">เป้าหมาย (Target)</label>
                                    <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ปัจจุบัน (Current)</label>
                                    <input type="number" className="w-full border border-gray-200 rounded-xl px-4 py-2" value={currentValue} onChange={e => setCurrentValue(Number(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">ต้องถึงภายในวันที่ (Deadline)</label>
                                <input type="date" className="w-full border border-gray-200 rounded-xl px-4 py-2" value={deadline} onChange={e => setDeadline(e.target.value)} required />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-500 font-bold bg-gray-100 rounded-xl">ยกเลิก</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">บันทึก</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- UPDATE MODAL --- */}
            {editingGoal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 text-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800">อัปเดตยอดล่าสุด</h3>
                        <p className="text-sm text-gray-500 mb-6">{editingGoal.title}</p>
                        
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">ยอดปัจจุบัน</label>
                                <input 
                                    type="number" 
                                    className="w-full border-2 border-indigo-100 rounded-2xl px-4 py-3 text-2xl font-black text-center text-indigo-900 focus:border-indigo-500 focus:ring-0 outline-none" 
                                    value={newValue} 
                                    onChange={e => setNewValue(Number(e.target.value))} 
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingGoal(null)} className="flex-1 py-3 text-gray-500 font-bold bg-gray-50 rounded-xl hover:bg-gray-100">ยกเลิก</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all">ยืนยัน</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalView;
