
import React, { useState, useRef, useEffect } from 'react';
import { MasterOption, Channel } from '../../../types';
import { Activity, ChevronDown, Check, Hash, Tv } from 'lucide-react';

interface CFStatusChannelProps {
    status: string;
    setStatus: (val: string) => void;
    channelId: string;
    setChannelId: (val: string) => void;
    statusOptions: MasterOption[];
    channels: Channel[];
}

const CFStatusChannel: React.FC<CFStatusChannelProps> = ({ 
    status, setStatus, channelId, setChannelId, statusOptions, channels 
}) => {
    // UI State for Custom Dropdowns
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isChannelOpen, setIsChannelOpen] = useState(false);

    // Refs for Click Outside
    const statusRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<HTMLDivElement>(null);

    // Helper: Find Current Objects
    const currentStatusOpt = statusOptions.find(o => o.key === status);
    const currentChannel = channels.find(c => c.id === channelId);

    // Helper: Extract Base Color for Gradient Logic (e.g. 'bg-blue-100' -> 'blue')
    const getThemeColor = (colorClass: string = '') => {
        const match = colorClass.match(/bg-(\w+)-/);
        return match ? match[1] : 'slate';
    };

    // Click Outside Handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
            if (channelRef.current && !channelRef.current.contains(event.target as Node)) {
                setIsChannelOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Visual Config for Active Status
    const statusTheme = getThemeColor(currentStatusOpt?.color);
    const activeStatusClass = currentStatusOpt 
        ? `bg-${statusTheme}-500 text-white shadow-${statusTheme}-200` // Solid Vibrant Color
        : 'bg-slate-800 text-white shadow-slate-200';

    return (
        <div className="flex flex-col md:flex-row gap-4 relative z-40">
            
            {/* --- 1. STATUS COMMAND BUTTON --- */}
            <div className="relative flex-1" ref={statusRef}>
                <button
                    type="button"
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={`
                        w-full h-[60px] rounded-2xl flex items-center justify-between px-4 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5
                        ${activeStatusClass}
                    `}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col items-start text-left min-w-0">
                            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Current Status</span>
                            <span className="text-lg font-black truncate w-full leading-none">
                                {currentStatusOpt?.label || 'Select Status'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-white/70 transition-transform duration-300 ${isStatusOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Status Dropdown Menu */}
                {isStatusOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-left max-h-[300px] overflow-y-auto p-2">
                        <p className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">Change Workflow Stage</p>
                        {statusOptions.map((opt) => {
                            const isSelected = status === opt.key;
                            // Use the lighter color class from master data for the list
                            return (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => { setStatus(opt.key); setIsStatusOpen(false); }}
                                    className={`
                                        w-full flex items-center justify-between px-4 py-3 rounded-xl mb-1 transition-all
                                        ${isSelected ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full ${opt.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-green-500" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* --- 2. CHANNEL SELECTOR (Logo Based) --- */}
            <div className="relative md:w-5/12" ref={channelRef}>
                 <button
                    type="button"
                    onClick={() => setIsChannelOpen(!isChannelOpen)}
                    className={`
                        w-full h-[60px] bg-white border-2 rounded-2xl flex items-center justify-between px-4 transition-all hover:border-indigo-300 hover:shadow-md
                        ${isChannelOpen ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-gray-100'}
                    `}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {/* Logo / Icon */}
                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {currentChannel?.logoUrl ? (
                                <img src={currentChannel.logoUrl} alt={currentChannel.name} className="w-full h-full object-cover" />
                            ) : (
                                <Tv className="w-5 h-5 text-gray-400" />
                            )}
                        </div>
                        
                        <div className="flex flex-col items-start text-left min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Channel</span>
                            <span className="text-sm font-bold text-gray-800 truncate w-full">
                                {currentChannel?.name || 'Select Channel'}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Channel Dropdown Menu */}
                {isChannelOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-left max-h-[300px] overflow-y-auto p-2">
                        <p className="text-[10px] font-bold text-gray-400 px-3 py-2 uppercase tracking-wider">Select Brand / Show</p>
                        {channels.map((ch) => {
                            const isSelected = channelId === ch.id;
                            return (
                                <button
                                    key={ch.id}
                                    type="button"
                                    onClick={() => { setChannelId(ch.id); setIsChannelOpen(false); }}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl mb-1 transition-all group
                                        ${isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-600'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                             {ch.logoUrl ? (
                                                <img src={ch.logoUrl} alt={ch.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-black text-gray-300">{ch.name.substring(0,2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold truncate">{ch.name}</span>
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CFStatusChannel;
