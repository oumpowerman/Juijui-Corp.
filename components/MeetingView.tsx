
import React, { useState, useEffect } from 'react';
import { User, MeetingLog, Task, MeetingCategory } from '../types';
import { useMeetings } from '../hooks/useMeetings';
import { useTasks } from '../hooks/useTasks';
import { FileText, Plus, Info, Sparkles } from 'lucide-react';
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

    const handleUpdateTask = async (task: Task, updateType: 'DONE' | 'NOTE') => {
        if (updateType === 'DONE') {
            await handleSaveTask({ ...task, status: 'DONE' }, null);
        } else {
            const note = prompt(`บันทึกเพิ่มเติมสำหรับ "${task.title}":`);
            if (note) {
                const newDesc = task.description + `\n[อัปเดต ${format(new Date(), 'd/MM')}]: ${note}`;
                await handleSaveTask({ ...task, description: newDesc }, null);
                
                const newMeetingNote = content + `\n> 🔄 อัปเดตงาน (${task.title}): ${note}`;
                setContent(newMeetingNote);
                handleUpdate('content', newMeetingNote);
            }
        }
    };

    const handleToggleAttendee = (userId: string) => {
        const newAttendees = attendees.includes(userId) 
            ? attendees.filter(id => id !== userId)
            : [...attendees, userId];
        setAttendees(newAttendees);
        handleUpdate('attendees', newAttendees);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-500 overflow-hidden pb-4 md:pb-6">
            <div className="flex justify-between items-center mb-6 shrink-0 px-2 md:px-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 text-indigo-600">
                        <FileText className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                            Meeting Room
                        </h1>
                        <p className="text-gray-500 text-sm font-medium mt-1">จดบันทึก ติดตามงาน และเปลี่ยนการคุยเป็น Action!</p>
                    </div>
                    <button 
                        onClick={() => setIsInfoOpen(true)}
                        className="p-1.5 bg-white text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors shadow-sm border border-gray-100 ml-2 self-start mt-1"
                        title="คู่มือการใช้งาน"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 group"
                >
                    <Plus className="w-5 h-5 mr-2 stroke-[3px] group-hover:rotate-90 transition-transform" /> 
                    <span>เริ่มการประชุม</span>
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/60 ring-1 ring-gray-200/50 p-1.5">
                
                {/* Sidebar Container */}
                <div className="hidden lg:flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden h-full">
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
                <div className="flex-1 flex flex-col overflow-hidden relative bg-white rounded-[2rem] border border-gray-100 shadow-lg shadow-gray-100/50">
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
                            decisions={decisions} setDecisions={setDecisions} // Passed
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
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30 p-12 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
                            <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100 border border-white rotate-3">
                                    <Sparkles className="w-14 h-14 text-indigo-300" />
                                </div>
                                <h3 className="font-black text-3xl text-gray-700 mb-3 tracking-tight">พร้อมเริ่มประชุมรึยัง?</h3>
                                <p className="max-w-xs mx-auto text-gray-400 leading-relaxed font-medium">
                                    เลือกหัวข้อการประชุมจากทางซ้าย <br/>หรือกดปุ่ม <span className="text-indigo-500 font-bold">"เริ่มการประชุม"</span> เพื่อเริ่มเรื่องใหม่
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
        </div>
    );
};

export default MeetingView;
