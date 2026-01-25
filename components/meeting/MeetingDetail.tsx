
import React, { useState, useEffect } from 'react';
import { MeetingLog, MeetingCategory, User, MeetingAgendaItem, TaskAsset } from '../../types';
import { Calendar, Check, BookOpen, CheckSquare, Share2, Hash, Users, List, Copy, ClipboardCheck, Plus, Trash2, Link as LinkIcon, Paperclip, Clock, PlayCircle, StopCircle, RefreshCw, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

interface MeetingDetailProps {
    meeting: MeetingLog;
    users: User[];
    
    // State Controls
    title: string;
    setTitle: (val: string) => void;
    date: Date;
    setDate: (val: Date) => void;
    category: MeetingCategory;
    setCategory: (val: MeetingCategory) => void;
    projectTag: string;
    setProjectTag: (val: string) => void;
    attendees: string[];
    onToggleAttendee: (id: string) => void;
    
    content: string;
    setContent: (val: string) => void;
    
    activeTab: 'NOTES' | 'ACTIONS' | 'DECISIONS';
    setActiveTab: (val: 'NOTES' | 'ACTIONS' | 'DECISIONS') => void;
    
    isSaving: boolean;
    onBlurUpdate: (field: string, value: any) => void;
    
    children?: React.ReactNode; 
}

const CATEGORY_OPTIONS: { id: MeetingCategory, label: string, color: string }[] = [
    { id: 'GENERAL', label: 'General / Weekly', color: 'bg-gray-100 text-gray-700' },
    { id: 'PROJECT', label: 'Production / Project', color: 'bg-orange-50 text-orange-700' },
    { id: 'CRISIS', label: 'Crisis / Urgent', color: 'bg-red-50 text-red-700' },
    { id: 'CREATIVE', label: 'Creative / Brainstorm', color: 'bg-purple-50 text-purple-700' },
    { id: 'HR', label: 'HR / Personnel', color: 'bg-teal-50 text-teal-700' },
];

const MeetingDetail: React.FC<MeetingDetailProps> = ({
    meeting, users,
    title, setTitle, date, setDate, category, setCategory, projectTag, setProjectTag, attendees, onToggleAttendee,
    content, setContent, activeTab, setActiveTab,
    isSaving, onBlurUpdate, children
}) => {
    const { showToast } = useToast();
    const [agenda, setAgenda] = useState<MeetingAgendaItem[]>(meeting.agenda || []);
    const [assets, setAssets] = useState<TaskAsset[]>(meeting.assets || []);
    const [newAgendaTopic, setNewAgendaTopic] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // --- Timer State (Local) ---
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTimer = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const remainingSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
    };

    // --- Agenda Logic ---
    const handleAddAgenda = () => {
        if(!newAgendaTopic.trim()) return;
        const newItem: MeetingAgendaItem = {
            id: crypto.randomUUID(),
            topic: newAgendaTopic,
            isCompleted: false
        };
        const newAgenda = [...agenda, newItem];
        setAgenda(newAgenda);
        setNewAgendaTopic('');
        onBlurUpdate('agenda', newAgenda);
    };

    const toggleAgenda = (id: string) => {
        const newAgenda = agenda.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item);
        setAgenda(newAgenda);
        onBlurUpdate('agenda', newAgenda);
    };

    const deleteAgenda = (id: string) => {
        const newAgenda = agenda.filter(item => item.id !== id);
        setAgenda(newAgenda);
        onBlurUpdate('agenda', newAgenda);
    };
    
    // Progress Calculation
    const completedAgenda = agenda.filter(a => a.isCompleted).length;
    const progress = agenda.length > 0 ? Math.round((completedAgenda / agenda.length) * 100) : 0;

    // --- Asset Logic ---
    const handleAddLink = () => {
        const url = prompt('ใส่ลิงก์เอกสาร / รูปภาพ (URL):');
        if (url) {
            const newAsset: TaskAsset = {
                id: crypto.randomUUID(),
                name: 'Attached Link',
                url: url,
                type: 'LINK',
                category: 'LINK',
                createdAt: new Date()
            };
            const newAssets = [...assets, newAsset];
            setAssets(newAssets);
            onBlurUpdate('assets', newAssets);
        }
    };

    // --- Export Summary Logic ---
    const handleCopySummary = () => {
        const attendeeNames = users.filter(u => attendees.includes(u.id)).map(u => u.name).join(', ');
        const agendaText = agenda.map(a => `${a.isCompleted ? '✅' : '⬜'} ${a.topic}`).join('\n');
        
        const summary = `
📅 *สรุปการประชุม: ${title}*
🗓️ วันที่: ${format(date, 'd MMM yyyy')}
👥 ผู้เข้าประชุม: ${attendeeNames || '-'}

📌 *วาระการประชุม (Agenda):*
${agendaText || '- ไม่มีวาระ -'}

📝 *รายละเอียด / บันทึก:*
${content}

🔗 *ลิงก์ที่เกี่ยวข้อง:*
${assets.map(a => `- ${a.url}`).join('\n')}

_Generated by Juijui Planner_
        `.trim();

        navigator.clipboard.writeText(summary);
        setIsCopied(true);
        showToast('คัดลอกสรุปการประชุมแล้ว! ไปวางใน Line ได้เลย', 'success');
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const theme = (() => {
        switch(category) {
            case 'CRISIS': return 'red';
            case 'PROJECT': return 'orange';
            case 'CREATIVE': return 'purple';
            case 'HR': return 'teal';
            default: return 'indigo';
        }
    })();

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fcfcfc]">
            
            {/* Header Area */}
            <div className={`px-8 py-6 border-b border-gray-100 flex flex-col gap-4 relative bg-white shadow-sm z-20`}>
                
                {/* Decorative Blob (Contained to prevent clipping of dropdowns) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                     <div className={`absolute top-0 right-0 w-32 h-32 bg-${theme}-50 rounded-bl-[80px] opacity-60 transition-colors duration-500`} />
                </div>

                <div className="flex justify-between items-center relative z-10">
                    <input 
                        type="text" 
                        className={`text-3xl font-black flex-1 w-full outline-none bg-transparent border-b-2 border-transparent focus:border-${theme}-200 transition-colors pb-1 placeholder:text-gray-300 text-gray-800 leading-tight mr-4`}
                        placeholder="หัวข้อการประชุม..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={() => onBlurUpdate('title', title)}
                    />
                    
                    <div className="flex gap-2 shrink-0 items-start">
                         {/* Copy Summary Button */}
                        <button 
                            onClick={handleCopySummary}
                            className={`p-2 rounded-xl transition-all shadow-sm active:scale-95 border ${isCopied ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-200'}`}
                            title="คัดลอกสรุป"
                        >
                            {isCopied ? <ClipboardCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-20">
                    {/* Date Picker (Styled) */}
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors shadow-sm group">
                        <Calendar className={`w-4 h-4 mr-2 text-${theme}-500`} />
                        <input 
                            type="date" 
                            className="bg-transparent outline-none font-bold text-gray-700 cursor-pointer group-hover:text-gray-900"
                            value={format(date, 'yyyy-MM-dd')}
                            onChange={e => {
                                const d = new Date(e.target.value);
                                setDate(d);
                                onBlurUpdate('date', d.toISOString());
                            }}
                        />
                    </div>

                    {/* Category Dropdown */}
                    <div className="relative group">
                        <button className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm border ${CATEGORY_OPTIONS.find(c => c.id === category)?.color} border-opacity-20`}>
                            {CATEGORY_OPTIONS.find(c => c.id === category)?.label}
                        </button>
                        <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-1 hidden group-hover:block z-[60] animate-in fade-in zoom-in-95">
                            {CATEGORY_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setCategory(opt.id); onBlurUpdate('category', opt.id); }}
                                    className={`w-full text-left px-3 py-2 text-xs font-bold rounded-xl hover:bg-gray-50 flex items-center justify-between transition-colors ${category === opt.id ? 'text-gray-900 bg-gray-50' : 'text-gray-500'}`}
                                >
                                    {opt.label}
                                    {category === opt.id && <Check className="w-3 h-3 text-green-500" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Project Tag */}
                    {(category === 'PROJECT' || category === 'CREATIVE' || projectTag) && (
                        <div className={`flex items-center text-sm px-3 py-1.5 rounded-xl border transition-all shadow-sm group focus-within:ring-2 focus-within:ring-${theme}-100 ${projectTag ? `bg-${theme}-50 border-${theme}-100 text-${theme}-700` : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                            <Hash className={`w-4 h-4 mr-2 ${projectTag ? `text-${theme}-500` : 'text-gray-400'}`} />
                            <input 
                                type="text" 
                                className={`bg-transparent outline-none font-bold w-32 focus:w-48 transition-all placeholder:text-gray-300 ${projectTag ? `text-${theme}-800` : 'text-gray-600'}`}
                                placeholder="Project Tag..."
                                value={projectTag}
                                onChange={e => setProjectTag(e.target.value)}
                                onBlur={() => onBlurUpdate('tags', [projectTag])}
                            />
                        </div>
                    )}

                    {/* Attendees & Add Button */}
                    <div className="flex items-center gap-2 ml-auto">
                        <div className="flex -space-x-2">
                            {attendees.map(uid => {
                                const u = users.find(user => user.id === uid);
                                return u ? <img key={uid} src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 object-cover shadow-sm" title={u.name} /> : null;
                            })}
                            <div className="relative group/add z-20">
                                <button className="w-8 h-8 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors shadow-sm">
                                    <Users className="w-4 h-4" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 hidden group-hover/add:block z-[60] max-h-60 overflow-y-auto">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase px-2 py-1">ผู้เข้าประชุม</p>
                                    {users.filter(u => u.isActive).map(u => {
                                        const isPresent = attendees.includes(u.id);
                                        return (
                                            <button key={u.id} onClick={() => onToggleAttendee(u.id)} className={`w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl text-left transition-colors ${isPresent ? 'bg-indigo-50' : ''}`}>
                                                <img src={u.avatarUrl} className="w-6 h-6 rounded-full object-cover" />
                                                <span className={`text-xs font-bold flex-1 ${isPresent ? 'text-indigo-700' : 'text-gray-600'}`}>{u.name}</span>
                                                {isPresent && <Check className="w-3 h-3 text-indigo-600" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs & Timer Bar */}
            <div className="px-8 pt-2 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex gap-6">
                    <button 
                        onClick={() => setActiveTab('NOTES')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'NOTES' ? `border-${theme}-600 text-${theme}-600` : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <BookOpen className="w-4 h-4" /> วาระ & บันทึก (Notes)
                    </button>
                    <button 
                        onClick={() => setActiveTab('ACTIONS')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'ACTIONS' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <CheckSquare className="w-4 h-4" /> สั่งงาน (Actions)
                    </button>
                    <button 
                        onClick={() => setActiveTab('DECISIONS')}
                        className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DECISIONS' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <Share2 className="w-4 h-4" /> มติ (Decisions)
                    </button>
                </div>
                
                {/* Timer Widget */}
                <div className="flex items-center gap-3 pb-2 text-xs font-mono">
                     <span className={`px-2 py-0.5 rounded text-gray-500 ${isTimerRunning ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gray-100'}`}>
                         {formatTimer(timerSeconds)}
                     </span>
                     <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-gray-400 hover:text-indigo-600">
                         {isTimerRunning ? <StopCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                     </button>
                     <button onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} className="text-gray-400 hover:text-red-500">
                         <RefreshCw className="w-3.5 h-3.5" />
                     </button>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-hidden flex flex-col relative`}>
                {activeTab === 'NOTES' && (
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto flex flex-col gap-6">
                        
                        {/* AGENDA CARD */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[50px] transition-transform group-hover:scale-110 pointer-events-none"></div>
                            
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center uppercase tracking-wide">
                                    <List className="w-4 h-4 mr-2 text-indigo-500" /> วาระการประชุม (Agenda)
                                </h3>
                                {agenda.length > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                        <BarChart className="w-3 h-3" /> {progress}%
                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2 relative z-10">
                                {agenda.map((item, idx) => (
                                    <div key={item.id} className="flex items-center gap-3 group/item">
                                        <button 
                                            onClick={() => toggleAgenda(item.id)}
                                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${item.isCompleted ? 'bg-green-500 border-green-500 text-white shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
                                        >
                                            {item.isCompleted && <Check className="w-4 h-4 stroke-[3px]" />}
                                        </button>
                                        <span className={`text-sm flex-1 font-medium transition-all ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                            {item.topic}
                                        </span>
                                        <button onClick={() => deleteAgenda(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                
                                {/* Add Agenda Input */}
                                <div className="flex items-center gap-3 pt-2 mt-2 border-t border-dashed border-gray-100">
                                    <div className="w-6 h-6 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                                        <Plus className="w-3 h-3" />
                                    </div>
                                    <input 
                                        type="text" 
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 font-medium"
                                        placeholder="เพิ่มหัวข้อที่จะคุย..."
                                        value={newAgendaTopic}
                                        onChange={e => setNewAgendaTopic(e.target.value)}
                                        onKeyDown={e => { if(e.key === 'Enter') handleAddAgenda(); }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ATTACHMENTS */}
                        {(assets.length > 0) && (
                            <div className="flex flex-wrap gap-2">
                                {assets.map(asset => (
                                    <a key={asset.id} href={asset.url} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm hover:shadow font-medium">
                                        <Paperclip className="w-3.5 h-3.5" /> {asset.name || asset.url}
                                    </a>
                                ))}
                                <button onClick={handleAddLink} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs text-gray-500 font-bold transition-all border border-transparent">
                                    <Plus className="w-3.5 h-3.5" /> แนบลิงก์
                                </button>
                            </div>
                        )}
                        {assets.length === 0 && (
                            <button onClick={handleAddLink} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-500 w-fit transition-colors">
                                <LinkIcon className="w-3.5 h-3.5" /> แนบไฟล์ประกอบการประชุม
                            </button>
                        )}

                        {/* NOTES PAPER */}
                        <div className="flex-1 min-h-[400px] relative bg-white rounded-3xl shadow-sm border border-gray-200 p-8 flex flex-col">
                            {/* Paper Lines Decoration (Optional CSS trick, keeping simple here) */}
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">บันทึกการประชุม (Minutes)</h3>
                            <textarea 
                                className="w-full h-full bg-transparent outline-none resize-none text-gray-800 leading-8 text-base font-medium placeholder:text-gray-300"
                                placeholder="เริ่มจดบันทึกที่นี่... ใช้ Markdown ได้นะ (- หัวข้อ, **ตัวหนา**)"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                style={{
                                    backgroundImage: 'linear-gradient(transparent, transparent 31px, #f1f5f9 31px)',
                                    backgroundSize: '100% 32px',
                                    lineHeight: '32px'
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'ACTIONS' && (
                    <div className="flex-1 overflow-hidden relative">
                         {children}
                    </div>
                )}

                {activeTab === 'DECISIONS' && (
                    <div className="flex-1 p-8 overflow-y-auto">
                        <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-100 h-full relative">
                             <div className="absolute top-0 left-0 p-6 opacity-10">
                                 <Share2 className="w-32 h-32 text-emerald-600" />
                             </div>
                             
                            <h3 className="text-emerald-700 font-bold uppercase tracking-wider text-sm mb-4 flex items-center relative z-10">
                                <Check className="w-5 h-5 mr-2" /> สรุปมติที่ประชุม (Key Decisions)
                            </h3>
                            <textarea 
                                className="w-full h-[85%] bg-transparent outline-none resize-none text-emerald-900 leading-relaxed font-medium placeholder:text-emerald-300/70 relative z-10"
                                placeholder="- อนุมัติงบประมาณโปรเจกต์ X...&#10;- เลื่อนกำหนดการถ่ายทำเป็นวันจันทร์หน้า...&#10;- เปลี่ยนธีมสีหลักเป็นสีส้ม..."
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingDetail;
