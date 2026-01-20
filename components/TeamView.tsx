
import React, { useState } from 'react';
import { Task, Status, Channel, User, Role } from '../types';
import { STATUS_COLORS, PLATFORM_ICONS } from '../constants';
import { format, endOfWeek, eachDayOfInterval, isWithinInterval, isToday, addWeeks, isSameWeek, isBefore, isAfter } from 'date-fns';
import { Battery, BatteryCharging, BatteryFull, BatteryWarning, Check, X, ShieldAlert, Crown, ChevronLeft, ChevronRight, Loader2, Gift, ShoppingBag, Wallet, Settings, History, Send, AlertCircle, Users, Zap, Briefcase as JobIcon, Sword, Shield, GraduationCap, Flame, Scissors, Lightbulb } from 'lucide-react';
import MentorTip from './MentorTip';
import { useRewards } from '../hooks/useRewards';
import MemberManagementModal from './MemberManagementModal'; 
import MemberDetailModal from './MemberDetailModal'; 
import { useTeam } from '../hooks/useTeam';

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
  onAddTask?: (task?: any) => void; 
}

const TeamView: React.FC<TeamViewProps> = ({ 
  tasks, 
  channels, 
  users, 
  currentUser,
  onEditTask, 
  onApproveMember, 
  onRemoveMember, 
  onToggleStatus,
  onOpenSettings,
  onAddTask
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { rewards, allRedemptions, redeemReward, fetchAllRedemptions } = useRewards(currentUser);
  const { updateMember } = useTeam();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN';

  // Filter only general tasks (type === 'TASK') to exclude Content items
  const generalTasks = tasks.filter(t => t.type === 'TASK');

  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => addWeeks(prev, -1));
  const goToToday = () => setCurrentDate(new Date());

  const approvedUsers = users.filter(u => u.isApproved);
  const activeMembers = approvedUsers.filter(u => u.isActive);
  const pendingUsers = users.filter(u => !u.isApproved);
  
  // Manual startOfWeek (Monday start)
  const getStartOfWeek = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1); // Monday start
      d.setDate(d.getDate() - day + diff);
      d.setHours(0, 0, 0, 0);
      return d;
  };

  const start = getStartOfWeek(currentDate);
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start, end });

  // Robust overlap check for the whole week
  const isTaskInWeek = (task: Task, weekStart: Date, weekEnd: Date) => {
      const taskStart = new Date(task.startDate);
      taskStart.setHours(0,0,0,0);
      const taskEnd = new Date(task.endDate);
      taskEnd.setHours(23,59,59,999);
      
      const wStart = new Date(weekStart);
      wStart.setHours(0,0,0,0);
      const wEnd = new Date(weekEnd);
      wEnd.setHours(23,59,59,999);
      
      // Check overlap: (StartA <= EndB) and (EndA >= StartB)
      return taskStart <= wEnd && taskEnd >= wStart;
  };

  const tasksThisWeek = generalTasks.filter(t => 
    t.status !== Status.DONE && isTaskInWeek(t, start, end)
  );

  // 1. Team Pool: AssigneeType = TEAM but no specific IDs
  const teamPoolTasks = tasksThisWeek.filter(t => t.assigneeType === 'TEAM' && (!t.assigneeIds || t.assigneeIds.length === 0));
  
  // 2. Unassigned: AssigneeType != TEAM and no IDs (Forgot to assign)
  const unassignedTasks = tasksThisWeek.filter(t => t.assigneeType !== 'TEAM' && (!t.assigneeIds || t.assigneeIds.length === 0));

  const getChannelIcon = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return null;
    const platform = channel.platforms?.[0] || 'OTHER';
    const Icon = PLATFORM_ICONS[platform];
    const colorClass = (channel.color || '').split(' ')[1] || 'text-gray-500';
    return <Icon className={`w-3 h-3 ${colorClass}`} />;
  };

  const getRoleIcon = (position: string = '') => {
      const p = position.toLowerCase();
      if (p.includes('editor') || p.includes('ตัดต่อ')) return <Scissors className="w-3 h-3" />;
      if (p.includes('creative') || p.includes('คิด')) return <Lightbulb className="w-3 h-3" />;
      if (p.includes('admin')) return <Shield className="w-3 h-3" />;
      return <Sword className="w-3 h-3" />;
  };

  const getJuijuiScore = (workload: number) => {
    if (workload === 0) return { text: 'ว่างจัด (Free)', color: 'text-green-600 bg-green-100', icon: <BatteryFull className="w-4 h-4" /> };
    if (workload <= 3) return { text: 'ชิวๆ (Chill)', color: 'text-blue-600 bg-blue-100', icon: <BatteryCharging className="w-4 h-4" /> };
    if (workload <= 6) return { text: 'ตึงมือ (Busy)', color: 'text-orange-600 bg-orange-100', icon: <Battery className="w-4 h-4" /> };
    return { text: 'งานเดือด! (On Fire)', color: 'text-red-600 bg-red-100 animate-pulse', icon: <BatteryWarning className="w-4 h-4" /> };
  };

  const handleAction = async (action: 'APPROVE' | 'REMOVE' | 'TOGGLE_STATUS', userId: string, currentStatus?: boolean) => {
      setProcessingId(userId);
      try {
          if (action === 'APPROVE') {
              await onApproveMember?.(userId);
          } else if (action === 'REMOVE') {
              await onRemoveMember?.(userId);
          } else if (action === 'TOGGLE_STATUS' && onToggleStatus && currentStatus !== undefined) {
              await onToggleStatus(userId, currentStatus);
          }
      } finally {
          setProcessingId(null);
      }
  };

  const handleUpdateMember = async (userId: string, updates: { name?: string, position?: string, role?: Role }) => {
      return await updateMember(userId, updates);
  };

  const toggleHistory = () => {
      setIsHistoryOpen(!isHistoryOpen);
      if (!isHistoryOpen) fetchAllRedemptions();
  };

  const getLevelProgress = (xp: number) => {
      return (xp % 1000) / 10; 
  };

  // Helper for checking if a task falls on a specific day (ignoring time)
  const isTaskOnDay = (task: Task, day: Date) => {
      const taskStart = new Date(task.startDate);
      taskStart.setHours(0,0,0,0);
      const taskEnd = new Date(task.endDate);
      taskEnd.setHours(23,59,59,999);
      
      const targetDayStart = new Date(day);
      targetDayStart.setHours(0,0,0,0);
      const targetDayEnd = new Date(day);
      targetDayEnd.setHours(23,59,59,999);
      
      // Check overlap for specific day
      return (taskStart <= targetDayEnd) && (taskEnd >= targetDayStart);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <MentorTip variant="blue" messages={[
          "เช็ค Load งานเบี้ยบ้ายรายทางของชาวแก๊งได้ที่นี่",
          "ใครว่าง/ไม่ว่าง ดูที่สถานะแบตเตอรี่ได้เลย ถ้าสีแดงแสดงว่างานล้นมือแล้ว!"
      ]} />
      
      {/* --- PENDING APPROVAL ALERT --- */}
      {isAdmin && pendingUsers.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 shadow-sm animate-pulse-slow">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-orange-800">
                      <ShieldAlert className="w-6 h-6 mr-2" />
                      <h3 className="font-bold text-lg">มีเด็กใหม่รอเข้าแก๊ง ({pendingUsers.length})</h3>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingUsers.map(user => (
                      <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                              <img src={user.avatarUrl} className="w-10 h-10 rounded-full bg-gray-200 object-cover" />
                              <div>
                                  <p className="font-bold text-gray-800 text-sm">{user.name || 'Unknown'}</p>
                                  <p className="text-xs text-gray-400">{user.email}</p>
                              </div>
                          </div>
                          <div className="flex space-x-2">
                              <button onClick={() => handleAction('APPROVE', user.id)} disabled={processingId === user.id} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50">
                                  {processingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </button>
                              <button onClick={() => handleAction('REMOVE', user.id)} disabled={processingId === user.id} className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50">
                                  <X className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- HEADER ACTIONS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 flex items-center tracking-tight">
             <span className="text-4xl mr-2">🤜🤛</span>
             Squad Tasks (ภารกิจแก๊ง)
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">เช็คงานเบี้ยบ้ายรายทาง งานด่วน งานงอกที่ใครบ้าง</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Distribute Task Button */}
            {onAddTask && (
                <button 
                    onClick={() => onAddTask()} 
                    className="flex items-center px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    <Send className="w-4 h-4 mr-2" /> สั่งงานด่วน
                </button>
            )}

            {isAdmin && (
                <>
                    <button onClick={() => setIsManageModalOpen(true)} className="flex items-center px-4 py-3 bg-gray-800 text-white rounded-2xl text-sm font-bold shadow-md hover:bg-gray-700 transition-all">
                        <Settings className="w-4 h-4 mr-2" /> จัดการคน
                    </button>
                    <button onClick={toggleHistory} className={`flex items-center px-4 py-3 rounded-2xl text-sm font-bold shadow-sm border transition-all ${isHistoryOpen ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:text-purple-600'}`}>
                        <History className="w-4 h-4 mr-2" /> ประวัติแลกของ
                    </button>
                </>
            )}

            {/* Wallet & Shop */}
            {currentUser && (
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-1 pr-4 pl-3 rounded-2xl flex items-center shadow-lg cursor-default border border-white/20">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mr-2 backdrop-blur-sm">
                        <Wallet className="w-4 h-4 text-yellow-300" />
                    </div>
                    <div>
                        <p className="text-[9px] text-purple-100 font-bold uppercase tracking-wider">My Points</p>
                        <p className="text-lg font-black leading-none">{currentUser.availablePoints || 0}</p>
                    </div>
                </div>
            )}
            
            <button onClick={() => setIsShopOpen(!isShopOpen)} className={`flex items-center px-4 py-3 rounded-2xl text-sm font-bold shadow-sm border transition-all ${isShopOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:text-indigo-600'}`}>
                <ShoppingBag className="w-4 h-4 mr-2" /> {isShopOpen ? 'ปิดร้าน' : 'ร้านค้า'}
            </button>
        </div>
      </div>

      {/* --- HISTORY SECTION --- */}
      {isAdmin && isHistoryOpen && (
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xl animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-purple-900 flex items-center">
                      <History className="w-5 h-5 mr-2" /> ประวัติการแลกของรางวัลทั้งทีม
                  </h3>
                  <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100">
                              <th className="pb-3 pl-2">สมาชิก</th>
                              <th className="pb-3">รางวัลที่แลก</th>
                              <th className="pb-3">แต้มที่ใช้</th>
                              <th className="pb-3">วันที่แลก</th>
                              <th className="pb-3 text-right">สถานะ</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {allRedemptions.length === 0 ? (
                              <tr><td colSpan={5} className="py-10 text-center text-gray-400 italic">ยังไม่มีใครแลกของรางวัลเลยครับ</td></tr>
                          ) : allRedemptions.map(r => (
                              <tr key={r.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 pl-2">
                                      <div className="flex items-center gap-3">
                                          <img src={r.user?.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                                          <span className="font-bold text-gray-700">{r.user?.name || 'Unknown'}</span>
                                      </div>
                                  </td>
                                  <td className="py-4">
                                      <div className="flex items-center gap-2">
                                          <span className="text-lg">{r.rewardSnapshot?.icon || '🎁'}</span>
                                          <span className="font-medium text-gray-600">{r.rewardSnapshot?.title || 'Unknown Reward'}</span>
                                      </div>
                                  </td>
                                  <td className="py-4 font-black text-indigo-600">-{r.rewardSnapshot?.cost || 0}</td>
                                  <td className="py-4 text-gray-400 text-xs">{format(r.redeemedAt, 'd MMM yyyy HH:mm')}</td>
                                  <td className="py-4 text-right">
                                      <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-lg border border-green-100">Redeemed</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- SHOP SECTION --- */}
      {isShopOpen && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-6 border border-indigo-100 shadow-inner animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-indigo-900 flex items-center"><Gift className="w-5 h-5 mr-2" /> ของรางวัล (Rewards)</h3>
                  <p className="text-xs text-indigo-600 font-medium bg-white/50 px-2 py-1 rounded-lg border border-indigo-100">ใช้แต้มแลกของรางวัล (XP ไม่ลด)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rewards.filter(r => r.isActive).map(reward => {
                      const canAfford = (currentUser?.availablePoints || 0) >= reward.cost;
                      return (
                          <div key={reward.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center text-center group relative overflow-hidden">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">{reward.icon || '🎁'}</div>
                              <h4 className="font-bold text-gray-800 text-sm mb-1">{reward.title}</h4>
                              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{reward.description}</p>
                              <div className="mt-auto w-full">
                                  <button onClick={() => redeemReward(reward)} disabled={!canAfford} className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>{reward.cost} แต้ม</button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* --- WEEK NAVIGATOR --- */}
      <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-fit mb-4">
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

      {/* --- DESKTOP VIEW: GANG TABLE (Resource Calendar) --- */}
      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-200 overflow-visible">
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
            
            {/* 1. Team Pool (กองกลาง) */}
            {teamPoolTasks.length > 0 && (
                <div className="grid grid-cols-8 min-h-[100px] group bg-indigo-50/30 border-b border-indigo-100">
                     <div className="col-span-1 p-4 flex flex-col items-center justify-center text-center border-r border-indigo-100">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-2 text-indigo-500 shadow-inner">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-indigo-700">กองกลาง (Pool)</p>
                        <p className="text-[9px] text-gray-400">ช่วยกันทำเด้อ</p>
                     </div>
                     {weekDays.map(day => {
                        // ROBUST DATE OVERLAP CHECK
                        const dayTasks = teamPoolTasks.filter(t => isTaskOnDay(t, day));
                        return (
                            <div key={day.toString()} className="col-span-1 border-l border-indigo-100 p-1.5 relative flex flex-col gap-1">
                                {dayTasks.map(task => (
                                    <div key={task.id} onClick={() => onEditTask(task)} className={`text-[10px] p-2 rounded-lg cursor-pointer border shadow-sm truncate hover:scale-105 transition-transform font-medium flex items-center ${STATUS_COLORS[task.status as Status]} border-indigo-200 bg-white ring-1 ring-indigo-100`}>
                                        <Zap className="w-3 h-3 mr-1 text-indigo-400" />
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                        );
                     })}
                </div>
            )}

            {/* 2. Unassigned (ลืมแจก) */}
            {unassignedTasks.length > 0 && (
                <div className="grid grid-cols-8 min-h-[100px] group bg-red-50/30 border-b border-red-100">
                     <div className="col-span-1 p-4 flex flex-col items-center justify-center text-center border-r border-red-100">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-2 text-red-500 shadow-inner animate-pulse">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-red-600">งานลอย (Empty)</p>
                        <p className="text-[9px] text-red-400">รีบหาคนทำด่วน!</p>
                     </div>
                     {weekDays.map(day => {
                        // ROBUST DATE OVERLAP CHECK
                        const dayTasks = unassignedTasks.filter(t => isTaskOnDay(t, day));
                        return (
                            <div key={day.toString()} className="col-span-1 border-l border-red-100 p-1.5 relative flex flex-col gap-1">
                                {dayTasks.map(task => (
                                    <div key={task.id} onClick={() => onEditTask(task)} className={`text-[10px] p-2 rounded-lg cursor-pointer border shadow-sm truncate hover:scale-105 transition-transform font-medium flex items-center ${STATUS_COLORS[task.status as Status]} border-red-200 bg-white ring-1 ring-red-100`}>
                                        <AlertCircle className="w-3 h-3 mr-1 text-red-400" />
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                        );
                     })}
                </div>
            )}

            {/* 3. Members List */}
            {activeMembers.map(user => {
                const userTasks = tasksThisWeek.filter(t => t.assigneeIds.includes(user.id));
                const workload = userTasks.length;
                const statusInfo = getJuijuiScore(workload);
                const levelProgress = getLevelProgress(user.xp || 0);
                const isMe = user.id === currentUser?.id;

                return (
                    <div key={user.id} className={`grid grid-cols-8 min-h-[130px] group transition-colors relative ${isMe ? 'bg-indigo-50/10' : 'hover:bg-gray-50/30'}`}>
                        {/* Member Profile Column */}
                        <div 
                            className="col-span-1 p-3 flex flex-col items-center text-center border-r border-gray-100 bg-white z-10 relative cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedMember(user)}
                        >
                            {/* ALWAYS VISIBLE BUBBLE (High Z-Index) */}
                            {user.feeling && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[50] w-max max-w-[150px] pointer-events-none opacity-100 transition-opacity duration-300">
                                    <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-xl shadow-gray-400/50 whitespace-normal text-center leading-tight relative">
                                        {user.feeling}
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                    </div>
                                </div>
                            )}

                            <div className="relative mb-2 mt-1">
                                <div className={`p-1 rounded-full border-2 ${isMe ? 'border-indigo-200' : 'border-gray-100'}`}>
                                    <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover" />
                                </div>
                                {user.role === 'ADMIN' && <span className="absolute -top-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white shadow-sm"><Crown className="w-3 h-3 fill-white" /></span>}
                                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[9px] px-1.5 rounded-full border-2 border-white font-bold shadow-sm">Lv.{user.level}</div>
                            </div>
                            
                            <p className={`text-xs font-bold truncate w-full mb-0.5 ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>{(user.name || 'Unknown').split(' ')[0]}</p>
                            <p className="text-[9px] text-gray-400 font-medium mb-2">{user.position || 'Member'}</p>
                            
                            {/* XP Bar */}
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden mb-2">
                                <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${levelProgress}%` }}></div>
                            </div>
                            
                            {/* Workload Pill */}
                            <div className={`text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center justify-center gap-1 w-full border ${statusInfo.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')} bg-white text-gray-600`}>
                                {statusInfo.icon}
                                {workload} Tasks
                            </div>
                        </div>

                        {/* Calendar Grid for this user */}
                        {weekDays.map(day => {
                            // ROBUST DATE OVERLAP CHECK
                            const dayTasks = userTasks.filter(t => isTaskOnDay(t, day));
                            return (
                                <div key={day.toString()} className={`col-span-1 border-l border-gray-100 p-1.5 relative flex flex-col gap-1 ${isToday(day) ? 'bg-indigo-50/20' : ''}`}>
                                    {dayTasks.map(task => (
                                        <div key={task.id} onClick={() => onEditTask(task)} className={`text-[10px] p-1.5 rounded-lg cursor-pointer border shadow-sm truncate hover:scale-105 transition-transform font-medium flex items-center bg-white ${STATUS_COLORS[task.status as Status]} group/task relative`}>
                                            <JobIcon className="w-3 h-3 mr-1 opacity-50 shrink-0" />
                                            <span className="truncate">{task.title}</span>
                                            
                                            {/* Hover Tooltip for Task Title */}
                                            <div className="absolute bottom-full left-0 mb-1 hidden group-hover/task:block z-50 w-max max-w-[150px] bg-gray-800 text-white text-[10px] p-2 rounded shadow-lg whitespace-normal break-words pointer-events-none">
                                                {task.title}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden space-y-4">
        
        {/* Mobile: Team Pool */}
        {teamPoolTasks.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-3xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3 border-b border-indigo-100 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-700 text-sm">งานกองกลาง (Help Needed)</h3>
                        <p className="text-[10px] text-indigo-500">{teamPoolTasks.length} งานรอคนช่วย</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {teamPoolTasks.map(task => (
                        <div key={task.id} onClick={() => onEditTask(task)} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-indigo-100 active:scale-[0.98] transition-transform shadow-sm">
                            <div className="min-w-0 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <p className="text-sm font-bold text-gray-700 truncate">{task.title}</p>
                                    <p className="text-[10px] text-gray-400">{format(new Date(task.endDate), 'dd MMM')} • {task.status}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Mobile: Unassigned */}
        {unassignedTasks.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-3xl shadow-sm p-4">
                <div className="flex items-center gap-3 mb-3 border-b border-red-100 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-red-500 shadow-sm">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-700 text-sm">ยังไม่ระบุคน (Unassigned)</h3>
                        <p className="text-[10px] text-red-500">งานลอยๆ ไม่มีเจ้าภาพ</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {unassignedTasks.map(task => (
                        <div key={task.id} onClick={() => onEditTask(task)} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-red-100 active:scale-[0.98] transition-transform shadow-sm">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-700 truncate">{task.title}</p>
                                <p className="text-[10px] text-gray-400">{format(new Date(task.endDate), 'dd MMM')} • {task.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeMembers.map(user => {
            const userTasks = tasksThisWeek.filter(t => t.assigneeIds.includes(user.id));
            const workload = userTasks.length;
            const statusInfo = getJuijuiScore(workload);
            
            return (
                <div key={user.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-visible mt-4">
                    <div 
                        className="p-4 flex items-center justify-between border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white relative rounded-t-3xl cursor-pointer"
                        onClick={() => setSelectedMember(user)}
                    >
                         <div className="flex items-center space-x-3">
                             <div className="relative">
                                <img src={user.avatarUrl} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm" />
                                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full border border-white font-bold">Lv.{user.level || 1}</div>
                             </div>
                             <div>
                                 <h3 className="font-bold text-gray-800 flex items-center gap-1">{(user.name || 'Unknown').split(' ')[0]} {user.role === 'ADMIN' && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}</h3>
                                 <p className="text-[10px] text-gray-400 mt-0.5">{user.position}</p>
                             </div>
                         </div>
                         <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-1.5 rounded-xl border shadow-sm ${statusInfo.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')} bg-white text-gray-600`}>
                             {statusInfo.icon}<span>{workload}</span>
                         </div>
                    </div>
                    <div className="p-4">
                         {userTasks.length > 0 ? (
                             <div className="space-y-2">
                                 {userTasks.map(task => (
                                     <div key={task.id} onClick={() => onEditTask(task)} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 active:scale-[0.98] transition-transform">
                                         <div className="flex items-center space-x-3 overflow-hidden">
                                             <div className="flex-shrink-0 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                                                <JobIcon className="w-4 h-4 text-gray-400" />
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="text-sm font-bold text-gray-700 truncate">{task.title}</p>
                                                 <p className="text-[10px] text-gray-400 mt-0.5">📅 {format(new Date(task.endDate), 'dd MMM')} • {task.status}</p>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         ) : <div className="text-center py-6 opacity-40"><p className="text-2xl mb-1">🏝️</p><p className="text-xs">ว่างจัดๆ</p></div>}
                    </div>
                </div>
            );
        })}
      </div>

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
              onUpdateMember={handleUpdateMember}
          />
      )}
    </div>
  );
};

export default TeamView;
