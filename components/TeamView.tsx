
import React, { useState, useMemo, useCallback } from 'react';
import { Task, Status, Channel, User, Role } from '../types';
import { format, endOfWeek, eachDayOfInterval, isSameWeek, isToday, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Check, X, Eye, EyeOff, Palette, Zap, Layers, Activity, ClipboardList } from 'lucide-react';
import MentorTip from './MentorTip';
import { useRewards } from '../hooks/useRewards';
import MemberManagementModal from './MemberManagementModal'; 
import MemberDetailModal from './MemberDetailModal'; 
import { useTeam } from '../hooks/useTeam';
import RewardShop from './RewardShop';
import RewardHistory from './RewardHistory';

// Import New Sub-components
import TeamHeader from './team/TeamHeader';
import TeamPoolRow from './team/TeamPoolRow';
import TeamMemberRow from './team/TeamMemberRow';
import MyWorkloadModal from './team/MyWorkloadModal'; // New Import

// Import DnD Hook
import { useTeamDragDrop } from '../hooks/useTeamDragDrop';

interface TeamViewProps {
  tasks: Task[];
  channels: Channel[];
  users: User[];
  currentUser: User | null;
  onEditTask: (task: Task) => void;
  onApproveMember?: (id: string) => void;
  onRemoveMember?: (id: string) => void;
  onToggleStatus?: (id: string, currentStatus: boolean) => void; 
  onOpenSettings: () => void;
  onAddTask?: (type?: any) => void; 
  onMoveTask?: (task: Task) => void; // New Prop for DnD
}

export type ColorLensMode = 'STATUS' | 'PRIORITY' | 'TYPE';

