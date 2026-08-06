
import React, { useMemo, useState } from 'react';
import { MasterOption, Task, Channel } from '../../../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import StatCard from './StatCard';
import { Package, TrendingUp, AlertCircle, CheckCircle2, Target, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InventoryDashboardProps {
    tasks: Task[];
    masterOptions: MasterOption[];
    selectedChannel?: string;
    channels?: Channel[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ tasks, masterOptions, selectedChannel = 'ALL', channels = [] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const channel = channels.find(c => c.id === selectedChannel);
    const strategy = channel?.content_strategy;

    const pillarOptions = useMemo(() => {
        return masterOptions.filter(o => 
            o.type === 'PILLAR' && 
            o.isActive &&
            (selectedChannel === 'ALL' || o.parentKey === selectedChannel)
        );
    }, [masterOptions, selectedChannel]);

    const categoryOptions = useMemo(() => {
        const pillarKeys = pillarOptions.map(p => p.key);
        return masterOptions.filter(o => 
            o.type === 'CATEGORY' && 
            o.isActive &&
            (selectedChannel === 'ALL' || (o.parentKey && pillarKeys.includes(o.parentKey)))
        );
    }, [masterOptions, selectedChannel, pillarOptions]);

    // Data for Pillar Bar Chart
    const pillarData = pillarOptions.map(p => ({
        key: p.key,
        name: p.label,
        count: tasks.filter(t => t.pillar === p.key).length
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);

    // Data for Category Pie Chart
    const categoryData = categoryOptions.map(c => ({
        key: c.key,
        name: c.label,
        value: tasks.filter(t => t.category === c.key).length
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

    const totalStock = tasks.length;
    const topPillar = pillarData[0]?.name || '-';
    const topCategory = categoryData[0]?.name || '-';

    // Target vs Actual Analysis
    const strategyAnalysis = useMemo(() => {
        if (!strategy || totalStock === 0) return null;

        const analysis = strategy.pillars.map(sp => {
            const pillarDef = pillarOptions.find(p => p.key === sp.key);
            const actualCount = tasks.filter(t => t.pillar === sp.key).length;
            const actualPercentage = Math.round((actualCount / totalStock) * 100);
            const diff = actualPercentage - sp.targetPercentage;
            
            let status: 'PERFECT' | 'EXCESS' | 'DEFICIT' = 'PERFECT';
            if (diff > 5) status = 'EXCESS';
            else if (diff < -5) status = 'DEFICIT';

            const cats = sp.categories.map(sc => {
                const catDef = categoryOptions.find(c => c.key === sc.key);
                const actualCatCount = tasks.filter(t => t.pillar === sp.key && t.category === sc.key).length;
                const actualCatPercentage = actualCount > 0 ? Math.round((actualCatCount / actualCount) * 100) : 0;
                const catDiff = actualCatPercentage - sc.targetPercentage;

                let cStatus: 'PERFECT' | 'EXCESS' | 'DEFICIT' = 'PERFECT';
                if (catDiff > 10) cStatus = 'EXCESS';
                else if (catDiff < -10) cStatus = 'DEFICIT';

                return {
                    key: sc.key,
                    name: catDef?.label || sc.key,
                    target: sc.targetPercentage,
                    actual: actualCatPercentage,
                    diff: catDiff,
                    status: cStatus
                };
            });

            return {
                key: sp.key,
                name: pillarDef?.label || sp.key,
                target: sp.targetPercentage,
                actual: actualPercentage,
                diff,
                status,
                categories: cats
            };
        });

        return analysis;
    }, [strategy, tasks, totalStock, pillarOptions, categoryOptions]);

    return (
        <div className="space-y-6">
            {/* Info Notice Badge */}
            <motion.div 
                layout
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-indigo-50/40 border border-indigo-100 rounded-[1.5rem] p-4 flex items-start gap-3.5 cursor-pointer hover:bg-indigo-50/60 transition-colors select-none"
                id="stock-analytics-scope-info"
            >
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest flex flex-wrap items-center gap-2">
                            <span>ขอบเขตการวิเคราะห์คลังคอนเทนต์ (Stock Analytics Scope)</span>
                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100/40">
                                {isExpanded ? 'ย่อข้อมูล' : 'คลิกเพื่อดูทำไมตัวเลขไม่ตรงกัน'}
                            </span>
                        </h4>
                        <div className="text-indigo-500 shrink-0">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </div>
                    
                    <div className="relative overflow-hidden">
                        <AnimatePresence initial={false} mode="wait">
                            {!isExpanded ? (
                                <motion.p 
                                    key="collapsed"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="text-xs text-gray-500 font-medium truncate"
                                >
                                    แดชบอร์ดนี้วิเคราะห์เฉพาะ "งานในคลังที่ยังไม่ได้จัดลงปฏิทิน" (is_unscheduled = true) และ "ยังทำไม่เสร็จ"...
                                </motion.p>
                            ) : (
                                <motion.p 
                                    key="expanded"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="text-xs text-gray-600 leading-relaxed font-medium pt-1"
                                >
                                    แดชบอร์ดนี้วิเคราะห์เฉพาะ <strong className="text-indigo-600 font-bold">"งานในคลังที่ยังไม่ได้จัดลงปฏิทิน" (is_unscheduled = true)</strong> และ <strong className="text-indigo-600 font-bold">"ยังทำไม่เสร็จ" (Active Only)</strong> เท่านั้น โดยคัดแยกงานที่เป็นของแคมเปญหลัก, งานที่เสร็จสมบูรณ์แล้ว (Done / Approve) และงานที่ผูกลงวันที่เรียบร้อยออกไป เพื่อให้คุณจัดหมวดหมู่เนื้อหาหมุนเวียนได้แม่นยำที่สุด จำนวนจึงแตกต่างกับจำนวนงานทั้งหมดในระบบด้านนอก
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Stock" 
                    value={totalStock} 
                    icon={Package} 
                    colorClass="bg-indigo-500" 
                    subtitle="Active Stock Only"
                />
                <StatCard 
                    title="Top Pillar" 
                    value={topPillar} 
                    icon={TrendingUp} 
                    colorClass="bg-blue-500" 
                    subtitle="Most Content"
                />
                <StatCard 
                    title="Top Category" 
                    value={topCategory} 
                    icon={CheckCircle2} 
                    colorClass="bg-emerald-500" 
                    subtitle="Most Variety"
                />
                <StatCard 
                    title="Health Status" 
                    value={totalStock > 20 ? 'Good' : 'Low'} 
                    icon={AlertCircle} 
                    colorClass={totalStock > 20 ? 'bg-green-500' : 'bg-orange-500'} 
                    subtitle="Inventory"
                />
            </div>

            {strategyAnalysis && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-6">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" /> Target vs Actual Analysis
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">เทียบสัดส่วนเป้าหมายกับจำนวนที่มีจริงใน Stock</p>

                    <div className="space-y-6">
                        {strategyAnalysis.map((pa, idx) => (
                            <div key={pa.key} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${pa.status === 'EXCESS' ? 'bg-red-500' : pa.status === 'DEFICIT' ? 'bg-orange-500' : 'bg-green-500'}`} />
                                        <div>
                                            <h4 className="font-bold text-gray-800">{pa.name}</h4>
                                            <p className="text-xs font-bold text-gray-400">
                                                Target: {pa.target}% <ArrowRight className="inline w-3 h-3 mx-1" /> Actual: {pa.actual}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white border border-gray-200">
                                        {pa.status === 'EXCESS' && <span className="text-red-500">🛑 ล้นสต๊อก! (ควรหยุดเติม)</span>}
                                        {pa.status === 'DEFICIT' && <span className="text-orange-500">⚠️ ขาดหาย (ควรหาไอเดียเพิ่ม)</span>}
                                        {pa.status === 'PERFECT' && <span className="text-green-500">✅ สัดส่วนสมบูรณ์แบบ</span>}
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-gray-300 border-r border-white/50"
                                        style={{ width: `${pa.target}%` }}
                                        title={`Target: ${pa.target}%`}
                                    />
                                    <div 
                                        className={`absolute top-0 left-0 h-full opacity-80 ${pa.status === 'EXCESS' ? 'bg-red-500' : pa.status === 'DEFICIT' ? 'bg-orange-500' : 'bg-green-500'}`}
                                        style={{ width: `${pa.actual}%` }}
                                        title={`Actual: ${pa.actual}%`}
                                    />
                                </div>

                                {/* Categories Analysis */}
                                {pa.categories.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {pa.categories.map(ca => (
                                            <div key={ca.key} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100">
                                                <span className="text-[10px] font-bold text-gray-600 truncate mr-2">{ca.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400">{ca.target}% vs {ca.actual}%</span>
                                                    {ca.status === 'EXCESS' && <span className="text-[10px] text-red-500 font-black">↓ ลด</span>}
                                                    {ca.status === 'DEFICIT' && <span className="text-[10px] text-orange-500 font-black">↑ เพิ่ม</span>}
                                                    {ca.status === 'PERFECT' && <span className="text-[10px] text-green-500 font-black">✓ พอดี</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pillar Distribution Chart */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Pillar Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pillarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                                    {pillarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Distribution Chart */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Category Breakdown</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend */}
                        <div className="w-1/3 space-y-2 pr-4">
                            {categoryData.slice(0, 5).map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-gray-500 truncate max-w-[80px]">{entry.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-800">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;
