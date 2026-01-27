
import React, { useState, useEffect } from 'react';
import { User, MeetingLog, Task, MeetingCategory } from '../types';
import { useMeetings } from '../hooks/useMeetings';
import { useTasks } from '../hooks/useTasks';
import { FileText, Plus, Info, Sparkles, StickyNote, X, Save, Coffee } from 'lucide-react';
import { format, addDays } from 'date-fns';

// Import New Components
import MeetingListSidebar from './meeting/MeetingListSidebar';
import MeetingDetail from './meeting/MeetingDetail';
import MeetingActionModule from './meeting/MeetingActionModule';
import InfoModal from './ui/InfoModal';
import MeetingGuide from './meeting/MeetingGuide';

interface MeetingViewProps {
    users: User[];
    currentUser: User;
    tasks: Task[]; 
}

type MeetingTab = 'NOTES' | 'ACTIONS' | 'DECISIONS';

const MeetingView: React.FC<MeetingViewProps> = ({ users, currentUser, tasks }) => {
    const { meetings, createMeeting, updateMeeting, deleteMeeting } = useMeetings();
    const { handleSaveTask } = useTasks(() => {}); 
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<MeetingTab>('NOTES');
    const [isSaving, setIsSaving] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    // Selected Meeting State (Controlled)
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [category, setCategory] = useState<MeetingCategory>('GENERAL');
    const [projectTag, setProjectTag] = useState('');
    const [content, setContent] = useState('');
    const [decisions, setDecisions] = useState(''); // New Decisions State
    const [attendees, setAttendees] = useState<string[]>([]);

    // --- Custom Note Modal State ---
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [taskToNote, setTaskToNote] = useState<Task | null>(null);
    const [noteText, setNoteText] = useState('');

    // Filter Logic
    const filteredMeetings = meetings.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tags && m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const selectedMeeting = meetings.find(m => m.id === selectedId);

    // Sync state when selection changes
    useEffect(() => {
        if (selectedMeeting) {
            setTitle(selectedMeeting.title);
            setDate(selectedMeeting.date);
            setContent(selectedMeeting.content);
            setDecisions(selectedMeeting.decisions || ''); // Sync Decisions
            setCategory(selectedMeeting.category || 'GENERAL');
            setAttendees(selectedMeeting.attendees);
            setProjectTag(selectedMeeting.tags?.[0] || ''); 
        }
    }, [selectedMeeting]);

    // Auto-save debounce for content & decisions
    useEffect(() => {
        if (!selectedId) return;
        const timer = setTimeout(() => {
            if (selectedMeeting) {
                if (content !== selectedMeeting.content) {
                    handleUpdate('content', content);
                }
                if (decisions !== (selectedMeeting.decisions || '')) {
                    handleUpdate('decisions', decisions);
                }
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [content, decisions, selectedId]);

    const handleCreate = async () => {
        const id = await createMeeting('การประชุมครั้งใหม่...', new Date(), currentUser.id);
        if (id) {
            setSelectedId(id);
            setActiveTab('NOTES');
            setProjectTag('');
        }
    };

    const handleUpdate = async (field: keyof MeetingLog, value: any) => {
        if (!selectedId) return;
        setIsSaving(true);
        await updateMeeting(selectedId, { [field]: value });
        setIsSaving(false);
    };

    // --- Task Integration Handlers (Improved Context) ---
    const handleAddTask = async (taskTitle: string, assigneeId: string, type: 'TASK' | 'CONTENT', targetDate?: Date) => {
        const tags = ['Meeting-Action'];
        if (projectTag) tags.push(projectTag);
        
        // Date Logic
        const effectiveDate = targetDate || new Date();
        const isFollowUp = targetDate && targetDate > addDays(new Date(), 2);
        if (isFollowUp) tags.push('FollowUp');

        // Context Injection: Add meeting info to description
        const meetingContext = `📌 Origin: Meeting "${title}" (${format(date, 'd MMM yy')})\n-------------------`;

        const newTask: Task = {
            id: crypto.randomUUID(),
            type: type,
            title: taskTitle,
            description: `${meetingContext}\n\n[รายละเอียดเพิ่มเติม...]\nหมวดหมู่: ${category}`,
            status: 'TODO',
            priority: 'MEDIUM',
            startDate: new Date(), // Created today
            endDate: effectiveDate, // Due date
            assigneeIds: assigneeId ? [assigneeId] : [],
            tags: tags,
            isUnscheduled: false,
            assigneeType: 'INDIVIDUAL',
            difficulty: 'MEDIUM',
            estimatedHours: 0,
            assets: [],
            reviews: [],
            logs: []
        };

        await handleSaveTask(newTask, null);
        
        // Append log to notes with better formatting
        const assigneeName = users.find(u => u.id === assigneeId)?.name || 'Unassigned';
        const dateLabel = targetDate ? format(targetDate, 'd MMM') : 'ASAP';
        
        // Update meeting notes content
        const newLogLine = `- [ ] ⚡ **${taskTitle}** (@${assigneeName}) — Due: ${dateLabel}`;
        const newContent = content ? `${content}\n${newLogLine}` : newLogLine;
        
        setContent(newContent);
        handleUpdate('content', newContent);
    };

    // Updated: Open Modal instead of prompt
    const handleUpdateTask = async (task: Task, updateType: 'DONE' | 'NOTE') => {
        if (updateType === 'DONE') {
            await handleSaveTask({ ...task, status: 'DONE' }, null);
        } else {
            setTaskToNote(task);
            setNoteText('');
            setIsNoteModalOpen(true);
        }
    };

    // New: Handle Saving Note from Modal
    const handleConfirmSaveNote = async () => {
        if (!taskToNote || !noteText.trim()) return;

        const newDesc = taskToNote.description + `\n\n[อัปเดต ${format(new Date(), 'd/MM')}]: ${noteText}`;
        await handleSaveTask({ ...taskToNote, description: newDesc }, null);
        
        const newMeetingNote = content + `\n> 🔄 อัปเดตงาน (${taskToNote.title}): ${noteText}`;
        setContent(newMeetingNote);
        handleUpdate('content', newMeetingNote);

        setIsNoteModalOpen(false);
        setTaskToNote(null);
        setNoteText('');
    };

    const handleToggleAttendee = (userId: string) => {
        const newAttendees = attendees.includes(userId) 
            ? attendees.filter(id => id !== userId)
            : [...attendees, userId];
        setAttendees(newAttendees);
        handleUpdate('attendees', newAttendees);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-500 overflow-hidden pb-4 md:pb-6 relative isolate">
            
            {/* Background Decoration (Cute Dots) */}
            <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none" 
                style={{ 
                    backgroundImage: 'radial-gradient(#e0e7ff 2px, transparent 2px)', 
                    backgroundSize: '24px 24px' 
                }}>
            </div>
            
            {/* Top Bar */}
            <div className="flex justify-between items-center mb-6 shrink-0 px-2 md:px-0 pt-2">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-3 rounded-2xl shadow-lg shadow-indigo-200 text-white transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Coffee className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center">
                            Meeting Room
                            <span className="ml-2 text-2xl animate-bounce">💬</span>
                        </h1>
                        <p className="text-gray-500 text-sm font-bold bg-white/60 px-3 py-1 rounded-full w-fit backdrop-blur-sm border border-white/50">
                            จดบันทึก ✦ ติดตามงาน ✦ ปิดจ็อบ
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsInfoOpen(true)}
                        className="p-2 bg-white text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all shadow-sm border border-indigo-100 ml-2 self-start mt-1 hover:scale-110 active:scale-95"
                        title="คู่มือการใช้งาน"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 group border-4 border-white/30"
                >
                    <Plus className="w-5 h-5 mr-2 stroke-[3px] group-hover:rotate-90 transition-transform" /> 
                    <span>เริ่มการประชุม</span>
                </button>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex gap-6 overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/80 ring-1 ring-indigo-50 p-2 relative">
                
                {/* Sidebar Container */}
                <div className="hidden lg:flex flex-col bg-white/80 backdrop-blur-md rounded-[2rem] border border-indigo-50 shadow-sm overflow-hidden h-full w-80 shrink-0">
                     <MeetingListSidebar 
                        meetings={filteredMeetings}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        onDelete={deleteMeeting}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </div>

                {/* Detail Container */}
                <div className="flex-1 flex flex-col overflow-hidden relative bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                    {selectedMeeting ? (
                        <MeetingDetail 
                            meeting={selectedMeeting}
                            users={users}
                            title={title} setTitle={setTitle}
                            date={date} setDate={setDate}
                            category={category} setCategory={setCategory}
                            projectTag={projectTag} setProjectTag={setProjectTag}
                            attendees={attendees} onToggleAttendee={handleToggleAttendee}
                            content={content} setContent={setContent}
                            decisions={decisions} setDecisions={setDecisions} 
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            isSaving={isSaving} onBlurUpdate={handleUpdate}
                        >
                            <MeetingActionModule 
                                users={users}
                                tasks={tasks}
                                projectTag={projectTag}
                                meetingTitle={title} 
                                meetingDate={date}
                                onAddTask={handleAddTask}
                                onUpdateTask={handleUpdateTask}
                            />
                        </MeetingDetail>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-indigo-50/30 p-12 text-center relative overflow-hidden">
                            {/* Empty State Decor */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
                            
                            <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-indigo-100 border-4 border-white rotate-3 hover:rotate-6 transition-transform duration-500">
                                    <Sparkles className="w-16 h-16 text-indigo-400" />
                                </div>
                                <h3 className="font-black text-3xl text-gray-700 mb-3 tracking-tight">พร้อมประชุมรึยัง?</h3>
                                <p className="max-w-xs mx-auto text-gray-500 leading-relaxed font-medium bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/50">
                                    เลือกหัวข้อการประชุมจากทางซ้าย <br/>หรือกดปุ่ม <span className="text-indigo-600 font-bold">"เริ่มการประชุม"</span> เพื่อเริ่มเรื่องใหม่
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* INFO MODAL */}
            <InfoModal 
                isOpen={isInfoOpen}
                onClose={() => setIsInfoOpen(false)}
                title="คู่มือ Meeting Room"
            >
                <MeetingGuide />
            </InfoModal>

            {/* NEW: Custom Note Modal (Styled) */}
            {isNoteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo-900/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 border-4 border-white ring-1 ring-indigo-100">
                        <button 
                            onClick={() => setIsNoteModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3.5 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm rotate-3">
                                <StickyNote className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-800 tracking-tight">บันทึกเพิ่มเติม</h3>
                                <p className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-lg truncate max-w-[200px] mt-1">
                                    งาน: {taskToNote?.title}
                                </p>
                            </div>
                        </div>

                        <textarea 
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="พิมพ์อัปเดต หรือรายละเอียดเพิ่มเติม..."
                            className="w-full h-36 p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-200 rounded-2xl outline-none resize-none text-sm font-medium mb-6 transition-all"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setIsNoteModalOpen(false)}
                                className="flex-1 py-3 text-gray-500 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={handleConfirmSaveNote}
                                disabled={!noteText.trim()}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4 mr-2" /> บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingView;
