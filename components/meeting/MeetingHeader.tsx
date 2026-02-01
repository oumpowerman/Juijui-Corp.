
import React, { useState } from 'react';
import { Calendar, Check, Hash, Copy, ClipboardCheck, Plus, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { MeetingCategory, User, MasterOption } from '../../types';
import AttendeeSelectorModal from './AttendeeSelectorModal';

interface MeetingHeaderProps {
    title: string;
    setTitle: (val: string) => void;
    onBlurTitle: () => void;
    
    date: Date;
    setDate: (val: Date) => void;
    onBlurDate: (val: Date) => void;

    category: MeetingCategory;
    setCategory: (val: MeetingCategory) => void;
    onBlurCategory: (val: MeetingCategory) => void;

    projectTag: string;
    setProjectTag: (val: string) => void;
    onBlurTag: (val: string) => void;

    attendees: string[];
    onToggleAttendee: (id: string) => void;
    onUpdateAttendees?: (ids: string[]) => void;

    users: User[];
    masterOptions: MasterOption[];
    
    isExpanded: boolean;
    onToggleExpand: () => void;
    
    isCopied: boolean;
    onCopySummary: () => void;
}

// Fallback if Master Data is empty
const DEFAULT_CATEGORIES: { key: string, label: string, color: string }[] = [
    { key: 'GENERAL', label: 'General Talk', color: 'bg-slate-100 text-slate-600 border-slate-200' },
    { key: 'PROJECT', label: 'Project Update', color: 'bg-orange-50 text-orange-600 border-orange-200' },
];

const MeetingHeader: React.FC<MeetingHeaderProps> = ({
    title, setTitle, onBlurTitle,
    date, setDate, onBlurDate,
    category, setCategory, onBlurCategory,
    projectTag, setProjectTag, onBlurTag,
    attendees, onToggleAttendee, onUpdateAttendees,
    users, masterOptions,
    isExpanded, onToggleExpand,
    isCopied, onCopySummary
}) => {
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    
    // 1. Resolve Categories
    const categoryOptions = masterOptions
        .filter(o => o.type === 'MEETING_CATEGORY' && o.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
    
    const availableCategories = categoryOptions.length > 0 ? categoryOptions : DEFAULT_CATEGORIES;

    // 2. Find Current Active Category Style
    const currentCatOption = availableCategories.find(c => c.key === category) || availableCategories[0];
    const colorClass = currentCatOption?.color || 'bg-gray-100 text-gray-600';
    
    const themeColorKey = colorClass.split(' ')[0].replace('bg-', '').replace('-50', '').replace('-100', '') || 'indigo';

    const dateValue = isValid(date) ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    const handleBatchUpdateAttendees = (newIds: string[]) => {
        if (onUpdateAttendees) {
            onUpdateAttendees(newIds);
        } else {
             // Fallback: If no batch update prop, try to toggle one by one (inefficient but safe)
             // But actually, we should rely on onUpdateAttendees being passed from parent
             console.warn("onUpdateAttendees prop missing");
        }
    };

    return (
        <div className={`px-6 py-5 border-b border-gray-100 flex flex-col gap-4 relative bg-white/80 backdrop-blur-md shadow-sm z-20 shrink-0`}>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <input 
                            type="text" 
                            className={`text-2xl md:text-3xl font-hand font-bold flex-1 w-full outline-none bg-transparent border-b-2 border-transparent focus:border-${themeColorKey}-300 transition-colors placeholder:text-gray-300 text-gray-800 leading-[1.8] py-2`}
                            placeholder="หัวข้อการประชุม..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onBlur={onBlurTitle}
                        />
                        </div>
                </div>
                
                <div className="flex gap-2 shrink-0 items-start">
                    <button 
                        onClick={onToggleExpand}
                        className={`p-2.5 rounded-2xl transition-all shadow-sm active:scale-95 border-2 ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                        title={isExpanded ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
                    >
                        {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    <button 
                        onClick={onCopySummary}
                        className={`p-2.5 rounded-2xl transition-all shadow-sm active:scale-95 border-2 ${isCopied ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                        title="คัดลอกสรุป"
                    >
                        {isCopied ? <ClipboardCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 relative z-20">
                <div className="flex items-center text-xs font-bold text-gray-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group cursor-pointer">
                    <Calendar className={`w-3.5 h-3.5 mr-2 text-${themeColorKey}-400`} />
                    <input 
                        type="date" 
                        className="bg-transparent outline-none font-bold text-gray-600 cursor-pointer group-hover:text-indigo-600 uppercase"
                        value={dateValue}
                        onChange={e => {
                            const val = e.target.value;
                            if (!val) return;
                            const [y, m, d] = val.split('-').map(Number);
                            const newDate = new Date(y, m - 1, d);
                            if (isValid(newDate)) {
                                setDate(newDate);
                                onBlurDate(newDate);
                            }
                        }}
                    />
                </div>

                <div className="relative group">
                    <button className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm border ${colorClass}`}>
                        {currentCatOption?.label}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                    </button>
                    <div className="absolute left-0 top-full pt-2 w-52 hidden group-hover:block z-[60]">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
                            <p className="text-[9px] text-gray-400 font-bold px-2 mb-1">เลือกประเภท</p>
                            {availableCategories.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => { setCategory(opt.key as MeetingCategory); onBlurCategory(opt.key as MeetingCategory); }}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 flex items-center justify-between transition-colors mb-1 ${category === opt.key ? 'text-gray-900 bg-gray-50' : 'text-gray-500'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${(opt.color || '').split(' ')[0]}`}></span> 
                                        {opt.label}
                                    </span>
                                    {category === opt.key && <Check className="w-3 h-3 text-green-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={`flex items-center text-xs px-3 py-1.5 rounded-xl border transition-all shadow-sm group focus-within:ring-2 focus-within:ring-${themeColorKey}-100 ${projectTag ? `bg-${themeColorKey}-50 border-${themeColorKey}-100 text-${themeColorKey}-700` : 'bg-white border-gray-200 text-gray-400'}`}>
                    <Hash className={`w-3.5 h-3.5 mr-1 ${projectTag ? `text-${themeColorKey}-500` : 'text-gray-300'}`} />
                    <input 
                        type="text" 
                        className={`bg-transparent outline-none font-bold w-24 focus:w-40 transition-all placeholder:text-gray-300 text-xs ${projectTag ? `text-${themeColorKey}-800` : 'text-gray-600'}`}
                        placeholder="Project Tag..."
                        value={projectTag}
                        onChange={e => setProjectTag(e.target.value)}
                        onBlur={() => onBlurTag(projectTag)}
                    />
                </div>

                {/* Attendees Section */}
                <div className="flex items-center gap-2 ml-auto">
                    <div 
                        className="flex -space-x-3 hover:space-x-1 transition-all duration-300 p-1 cursor-pointer" 
                        onClick={() => setIsAttendeeModalOpen(true)}
                    >
                        {attendees.map(uid => {
                            const u = users.find(user => user.id === uid);
                            return u ? <img key={uid} src={u.avatarUrl} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 object-cover shadow-sm hover:scale-110 transition-transform hover:z-10" title={u.name} /> : null;
                        })}
                        <div className="relative z-20">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsAttendeeModalOpen(true);
                                }}
                                className="w-9 h-9 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all shadow-sm group"
                                title="จัดการผู้เข้าร่วม"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Attendee Modal */}
            <AttendeeSelectorModal 
                isOpen={isAttendeeModalOpen}
                onClose={() => setIsAttendeeModalOpen(false)}
                users={users}
                selectedIds={attendees}
                onConfirm={handleBatchUpdateAttendees}
            />
        </div>
    );
};

export default MeetingHeader;
