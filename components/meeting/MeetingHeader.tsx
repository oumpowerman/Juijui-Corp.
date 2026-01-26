import React from 'react';
import { Calendar, Check, Hash, Copy, ClipboardCheck, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { MeetingCategory, User } from '../../types';

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

    users: User[];
    
    isExpanded: boolean;
    onToggleExpand: () => void;
    
    isCopied: boolean;
    onCopySummary: () => void;
}

const CATEGORY_OPTIONS: { id: MeetingCategory, label: string, color: string, icon: string }[] = [
    { id: 'GENERAL', label: 'General Talk', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: '☕' },
    { id: 'PROJECT', label: 'Project Update', color: 'bg-orange-50 text-orange-600 border-orange-200', icon: '⚡' },
    { id: 'CRISIS', label: 'War Room (Urgent)', color: 'bg-red-50 text-red-600 border-red-200', icon: '🔥' },
    { id: 'CREATIVE', label: 'Brainstorm', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: '🧠' },
    { id: 'HR', label: 'People & Team', color: 'bg-teal-50 text-teal-600 border-teal-200', icon: '🌱' },
];

const MeetingHeader: React.FC<MeetingHeaderProps> = ({
    title, setTitle, onBlurTitle,
    date, setDate, onBlurDate,
    category, setCategory, onBlurCategory,
    projectTag, setProjectTag, onBlurTag,
    attendees, onToggleAttendee,
    users,
    isExpanded, onToggleExpand,
    isCopied, onCopySummary
}) => {
    
    const theme = (() => {
        switch(category) {
            case 'CRISIS': return 'red';
            case 'PROJECT': return 'orange';
            case 'CREATIVE': return 'purple';
            case 'HR': return 'teal';
            default: return 'indigo';
        }
    })();

    const dateValue = isValid(date) ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    return (
        <div className={`px-6 py-5 border-b border-gray-100 flex flex-col gap-4 relative bg-white/80 backdrop-blur-md shadow-sm z-20 shrink-0`}>
            
            <div className="flex justify-between items-start relative z-10">
                <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`text-3xl animate-bounce-slow`}>
                                {CATEGORY_OPTIONS.find(c => c.id === category)?.icon}
                            </span>
                            {/* FIX: Increased line-height (leading-[1.8]) and padding (py-3) to prevent Thai vowel clipping */}
                            <input 
                            type="text" 
                            className={`text-2xl md:text-3xl font-hand font-bold flex-1 w-full outline-none bg-transparent border-b-2 border-transparent focus:border-${theme}-300 transition-colors placeholder:text-gray-300 text-gray-800 leading-[1.8] py-2`}
                            placeholder="หัวข้อการประชุม..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onBlur={onBlurTitle}
                        />
                        </div>
                </div>
                
                <div className="flex gap-2 shrink-0 items-start">
                    {/* Fullscreen Toggle */}
                    <button 
                        onClick={onToggleExpand}
                        className={`p-2.5 rounded-2xl transition-all shadow-sm active:scale-95 border-2 ${isExpanded ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100'}`}
                        title={isExpanded ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
                    >
                        {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>
                    
                        {/* Copy Summary Button */}
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
                {/* Date Picker (Pill Style) */}
                <div className="flex items-center text-xs font-bold text-gray-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all group cursor-pointer">
                    <Calendar className={`w-3.5 h-3.5 mr-2 text-${theme}-400`} />
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

                {/* Category Dropdown (With Bridge Fix) */}
                <div className="relative group">
                    <button className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm border ${CATEGORY_OPTIONS.find(c => c.id === category)?.color}`}>
                        {CATEGORY_OPTIONS.find(c => c.id === category)?.label}
                    </button>
                    {/* FIX: Use pt-2 instead of mt-2 to create a hover bridge */}
                    <div className="absolute left-0 top-full pt-2 w-52 hidden group-hover:block z-[60]">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 animate-in fade-in zoom-in-95">
                            <p className="text-[9px] text-gray-400 font-bold px-2 mb-1">เลือกประเภท</p>
                            {CATEGORY_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setCategory(opt.id); onBlurCategory(opt.id); }}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 flex items-center justify-between transition-colors mb-1 ${category === opt.id ? 'text-gray-900 bg-gray-50' : 'text-gray-500'}`}
                                >
                                    <span className="flex items-center gap-2"><span>{opt.icon}</span> {opt.label}</span>
                                    {category === opt.id && <Check className="w-3 h-3 text-green-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Project Tag */}
                {(category === 'PROJECT' || category === 'CREATIVE' || projectTag) && (
                    <div className={`flex items-center text-xs px-3 py-1.5 rounded-xl border transition-all shadow-sm group focus-within:ring-2 focus-within:ring-${theme}-100 ${projectTag ? `bg-${theme}-50 border-${theme}-100 text-${theme}-700` : 'bg-white border-gray-200 text-gray-400'}`}>
                        <Hash className={`w-3.5 h-3.5 mr-1 ${projectTag ? `text-${theme}-500` : 'text-gray-300'}`} />
                        <input 
                            type="text" 
                            className={`bg-transparent outline-none font-bold w-24 focus:w-40 transition-all placeholder:text-gray-300 text-xs ${projectTag ? `text-${theme}-800` : 'text-gray-600'}`}
                            placeholder="Project Tag..."
                            value={projectTag}
                            onChange={e => setProjectTag(e.target.value)}
                            onBlur={() => onBlurTag(projectTag)}
                        />
                    </div>
                )}

                {/* Attendees (With Bridge Fix) */}
                <div className="flex items-center gap-2 ml-auto">
                    <div className="flex -space-x-3 hover:space-x-1 transition-all duration-300 p-1">
                        {attendees.map(uid => {
                            const u = users.find(user => user.id === uid);
                            return u ? <img key={uid} src={u.avatarUrl} className="w-9 h-9 rounded-full border-2 border-white bg-gray-100 object-cover shadow-sm hover:scale-110 transition-transform hover:z-10" title={u.name} /> : null;
                        })}
                        <div className="relative group/add z-20">
                            <button className="w-9 h-9 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all shadow-sm">
                                <Plus className="w-4 h-4" />
                            </button>
                            {/* FIX: Use pt-2 for bridge */}
                            <div className="absolute right-0 top-full pt-2 w-60 hidden group-hover/add:block z-[60]">
                                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 max-h-60 overflow-y-auto">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase px-3 py-2">ใครเข้าบ้าง?</p>
                                    {users.filter(u => u.isActive).map(u => {
                                        const isPresent = attendees.includes(u.id);
                                        return (
                                            <button key={u.id} onClick={() => onToggleAttendee(u.id)} className={`w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl text-left transition-colors mb-1 ${isPresent ? 'bg-indigo-50' : ''}`}>
                                                <img src={u.avatarUrl} className="w-8 h-8 rounded-full object-cover border border-white shadow-sm" />
                                                <span className={`text-xs font-bold flex-1 ${isPresent ? 'text-indigo-700' : 'text-gray-600'}`}>{u.name}</span>
                                                {isPresent && <Check className="w-4 h-4 text-indigo-600" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MeetingHeader;