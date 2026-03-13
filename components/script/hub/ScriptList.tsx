
import React from 'react';
import { ScriptSummary, Channel, MasterOption, User } from '../../../types';
import { FileText, Trash2, Clock, ListPlus, CheckCircle2, Search, Tag, RotateCcw, ArrowRightLeft, User as UserIcon, Users, Layers, AlignLeft, List, Eye, Check, MonitorPlay } from 'lucide-react';
import { format } from 'date-fns';

import { ScriptHubMode } from './ScriptModeSwitcher';

interface ScriptListProps {
    scripts: ScriptSummary[];
    layoutMode: 'GRID' | 'LIST';
    viewTab: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    isLoading: boolean;
    channels: Channel[];
    masterOptions: MasterOption[];
    mode?: ScriptHubMode; // NEW
    
    // Actions
    onOpen: (script: ScriptSummary) => void;
    onToggleQueue: (id: string, current: boolean) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void; 
    onDone: (id: string) => void;
    onTogglePersonal?: (id: string, current: boolean) => void; // NEW
}

const ScriptList: React.FC<ScriptListProps> = React.memo(({ 
    scripts, layoutMode, viewTab, isLoading, channels, masterOptions, mode = 'HUB',
    onOpen, onToggleQueue, onDelete, onRestore, onDone, onTogglePersonal
}) => {
    const isStudio = mode === 'STUDIO';

    const [sortConfig, setSortConfig] = React.useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const sortedScripts = React.useMemo(() => {
        if (!sortConfig) return scripts;
        return [...scripts].sort((a, b) => {
            let aVal: any;
            let bVal: any;

            if (sortConfig.key === 'title') {
                aVal = a.title;
                bVal = b.title;
            } else if (sortConfig.key === 'author') {
                aVal = a.author?.name || '';
                bVal = b.author?.name || '';
            } else if (sortConfig.key === 'status') {
                aVal = a.status;
                bVal = b.status;
            } else {
                return 0;
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [scripts, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name;
    const getCategoryLabel = (key?: string) => masterOptions.find(o => o.type === 'SCRIPT_CATEGORY' && o.key === key)?.label;

    const renderStatusBadge = (status: string) => {
        const config: any = {
            DRAFT: { label: 'Draft', icon: List, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
            REVIEW: { label: 'Review', icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
            FINAL: { label: 'Final', icon: Check, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            SHOOTING: { label: 'Shooting', icon: isStudio ? 'text-indigo-700' : 'text-rose-700', bg: isStudio ? 'bg-indigo-50' : 'bg-rose-50', border: isStudio ? 'border-indigo-200' : 'border-rose-200' },
            DONE: { label: 'Done', icon: CheckCircle2, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
        }[status] || { label: status, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };

        const Icon = config.icon;

        return (
            <span className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm w-full max-w-[90px] ${config.bg} ${config.color} ${config.border}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const premiumStyles = (
        <style>{`
            .premium-3d-card {
                background: ${isStudio 
                    ? 'linear-gradient(135deg, rgba(239, 246, 255, 0.9) 0%, rgba(245, 243, 255, 0.8) 100%)' 
                    : 'linear-gradient(135deg, rgba(236, 239, 255, 0.9) 0%, rgba(255, 245, 255, 0.8) 100%)'};
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.6);
                box-shadow: 
                    0 10px 20px -5px rgba(0, 0, 0, 0.05),
                    0 4px 6px -2px rgba(0, 0, 0, 0.02),
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.8);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .premium-3d-card:hover {
                transform: translateY(-6px) scale(1.01);
                box-shadow: 
                    0 20px 40px -10px ${isStudio ? 'rgba(79, 70, 229, 0.12)' : 'rgba(99, 102, 241, 0.12)'},
                    0 10px 20px -5px rgba(0, 0, 0, 0.05);
                border-color: ${isStudio ? 'rgba(79, 70, 229, 0.2)' : 'rgba(99, 102, 241, 0.2)'};
            }
            .glossy-shine-card {
                position: relative;
                overflow: hidden;
            }
            .glossy-shine-card::after {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(
                    45deg,
                    transparent 0%,
                    rgba(255, 255, 255, 0.1) 45%,
                    rgba(255, 255, 255, 0.3) 50%,
                    rgba(255, 255, 255, 0.1) 55%,
                    transparent 100%
                );
                transform: rotate(30deg);
                transition: all 0.8s ease;
                opacity: 0;
                pointer-events: none;
            }
            .glossy-shine-card:hover::after {
                left: 100%;
                opacity: 1;
            }
            .pastel-border-indigo { border-color: rgba(129, 140, 248, 0.2); }
            .pastel-border-rose { border-color: rgba(251, 113, 133, 0.2); }
        `}</style>
    );

    if (isLoading) {
        return (
            <div className="py-32 text-center text-gray-400 flex flex-col items-center">
                {premiumStyles}
                <div className={`w-8 h-8 border-4 rounded-full animate-spin mb-4 ${isStudio ? 'border-indigo-200 border-t-indigo-600' : 'border-rose-200 border-t-rose-600'}`}></div>
                <p>กำลังโหลดสคริปต์...</p>
            </div>
        );
    }

    if (scripts.length === 0) {
        return (
            <div className="col-span-full py-24 text-center text-gray-400 bg-white/80 backdrop-blur-md rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center shadow-lg premium-3d-card">
                {premiumStyles}
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <Search className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">ไม่พบสคริปต์ในหน้านี้</h3>
                <p className="max-w-xs text-sm">ลองเปลี่ยนตัวกรอง หรือสร้างสคริปต์ใหม่ได้เลย</p>
            </div>
        );
    }

    // --- LIST VIEW (Standard Mapping) ---
    if (layoutMode === 'LIST') {
        return (
            <div className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-gray-200 overflow-hidden shadow-xl flex flex-col relative z-10 premium-3d-card">
                {premiumStyles}
                <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-200 hidden md:grid grid-cols-12 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <div className={`col-span-6 cursor-pointer flex items-center gap-1 transition-colors ${isStudio ? 'hover:text-indigo-600' : 'hover:text-rose-600'}`} onClick={() => handleSort('title')}>
                        Script Details {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className={`col-span-2 cursor-pointer flex items-center gap-1 transition-colors ${isStudio ? 'hover:text-indigo-600' : 'hover:text-rose-600'}`} onClick={() => handleSort('author')}>
                        Creator {sortConfig?.key === 'author' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className={`col-span-2 text-center cursor-pointer flex items-center justify-center gap-1 transition-colors ${isStudio ? 'hover:text-indigo-600' : 'hover:text-rose-600'}`} onClick={() => handleSort('status')}>
                        Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {sortedScripts.map((script) => (
                    <div 
                        key={script.id}
                        onClick={() => onOpen(script)}
                        className={`
                            grid grid-cols-12 items-start gap-4 p-4 border-b transition-colors cursor-pointer group last:border-b-0
                            ${isStudio ? 'border-indigo-100 hover:bg-indigo-50/30' : 'border-rose-100 hover:bg-rose-50/30'}
                            ${viewTab === 'HISTORY' ? 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                        `}
                    >
                        {/* Title & Meta & Desc */}
                        <div className="col-span-12 md:col-span-6 flex gap-3 min-w-0">
                            <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border font-black text-[10px] ${script.scriptType === 'DIALOGUE' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                 {script.scriptType === 'DIALOGUE' ? 'DIAL' : 'MONO'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold text-gray-800 text-md truncate transition-colors ${isStudio ? 'group-hover:text-indigo-700' : 'group-hover:text-rose-700'}`}>{script.title}</h3>
                                </div>
                                
                                {script.objective && (
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 mb-1.5 flex items-center">
                                        <AlignLeft className="w-3 h-3 mr-1 opacity-50" /> {script.objective}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-400">
                                    {/* Channel */}
                                    {script.channelId && (
                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-600 font-bold">
                                            {getChannelName(script.channelId)}
                                        </span>
                                    )}
                                    {/* Category */}
                                    {script.category && (
                                        <span className={`flex items-center px-1.5 py-0.5 rounded border font-medium ${isStudio ? 'text-indigo-500 bg-indigo-50 border-indigo-100' : 'text-rose-500 bg-rose-50 border-rose-100'}`}>
                                            <Layers className="w-2.5 h-2.5 mr-1" />
                                            {getCategoryLabel(script.category)}
                                        </span>
                                    )}
                                    {/* Tags */}
                                    {script.tags && script.tags.length > 0 && (
                                        <span className={`flex items-center px-1.5 py-0.5 rounded border font-medium ${isStudio ? 'text-sky-500 bg-sky-50 border-sky-100' : 'text-pink-500 bg-pink-50 border-pink-100'}`}>
                                            <Tag className="w-2.5 h-2.5 mr-1" />
                                            {script.tags.slice(0, 2).join(', ')}
                                            {script.tags.length > 2 && ` +${script.tags.length - 2}`}
                                        </span>
                                    )}
                                    
                                    <span className="text-gray-300 ml-1">•</span>
                                    <span>{format(script.updatedAt, 'd MMM')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Creator */}
                        <div className="hidden md:flex col-span-2 items-center gap-2 pt-1">
                            {script.ideaOwnerId !== script.authorId ? (
                                <div className="flex items-center gap-1.5">
                                    <div className="flex -space-x-2">
                                        {/* Idea Owner */}
                                        <div className="relative z-10">
                                            {script.ideaOwner?.avatarUrl ? (
                                                <img src={script.ideaOwner.avatarUrl} className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" title={`Owner: ${script.ideaOwner.name}`} />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-[10px] border-2 border-white shadow-sm" title={`Owner: ${script.ideaOwner?.name}`}>
                                                    {script.ideaOwner?.name?.[0] || <UserIcon className="w-3 h-3"/>}
                                                </div>
                                            )}
                                        </div>
                                        {/* Author */}
                                        <div className="relative z-0">
                                            {script.author?.avatarUrl ? (
                                                <img src={script.author.avatarUrl} className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" title={`Writer: ${script.author.name}`} />
                                            ) : (
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border-2 border-white shadow-sm ${isStudio ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`} title={`Writer: ${script.author?.name}`}>
                                                    {script.author?.name?.[0] || <UserIcon className="w-3 h-3"/>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className={`text-[8px] font-black uppercase leading-none ${isStudio ? 'text-indigo-400' : 'text-rose-400'}`}>Owner → Writer</span>
                                        <span className="text-[10px] font-bold text-gray-600 truncate max-w-[70px] leading-tight">
                                            {script.ideaOwner?.name.split(' ')[0]} → {script.author?.name.split(' ')[0]}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="relative">
                                        {script.author?.avatarUrl ? (
                                            <img src={script.author.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white shadow-md ${isStudio ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {script.author?.name?.[0] || <UserIcon className="w-4 h-4"/>}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 truncate max-w-[80px]">{script.author?.name?.split(' ')[0]}</span>
                                </>
                            )}
                        </div>
                        
                        {/* Status */}
                        <div className="hidden md:flex col-span-2 pt-1 justify-center">
                             {renderStatusBadge(script.status)}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex col-span-2 items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                            {viewTab === 'LIBRARY' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleQueue(script.id, false); }}
                                    className={`p-2 rounded-lg bg-white border border-gray-200 shadow-sm transition-colors ${isStudio ? 'text-indigo-600 hover:bg-indigo-100' : 'text-rose-600 hover:bg-rose-100'}`}
                                    title="Add to Queue"
                                >
                                    <ListPlus className="w-4 h-4" />
                                </button>
                            )}
                            {viewTab === 'QUEUE' && (
                                <>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onToggleQueue(script.id, true); }}
                                        className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg bg-white border border-gray-200 shadow-sm transition-colors"
                                        title="Return to Library"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDone(script.id); }}
                                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg bg-white border border-gray-200 shadow-sm transition-colors"
                                        title="Mark Done"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                            {onTogglePersonal && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onTogglePersonal(script.id, script.isPersonal || false); }}
                                    className={`p-2 rounded-lg bg-white border border-gray-200 shadow-sm transition-colors ${script.isPersonal ? 'text-indigo-600 hover:bg-indigo-50' : 'text-rose-600 hover:bg-rose-50'}`}
                                    title={script.isPersonal ? 'Publish to Hub' : 'Make Personal'}
                                >
                                    {script.isPersonal ? <Users className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(script.id); }} 
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // --- GRID VIEW (Standard Map) ---
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
            {premiumStyles}
            {sortedScripts.map(script => (
                <div 
                    key={script.id}
                    className={`rounded-[2rem] border p-5 shadow-lg transition-all flex flex-col relative group min-h-[280px] premium-3d-card glossy-shine-card ${isStudio ? 'hover:border-indigo-300' : 'hover:border-rose-300'} ${viewTab === 'HISTORY' ? 'border-gray-200 opacity-80 hover:opacity-100 grayscale-[0.5] hover:grayscale-0' : 'border-gray-100'}`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-2 items-center">
                            {renderStatusBadge(script.status)}
                            {script.isPersonal && (
                                <span className={`px-2 py-1 rounded-lg border font-bold text-[10px] flex items-center gap-1 ${isStudio ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    <UserIcon className="w-3 h-3" /> Personal
                                </span>
                            )}
                            {script.channelId && (
                                <span className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-200 font-bold max-w-[100px] truncate">
                                    {getChannelName(script.channelId)}
                                </span>
                            )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(script.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    <h3 onClick={() => onOpen(script)} className={`font-black text-gray-800 text-lg mb-2 cursor-pointer line-clamp-2 leading-tight transition-colors ${isStudio ? 'hover:text-indigo-600' : 'hover:text-rose-600'}`}>
                        {script.title}
                    </h3>
                    
                    {/* Objective / Desc */}
                    {script.objective && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed font-medium bg-gray-50/50 p-2 rounded-xl border border-gray-50">
                            {script.objective}
                        </p>
                    )}
                    
                    {/* Metadata Tags */}
                    <div className="flex flex-wrap gap-2 mb-auto content-start">
                        {script.category && (
                            <div className={`flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${isStudio ? 'text-indigo-600 bg-indigo-50 border-indigo-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                                <Layers className="w-3 h-3 mr-1" /> {getCategoryLabel(script.category)}
                            </div>
                        )}
                        {script.tags && script.tags.length > 0 && (
                            <div className={`flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${isStudio ? 'text-sky-600 bg-sky-50 border-sky-100' : 'text-pink-600 bg-pink-50 border-pink-100'}`}>
                                <Tag className="w-3 h-3 mr-1" /> 
                                {script.tags.slice(0, 2).join(', ')}
                                {script.tags.length > 2 && ` +${script.tags.length - 2}`}
                            </div>
                        )}
                    </div>

                    {/* Footer Area */}
                    <div className="mt-4 pt-4 border-t border-gray-50">
                        
                        {/* Prominent Creator Badge */}
                        <div className="flex items-center justify-between mb-3">
                             {script.ideaOwnerId !== script.authorId ? (
                                 <div className={`flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border shadow-sm w-fit ${isStudio ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' : 'bg-gradient-to-r from-amber-50 to-indigo-50 border-amber-100'}`}>
                                    <div className="flex -space-x-2">
                                         <img src={script.ideaOwner?.avatarUrl} className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-md bg-gray-200 relative z-10" title={`Owner: ${script.ideaOwner?.name}`} />
                                         <img src={script.author?.avatarUrl} className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-md bg-gray-200 relative z-0" title={`Writer: ${script.author?.name}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-black uppercase leading-none ${isStudio ? 'text-blue-500' : 'text-amber-500'}`}>Owner → Writer</span>
                                        <span className="text-[10px] font-bold text-gray-700 leading-none">
                                            {script.ideaOwner?.name.split(' ')[0]} → {script.author?.name.split(' ')[0]}
                                        </span>
                                    </div>
                                 </div>
                             ) : (
                                 <div className={`flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border shadow-sm w-fit ${isStudio ? 'bg-gradient-to-r from-indigo-50 to-white border-indigo-50' : 'bg-gradient-to-r from-rose-50 to-white border-rose-50'}`}>
                                    <div className="relative">
                                         <img src={script.author?.avatarUrl} className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-md bg-gray-200" />
                                         <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${isStudio ? 'bg-indigo-400' : 'bg-green-400'}`}></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[8px] font-bold uppercase leading-none ${isStudio ? 'text-indigo-400' : 'text-rose-400'}`}>Created by</span>
                                        <span className="text-[10px] font-bold text-gray-700 leading-none">{script.author?.name.split(' ')[0]}</span>
                                    </div>
                                 </div>
                             )}
                             
                             <span className="text-[10px] text-gray-400 font-bold flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                                <Clock className="w-3 h-3 mr-1"/> {format(script.updatedAt, 'd MMM')}
                             </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2">
                            {onTogglePersonal && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onTogglePersonal(script.id, script.isPersonal || false); }}
                                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all active:scale-95 border ${script.isPersonal ? (isStudio ? 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100' : 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100') : (isStudio ? 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100' : 'text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-100')}`}
                                >
                                    {script.isPersonal ? <Users className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                    {script.isPersonal ? 'Publish' : 'Personal'}
                                </button>
                            )}
                            {viewTab === 'LIBRARY' && (
                                <button 
                                    onClick={() => onToggleQueue(script.id, false)}
                                    className={`flex items-center gap-1.5 text-xs font-black text-white px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 w-full justify-center ${isStudio ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'}`}
                                >
                                    <ListPlus className="w-4 h-4" />
                                    เข้าคิวถ่าย
                                </button>
                            )}
                            {viewTab === 'QUEUE' && (
                                 <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={() => onToggleQueue(script.id, true)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all active:scale-95"
                                        title="เอาออกจากคิว"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        คืนคลัง
                                    </button>
                                    <button 
                                        onClick={() => onDone(script.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-green-100 active:scale-95"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        เสร็จแล้ว
                                    </button>
                                 </div>
                            )}
                            {viewTab === 'HISTORY' && (
                                <button 
                                    onClick={() => onRestore(script.id)}
                                    className={`flex items-center justify-center w-full gap-1.5 text-xs font-bold py-2 rounded-xl transition-colors ${isStudio ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100' : 'text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100'}`}
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5" /> นำกลับมาใช้
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

export default ScriptList;
