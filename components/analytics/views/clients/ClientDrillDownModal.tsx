
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, TrendingUp, BarChart3, Target, PieChart } from 'lucide-react';

interface ClientDrillDownModalProps {
    client: any;
    data: any[];
    onClose: () => void;
    channels: any[];
}

const ClientDrillDownModal: React.FC<ClientDrillDownModalProps> = ({ client, data, onClose, channels }) => {
    // Calculate Client Specific Stats
    const stats = useMemo(() => {
        const clientContent = data.filter(d => d.clientId === client.id);
        const totalInvestment = clientContent.reduce((acc, curr) => acc + curr.dealValue, 0);
        const totalEngagements = clientContent.reduce((acc, curr) => acc + (curr.task?.engagements || 0), 0);
        const totalViews = clientContent.reduce((acc, curr) => acc + (curr.task?.views || 0), 0);
        
        // Group by Channel
        const channelPerformance: any = {};
        clientContent.forEach(c => {
            const chId = c.task?.channelId || 'unknown';
            if (!channelPerformance[chId]) {
                const channel = channels.find(ch => ch.id === chId);
                const channelName = channel?.name || 'Unknown Channel';
                const logoUrl = channel?.logoUrl || null;
                channelPerformance[chId] = { name: channelName, logoUrl, investment: 0, engagement: 0, count: 0 };
            }
            channelPerformance[chId].investment += c.dealValue;
            channelPerformance[chId].engagement += (c.task?.engagements || 0);
            channelPerformance[chId].count++;
        });

        return {
            totalInvestment,
            totalEngagements,
            totalViews,
            cpe: totalEngagements > 0 ? totalInvestment / totalEngagements : 0,
            channelBreakdown: Object.values(channelPerformance)
        };
    }, [data, client.id, channels]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-5xl bg-[#fdfdfe] rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="px-10 py-8 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-slate-100 p-3 flex items-center justify-center shadow-inner">
                            {client.logoUrl ? (
                                <img src={client.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                                <Building2 className="w-8 h-8 text-slate-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Brand Intelligence Report</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 group transition-all"
                    >
                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Performance Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                             <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-indigo-600" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total Investment</span>
                             </div>
                             <p className="text-xl font-bold text-indigo-900">฿{stats.totalInvestment.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100">
                             <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-4 h-4 text-emerald-600" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Growth Views</span>
                             </div>
                             <p className="text-xl font-bold text-emerald-900">{stats.totalViews.toLocaleString()}</p>
                        </div>
                        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100">
                             <div className="flex items-center gap-2 mb-2">
                                <PieChart className="w-4 h-4 text-amber-600" />
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Total Action</span>
                             </div>
                             <p className="text-xl font-bold text-amber-900">{stats.totalEngagements.toLocaleString()}</p>
                        </div>
                        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                             <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-rose-600" />
                                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Efficiency Index</span>
                             </div>
                             <p className="text-xl font-bold text-rose-900">฿{stats.cpe.toFixed(2)} / Eng</p>
                        </div>
                    </div>

                    {/* Attribution Table (Channel Breakdown) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Channel Attribution Analysis</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(stats.channelBreakdown as any[]).map((ch, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors overflow-hidden border border-slate-100">
                                                {ch.logoUrl ? (
                                                    <img src={ch.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <Tv className="w-5 h-5" />
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{ch.name}</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {ch.count} Projects
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Investment Share</span>
                                            <span className="text-sm font-bold text-slate-900">฿{ch.investment.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(ch.investment / stats.totalInvestment) * 100}%` }}
                                                className="h-full bg-indigo-500 rounded-full"
                                            />
                                        </div>
                                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                                             <span className="text-[10px] font-bold text-slate-400 uppercase">ROI Ratio</span>
                                             <span className="text-xs font-bold text-emerald-600">
                                                {((ch.engagement / (ch.investment || 1)) * 100).toFixed(1)}x Impact
                                             </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="px-10 py-6 bg-slate-50 border-t border-slate-100">
                    <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                        Data synchronized with real-time analytics engine • {new Date().toLocaleDateString()}
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

const Tv = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
);

export default ClientDrillDownModal;
