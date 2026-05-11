
import React from 'react';
import { Search, TrendingUp, Download, Filter, Hash } from 'lucide-react';

interface AnalyticsHeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    platformFilter: string;
    setPlatformFilter: (filter: string) => void;
    channelFilter: string;
    setChannelFilter: (filter: string) => void;
    timeRange: string;
    setTimeRange: (range: string) => void;
    channels: any[];
}

const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({ 
    searchTerm, 
    setSearchTerm, 
    platformFilter, 
    setPlatformFilter,
    channelFilter,
    setChannelFilter,
    timeRange,
    setTimeRange,
    channels
}) => {
    return (
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider">
                        Enterprise Analytics
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">REAL-TIME INTELLIGENCE</span>
                </div>
                <h1 className="text-4xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="w-9 h-9 text-indigo-600" />
                    วิเคราะห์ข้อมูลคอนเทนต์
                </h1>
                <p className="text-slate-500 font-medium mt-2 max-w-md">เจาะลึกประสิทธิภาพรายช่องทางและแพลตฟอร์ม เพื่อยกระดับกลยุทธ์การผลิต</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="กรองรายการคอนเทนต์..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full sm:w-60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm outline-none text-sm font-medium"
                    />
                </div>

                {/* Channel Filter */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    <div className="pl-2 flex items-center gap-1.5 text-slate-400 pr-1 border-r border-slate-100">
                        <Hash className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">CHANNEL</span>
                    </div>
                    <select 
                        value={channelFilter}
                        onChange={(e) => setChannelFilter(e.target.value)}
                        className="pl-2 pr-8 py-1.5 bg-transparent font-semibold text-sm text-slate-700 outline-none appearance-none cursor-pointer min-w-[120px]"
                    >
                        <option value="ALL">เลือกทุกช่อง</option>
                        {channels.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.name}</option>
                        ))}
                    </select>
                </div>
                
                {/* Platform Filter */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    <div className="pl-2 flex items-center gap-1.5 text-slate-400 pr-1 border-r border-slate-100">
                        <Filter className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">PLATFORM</span>
                    </div>
                    <select 
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="pl-2 pr-8 py-1.5 bg-transparent font-semibold text-sm text-slate-700 outline-none appearance-none cursor-pointer min-w-[120px]"
                    >
                        <option value="ALL">ทุกช่องทาง</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="YOUTUBE">YouTube</option>
                    </select>
                </div>

                {/* Time Range Filter */}
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
                    <div className="pl-2 flex items-center gap-1.5 text-slate-500 pr-1 border-r border-slate-800">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">PERIOD</span>
                    </div>
                    <select 
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="pl-2 pr-8 py-1.5 bg-transparent font-semibold text-sm text-slate-100 outline-none appearance-none cursor-pointer min-w-[100px]"
                    >
                        <option value="7" className="text-slate-900">7 วันล่าสุด</option>
                        <option value="30" className="text-slate-900">30 วันล่าสุด</option>
                        <option value="90" className="text-slate-900">90 วันล่าสุด</option>
                        <option value="365" className="text-slate-900">1 ปีล่าสุด</option>
                        <option value="ALL" className="text-slate-900">ทั้งหมด</option>
                    </select>
                </div>

                <button className="h-10 w-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 active:scale-95 group">
                    <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default AnalyticsHeader;
