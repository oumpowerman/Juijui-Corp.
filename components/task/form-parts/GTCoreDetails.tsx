
import React, { useState, useRef, useEffect } from 'react';
import { Flag, Activity, FileText, ChevronDown, Check, Zap, Coffee, Leaf, Flame } from 'lucide-react';
import { Priority, MasterOption, User } from '../../../types';

interface GTCoreDetailsProps {
    description: string;
    setDescription: (val: string) => void;
    priority: Priority;
    setPriority: (val: Priority) => void;
    status: string;
    setStatus: (val: string) => void;
    taskStatusOptions: MasterOption[];
    currentUser?: User;
}

const PRIORITY_CONFIG: Record<string, { label: string, color: string, icon: any, ring: string }> = {
    LOW: { label: 'ชิวๆ (Low)', color: 'bg-slate-100 text-slate-600', icon: Leaf, ring: 'ring-slate-200' },
    MEDIUM: { label: 'ทั่วไป (Medium)', color: 'bg-blue-50 text-blue-600', icon: Coffee, ring: 'ring-blue-200' },
    HIGH: { label: 'ด่วน (High)', color: 'bg-orange-50 text-orange-600', icon: Zap, ring: 'ring-orange-200' },
    URGENT: { label: 'ไฟลุก (Urgent)', color: 'bg-red-50 text-red-600', icon: Flame, ring: 'ring-red-200' },
};

const GTCoreDetails: React.FC<GTCoreDetailsProps> = ({ 
    description, setDescription, priority, setPriority, status, setStatus, taskStatusOptions, currentUser 
}) => {
    
    const [isPriorityOpen, setIsPriorityOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    const priorityRef = useRef<HTMLDivElement>(null);
    const statusRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
                setIsPriorityOpen(false);
            }
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Priority Render Helpers
    const currentPrio = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
    const PrioIcon = currentPrio.icon;

    // Status Render Helpers
    const currentStatusOpt = taskStatusOptions.find(o => o.key === status);
    const statusColorClass = currentStatusOpt?.color || 'bg-gray-100 text-gray-600';

    return (
        <div className="space-y-6">
            
            {/* Description Box (Pastel Style) */}
            <div className="group bg-indigo-50/30 p-5 rounded-[2rem] border-2 border-indigo-50 focus-within:bg-white focus-within:border-indigo-200 focus-within:shadow-lg focus-within:shadow-indigo-100/50 transition-all duration-300 relative">
                <label className="block text-[13px] font-black text-indigo-400 mb-2 uppercase tracking-widest flex items-center gap-1 group-focus-within:text-indigo-600 transition-colors">
                    <FileText className="w-3 h-3" /> รายละเอียด (Details)
                </label>
                <div className="absolute top-4 right-4 opacity-10 pointer-events-none group-focus-within:opacity-20 transition-opacity">
                    <FileText className="w-16 h-16 text-indigo-600 rotate-12" />
                </div>
                <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={4} 
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-700 placeholder:text-indigo-300/60 resize-none outline-none leading-relaxed relative z-10" 
                    placeholder="พิมพ์รายละเอียดงานแบบเจาะลึกที่นี่..." 
                />
            </div>

            {/* Selectors Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                 
                {/* 1. Priority Custom Dropdown */}
                <div className="relative z-30" ref={priorityRef}>
                    <label className="block text-[13px] font-black text-slate-600 uppercase mb-2 ml-1 tracking-tight">ความเร่งด่วน</label>
                    <button
                        type="button"
                        onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                        className={`w-full flex items-center justify-between p-2.5 pl-3 rounded-2xl border-2 transition-all duration-300 active:scale-95 group ${isPriorityOpen ? `border-transparent ring-4 ${currentPrio.ring}` : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${currentPrio.color}`}>
                                <PrioIcon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className={`font-black text-base ${currentPrio.color.split(' ')[1]}`}>{currentPrio.label.split('(')[0]}</span>
                            </div>
                        </div>
                        <div className="pr-3 text-gray-300 group-hover:text-gray-500 transition-colors">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isPriorityOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isPriorityOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-gray-100 p-2 animate-in fade-in zoom-in-95 slide-in-from-top-2">
                            {Object.entries(PRIORITY_CONFIG).map(([key, conf]) => {
                                const Icon = conf.icon;
                                const isSelected = priority === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => { setPriority(key as Priority); setIsPriorityOpen(false); }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 transition-all ${isSelected ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${conf.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>{conf.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-green-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Status Custom Dropdown */}
                <div className="relative z-20" ref={statusRef}>
                    <label className="block text-[13px] font-black text-slate-600 uppercase mb-2 ml-1 tracking-tight">สถานะงาน</label>
                    <button
                        type="button"
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className={`w-full flex items-center justify-between p-2 pl-3 rounded-2xl border-2 transition-all duration-300 active:scale-95 group shadow-sm ${isStatusOpen ? 'border-indigo-400 ring-4 ring-indigo-50 bg-white' : 'border-indigo-100 hover:border-indigo-300 bg-indigo-50/30'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white text-indigo-600 shadow-md border border-indigo-50 group-hover:animate-wiggle transition-transform">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div className="text-left overflow-hidden">
                                <div className="flex items-center gap-2">
                                     {/* Status Dot */}
                                     <div className={`w-3 h-3 rounded-full shadow-inner animate-pulse ${statusColorClass.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                     <span className="font-black text-base text-slate-900 truncate tracking-tight">{currentStatusOpt?.label || status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pr-3 text-indigo-300 group-hover:text-indigo-500 transition-colors">
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {isStatusOpen && (
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-2 animate-in fade-in zoom-in-95 slide-in-from-top-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                            {taskStatusOptions.map(opt => {
                                const isSelected = status === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() => { setStatus(opt.key); setIsStatusOpen(false); }}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Color Pill */}
                                            <div className={`w-3 h-8 rounded-full ${isSelected ? 'bg-white/40' : opt.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                            <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-700'}`}>{opt.label}</span>
                                        </div>
                                        {isSelected && <Check className="w-5 h-5 text-white" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GTCoreDetails;
