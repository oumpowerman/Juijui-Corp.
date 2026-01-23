
import React from 'react';
import { MeetingLog, MeetingCategory } from '../../types';
import { Search, Trash2, Clock, Calendar, AlertTriangle, Zap, Coffee, Users, BrainCircuit } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface MeetingListSidebarProps {
    meetings: MeetingLog[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
}

const CATEGORY_ICONS: Record<MeetingCategory, any> = {
    GENERAL: Coffee,
    PROJECT: Zap,
    CRISIS: AlertTriangle,
    CREATIVE: BrainCircuit,
    HR: Users
};

const CATEGORY_COLORS: Record<MeetingCategory, string> = {
    GENERAL: 'bg-gray-100 text-gray-600',
    PROJECT: 'bg-orange-100 text-orange-600',
    CRISIS: 'bg-red-100 text-red-600',
    CREATIVE: 'bg-purple-100 text-purple-600',
    HR: 'bg-teal-100 text-teal-600'
};

const MeetingListSidebar: React.FC<MeetingListSidebarProps> = ({
    meetings, selectedId, onSelect, onDelete, searchQuery, setSearchQuery
}) => {
    
    // Fallback for meetings without category (legacy support)
    const getCategory = (m: MeetingLog): MeetingCategory => m.category || 'GENERAL';

    return (
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 bg-white">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาการประชุม..." 
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 outline-none bg-gray-50 focus:bg-white transition-all"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {meetings.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-sm flex flex-col items-center">
                        <Calendar className="w-10 h-10 mb-2 opacity-20" />
                        <p>ไม่พบรายการประชุม</p>
                    </div>
                )}

                {meetings.map(meeting => {
                    const cat = getCategory(meeting);
                    const Icon = CATEGORY_ICONS[cat];
                    const colorClass = CATEGORY_COLORS[cat];
                    const isSelected = selectedId === meeting.id;

                    return (
                        <div 
                            key={meeting.id} 
                            onClick={() => onSelect(meeting.id)}
                            className={`
                                p-3 rounded-xl cursor-pointer border transition-all hover:shadow-md group relative
                                ${isSelected 
                                    ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                                    : 'bg-white border-gray-200 hover:border-indigo-300'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${colorClass}`}>
                                    <Icon className="w-3 h-3" />
                                    {cat}
                                </span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }}
                                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <h4 className={`font-bold text-sm mb-1 line-clamp-2 ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                                {meeting.title || 'Untitled Meeting'}
                            </h4>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center text-xs text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {format(meeting.date, 'd MMM yyyy', { locale: th })}
                                </div>
                                {meeting.tags && meeting.tags.length > 0 && (
                                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[80px]">
                                        {meeting.tags[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MeetingListSidebar;
