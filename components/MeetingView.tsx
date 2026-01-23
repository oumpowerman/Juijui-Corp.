
import React, { useState, useEffect } from 'react';
import { User, MeetingLog, Task, MeetingCategory } from '../types';
import { useMeetings } from '../hooks/useMeetings';
import { useTasks } from '../hooks/useTasks';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';

// Import New Components
import MeetingListSidebar from './meeting/MeetingListSidebar';
import MeetingDetail from './meeting/MeetingDetail';
import MeetingActionModule from './meeting/MeetingActionModule';

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

    // Selected Meeting State (Controlled)
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date());
    const [category, setCategory] = useState<MeetingCategory>('GENERAL');
    const [projectTag, setProjectTag] = useState('');
    const [content, setContent] = useState('');
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
            setCategory(selectedMeeting.category || 'GENERAL');
            setAttendees(selectedMeeting.attendees);
            setProjectTag(selectedMeeting.tags?.[0] || ''); 
        }
    }, [selectedMeeting]);

    // Auto-save debounce for content
    useEffect(() => {
        if (!selectedId) return;
        const timer = setTimeout(() => {
            if (selectedMeeting && content !== selectedMeeting.content) {
                handleUpdate('content', content);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [content, selectedId]);

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

    // --- Task Integration Handlers ---
    const handleAddTask = async (taskTitle: string, assigneeId: string, type: 'TASK' | 'CONTENT') => {
        const tags = ['Meeting-Action'];
        if (projectTag) tags.push(projectTag);

        const newTask: Task = {
            id: crypto.randomUUID(),
            type: type,
            title: taskTitle,
            description: `[จากที่ประชุม: ${title}]\nหมวดหมู่: ${category}\nวันที่: ${format(new Date(), 'd MMM yyyy')}`,
            status: 'TODO',
            priority: 'MEDIUM',
            startDate: new Date(),
            endDate: new Date(), 
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
        
        // Append log to notes
        const assigneeName = users.find(u => u.id === assigneeId)?.name || 'Unassigned';
        const newContent = content + `\n- [ ] ⚡ Action: ${taskTitle} (@${assigneeName})`;
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
        <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-500 overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                        <FileText className="w-8 h-8 mr-3 text-indigo-600" />
                        Meeting Room
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">จดบันทึก ติดตามงาน และจัดการโปรเจกต์แบบครบวงจร</p>
                </div>
                <button 
                    onClick={handleCreate}
                    className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2 stroke-[3px]" /> เริ่มการประชุม
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden bg-white rounded-[2.5rem] shadow-sm border border-gray-200">
                <MeetingListSidebar 
                    meetings={filteredMeetings}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDelete={deleteMeeting}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <div className="flex-1 flex flex-col overflow-hidden relative">
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
                            activeTab={activeTab} setActiveTab={setActiveTab}
                            isSaving={isSaving} onBlurUpdate={handleUpdate}
                        >
                            <MeetingActionModule 
                                users={users}
                                tasks={tasks}
                                projectTag={projectTag}
                                onAddTask={handleAddTask}
                                onUpdateTask={handleUpdateTask}
                            />
                        </MeetingDetail>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50 p-12 text-center">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <FileText className="w-12 h-12 text-gray-200" />
                            </div>
                            <h3 className="font-black text-2xl text-gray-400 mb-2">เลือกห้องประชุม</h3>
                            <p className="max-w-xs mx-auto text-sm">เลือกบันทึกการประชุมจากรายการทางซ้าย หรือกดปุ่มเริ่มการประชุมใหม่ด้านบน</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingView;