const TeamView: React.FC<TeamViewProps> = ({ 
  tasks, 
  channels,
  users, 
  currentUser,
  onEditTask, 
  onApproveMember, 
  onRemoveMember, 
  onToggleStatus,
  onAddTask,
  onMoveTask
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- NEW STATES: View Controls ---
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [colorLens, setColorLens] = useState<ColorLensMode>('STATUS');
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false); // Modal State
  
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { rewards, allRedemptions, redeemReward, fetchAllRedemptions } = useRewards(currentUser);
  const { updateMember } = useTeam();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // --- Date Logic (Memoized) ---
  const { start, end, weekDays } = useMemo(() => {
      const d = new Date(currentDate);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1); // Monday start
      d.setDate(d.getDate() - day + diff);
      d.setHours(0, 0, 0, 0);
      
      const start = new Date(d);
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start, end });
      return { start, end, weekDays };
  }, [currentDate]);

  // --- Task Filtering (Heavy Logic Memoized) ---
  const { tasksThisWeek, teamPoolTasks, unassignedTasks } = useMemo(() => {
      // 1. Filter General Tasks
      const generalTasks = tasks.filter(t => t.type === 'TASK');

      // 2. Filter for This Week
      const tasksInWeek = generalTasks.filter(t => {
          if (t.status === 'DONE') return false;
          
          const taskStart = new Date(t.startDate);
          taskStart.setHours(0,0,0,0);
          const taskEnd = new Date(t.endDate);
          taskEnd.setHours(23,59,59,999);
          
          const wStart = new Date(start);
          wStart.setHours(0,0,0,0);
          const wEnd = new Date(end);
          wEnd.setHours(23,59,59,999);
          
          return taskStart <= wEnd && taskEnd >= wStart;
      });

      // 3. Categorize
      const pool = tasksInWeek.filter(t => t.assigneeType === 'TEAM' && (!t.assigneeIds || t.assigneeIds.length === 0));
      const unassigned = tasksInWeek.filter(t => t.assigneeType !== 'TEAM' && (!t.assigneeIds || t.assigneeIds.length === 0));

      return {
          tasksThisWeek: tasksInWeek,
          teamPoolTasks: pool,
          unassignedTasks: unassigned
      };
  }, [tasks, start, end]);

  // --- Optimized Helper to pass down ---
  const isTaskOnDay = useCallback((task: Task, day: Date) => {
      const taskStart = new Date(task.startDate);
      taskStart.setHours(0,0,0,0);
      const taskEnd = new Date(task.endDate);
      taskEnd.setHours(23,59,59,999);
      
      const targetDayStart = new Date(day);
      targetDayStart.setHours(0,0,0,0);
      const targetDayEnd = new Date(day);
      targetDayEnd.setHours(23,59,59,999);
      
      return (taskStart <= targetDayEnd) && (taskEnd >= targetDayStart);
  }, []);

  // --- DnD Hook Initialization ---
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useTeamDragDrop({
      tasks,
      onTaskMove: (taskId, newAssigneeId, newDate) => {
          const task = tasks.find(t => t.id === taskId);
          if (task && onMoveTask) {
              // Update task data: Re-assign to the new user row and update date
              const updatedTask = {
                  ...task,
                  assigneeIds: [newAssigneeId], // Move task to this user
                  startDate: newDate,
                  endDate: newDate,
                  isUnscheduled: false
              };
              onMoveTask(updatedTask);
          }
      }
  });

  // --- Handlers ---
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => addWeeks(prev, -1));
  const goToToday = () => setCurrentDate(new Date());

  const handleAction = async (action: 'APPROVE' | 'REMOVE' | 'TOGGLE_STATUS', userId: string, currentStatus?: boolean) => {
      if (action === 'APPROVE') {
          await onApproveMember?.(userId);
      } else if (action === 'REMOVE') {
          await onRemoveMember?.(userId);
      } else if (action === 'TOGGLE_STATUS' && onToggleStatus && currentStatus !== undefined) {
          await onToggleStatus(userId, currentStatus);
      }
  };

  // --- MEMBERS FILTER LOGIC (Focus Mode) ---
  const activeMembers = useMemo(() => users.filter(u => u.isApproved && u.isActive), [users]);
  const displayedMembers = useMemo(() => {
      if (isFocusMode && currentUser) {
          return activeMembers.filter(u => u.id === currentUser.id);
      }
      return activeMembers;
  }, [activeMembers, isFocusMode, currentUser]);

  const pendingMembers = useMemo(() => users.filter(u => !u.isApproved), [users]);

  // Map Tasks to Users ONCE to avoid O(N*M) in render
  const userTaskMap = useMemo(() => {
      const map = new Map<string, Task[]>();
      activeMembers.forEach(u => map.set(u.id, []));
      
      tasksThisWeek.forEach(t => {
          t.assigneeIds.forEach(uid => {
              if (map.has(uid)) {
                  map.get(uid)?.push(t);
              }
          });
      });
      return map;
  }, [tasksThisWeek, activeMembers]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <MentorTip variant="blue" messages={[
          "เช็ค Load งานเบี้ยบ้ายรายทางของชาวแก๊งได้ที่นี่",
          "ใครว่าง/ไม่ว่าง ดูที่สถานะแบตเตอรี่และไอคอนสถานะ (Online/Sick) ได้เลย",
          "ลองใช้ปุ่ม 'Focus Me' เพื่อดูเฉพาะงานตัวเองแบบชัดๆ",
          "เปลี่ยนมุมมองสี (Color Lens) เพื่อดูความเร่งด่วนของงานได้นะ"
      ]} />
      
      {/* Header */}
      <TeamHeader 
          onAddTask={onAddTask}
          onManageClick={() => setIsManageModalOpen(true)}
          currentUser={currentUser}
          isShopOpen={isShopOpen}
          toggleShop={() => setIsShopOpen(!isShopOpen)}
      />

      {/* Shop & History Sections */}
      {isShopOpen && (
          <div className="animate-in slide-in-from-top-4 fade-in">
              <RewardShop 
                  rewards={rewards} 
                  userPoints={currentUser?.availablePoints || 0}
                  onRedeem={redeemReward}
                  onClose={() => setIsShopOpen(false)}
                  onOpenHistory={() => { setIsHistoryOpen(true); fetchAllRedemptions(); }}
              />
          </div>
      )}

      {isHistoryOpen && (
          <div className="animate-in slide-in-from-top-4 fade-in">
              <RewardHistory 
                  redemptions={allRedemptions.filter(r => isAdmin || r.userId === currentUser?.id)} 
                  onClose={() => setIsHistoryOpen(false)} 
                  isAdmin={isAdmin}
              />
          </div>
      )}

      {/* Pending Approvals */}
      {isAdmin && pendingMembers.length > 0 && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 animate-in slide-in-from-top-2">
              <h3 className="font-bold text-orange-800 mb-3 flex items-center text-sm">
                  <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded-lg mr-2 text-xs">Waiting</span>
                  รออนุมัติเข้าทีม ({pendingMembers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pendingMembers.map(member => (
                      <div key={member.id} className="bg-white p-3 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              {member.avatarUrl ? (
                                  <img src={member.avatarUrl} className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                              ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">{member.name.charAt(0)}</div>
                              )}
                              <div>
                                  <p className="font-bold text-sm text-gray-800">{member.name}</p>
                                  <p className="text-xs text-gray-500">{member.position || 'No Position'}</p>
                              </div>
                          </div>
                          <div className="flex gap-1">
                              <button 
                                  onClick={() => handleAction('APPROVE', member.id)} 
                                  className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                  title="อนุมัติ"
                              >
                                  <Check className="w-4 h-4" />
                              </button>
                              <button 
                                  onClick={() => handleAction('REMOVE', member.id)} 
                                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                  title="ปฏิเสธ"
                              >
                                  <X className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- CONTROLS ROW: Date & View Options --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Date Navigator */}
        <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-fit">
                <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                <div className="flex flex-col items-center px-4 min-w-[140px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }) ? 'สัปดาห์นี้' : 'ช่วงวันที่'}</span>
                    <span className="text-sm font-black text-indigo-600">{format(start, 'd MMM')} - {format(end, 'd MMM')}</span>
                </div>
                <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                {!isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }) && (
                    <div className="border-l border-gray-200 pl-1 ml-1">
                        <button onClick={goToToday} className="px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors ml-1">Today</button>
                    </div>
                )}
        </div>

        {/* View Controls (Focus & Lens) */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
            {/* My Tasks Modal Trigger */}
             <button 
                onClick={() => setIsWorkloadModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                title="My Active Tasks"
            >
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">My Tasks</span>
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            {/* Focus Toggle */}
            <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isFocusMode ? 'bg-slate-800 text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                title={isFocusMode ? "Show All Team" : "Focus My Work"}
            >
                {isFocusMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{isFocusMode ? 'My View' : 'Team View'}</span>
            </button>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            {/* Lens Switcher */}
            <div className="flex items-center gap-1">
                 <button 
                    onClick={() => setColorLens('STATUS')}
                    className={`p-2 rounded-lg transition-all ${colorLens === 'STATUS' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/20' : 'text-gray-400 hover:bg-gray-50'}`}
                    title="Color by Status"
                 >
                     <Activity className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => setColorLens('PRIORITY')}
                    className={`p-2 rounded-lg transition-all ${colorLens === 'PRIORITY' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500/20' : 'text-gray-400 hover:bg-gray-50'}`}
                    title="Color by Priority"
                 >
                     <Zap className="w-4 h-4" />
                 </button>
                 <button 
                    onClick={() => setColorLens('TYPE')}
                    className={`p-2 rounded-lg transition-all ${colorLens === 'TYPE' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500/20' : 'text-gray-400 hover:bg-gray-50'}`}
                    title="Color by Type"
                 >
                     <Layers className="w-4 h-4" />
                 </button>
            </div>
        </div>

      </div>

      {/* --- DESKTOP VIEW: GANG TABLE --- */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-200 overflow-visible">
        {/* Table Header */}
        <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 rounded-t-3xl">
           <div className="col-span-1 py-4 px-4 text-xs font-black text-gray-400 uppercase tracking-wider">สมาชิก (Members)</div>
           {weekDays.map(day => (
               <div key={day.toString()} className={`col-span-1 py-3 text-center border-l border-gray-100 ${isToday(day) ? 'bg-indigo-50/50' : ''}`}>
                   <p className="text-xs text-gray-400 uppercase font-semibold">{format(day, 'EEE')}</p>
                   <p className={`text-sm font-bold ${isToday(day) ? 'text-indigo-600' : 'text-gray-700'}`}>{format(day, 'dd')}</p>
               </div>
           ))}
        </div>

        <div className="divide-y divide-gray-100">
            {/* Team Pool Rows (Hide in Focus Mode to reduce noise) */}
            {!isFocusMode && (
                <>
                    <TeamPoolRow 
                        type="POOL" 
                        tasks={teamPoolTasks} 
                        weekDays={weekDays} 
                        onEditTask={onEditTask} 
                        isTaskOnDay={isTaskOnDay}
                    />
                    <TeamPoolRow 
                        type="UNASSIGNED" 
                        tasks={unassignedTasks} 
                        weekDays={weekDays} 
                        onEditTask={onEditTask}
                        isTaskOnDay={isTaskOnDay}
                    />
                </>
            )}

            {/* Member Rows */}
            {displayedMembers.map(user => (
                <TeamMemberRow 
                    key={user.id}
                    user={user}
                    tasks={userTaskMap.get(user.id) || []}
                    weekDays={weekDays}
                    currentUser={currentUser}
                    onEditTask={onEditTask}
                    onSelectUser={setSelectedMember}
                    isTaskOnDay={isTaskOnDay}
                    // DnD Props
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    // Visual Props
                    colorLens={colorLens}
                    isFocused={isFocusMode}
                />
            ))}
        </div>
      </div>

      {/* Modals */}
      <MemberDetailModal 
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          user={selectedMember}
      />

      {isAdmin && currentUser && (
          <MemberManagementModal 
              isOpen={isManageModalOpen}
              onClose={() => setIsManageModalOpen(false)}
              users={users}
              currentUser={currentUser}
              onToggleStatus={(uid, status) => handleAction('TOGGLE_STATUS', uid, status)}
              onRemoveMember={(uid) => handleAction('REMOVE', uid)}
              onUpdateMember={updateMember}
          />
      )}

      {/* WORKLOAD MODAL */}
      {currentUser && (
          <MyWorkloadModal 
              isOpen={isWorkloadModalOpen}
              onClose={() => setIsWorkloadModalOpen(false)}
              tasks={tasks}
              currentUser={currentUser}
              channels={channels}
              onOpenTask={onEditTask}
          />
      )}
    </div>
  );
};

export default TeamView;
