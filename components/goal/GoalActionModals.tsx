
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Save, RefreshCw, Coins, Star, Calendar, MonitorPlay, Hash, Check } from 'lucide-react';
import { Goal, Channel, Platform } from '../../types';
import { PLATFORM_ICONS } from '../../constants';

interface GoalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Goal | null;
    channels: Channel[];
    onSave: (data: any) => void;
}

const ALL_PLATFORMS: { id: Platform | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'รวมทุกช่อง' },
    { id: 'YOUTUBE', label: 'YouTube' },
    { id: 'FACEBOOK', label: 'Facebook' },
    { id: 'TIKTOK', label: 'TikTok' },
    { id: 'INSTAGRAM', label: 'Instagram' },
];

export const GoalFormModal: React.FC<GoalFormModalProps> = ({ isOpen, onClose, initialData, channels, onSave }) => {
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState<Platform | 'ALL'>('ALL');
    const [targetValue, setTargetValue] = useState<number>(1000);
    const [currentValue, setCurrentValue] = useState<number>(0);
    const [deadline, setDeadline] = useState('');
    const [channelId, setChannelId] = useState('');
    const [rewardXp, setRewardXp] = useState(500);
    const [rewardCoin, setRewardCoin] = useState(100);

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setPlatform(initialData.platform);
            setTargetValue(initialData.targetValue);
            setCurrentValue(initialData.currentValue);
            setDeadline(new Date(initialData.deadline).toISOString().split('T')[0]);
            setChannelId(initialData.channelId || '');
            setRewardXp(initialData.rewardXp);
            setRewardCoin(initialData.rewardCoin);
        } else {
            setTitle('');
            setPlatform('ALL');
            setTargetValue(1000);
            setCurrentValue(0);
            setDeadline('');
            setChannelId('');
            setRewardXp(500);
            setRewardCoin(100);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            title, platform, targetValue, currentValue, deadline: new Date(deadline), channelId, rewardXp, rewardCoin
        });
        onClose();
    };

    const progressPercent = Math.min(100, Math.round((currentValue / (targetValue || 1)) * 100));

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                                <Target className="w-6 h-6" />
                            </span>
                            {initialData ? 'แก้ไขภารกิจ' : 'สร้างเป้าหมายใหม่'}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1 ml-1 font-medium">ตั้งเป้าให้ชัดเจน แล้วพุ่งชนให้สำเร็จ! 🚀</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 bg-[#f8fafc] p-6 md:p-8 space-y-8 scrollbar-thin scrollbar-thumb-gray-200">
                    
                    {/* Section 1: Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1 mb-2 block">ชื่อเป้าหมาย (Goal Title)</label>
                            <input 
                                type="text" 
                                className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none text-lg font-bold text-gray-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-300 shadow-sm" 
                                placeholder="เช่น ผู้ติดตามครบ 100k, ยอดวิวรวม 1 ล้าน..." 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                autoFocus
                                required 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Platform Chips */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1 mb-2 flex items-center"><MonitorPlay className="w-3 h-3 mr-1"/> Platform</label>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_PLATFORMS.map(p => {
                                        const Icon = p.id === 'ALL' ? Hash : PLATFORM_ICONS[p.id as Platform] || Hash;
                                        const isSelected = platform === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setPlatform(p.id as any)}
                                                className={`
                                                    flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all
                                                    ${isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105' 
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                    }
                                                `}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {p.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                            
                            {/* Channel Chips */}
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1 mb-2 flex items-center"><Hash className="w-3 h-3 mr-1"/> Channel</label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 scrollbar-hide">
                                    <button
                                        type="button"
                                        onClick={() => setChannelId('')}
                                        className={`
                                            flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all
                                            ${channelId === '' 
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                                : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        ไม่ระบุ
                                    </button>
                                    {channels.map(c => {
                                        const isSelected = channelId === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setChannelId(c.id)}
                                                className={`
                                                    flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all
                                                    ${isSelected 
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md transform scale-105' 
                                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                                                    }
                                                `}
                                            >
                                                {c.logoUrl && <img src={c.logoUrl} className="w-4 h-4 rounded-full object-cover bg-white" />}
                                                {c.name}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Progress & Date */}
                    <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] opacity-50 pointer-events-none"></div>
                        
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div>
                                <label className="text-xs font-black text-indigo-400 uppercase tracking-wider ml-1 mb-2 block">🎯 เป้าหมาย (Target)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-4 py-3 bg-indigo-50/30 border-2 border-indigo-100 rounded-xl text-2xl font-black text-indigo-900 focus:border-indigo-400 focus:bg-white transition-all text-right outline-none"
                                    value={targetValue} 
                                    onChange={e => setTargetValue(Number(e.target.value))} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1 mb-2 block">🚩 เริ่มต้นที่ (Start/Current)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-2xl font-bold text-gray-600 focus:border-gray-300 focus:bg-white transition-all text-right outline-none"
                                    value={currentValue} 
                                    onChange={e => setCurrentValue(Number(e.target.value))} 
                                />
                            </div>
                        </div>

                        {/* Progress Preview */}
                        <div className="mb-6">
                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-1 px-1">
                                <span>Preview Progress</span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1 mb-2 flex items-center"><Calendar className="w-3 h-3 mr-1" /> เส้นตาย (Deadline)</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all" 
                                value={deadline} 
                                onChange={e => setDeadline(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    {/* Section 3: Rewards */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-[2rem] border border-amber-100 relative overflow-hidden">
                         <div className="grid grid-cols-2 gap-6 relative z-10">
                             <div>
                                 <label className="text-xs font-black text-amber-600 uppercase tracking-wider ml-1 mb-2 block flex items-center"><Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500"/> Reward XP</label>
                                 <input type="number" className="w-full px-4 py-3 bg-white/60 border-2 border-amber-100 rounded-xl font-bold text-amber-800 focus:bg-white focus:border-amber-300 outline-none" value={rewardXp} onChange={e => setRewardXp(Number(e.target.value))} />
                             </div>
                             <div>
                                 <label className="text-xs font-black text-yellow-600 uppercase tracking-wider ml-1 mb-2 block flex items-center"><Coins className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500"/> Reward Coin</label>
                                 <input type="number" className="w-full px-4 py-3 bg-white/60 border-2 border-yellow-100 rounded-xl font-bold text-yellow-800 focus:bg-white focus:border-yellow-300 outline-none" value={rewardCoin} onChange={e => setRewardCoin(Number(e.target.value))} />
                             </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end gap-3 shrink-0">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <Save className="w-5 h-5" /> บันทึกเป้าหมาย
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

interface UpdateProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: Goal;
    onUpdate: (val: number) => void;
}

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({ isOpen, onClose, goal, onUpdate }) => {
    const [val, setVal] = useState(goal.currentValue);

    useEffect(() => { setVal(goal.currentValue); }, [goal, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(val);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative animate-in zoom-in-95 border-4 border-white ring-1 ring-gray-100">
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
                 
                 <div className="text-center mb-8">
                     <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner border-4 border-white ring-1 ring-indigo-100">
                         <RefreshCw className="w-10 h-10" />
                     </div>
                     <h3 className="text-2xl font-black text-gray-800">อัปเดตผลงาน</h3>
                     <p className="text-sm text-gray-500 mt-1 font-medium">{goal.title}</p>
                 </div>

                 <form onSubmit={handleSubmit} className="space-y-6">
                     <div className="relative">
                         <label className="text-[10px] font-black text-indigo-300 uppercase text-center block mb-2 tracking-widest">Current Value</label>
                         <input 
                            type="number" 
                            className="w-full text-center text-5xl font-black text-indigo-600 border-b-4 border-indigo-100 pb-2 focus:border-indigo-500 outline-none bg-transparent transition-colors placeholder:text-indigo-200"
                            value={val}
                            onChange={e => setVal(Number(e.target.value))}
                            autoFocus
                            placeholder="0"
                         />
                         <p className="text-center text-xs text-gray-400 mt-2 font-bold">จากเป้าหมาย {goal.targetValue.toLocaleString()}</p>
                     </div>
                     <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                         <Check className="w-5 h-5 stroke-[3px]" /> บันทึกยอดใหม่
                     </button>
                 </form>
            </div>
        </div>,
        document.body
    );
};
