
import React, { useState } from 'react';
import { Task, Status, Priority, Channel, User } from '../types';
import { STATUS_COLORS, PRIORITY_COLORS, STATUS_LABELS, PRIORITY_LABELS, PLATFORM_ICONS } from '../constants';
import { format, isAfter, isBefore, addDays, isSameMonth, isSameDay } from 'date-fns';
import { Clock, CheckCircle2, AlertTriangle, ListTodo, ArrowRight, PartyPopper, Sparkles, CalendarDays, ChevronDown, Bell, User as UserIcon, Users, Coffee } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TaskCategoryModal from './TaskCategoryModal';
import MentorTip from './MentorTip';
import { useDuty } from '../hooks/useDuty'; // Import Duty Hook

interface DashboardProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onNavigateToCalendar: () => void;
  onOpenSettings: () => void;
}

type TimeRangeOption = 'THIS_MONTH' | 'LAST_30' | 'LAST_90' | 'CUSTOM' | 'ALL';
type ViewScope = 'ALL' | 'ME';

const Dashboard: React.FC<DashboardProps> = ({ tasks, channels, users, currentUser, onEditTask, onNavigateToCalendar, onOpenSettings }) => {
  const today = new Date();
  
  // Integrate Duty System
  const { duties } = useDuty();
  const todaysDuties = duties.filter(d => isSameDay(new Date(d.date), today));

  // States for Filter
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('LAST_30');
  const [customDays, setCustomDays] = useState<number>(7);
  
  // Logic: Admins see ALL by default, Members see ME by default
  const [viewScope, setViewScope] = useState<ViewScope>(currentUser.role === 'ADMIN' ? 'ALL' : 'ME');

  // States for Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTasks, setModalTasks] = useState<Task[]>([]);
  const [modalTheme, setModalTheme] = useState('blue');

  // --- Filtering Logic ---
  const checkDateInRange = (date: Date) => {
      switch (timeRange) {
          case 'THIS_MONTH':
              return isSameMonth(date, today);
          case 'LAST_30':
              return isAfter(date, addDays(today, -30));
          case 'LAST_90':
              return isAfter(date, addDays(today, -90));
          case 'CUSTOM':
              return isAfter(date, addDays(today, -customDays));
          case 'ALL':
              return true;
          default:
              return true;
      }
  };

  const filteredTasks = tasks.filter(t => {
    // 1. Scope Filter (Me vs All)
    if (viewScope === 'ME') {
        const isAssignee = t.assigneeIds?.includes(currentUser.id);
        const isOwner = t.ideaOwnerIds?.includes(currentUser.id);
        const isEditor = t.editorIds?.includes(currentUser.id);
        if (!isAssignee && !isOwner && !isEditor) return false;
    }

    // 2. Time Range Filter (Apply to Completed items strictly, Pending items loosely)
    if (timeRange === 'ALL') return true;

    const isInRange = checkDateInRange(t.endDate);
    
    // For Completed tasks, strictly follow date range
    if (t.status === Status.DONE || t.status === Status.APPROVE) {
        return isInRange;
    } else {
        // For Pending tasks, show if in range OR overdue (before today)
        return isInRange || isBefore(t.endDate, today);
    }
  });

  const totalTasks = filteredTasks.length;

  // --- STATUS GROUPING LOGIC (10 Steps -> 4 Groups) ---
  const isDoneGroup = (s: Status) => s === Status.APPROVE || s === Status.DONE;
  const isFeedbackGroup = (s: Status) => s === Status.FEEDBACK || s === Status.FEEDBACK_1;
  const isProductionGroup = (s: Status) => s === Status.SHOOTING || s === Status.EDIT_CLIP || s === Status.EDIT_DRAFT_1 || s === Status.EDIT_DRAFT_2 || s === Status.DOING || s === Status.BLOCKED;
  const isTodoGroup = (s: Status) => s === Status.IDEA || s === Status.SCRIPT || s === Status.TODO;

  const doneTasksList = filteredTasks.filter(t => isDoneGroup(t.status));
  const inProgressTasksList = filteredTasks.filter(t => isProductionGroup(t.status));
  const feedbackTasksList = filteredTasks.filter(t => isFeedbackGroup(t.status));
  const todoTasksList = filteredTasks.filter(t => isTodoGroup(t.status));

  const doneTasks = doneTasksList.length;
  const inProgressTasks = inProgressTasksList.length;
  const feedbackTasks = feedbackTasksList.length;
  const todoTasks = todoTasksList.length;

  const urgentTasks = filteredTasks
    .filter(t => (t.priority === Priority.URGENT || t.priority === Priority.HIGH) && !isDoneGroup(t.status))
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    .slice(0, 3);

  const dueSoon = filteredTasks
    .filter(t => isAfter(t.endDate, today) && isBefore(t.endDate, addDays(today, 3)) && !isDoneGroup(t.status))
    .slice(0, 3);

  const chartData = [
    { name: 'Concept & Script 💡', value: todoTasks, color: '#f59e0b' }, // Yellow/Orange
    { name: 'Production 🎥', value: inProgressTasks, color: '#3b82f6' }, // Blue
    { name: 'Feedback 💬', value: feedbackTasks, color: '#ec4899' }, // Pink
    { name: 'Ready ✅', value: doneTasks, color: '#10b981' }, // Green
  ];

  const getChannelIcon = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return null;
    const platform = channel.platforms?.[0] || 'OTHER';
    const Icon = PLATFORM_ICONS[platform];
    return <Icon className={`w-3 h-3 ${channel.color.split(' ')[1]}`} />;
  };

  const handleCardClick = (title: string, tasks: Task[], theme: string) => {
    setModalTitle(title);
    setModalTasks(tasks);
    setModalTheme(theme);
    setModalOpen(true);
  };

  const getTimeRangeLabel = () => {
      switch(timeRange) {
          case 'THIS_MONTH': return 'เดือนนี้';
          case 'LAST_30': return '30 วันล่าสุด';
          case 'LAST_90': return '90 วันล่าสุด';
          case 'CUSTOM': return `ย้อนหลัง ${customDays} วัน`;
          case 'ALL': return 'ทั้งหมด (All Time)';
      }
  };

  // Mentor Tips Logic
  const DASHBOARD_TIPS = [
      "ช่วง Script คือหัวใจสำคัญ วางโครงเรื่องให้แน่น จะถ่ายง่ายขึ้นเยอะ!",
      "งานใน Production เยอะ แสดงว่าทีมกำลังลุยเต็มที่ สู้ๆ!",
      "Feedback มาแล้วรีบแก้ จะได้ปิดงานไวๆ",
      "พักสายตาทุก 45 นาทีด้วยนะ งานเดิน สุขภาพต้องดีด้วย"
  ];

  if (feedbackTasks > 0) {
      DASHBOARD_TIPS.unshift(`มี ${feedbackTasks} งานรอ Feedback อยู่ รีบเช็คหน่อยนะครับ!`);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section: Welcome + Mentor Tip (Side-by-Side) */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch mb-8">
        
        {/* Left: Welcome & Filters */}
        <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center">
                        ยินดีต้อนรับ, {currentUser.name.split(' ')[0]}! <span className="text-4xl ml-2">🚀</span>
                    </h1>
                    <p className="text-gray-500 mt-1 text-base">
                        ภาพรวม <span className="font-bold text-indigo-600">{viewScope === 'ALL' ? 'ทั้งทีม' : 'งานของคุณ'}</span> ในช่วง: <span className="font-bold text-gray-700">{getTimeRangeLabel()}</span>
                    </p>
                </div>
                 {/* Notification Button (Desktop) */}
                <button 
                  onClick={onOpenSettings}
                  className="hidden md:flex p-2.5 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 rounded-xl shadow-sm transition-all active:scale-95"
                  title="การแจ้งเตือน"
                >
                  <Bell className="w-5 h-5" />
                </button>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-3">
                
                {/* View Scope Toggle (Me vs All) */}
                <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                    <button
                        onClick={() => setViewScope('ALL')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewScope === 'ALL' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        ทีม (All)
                    </button>
                    <button
                        onClick={() => setViewScope('ME')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewScope === 'ME' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <UserIcon className="w-4 h-4 mr-2" />
                        ของฉัน (Me)
                    </button>
                </div>

                {/* Time Range Filter Dropdown */}
                <div className="relative group z-20 w-fit">
                    <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
                        <div className="relative">
                            <select
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
                                className="appearance-none bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 pl-4 pr-10 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm border-transparent focus:border-indigo-500"
                            >
                                <option value="THIS_MONTH">📅 เดือนนี้</option>
                                <option value="LAST_30">🗓️ 30 วันล่าสุด</option>
                                <option value="LAST_90">📊 90 วันล่าสุด</option>
                                <option value="CUSTOM">✏️ กำหนดเอง</option>
                                <option value="ALL">♾️ ทั้งหมด</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>

                        {timeRange === 'CUSTOM' && (
                        <div className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300 bg-gray-50 rounded-lg px-2 border border-gray-200">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap mr-2">ย้อนหลัง</span>
                            <input 
                                type="number"
                                value={customDays}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if(val > 0) setCustomDays(val);
                                }}
                                className="w-14 py-1.5 bg-transparent text-center font-bold text-indigo-600 outline-none border-b-2 border-indigo-200 focus:border-indigo-500 transition-colors"
                            />
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap ml-2">วัน</span>
                        </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Mentor Tip Banner */}
        <div className="flex-1 xl:max-w-2xl h-full flex items-center">
             <MentorTip 
                variant={feedbackTasks > 0 ? 'pink' : 'blue'}
                messages={DASHBOARD_TIPS}
                className="h-full"
            />
        </div>

      </div>

      {/* Stats Grid - REDESIGNED FOR 4 MAIN GROUPS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Todo (Idea/Script) */}
        <div 
          onClick={() => handleCardClick(`วางแผน & เขียนบท 💡 (${getTimeRangeLabel()})`, todoTasksList, 'slate')}
          className="bg-gradient-to-br from-white to-amber-50 p-5 md:p-6 rounded-3xl shadow-lg shadow-amber-200/30 border border-amber-100 flex flex-col md:flex-row items-center justify-between md:space-x-4 space-y-3 md:space-y-0 text-center md:text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-300/30 transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 bg-amber-200/20 blur-2xl rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 order-2 md:order-1 w-full">
            <p className="text-xs md:text-sm text-amber-600 font-bold uppercase tracking-wider mb-1 opacity-80 group-hover:opacity-100 transition-opacity">Idea & Script</p>
            <p className="text-3xl md:text-5xl font-black text-amber-700 tracking-tight leading-none">{todoTasks}</p>
          </div>
          <div className="relative z-10 p-3 bg-white text-amber-500 rounded-2xl shadow-sm border border-amber-100 group-hover:scale-110 transition-transform duration-300 order-1 md:order-2">
            <ListTodo className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>
        
        {/* Card 2: Production (Shooting/Edit) */}
        <div 
           onClick={() => handleCardClick(`กำลังผลิต 🎥 (${getTimeRangeLabel()})`, inProgressTasksList, 'blue')}
           className="bg-gradient-to-br from-white to-blue-50 p-5 md:p-6 rounded-3xl shadow-lg shadow-blue-200/30 border border-blue-200 flex flex-col md:flex-row items-center justify-between md:space-x-4 space-y-3 md:space-y-0 text-center md:text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-300/50 transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 bg-blue-200/20 blur-2xl rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110 pointer-events-none"></div>

          <div className="relative z-10 flex-1 order-2 md:order-1 w-full">
            <p className="text-xs md:text-sm text-blue-500 font-bold uppercase tracking-wider mb-1 opacity-80 group-hover:opacity-100 transition-opacity">Production</p>
            <p className="text-3xl md:text-5xl font-black text-blue-600 tracking-tight leading-none">{inProgressTasks}</p>
          </div>
          <div className="relative z-10 p-3 bg-white text-blue-500 rounded-2xl shadow-sm border border-blue-100 group-hover:scale-110 transition-transform duration-300 order-1 md:order-2">
            <Clock className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>

        {/* Card 3: Feedback (Review) */}
        <div 
           onClick={() => handleCardClick(`รอ Feedback 💬 (${getTimeRangeLabel()})`, feedbackTasksList, 'red')}
           className="bg-gradient-to-br from-white to-pink-50 p-5 md:p-6 rounded-3xl shadow-lg shadow-pink-200/30 border border-pink-200 flex flex-col md:flex-row items-center justify-between md:space-x-4 space-y-3 md:space-y-0 text-center md:text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-300/50 transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 p-12 bg-pink-200/20 blur-2xl rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110 pointer-events-none"></div>

          <div className="relative z-10 flex-1 order-2 md:order-1 w-full">
            <p className="text-xs md:text-sm text-pink-500 font-bold uppercase tracking-wider mb-1 opacity-80 group-hover:opacity-100 transition-opacity">Feedback</p>
            <p className="text-3xl md:text-5xl font-black text-pink-500 tracking-tight leading-none">{feedbackTasks}</p>
          </div>
          <div className="relative z-10 p-3 bg-white text-pink-500 rounded-2xl shadow-sm border border-pink-100 group-hover:scale-110 transition-transform duration-300 order-1 md:order-2">
            <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>

        {/* Card 4: Done (Approve/Done) */}
        <div 
           onClick={() => handleCardClick(`พร้อมลง/เสร็จแล้ว ✅ (${getTimeRangeLabel()})`, doneTasksList, 'green')}
           className="bg-gradient-to-br from-white to-emerald-50 p-5 md:p-6 rounded-3xl shadow-lg shadow-emerald-200/30 border border-emerald-200 flex flex-col md:flex-row items-center justify-between md:space-x-4 space-y-3 md:space-y-0 text-center md:text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-300/50 transition-all cursor-pointer group active:scale-95 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-12 bg-emerald-200/20 blur-2xl rounded-full -mr-6 -mt-6 transition-transform group-hover:scale-110 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 order-2 md:order-1 w-full">
            <p className="text-xs md:text-sm text-emerald-600 font-bold uppercase tracking-wider mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
                Ready / Done
            </p>
            <p className="text-3xl md:text-5xl font-black text-emerald-600 tracking-tight leading-none">{doneTasks}</p>
          </div>
          <div className="relative z-10 p-3 bg-white text-emerald-600 rounded-2xl shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform duration-300 order-1 md:order-2">
            <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: High Priority */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-orange-50/50">
              <h3 className="font-bold text-gray-800 flex items-center">
                <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg mr-2">
                    <AlertTriangle className="w-4 h-4" />
                </span>
                {viewScope === 'ME' ? 'งานด่วนของฉัน 🔥' : 'งานไฟลุก! รีบเคลียร์ด่วน 🔥'}
              </h3>
            </div>
            <div className="p-0">
              {urgentTasks.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <PartyPopper className="w-12 h-12 text-yellow-400 mb-3 animate-bounce" />
                    <p className="text-gray-400 font-medium">จุ๊ยมากกก! {viewScope === 'ME' ? 'คุณไม่มีงานด่วน' : 'ไม่มีงานด่วน'} เลยวันนี้ 😎</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {urgentTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => onEditTask(task)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${STATUS_COLORS[task.status]}`}>
                            {STATUS_LABELS[task.status].split(' ')[0] + ' ' + STATUS_LABELS[task.status].split(' ')[1]}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                           {/* Channel Icon */}
                           <div className="flex items-center space-x-1 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                {getChannelIcon(task.channelId)}
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {channels.find(c => c.id === task.channelId)?.name}
                                </span>
                           </div>
                        </div>
                        <h4 className="text-base font-semibold text-gray-800 truncate">{task.title}</h4>
                        <p className="text-sm text-gray-400 truncate mt-0.5">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                         <div className="flex -space-x-2 overflow-hidden">
                            {task.assigneeIds.map(id => {
                                const user = users.find(u => u.id === id);
                                return user ? (
                                    <img key={id} src={user.avatarUrl} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" alt={user.name} title={user.name}/>
                                ) : null;
                            })}
                         </div>
                         <div className="text-right min-w-[60px]">
                           <p className="text-[10px] text-gray-400 uppercase">Deadline</p>
                           <p className="text-sm font-bold text-gray-700">{format(task.endDate, 'd MMM')}</p>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
              <button onClick={onNavigateToCalendar} className="text-sm text-indigo-600 hover:text-indigo-800 font-bold flex items-center justify-center w-full py-1">
                ไปดูตารางงานทั้งหมด <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>
          </div>

          {/* Quick Due Soon */}
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center"><Sparkles className="w-4 h-4 mr-2 text-yellow-500" /> ใกล้ถึงกำหนดส่ง (3 วันนี้) ⏳</h3>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {dueSoon.length === 0 ? (
                 <p className="text-sm text-gray-400 col-span-full text-center py-4">โล่งมาก ไม่มีอะไรต้องส่งเร็วๆ นี้ จุ๊ยๆ เลย 🍹</p>
               ) : dueSoon.map(task => (
                 <div key={task.id} onClick={() => onEditTask(task)} className="border border-gray-100 rounded-xl p-4 hover:shadow-md cursor-pointer transition-all bg-white group hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[10px] px-2 py-0.5 font-semibold rounded border ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status].split(' ')[0]}</span>
                       <span className="text-xs font-medium text-gray-400">{format(task.endDate, 'd MMM')}</span>
                    </div>
                    <div className="mb-2">
                        {getChannelIcon(task.channelId)}
                    </div>
                    <p className="text-sm font-bold text-gray-700 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{task.title}</p>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Workload Chart & Duty */}
        <div className="space-y-6">
          {/* Workload Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center min-h-[300px]">
             <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-6 self-start">
                กราฟความจุ๊ย 📈 ({getTimeRangeLabel()})
             </h3>
             <div className="w-full h-[220px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={65}
                     outerRadius={85}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} 
                      itemStyle={{ color: '#1e293b' }}
                   />
                   <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                 </PieChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-4 text-center">
                <p className="text-4xl font-black text-gray-800">
                    {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}
                    <span className="text-lg text-gray-400 font-medium ml-1">%</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">ความคืบหน้า {getTimeRangeLabel()}</p>
             </div>
          </div>

          {/* Today's Duty Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-3 flex items-center">
                  <Coffee className="w-4 h-4 mr-2" /> เวรประจำวันนี้
              </h3>
              <div className="space-y-2">
                  {todaysDuties.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                          วันนี้ไม่มีเวรครับ
                      </p>
                  ) : (
                      todaysDuties.map(duty => {
                          const assignee = users.find(u => u.id === duty.assigneeId);
                          return (
                              <div key={duty.id} className={`flex items-center p-3 rounded-xl border transition-all ${duty.isDone ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 hover:border-indigo-200'}`}>
                                  <div className="mr-3">
                                      {assignee?.avatarUrl ? (
                                          <img src={assignee.avatarUrl} className="w-8 h-8 rounded-full" alt={assignee.name} />
                                      ) : (
                                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                              {assignee?.name?.charAt(0) || '?'}
                                          </div>
                                      )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-bold truncate ${duty.isDone ? 'text-green-700 line-through' : 'text-gray-800'}`}>
                                          {duty.title}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                          รับผิดชอบโดย {assignee?.name || 'Unknown'}
                                      </p>
                                  </div>
                                  {duty.isDone && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <TaskCategoryModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        tasks={modalTasks}
        channels={channels}
        onEditTask={onEditTask}
        colorTheme={modalTheme}
      />
    </div>
  );
};

export default Dashboard;
