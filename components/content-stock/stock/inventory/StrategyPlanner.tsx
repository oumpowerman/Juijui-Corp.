import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../lib/supabase';
import { Channel, MasterOption, ChannelStrategy } from '../../../../types';
import { Save, AlertCircle, Target, CheckCircle2, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../../context/ToastContext';

interface StrategyPlannerProps {
    channels: Channel[];
    selectedChannel: string;
    setSelectedChannel: (channelId: string) => void;
    masterOptions: MasterOption[];
}

const StrategyPlanner: React.FC<StrategyPlannerProps> = ({ channels, selectedChannel, setSelectedChannel, masterOptions }) => {
    const { showToast } = useToast();
    const channel = channels.find(c => c.id === selectedChannel);
    const [strategy, setStrategy] = useState<ChannelStrategy | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter master options
    const pillarOptions = masterOptions.filter(m => m.type === 'CONTENT_PILLAR' && m.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(m => m.type === 'CONTENT_CATEGORY' && m.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

    useEffect(() => {
        if (channel) {
            if (channel.content_strategy) {
                // We do a deep copy to avoid mutating the prop directly
                setStrategy(JSON.parse(JSON.stringify(channel.content_strategy)));
            } else {
                // Initialize empty strategy
                setStrategy({ pillars: [] });
            }
        } else {
            setStrategy(null);
        }
    }, [channel]);

    if (!channel) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4 font-sans max-w-3xl mx-auto">
                <div className="text-center max-w-md mb-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-100/50 shadow-sm">
                        <Target className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">เลือกช่องเพื่อวางแผน</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        การวางแผนสัดส่วนคอนเทนต์ (Content Strategy) จะกำหนดแยกกันเป็นรายช่อง เพื่อเปรียบเทียบสัดส่วนเสาหลัก (Pillars) และหมวดหมู่ (Categories) ได้อย่างแม่นยำ
                    </p>
                </div>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {channels.map((ch) => {
                        const hasStrategy = ch.content_strategy && ch.content_strategy.pillars.length > 0;
                        return (
                            <button
                                key={ch.id}
                                onClick={() => setSelectedChannel(ch.id)}
                                className="group relative bg-white p-6 rounded-3xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 text-left transition-all duration-300"
                            >
                                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                                    {hasStrategy ? (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                            มีแผนแล้ว
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                            ยังไม่มีแผน
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3.5 mb-3">
                                    <div 
                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm shrink-0"
                                        style={{ backgroundColor: ch.color || '#6366f1' }}
                                    />
                                    <h4 className="font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                                        {ch.name}
                                    </h4>
                                </div>

                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                    {ch.description || 'ไม่มีคำอธิบายสำหรับช่องทางนี้'}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (!strategy) return null;

    const totalPillarPercentage = strategy.pillars.reduce((sum, p) => sum + p.targetPercentage, 0);
    const isPillarValid = totalPillarPercentage === 100;

    const handleAddPillar = (pillarKey: string) => {
        if (strategy.pillars.find(p => p.key === pillarKey)) return;
        setStrategy({
            ...strategy,
            pillars: [...strategy.pillars, { key: pillarKey, targetPercentage: 0, categories: [] }]
        });
    };

    const handleRemovePillar = (pillarKey: string) => {
        setStrategy({
            ...strategy,
            pillars: strategy.pillars.filter(p => p.key !== pillarKey)
        });
    };

    const handleUpdatePillar = (pillarKey: string, value: number) => {
        setStrategy({
            ...strategy,
            pillars: strategy.pillars.map(p => p.key === pillarKey ? { ...p, targetPercentage: value } : p)
        });
    };

    const handleAddCategory = (pillarKey: string, categoryKey: string) => {
        setStrategy({
            ...strategy,
            pillars: strategy.pillars.map(p => {
                if (p.key === pillarKey) {
                    if (p.categories.find(c => c.key === categoryKey)) return p;
                    return {
                        ...p,
                        categories: [...p.categories, { key: categoryKey, targetPercentage: 0 }]
                    };
                }
                return p;
            })
        });
    };

    const handleRemoveCategory = (pillarKey: string, categoryKey: string) => {
        setStrategy({
            ...strategy,
            pillars: strategy.pillars.map(p => {
                if (p.key === pillarKey) {
                    return {
                        ...p,
                        categories: p.categories.filter(c => c.key !== categoryKey)
                    };
                }
                return p;
            })
        });
    };

    const handleUpdateCategory = (pillarKey: string, categoryKey: string, value: number) => {
        setStrategy({
            ...strategy,
            pillars: strategy.pillars.map(p => {
                if (p.key === pillarKey) {
                    return {
                        ...p,
                        categories: p.categories.map(c => c.key === categoryKey ? { ...c, targetPercentage: value } : c)
                    };
                }
                return p;
            })
        });
    };

    const getPillarLabel = (key: string) => pillarOptions.find(p => p.key === key)?.label || key;
    const getCategoryLabel = (key: string) => categoryOptions.find(c => c.key === key)?.label || key;

    const saveStrategy = async () => {
        if (!isPillarValid) {
            showToast('Pillar target percentage must total 100%', 'error');
            return;
        }

        // Validate categories within each pillar
        for (const p of strategy.pillars) {
            if (p.categories.length > 0) {
                const catTotal = p.categories.reduce((sum, c) => sum + c.targetPercentage, 0);
                if (catTotal !== 100) {
                    showToast(`Categories in "${getPillarLabel(p.key)}" must total 100%`, 'error');
                    return;
                }
            }
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('channels')
                .update({ content_strategy: strategy })
                .eq('id', channel.id);

            if (error) throw error;
            showToast('Strategy saved successfully', 'success');
            
            // Mutate local prop so it updates without refresh
            channel.content_strategy = strategy;
        } catch (err: any) {
            console.error('Error saving strategy:', err);
            showToast('Failed to save strategy: ' + err.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10 font-sans">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            Content Strategy Planner
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                            วางแผนสัดส่วนคอนเทนต์สำหรับ {channel.name}
                        </p>
                    </div>
                    <button
                        onClick={saveStrategy}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-200"
                    >
                        {isSaving ? <span className="animate-spin text-lg">↻</span> : <Save className="w-4 h-4" />}
                        Save Strategy
                    </button>
                </div>

                {/* Overall Pillar Progress */}
                <div className="mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Pillar Allocation</span>
                        <span className={`text-sm font-black ${isPillarValid ? 'text-green-500' : 'text-red-500'}`}>
                            {totalPillarPercentage}% / 100%
                        </span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden flex">
                        {strategy.pillars.map((p, i) => {
                            const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];
                            const color = colors[i % colors.length];
                            return (
                                <motion.div 
                                    key={p.key}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${p.targetPercentage}%` }}
                                    className={`h-full ${color}`}
                                    title={`${getPillarLabel(p.key)}: ${p.targetPercentage}%`}
                                />
                            );
                        })}
                    </div>
                    {!isPillarValid && (
                        <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ยอดรวมต้องเท่ากับ 100% พอดี
                        </p>
                    )}
                </div>

                {/* Add Pillar Button */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {pillarOptions.filter(opt => !strategy.pillars.find(p => p.key === opt.key)).map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => handleAddPillar(opt.key)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-lg text-xs font-bold transition-colors border border-gray-200"
                        >
                            + Add {opt.label}
                        </button>
                    ))}
                </div>

                {/* Pillar Configuration */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {strategy.pillars.map((pillar) => {
                            const catTotal = pillar.categories.reduce((sum, c) => sum + c.targetPercentage, 0);
                            const isCatValid = pillar.categories.length === 0 || catTotal === 100;
                            const availableCats = categoryOptions.filter(opt => !pillar.categories.find(c => c.key === opt.key));

                            return (
                                <motion.div 
                                    key={pillar.key}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border border-gray-200 rounded-2xl overflow-hidden"
                                >
                                    {/* Pillar Header */}
                                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-800">{getPillarLabel(pillar.key)}</h4>
                                                <button onClick={() => handleRemovePillar(pillar.key)} className="text-gray-400 hover:text-red-500 text-xs">Remove</button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-1/2">
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={pillar.targetPercentage}
                                                onChange={(e) => handleUpdatePillar(pillar.key, parseInt(e.target.value) || 0)}
                                                className="flex-1 accent-indigo-600"
                                            />
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={pillar.targetPercentage || ''}
                                                    onChange={(e) => handleUpdatePillar(pillar.key, parseInt(e.target.value) || 0)}
                                                    className="w-16 px-2 py-1 text-center font-black text-indigo-600 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <span className="absolute right-2 top-1.5 text-xs font-bold text-gray-400">%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Categories inside Pillar */}
                                    <div className="p-4 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <SlidersHorizontal className="w-3 h-3" /> Categories Breakdown
                                            </span>
                                            {pillar.categories.length > 0 && (
                                                <span className={`text-xs font-bold ${isCatValid ? 'text-green-500' : 'text-red-500'}`}>
                                                    Total: {catTotal}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            {pillar.categories.map((cat) => (
                                                <div key={cat.key} className="flex items-center gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                                                    <div className="flex-1 flex justify-between items-center">
                                                        <span className="text-sm font-semibold text-gray-700">{getCategoryLabel(cat.key)}</span>
                                                        <button onClick={() => handleRemoveCategory(pillar.key, cat.key)} className="text-gray-400 hover:text-red-500 text-[10px] uppercase font-bold tracking-widest">Remove</button>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-1/2">
                                                        <input 
                                                            type="range" 
                                                            min="0" 
                                                            max="100" 
                                                            value={cat.targetPercentage}
                                                            onChange={(e) => handleUpdateCategory(pillar.key, cat.key, parseInt(e.target.value) || 0)}
                                                            className="flex-1 accent-emerald-500"
                                                        />
                                                        <div className="relative">
                                                            <input 
                                                                type="number"
                                                                value={cat.targetPercentage || ''}
                                                                onChange={(e) => handleUpdateCategory(pillar.key, cat.key, parseInt(e.target.value) || 0)}
                                                                className="w-14 px-1 py-1 text-center text-sm font-bold text-emerald-600 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {availableCats.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => handleAddCategory(pillar.key, opt.key)}
                                                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-gray-500 hover:text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors border border-gray-200 border-dashed"
                                                >
                                                    + {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {strategy.pillars.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
                            <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-500">No Pillars Configured</p>
                            <p className="text-xs text-gray-400 mt-1">Add a content pillar to start planning your strategy.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StrategyPlanner;
