
import React from 'react';
import { ScriptSummary, Channel, MasterOption } from '../../../types';
import { FileText, Trash2, Video, User as UserIcon, Users, PlayCircle, CheckCircle2, ListPlus, XCircle, Clock, Lightbulb, Tag, History, Search } from 'lucide-react';
import { format } from 'date-fns';

interface ScriptListProps {
    scripts: ScriptSummary[];
    layoutMode: 'GRID' | 'LIST';
    viewTab: 'QUEUE' | 'LIBRARY' | 'HISTORY';
    isLoading: boolean;
    channels: Channel[];
    masterOptions: MasterOption[];
    
    // Actions
    onOpen: (script: ScriptSummary) => void;
    onToggleQueue: (id: string, current: boolean) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void; 
    onDone: (id: string) => void;
}

const ScriptList: React.FC<ScriptListProps> = ({ 
    scripts, layoutMode, viewTab, isLoading, channels, masterOptions,
    onOpen, onToggleQueue, onDelete, onRestore, onDone 
}) => {

    const getChannelName = (id?: string) => channels.find(c => c.id === id)?.name;
    const getCategoryLabel = (key?: string) => masterOptions.find(o => o.type === 'SCRIPT_CATEGORY' && o.key === key)?.label;

    if (isLoading) {
        return (
            <div className="py-32 text-center text-gray-400 flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p>กำลังโหลดสคริปต์...</p>
            </div>
        );
    }

    if (scripts.length === 0) {
        return (
            <div className="col-span-full py-24 text-center text-gray-400 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
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
            <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                {scripts.map((script) => (
                    <div 
                        key={script.id}
                        onClick={() => onOpen(script)}
                        className={`
                            flex items-center gap-4 p-4 border-b border-gray-100 hover:bg-indigo-50/50 transition-colors cursor-pointer group last:border-b-0
                            ${viewTab === 'HISTORY' ? 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100' : ''}
                        `}
                    >
                        <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${script.scriptType === 'DIALOGUE' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                             {script.scriptType === 'DIALOGUE' ? <Users className="w-6 h-6"/> : <FileText className="w-6 h-6"/>}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="font-bold text-gray-800 text-base truncate group-hover:text-indigo-700 transition-colors">{script.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                     script.status === 'FINAL' ? 'bg-green-100 text-green-700 border-green-200' :
                                     script.status === 'DONE' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                     'bg-orange-100 text-orange-700 border-orange-200'
                                }`}>
                                    {script.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> {format(script.updatedAt, 'd MMM HH:mm')}</span>
                                {script.channelId && <span className="flex items-center text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{getChannelName(script.channelId)}</span>}
                                {script.category && <span className="flex items-center text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{getCategoryLabel(script.category)}</span>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {viewTab === 'LIBRARY' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onToggleQueue(script.id, false); }}
                                    className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl bg-indigo-50 border border-indigo-100 transition-all shadow-sm"
                                    title="Add to Queue"
                                >
                                    <ListPlus className="w-5 h-5" />
                                </button>
                            )}
                            {viewTab === 'QUEUE' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDone(script.id); }}
                                    className="p-2.5 text-green-600 hover:bg-green-100 rounded-xl bg-green-50 border border-green-100 transition-all shadow-sm"
                                    title="Mark Done"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </button>
                            )}
                            {viewTab === 'HISTORY' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRestore(script.id); }}
                                    className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-xl bg-indigo-50 border border-indigo-100 transition-all shadow-sm"
                                    title="Restore"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(script.id); }} 
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // --- GRID VIEW (Standard Map) ---
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {scripts.map(script => (
                <div 
                    key={script.id}
                    className={`bg-white rounded-3xl border p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col relative group h-[280px] ${viewTab === 'HISTORY' ? 'border-gray-200 opacity-80 hover:opacity-100' : 'border-gray-100'}`}
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                script.status === 'FINAL' ? 'bg-green-50 text-green-600 border-green-100' :
                                script.status === 'DONE' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                                'bg-orange-50 text-orange-600 border-orange-100 shadow-sm'
                            }`}>
                                {script.status}
                            </span>
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

                    <h3 onClick={() => onOpen(script)} className="font-black text-gray-800 text-xl mb-3 cursor-pointer hover:text-indigo-600 line-clamp-2 leading-tight transition-colors">
                        {script.title}
                    </h3>
                    
                    {/* Metadata Tags */}
                    <div className="flex flex-wrap gap-2 mb-auto content-start">
                        {script.category && (
                            <div className="flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                <FileText className="w-3 h-3 mr-1" /> {getCategoryLabel(script.category)}
                            </div>
                        )}
                        {script.ideaOwner && (
                            <div className="flex items-center text-[10px] text-yellow-700 font-bold bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-100">
                                <Lightbulb className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> By {script.ideaOwner.name.split(' ')[0]}
                            </div>
                        )}
                        {script.tags && script.tags.length > 0 && (
                            <div className="flex items-center text-[10px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                <Tag className="w-3 h-3 mr-1" /> {script.tags[0]}
                                {script.tags.length > 1 && ` +${script.tags.length - 1}`}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-400 font-bold">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {format(script.updatedAt, 'd MMM HH:mm')}
                        </div>
                        
                        {viewTab === 'LIBRARY' && (
                            <button 
                                onClick={() => onToggleQueue(script.id, false)}
                                className="flex items-center gap-1.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95"
                            >
                                <ListPlus className="w-4 h-4" />
                                เข้าคิวถ่าย
                            </button>
                        )}
                        {viewTab === 'QUEUE' && (
                             <button 
                                onClick={() => onDone(script.id)}
                                className="flex items-center gap-1.5 text-xs font-black text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl transition-all shadow-md shadow-green-100 active:scale-95"
                             >
                                <CheckCircle2 className="w-4 h-4" />
                                เสร็จแล้ว
                             </button>
                        )}
                        {viewTab === 'HISTORY' && (
                            <button 
                                onClick={() => onRestore(script.id)}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                                นำกลับมาใช้
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ScriptList;
