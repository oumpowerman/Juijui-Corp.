
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Building2, Search } from 'lucide-react';
import ClientFilterBar from './clients/ClientFilterBar';
import ClientDrillDownModal from './clients/ClientDrillDownModal';

interface ClientAnalyticsViewProps {
    data: any[];
    isLoading: boolean;
    channels: any[];
    onRefresh: (start: Date, end: Date) => void;
}

const ClientAnalyticsView: React.FC<ClientAnalyticsViewProps> = ({ data, isLoading, channels, onRefresh }) => {
    // Advanced Filter State
    const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedChannel, setSelectedChannel] = useState('ALL');
    const [selectedPlatform, setSelectedPlatform] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // Drill-Down State
    const [drillDownClient, setDrillDownClient] = useState<any | null>(null);

    // Trigger Refresh on Date Change
    useEffect(() => {
        onRefresh(startDate, endDate);
    }, [startDate, endDate]);

    // Data Transformation Logic (Applying Multi-dimension filters)
    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchesChannel = selectedChannel === 'ALL' || item.task?.channelId === selectedChannel;
            const matchesPlatform = selectedPlatform === 'ALL' || (item.task?.platforms?.includes(selectedPlatform));
            const matchesSearch = searchQuery === '' || 
                item.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.task?.title.toLowerCase().includes(searchQuery.toLowerCase());
            
            return matchesChannel && matchesPlatform && matchesSearch;
        });
    }, [data, selectedChannel, selectedPlatform, searchQuery]);

    if (isLoading && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Processing Advanced Attribution...</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Filter Suite */}
            <ClientFilterBar 
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                selectedChannel={selectedChannel} setSelectedChannel={setSelectedChannel}
                selectedPlatform={selectedPlatform} setSelectedPlatform={setSelectedPlatform}
                channels={channels}
            />

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total Realized Value</h4>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                        ฿{filteredData.reduce((acc, curr) => acc + curr.dealValue, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Campaign Reach</h4>
                    <p className="text-2xl font-bold text-slate-900 tracking-tight">
                        {filteredData.reduce((acc, curr) => acc + (curr.task?.views || 0), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Engagement Index</h4>
                    <p className="text-2xl font-bold text-emerald-600 tracking-tight">
                        {filteredData.reduce((acc, curr) => acc + (curr.task?.engagements || 0), 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Client Portfolio</h4>
                    <p className="text-2xl font-bold text-indigo-600 tracking-tight">
                        {new Set(filteredData.map(c => c.clientId)).size} Partners
                    </p>
                </div>
            </div>

            {/* Search & List */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
                <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                             <Search className="w-5 h-5" />
                        </div>
                        <div>
                             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Portfolio Analysis Matrix</h3>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click any row to drill down for deep intelligence</p>
                        </div>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Find by client or project name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-2xl px-12 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-80"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/20">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Identity</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investment</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visibility (Views)</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ROI Ratio</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? filteredData.map((item, idx) => (
                                <tr 
                                    key={idx} 
                                    onClick={() => setDrillDownClient(item.client)}
                                    className="hover:bg-indigo-50/30 cursor-pointer transition-all border-b border-slate-50 last:border-0 group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-100 group-hover:border-indigo-200">
                                                {item.client?.logoUrl ? (
                                                    <img src={item.client.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                                ) : (
                                                    <Building2 className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">
                                                    {item.client?.name || 'Unknown'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[200px]">
                                                    {item.task?.title}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-bold text-slate-900">฿{item.dealValue.toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-sm font-bold text-slate-600">{(item.task?.views || 0).toLocaleString()}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-emerald-600 capitalize">
                                                {((item.task?.engagements / (item.dealValue || 1)) * 100).toFixed(1)} impact
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="px-4 py-2 bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                                            Insight 
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold">
                                        No data matches your selection...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Drill Down Modal Section */}
            <AnimatePresence>
                {drillDownClient && (
                    <ClientDrillDownModal 
                        client={drillDownClient}
                        data={data}
                        channels={channels}
                        onClose={() => setDrillDownClient(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ClientAnalyticsView;

