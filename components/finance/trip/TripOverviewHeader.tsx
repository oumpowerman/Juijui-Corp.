
import React from 'react';
import { Target, DollarSign, Film, Sparkles, Plus, TrendingUp, BarChart3 } from 'lucide-react';

interface Props {
    analytics: any;
    onOpenCreate: () => void;
}

const TripOverviewHeader: React.FC<Props> = ({ analytics, onOpenCreate }) => {
    return (
        <div className="relative mb-8">
            {/* Soft Ambient Blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-sky-200/30 rounded-full blur-[100px] -ml-20 -mt-10 pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-200/20 rounded-full blur-[80px] -mr-10 -mb-10 pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Main Hero Card: Stunning Pastel Concept */}
                <div className="lg:col-span-7 bg-gradient-to-br from-sky-400/90 via-blue-400/90 to-teal-400/90 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-sky-100 relative overflow-hidden group border border-white/20">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000 ease-out">
                        <Sparkles className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold border border-white/30 mb-6 tracking-widest uppercase">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-200 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                Production Hub
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                                จัดการกองถ่าย
                            </h2>
                            <p className="text-sky-50 text-xl font-medium mt-2 opacity-90 italic">
                                ครบ จบ ในที่เดียว
                            </p>
                        </div>
                        
                        <div className="mt-10">
                            <button 
                                onClick={onOpenCreate}
                                className="group/btn flex items-center gap-3 bg-white text-sky-600 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-sky-200 hover:-translate-y-1 active:scale-95 transition-all duration-300 border-b-4 border-sky-100"
                            >
                                <Plus className="w-5 h-5 stroke-[3px] group-hover/btn:rotate-90 transition-transform duration-300" />
                                เปิดกองถ่ายใหม่
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Column */}
                <div className="lg:col-span-5 grid grid-cols-1 gap-4">
                    {/* Stat 1: Cost - Soft Emerald */}
                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[2.2rem] border-2 border-emerald-50 hover:border-emerald-200 shadow-sm hover:shadow-emerald-50 hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden">
                         <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                         <div className="flex justify-between items-center relative z-10">
                             <div>
                                <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-xs uppercase tracking-widest">
                                    <div className="p-2 bg-emerald-50 rounded-xl"><DollarSign className="w-4 h-4" /></div>
                                    งบประมาณรวม
                                </div>
                                <p className="text-3xl font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                                    ฿ {analytics.totalCost.toLocaleString()}
                                </p>
                             </div>
                             <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                                 <TrendingUp className="w-6 h-6 text-emerald-400" />
                             </div>
                         </div>
                    </div>

                    {/* Stat 2: Output - Soft Cyan */}
                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-[2.2rem] border-2 border-sky-50 hover:border-sky-200 shadow-sm hover:shadow-sky-50 hover:-translate-y-1.5 transition-all duration-500 group relative overflow-hidden">
                         <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-sky-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-700"></div>
                         <div className="flex justify-between items-center relative z-10">
                             <div>
                                <div className="flex items-center gap-2 mb-2 text-sky-500 font-bold text-xs uppercase tracking-widest">
                                    <div className="p-2 bg-sky-50 rounded-xl"><Film className="w-4 h-4" /></div>
                                    ผลผลิตคลิป
                                </div>
                                <p className="text-3xl font-bold text-slate-700 group-hover:text-sky-600 transition-colors">
                                    {analytics.totalVideos} <span className="text-base text-slate-300 font-medium">Clips</span>
                                </p>
                             </div>
                             <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center border border-sky-100">
                                 <BarChart3 className="w-6 h-6 text-sky-400" />
                             </div>
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TripOverviewHeader;
