
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Tag, Users, Maximize2, Minimize2, Copy, Check, ChevronDown, X } from 'lucide-react';
import { MeetingCategory, User, MasterOption } from '../../types';
import AttendeesModal from './AttendeesModal';
import MeetingTagInput from './MeetingTagInput';

interface MeetingHeaderProps {
    title: string;
    setTitle: (val: string) => void;
    onBlurTitle: () => void;
    date: Date;
    setDate: (val: Date) => void;
    onBlurDate: (d: Date) => void;
    category: MeetingCategory;
    setCategory: (val: MeetingCategory) => void;
    onBlurCategory: (c: MeetingCategory) => void;
    projectTags: string[];
    setProjectTags: (val: string[]) => void;
    onBlurTags: (t: string[]) => void;
    attendees: string[];
    onToggleAttendee: (id: string) => void;
    users: User[];
    masterOptions: MasterOption[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    isCopied: boolean;
    onCopySummary: () => void;
}

const MeetingHeader: React.FC<MeetingHeaderProps> = React.memo(({
    title, setTitle, onBlurTitle,
    date, setDate, onBlurDate,
    category, setCategory, onBlurCategory,
    projectTags, setProjectTags, onBlurTags,
    attendees, onToggleAttendee,
    users, masterOptions,
    isExpanded, onToggleExpand,
    isCopied, onCopySummary
}) => {
    const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    const selectedCategory = masterOptions.find(o => o.key === category);

    return (
        <div className="p-6 bg-white/40 backdrop-blur-md border-b border-white/60 relative z-30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                <div className="flex-1">
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={onBlurTitle}
                        className="w-full text-xl md:text-2xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
                        placeholder="หัวข้อการประชุม..."
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button 
                        onClick={onCopySummary}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs transition-all shadow-sm border ${isCopied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-600 border-white/80 hover:bg-slate-50'}`}
                    >
                        {isCopied ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        <span>{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกสรุป'}</span>
                    </button>
                    <button 
                        onClick={onToggleExpand}
                        className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-white/80 shadow-sm transition-all"
                    >
                        {isExpanded ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Custom Date Picker */}
                <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <input 
                        type="date"
                        value={format(date, 'yyyy-MM-dd')}
                        onChange={(e) => {
                            const newDate = new Date(e.target.value);
                            setDate(newDate);
                            onBlurDate(newDate);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-600">{format(date, 'd MMM yyyy')}</span>
                </div>

                {/* Custom Category Dropdown */}
                <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative">
                    <Tag className="w-4 h-4 text-purple-400" />
                    <button 
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="flex items-center justify-between w-full text-xs font-bold text-slate-600"
                    >
                        {selectedCategory?.label || 'เลือกหมวดหมู่'}
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    {isCategoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2">
                            {masterOptions.filter(o => o.type === 'MEETING_CATEGORY').map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => {
                                        setCategory(opt.key as MeetingCategory);
                                        onBlurCategory(opt.key as MeetingCategory);
                                        setIsCategoryDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-indigo-50 rounded-xl"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Project Tag Input */}
                <div className="flex items-center gap-3 bg-white/60 p-1 rounded-2xl border border-white/80 shadow-sm">
                    <Clock className="w-4 h-4 text-amber-400 ml-3" />
                    <MeetingTagInput 
                        tags={projectTags}
                        onTagsChange={(tags) => {
                            setProjectTags(tags);
                            onBlurTags(tags);
                        }}
                        placeholder="Project Tag..."
                    />
                </div>

                {/* Attendees Button */}
                <button 
                    onClick={() => setIsAttendeesModalOpen(true)}
                    className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative group hover:bg-white transition-all"
                >
                    <Users className="w-4 h-4 text-emerald-400" />
                    <div className="flex -space-x-2 overflow-hidden">
                        {users.filter(u => attendees.includes(u.id)).slice(0, 3).map(u => (
                            <img key={u.id} src={u.avatarUrl} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" title={u.name} />
                        ))}
                        {attendees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                                +{attendees.length - 3}
                            </div>
                        )}
                        {attendees.length === 0 && <span className="text-xs font-bold text-slate-300">ผู้เข้าประชุม...</span>}
                    </div>
                </button>
            </div>

            <AttendeesModal 
                isOpen={isAttendeesModalOpen}
                onClose={() => setIsAttendeesModalOpen(false)}
                users={users}
                attendees={attendees}
                onToggleAttendee={onToggleAttendee}
                masterOptions={masterOptions}
            />
        </div>
    );
});

export default MeetingHeader;
