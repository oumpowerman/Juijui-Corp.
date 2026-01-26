
import React, { useState, useMemo } from 'react';
import { MeetingLog, MeetingCategory } from '../../types';
import { Search, Trash2, Clock, Calendar as CalendarIcon, AlertTriangle, Zap, Coffee, Users, BrainCircuit, ChevronLeft, ChevronRight, Filter, User, MoreVertical } from 'lucide-react';
import { format, isSameMonth, isSameDay, endOfMonth, eachDayOfInterval, isToday, addMonths, isFuture, isPast } from 'date-fns';

interface MeetingListSidebarProps {
    meetings: MeetingLog[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    currentUser?: any; // To filter "My Meetings"
}

const CATEGORY_ICONS: Record<MeetingCategory, any> = {
    GENERAL: Coffee,
    PROJECT: Zap,
    CRISIS: AlertTriangle,
    CREATIVE: BrainCircuit,
    HR: Users
};

const CATEGORY_STYLES: Record<MeetingCategory, { bg: string, text: string, border: string, shadow: string }> = {
    GENERAL: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', shadow: 'shadow-slate-100' },
    PROJECT: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', shadow: 'shadow-orange-100' },
    CRISIS: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', shadow: 'shadow-red-100' },
    CREATIVE: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', shadow: 'shadow-purple-100' },
    HR: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', shadow: 'shadow-teal-100' }
};

type ViewTab = 'UPCOMING' | 'HISTORY';

const MeetingListSidebar: React.FC<MeetingListSidebarProps> = ({
    meetings, selectedId, onSelect, onDelete, searchQuery, setSearchQuery, currentUser
}) => {
    // --- State ---
    const [viewTab, setViewTab] = useState<ViewTab>('UPCOMING');
    const [currentNavDate, setCurrentNavDate] = useState(new Date()); // For Calendar Navigation
    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Specific day filter
    const [filterCategory, setFilterCategory] = useState<MeetingCategory | 'ALL'>('ALL');
    const [showCalendar, setShowCalendar] = useState(true);

    // --- Helpers ---
    const getCategory = (m: MeetingLog): MeetingCategory => m.category || 'GENERAL';

    // --- Calendar Logic ---
    const monthStart = new Date(currentNavDate.getFullYear(), currentNavDate.getMonth(), 1);
    const monthEnd = endOfMonth(currentNavDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startOffset = monthStart.getDay(); // Calculate start day offset (0 = Sunday)
    
    // Find days with meetings
    const meetingDays = useMemo(() => {
        const days = new Set<string>();
        meetings.forEach(m => days.add(format(m.date, 'yyyy-MM-dd')));
        return days;
    }, [meetings]);

    // --- Filter Logic ---
    const filteredMeetings = useMemo(() => {
        let filtered = meetings.filter(m => {
            // 1. Search Query
            const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
            // 2. Category
            const matchCat = filterCategory === 'ALL' || getCategory(m) === filterCategory;
            // 3. Date Selection (If calendar day selected)
            const matchDate = selectedDate ? isSameDay(m.date, selectedDate) : true;
            
            return matchSearch && matchCat && matchDate;
        });

        // 4. Tab Split (Upcoming vs History)
        // Note: If a specific date is selected, we ignore the tab split to show everything on that day
        if (!selectedDate) {
            const today = new Date();
            today.setHours(0,0,0,0);
            
            if (viewTab === 'UPCOMING') {
                // Future or Today
                filtered = filtered.filter(m => {
                    const mDate = new Date(m.date);
                    mDate.setHours(0,0,0,0);
                    return mDate >= today;
                }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ascending (Soonest first)
            } else {
                // Past
                filtered = filtered.filter(m => {
                    const mDate = new Date(m.date);
                    mDate.setHours(0,0,0,0);
                    return mDate < today;
                }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Descending (Newest history first)
            }
        } else {
             // If date selected, sort by creation time or alphabetical
             filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return filtered;
    }, [meetings, searchQuery, filterCategory, selectedDate, viewTab]);

    // --- Grouping Logic (For History) ---
    const groupedMeetings = useMemo(() => {
        if (selectedDate || viewTab === 'UPCOMING') return null; // No grouping for single day or upcoming
        
        const groups: Record<string, MeetingLog[]> = {};
        filteredMeetings.forEach(m => {
            const key = format(m.date, 'MMMM yyyy'); // e.g. "October 2023"
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });
        return groups;
    }, [filteredMeetings, selectedDate, viewTab]);


    // --- Renderers ---
    const renderMeetingItem = (meeting: MeetingLog) => {
        const cat = getCategory(meeting);
        const Icon = CATEGORY_ICONS[cat];
        const style = CATEGORY_STYLES[cat];
        const isSelected = selectedId === meeting.id;

        return (
            <div 
                key={meeting.id} 
                onClick={() => onSelect(meeting.id)}
                className={`
                    relative p-4 mb-3 rounded-2xl cursor-pointer transition-all duration-300 group border
                    ${isSelected 
                        ? `bg-white border-${style.text.split('-')[1]}-400 shadow-lg scale-[1.02] z-10 ring-1 ring-${style.text.split('-')[1]}-100` 
                        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                    }
                `}
            >
                {/* Left Accent Bar */}
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${isSelected ? style.bg.replace('bg-', 'bg-') : 'bg-transparent'} ${style.text.replace('text-', 'bg-')}`}></div>

                <div className="pl-3">
                    {/* Header: Date & Category */}
                    <div className="flex justify-between items-center mb-2">
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1.5 ${style.bg} ${style.text} border ${style.border}`}>
                            <Icon className="w-3 h-3" />
                            {cat}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {format(meeting.date, 'd MMM')}
                        </div>
                    </div>

                    {/* Title */}
                    <h4 className={`font-bold text-sm mb-2 line-clamp-2 leading-snug ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                        {meeting.title || 'Untitled Meeting'}
                    </h4>

                    {/* Footer: Stats & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                         <div className="flex items-center gap-2">
                            {/* Tags */}
                            {meeting.tags.length > 0 && (
                                <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-medium">
                                    #{meeting.tags[0]}
                                </span>
                            )}
                            {/* Attendees */}
                            {meeting.attendees.length > 0 && (
                                <div className="flex -space-x-1">
                                    {meeting.attendees.slice(0,3).map((_, i) => (
                                        <div key={i} className="w-4 h-4 rounded-full bg-gray-200 border border-white"></div>
                                    ))}
                                    {meeting.attendees.length > 3 && <div className="text-[8px] text-gray-400 ml-1">+{meeting.attendees.length - 3}</div>}
                                </div>
                            )}
                         </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(meeting.id); }}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            title="ลบบันทึก"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-80 bg-[#f8fafc] border-r border-gray-200 flex flex-col h-full shrink-0">
            
            {/* 1. Search & Filter Header */}
            <div className="p-4 bg-white border-b border-gray-100 space-y-3 shadow-sm z-10">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ค้นหาบันทึก..." 
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Main Tabs */}
                <div className="bg-gray-100 p-1 rounded-xl flex font-bold text-xs relative">
                     {/* Active Indicator Slider logic could go here for polish, but standard toggle is fine */}
                    <button 
                        onClick={() => { setViewTab('UPCOMING'); setSelectedDate(null); }}
                        className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${viewTab === 'UPCOMING' && !selectedDate ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        นัดหมาย <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${viewTab === 'UPCOMING' && !selectedDate ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>{meetings.filter(m => isFuture(m.date) || isToday(m.date)).length}</span>
                    </button>
                    <button 
                        onClick={() => { setViewTab('HISTORY'); setSelectedDate(null); }}
                        className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${viewTab === 'HISTORY' && !selectedDate ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        ประวัติเก่า
                    </button>
                </div>
            </div>
            
            {/* 2. Mini Calendar (Expandable) */}
            <div className={`bg-white border-b border-gray-100 overflow-hidden transition-all duration-300 ${showCalendar ? 'max-h-[300px]' : 'max-h-0'}`}>
                <div className="px-4 pb-4 pt-2">
                    <div className="flex justify-between items-center mb-3">
                        <button onClick={() => setCurrentNavDate(addMonths(currentNavDate, -1))} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><ChevronLeft className="w-4 h-4"/></button>
                        <span className="text-sm font-black text-gray-800">{format(currentNavDate, 'MMMM yyyy')}</span>
                        <button onClick={() => setCurrentNavDate(addMonths(currentNavDate, 1))} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><ChevronRight className="w-4 h-4"/></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['S','M','T','W','T','F','S'].map((d, i) => <span key={i} className="text-[9px] text-gray-400 font-bold uppercase">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {/* Add empty slots to align first day of month correctly */}
                        {Array.from({ length: startOffset }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {daysInMonth.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const hasMeeting = meetingDays.has(dateStr);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const isCurrent = isToday(day);

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(isSelected ? null : day)}
                                    className={`
                                        h-8 rounded-xl text-xs font-medium flex items-center justify-center relative transition-all
                                        ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'hover:bg-gray-50 text-gray-600'}
                                        ${!isSameMonth(day, currentNavDate) ? 'opacity-20' : ''}
                                        ${isCurrent && !isSelected ? 'text-indigo-600 font-bold border border-indigo-100 bg-indigo-50' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                    {hasMeeting && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-400"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Calendar Toggle Bar */}
            <button 
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full py-1.5 flex items-center justify-center bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/50 transition-colors"
            >
                {showCalendar ? 'ซ่อนปฏิทิน' : 'แสดงปฏิทิน'}
            </button>

            {/* 3. Category Filter Chips */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <button 
                    onClick={() => setFilterCategory('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all ${filterCategory === 'ALL' ? 'bg-gray-800 text-white border-gray-800 shadow' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                >
                    ทั้งหมด
                </button>
                {Object.keys(CATEGORY_STYLES).map(key => {
                    const catKey = key as MeetingCategory;
                    const style = CATEGORY_STYLES[catKey];
                    const activeClass = `${style.bg} ${style.text} ${style.border} shadow-sm`;
                    
                    return (
                        <button
                            key={key}
                            onClick={() => setFilterCategory(catKey)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all ${filterCategory === key ? activeClass : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}
                        >
                            {key}
                        </button>
                    );
                })}
            </div>
            
            {/* 4. Scrollable List Area */}
            <div className="flex-1 overflow-y-auto p-3 bg-[#f8fafc]">
                {filteredMeetings.length === 0 ? (
                    <div className="text-center py-16 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                            <CalendarIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="text-gray-500 font-bold text-sm">ไม่พบการประชุม</h4>
                        {viewTab === 'UPCOMING' && <p className="text-xs text-gray-400 mt-1">กด + ด้านบนเพื่อเริ่มนัดหมาย</p>}
                    </div>
                ) : (
                    <>
                        {groupedMeetings ? (
                            // Grouped View (For History)
                            Object.keys(groupedMeetings).map(group => (
                                <div key={group} className="mb-6">
                                    <div className="flex items-center gap-2 mb-3 px-1">
                                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{group}</span>
                                        <div className="h-px bg-gray-200 flex-1"></div>
                                    </div>
                                    <div>
                                        {groupedMeetings[group].map(m => renderMeetingItem(m))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Flat View (For Upcoming or Single Date)
                            <div className="space-y-1">
                                {selectedDate && (
                                    <div className="flex justify-between items-center mb-3 px-2">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                            Filter: {format(selectedDate, 'd MMM yyyy')}
                                        </span>
                                        <button onClick={() => setSelectedDate(null)} className="text-[10px] text-gray-400 hover:text-red-500 underline">Clear</button>
                                    </div>
                                )}
                                {filteredMeetings.map(m => renderMeetingItem(m))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MeetingListSidebar;
