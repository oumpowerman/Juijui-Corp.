
import React, { useState } from 'react';
import { X, Calendar as CalIcon, AlertCircle, Trash2, Layout, Film, CheckSquare, User as UserIcon, Video, Lightbulb, Check, MessageSquare, ArrowLeft, Paperclip, ChevronRight, History, Clock, FileCheck, Send, TrendingUp, DollarSign, Eye, ThumbsUp, Share2, MessageCircle, BarChart3, Timer, Wrench, PlayCircle, Star, Settings } from 'lucide-react';
import { Task, Status, Priority, Channel, TaskType, User, MasterOption, ReviewSession } from '../types';
import { PLATFORM_ICONS, DIFFICULTY_LABELS } from '../constants';
import TaskComments from './TaskComments';
import TaskAssets from './TaskAssets';
import { useTaskForm } from '../hooks/useTaskForm';
import { supabase } from '../lib/supabase';
import { format, addHours } from 'date-fns';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  initialData?: Task | null;
  selectedDate?: Date | null;
  channels: Channel[];
  users: User[];
  lockedType?: TaskType | null; 
  masterOptions?: MasterOption[];
  currentUser?: User; 
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, onDelete, initialData, selectedDate, channels, users, lockedType, masterOptions = [], currentUser }) => {
  const [viewMode, setViewMode] = useState<'DETAILS' | 'COMMENTS' | 'ASSETS' | 'HISTORY'>('DETAILS');
  const [bookingRound, setBookingRound] = useState(1);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('14:00');
  const [reviseNote, setReviseNote] = useState(''); // For Revision Feedback
  const [isRejecting, setIsRejecting] = useState(false);
  
  // Only show Active users for selection, but include inactive if they are already assigned to THIS task
  const activeUsers = users.filter(u => u.isActive);
  const usersForSelection = users.filter(u => {
      // If user is active, show them
      if (u.isActive) return true;
      // If user is inactive BUT currently assigned/owner/editor of this task, show them (so we don't break display)
      if (initialData) {
          return initialData.assigneeIds.includes(u.id) || 
                 initialData.ideaOwnerIds?.includes(u.id) || 
                 initialData.editorIds?.includes(u.id);
      }
      return false;
  });
  
  // Use Custom Hook for Form Logic
  const {
      activeTab, setActiveTab,
      title, setTitle,
      description, setDescription,
      remark, setRemark,
      startDate, setStartDate,
      endDate, setEndDate,
      status, setStatus,
      priority, setPriority,
      channelId, setChannelId,
      targetPlatforms,
      pillar, setPillar,
      contentFormat, setContentFormat,
      category, setCategory,
      ideaOwnerIds, setIdeaOwnerIds,
      editorIds, setEditorIds,
      isStock, setIsStock,
      assigneeIds, setAssigneeIds,
      assets, 
      difficulty, setDifficulty,
      estimatedHours, setEstimatedHours,
      performance, setPerformance, // New
      error,
      formatOptions, pillarOptions, categoryOptions, statusOptions,
      handleSubmit, togglePlatform, toggleUserSelection, addAsset, removeAsset
  } = useTaskForm({
      initialData,
      selectedDate,
      channels,
      lockedType,
      masterOptions,
      onSave: (task) => {
          onSave(task);
          onClose();
          setViewMode('DETAILS');
      }
  });

  const selectedChannelObj = channels.find(c => c.id === channelId);
  const isAdmin = currentUser?.role === 'ADMIN';
  const isTaskDone = status === Status.DONE || status === Status.APPROVE;

  // Calculate Projected XP for Display
  const baseXP = DIFFICULTY_LABELS[difficulty || 'MEDIUM'].xp;
  const hourlyBonus = Math.floor((estimatedHours || 0) * 20);
  const totalProjectedXP = baseXP + hourlyBonus;

  // --- WORKFLOW ACTIONS ---

  // 1. Worker: Submit for Review
  const handleSubmitForReview = async () => {
      if (!initialData) return;
      
      const confirmMsg = "ยืนยันส่งตรวจงาน (Submit)?\nสถานะจะเปลี่ยนเป็น 'Feedback' และแจ้งเตือนหัวหน้า";
      if (!confirm(confirmMsg)) return;

      try {
          const nextRound = (initialData.reviews?.length || 0) + 1;
          const scheduledAt = addHours(new Date(), 1); // Default time

          // 1. Create Review Record
          await supabase.from('task_reviews').insert({
              task_id: initialData.id,
              round: nextRound,
              scheduled_at: scheduledAt.toISOString(),
              status: 'PENDING'
          });

          // 2. Log
          await supabase.from('task_logs').insert({
              task_id: initialData.id,
              action: 'STATUS_CHANGE',
              details: `🚀 ส่งตรวจ Draft ${nextRound} (Submitted for Review)`,
              user_id: currentUser?.id
          });

          // 3. Update Status -> FEEDBACK
          setStatus('FEEDBACK');
          
          // Force save to parent to trigger updates
          const updatedTask = { ...initialData, status: Status.FEEDBACK };
          onSave(updatedTask); // This closes modal
      } catch (e) {
          alert('เกิดข้อผิดพลาดในการส่งตรวจ');
      }
  };

  // 2. Admin: Approve (Pass)
  const handleApproveTask = async () => {
      if (!initialData) return;
      if (!confirm("ยืนยันให้ผ่าน (Approve)?\nงานจะเปลี่ยนสถานะเป็น 'Done' และคำนวณคะแนน XP")) return;

      try {
          // 1. Update pending reviews to PASSED
          const pendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
          if (pendingReview) {
              await supabase.from('task_reviews').update({ status: 'PASSED', is_completed: true }).eq('id', pendingReview.id);
          }

          // 2. Log
          await supabase.from('task_logs').insert({
              task_id: initialData.id,
              action: 'STATUS_CHANGE',
              details: `✅ อนุมัติงาน (Approved) โดย ${currentUser?.name}`,
              user_id: currentUser?.id
          });

          // 3. Update Status -> DONE
          setStatus('DONE');
          
          const updatedTask = { ...initialData, status: Status.DONE };
          onSave(updatedTask);
      } catch (e) {
          alert('เกิดข้อผิดพลาด');
      }
  };

  // 3. Admin: Revise (Reject)
  const handleReviseTask = async () => {
      if (!initialData || !reviseNote.trim()) {
          alert("กรุณาระบุสิ่งที่ต้องแก้ไข (Feedback) ครับ");
          return;
      }

      try {
          // 1. Update pending review to REVISE
          const pendingReview = initialData.reviews?.find(r => r.status === 'PENDING');
          if (pendingReview) {
              await supabase.from('task_reviews').update({ status: 'REVISE', feedback: reviseNote }).eq('id', pendingReview.id);
          }

          // 2. Log
          await supabase.from('task_logs').insert({
              task_id: initialData.id,
              action: 'STATUS_CHANGE',
              details: `🛠️ ส่งกลับแก้ไข: ${reviseNote}`,
              user_id: currentUser?.id
          });

          // 3. Update Status -> EDIT_DRAFT_2 (or generic EDIT)
          const returnStatus = 'DOING'; 
          setStatus(returnStatus);

          const updatedTask = { ...initialData, status: returnStatus as Status };
          onSave(updatedTask);
      } catch (e) {
          alert('เกิดข้อผิดพลาด');
      }
  };

  // Standard booking (Manual)
  const handleBookReview = async () => {
      if (!initialData || !bookingDate || !bookingTime) return;
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`);
      
      try {
          const { error } = await supabase.from('task_reviews').insert({
              task_id: initialData.id,
              round: bookingRound,
              scheduled_at: scheduledAt.toISOString(),
              status: 'PENDING'
          });
          if (error) throw error;
          
          await supabase.from('task_logs').insert({
              task_id: initialData.id,
              action: 'REVIEW_BOOKED',
              details: `จองคิวตรวจ Draft ${bookingRound} วันที่ ${format(scheduledAt, 'dd MMM HH:mm')}`,
              user_id: currentUser?.id
          });

          await supabase.from('tasks').update({ status: 'FEEDBACK' }).eq('id', initialData.id);
          alert('จองคิวตรวจเรียบร้อย!');
          setViewMode('DETAILS');
      } catch (e) {
          alert('จองคิวไม่สำเร็จ');
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border border-gray-100 transition-transform duration-300 transform translate-y-0">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                {viewMode !== 'DETAILS' && (
                    <button onClick={() => setViewMode('DETAILS')} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h2 className="text-xl font-bold text-gray-800">
                    {viewMode === 'HISTORY' ? '🕒 ประวัติ & ตรวจงาน' : viewMode === 'COMMENTS' ? '💬 คอมเมนต์' : viewMode === 'ASSETS' ? '📂 ไฟล์แนบ' : (initialData ? '✏️ แก้ไขข้อมูล' : '✨ เพิ่มข้อมูลใหม่')}
                </h2>
             </div>
             
             <div className="flex items-center gap-2">
                 {initialData && (
                     <button 
                        type="button"
                        onClick={() => setViewMode(prev => prev === 'HISTORY' ? 'DETAILS' : 'HISTORY')}
                        className={`p-2 rounded-xl transition-all relative ${viewMode === 'HISTORY' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200 text-gray-500'}`}
                        title="History & Reviews"
                     >
                         <History className="w-5 h-5" />
                     </button>
                 )}
                 <button 
                    type="button"
                    onClick={() => setViewMode(prev => prev === 'ASSETS' ? 'DETAILS' : 'ASSETS')}
                    className={`p-2 rounded-xl transition-all relative ${viewMode === 'ASSETS' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-200 text-gray-500'}`}
                 >
                     <Paperclip className="w-5 h-5" />
                     {assets.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center border border-white">{assets.length}</span>}
                 </button>
                 {initialData && (
                     <button 
                        type="button"
                        onClick={() => setViewMode(prev => prev === 'COMMENTS' ? 'DETAILS' : 'COMMENTS')}
                        className={`p-2 rounded-xl transition-all relative ${viewMode === 'COMMENTS' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-500'}`}
                     >
                         <MessageSquare className="w-5 h-5" />
                     </button>
                 )}
                 <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                 </button>
             </div>
          </div>
          
          {!lockedType && viewMode === 'DETAILS' && (
              <div className="flex bg-gray-200 p-1 rounded-xl">
                  <button type="button" onClick={() => setActiveTab('CONTENT')} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'CONTENT' && !isTaskDone ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Film className="w-4 h-4 mr-2" /> Content
                  </button>
                  <button type="button" onClick={() => setActiveTab('TASK')} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'TASK' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      <CheckSquare className="w-4 h-4 mr-2" /> Task
                  </button>
                  
                  {/* NEW PERFORMANCE TAB */}
                  {isTaskDone && (
                      <button 
                        type="button" 
                        onClick={() => setActiveTab('CONTENT')} 
                        className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition-all bg-white text-green-600 shadow-sm border border-green-100`}
                        title="กรอกผลลัพธ์ (Performance)"
                      >
                          <TrendingUp className="w-4 h-4 mr-2" /> 📊 ผลลัพธ์
                      </button>
                  )}
              </div>
          )}
        </div>

        {/* --- BODY --- */}
        {viewMode === 'HISTORY' && initialData ? (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
                
                {/* 1. Review History (Quality Gate) */}
                <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-5">
                    <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                        <FileCheck className="w-5 h-5 mr-2" /> ประวัติการส่งตรวจ (Quality Gate)
                    </h3>
                    
                    {/* Render Reviews List */}
                    <div className="space-y-4 mb-6">
                        {initialData.reviews?.length === 0 && <p className="text-sm text-gray-400 text-center italic">ยังไม่มีประวัติการส่งตรวจ</p>}
                        
                        {initialData.reviews?.slice().reverse().map((review) => (
                            <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">Draft {review.round}</span>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">{format(review.scheduledAt, 'd MMM yyyy, HH:mm')}</p>
                                        </div>
                                    </div>
                                    {review.status === 'PENDING' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">รอตรวจ</span>}
                                    {review.status === 'PASSED' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ผ่านแล้ว ✅</span>}
                                    {review.status === 'REVISE' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">ต้องแก้ไข 🛠️</span>}
                                </div>
                                
                                {/* FEEDBACK COMMENT SECTION */}
                                {review.feedback && (
                                    <div className="mt-2 bg-white p-3 rounded-lg border border-red-100 text-sm text-gray-700 relative">
                                        <div className="absolute -top-2 left-4 w-3 h-3 bg-white border-t border-l border-red-100 transform rotate-45"></div>
                                        <p className="font-bold text-red-600 text-xs mb-1">คอมเมนต์จากหัวหน้า:</p>
                                        "{review.feedback}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Manual Booking Form */}
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <p className="text-sm font-bold text-purple-900 mb-3">จองคิวตรวจเอง (Manual):</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">รอบ (Draft)</label>
                                <select className="w-full p-2 rounded-lg border border-purple-200 text-sm" value={bookingRound} onChange={e => setBookingRound(Number(e.target.value))}>
                                    <option value={1}>Draft 1</option>
                                    <option value={2}>Draft 2</option>
                                    <option value={3}>Draft 3</option>
                                    <option value={4}>Final</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">เวลานัด</label>
                                <input type="time" className="w-full p-2 rounded-lg border border-purple-200 text-sm" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
                            </div>
                        </div>
                        <div className="mb-3">
                             <label className="text-xs font-bold text-gray-500 mb-1 block">วันที่</label>
                             <input type="date" className="w-full p-2 rounded-lg border border-purple-200 text-sm" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                        </div>
                        <button onClick={handleBookReview} className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 shadow-sm">ยืนยันการจองคิว</button>
                    </div>
                </div>

                {/* 2. Audit Log */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">ประวัติการทำงาน (System Logs)</h3>
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
                        {initialData.logs?.map((log) => (
                            <div key={log.id} className="relative">
                                <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full border-2 border-white ${log.action === 'DELAYED' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${log.action === 'DELAYED' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{log.action}</span>
                                        <span className="text-xs text-gray-400">{format(log.createdAt, 'dd/MM HH:mm')}</span>
                                    </div>
                                    <p className="text-sm text-gray-800 font-medium">{log.details}</p>
                                    {log.reason && <p className="text-xs text-red-500 mt-1 bg-red-50 p-2 rounded-lg">Reason: {log.reason}</p>}
                                    <div className="flex items-center gap-1 mt-2">
                                        {log.user?.avatarUrl ? <img src={log.user.avatarUrl} className="w-4 h-4 rounded-full" /> : <div className="w-4 h-4 bg-gray-200 rounded-full"></div>}
                                        <span className="text-[10px] text-gray-500">by {log.user?.name || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : viewMode === 'COMMENTS' && initialData ? (
            <div className="flex-1 overflow-hidden p-6 bg-gray-50">
                <TaskComments taskId={initialData.id} currentUser={users[0]} />
            </div>
        ) : viewMode === 'ASSETS' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <TaskAssets assets={assets} onAdd={addAsset} onDelete={removeAsset} />
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center shadow-sm border border-red-100"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>}

                {/* --- WORKFLOW ACTIONS (Dynamic Buttons) --- */}
                {initialData && !isTaskDone && (
                    <div className="mb-6 animate-in slide-in-from-top-2">
                        {/* 1. Worker View: Submit for Review */}
                        {(status === 'DOING' || status === 'EDIT_DRAFT_1' || status === 'EDIT_DRAFT_2' || status === 'EDIT_CLIP') && (
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-800">งานเสร็จแล้วใช่ไหม?</h4>
                                    <p className="text-xs text-indigo-600">กดปุ่มส่งตรวจ เพื่อแจ้งหัวหน้างาน</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={handleSubmitForReview}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center active:scale-95 transition-all"
                                >
                                    <Send className="w-4 h-4 mr-2" /> ส่งตรวจ (Submit)
                                </button>
                            </div>
                        )}

                        {/* 2. Admin/Reviewer View: Approve or Revise */}
                        {status === 'FEEDBACK' && (
                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 shadow-sm">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                                        <FileCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-yellow-800">งานรอตรวจ (Review Pending)</h4>
                                        <p className="text-xs text-yellow-600">กรุณาตรวจสอบความถูกต้องก่อนอนุมัติ</p>
                                    </div>
                                </div>
                                
                                {!isRejecting ? (
                                    <div className="flex gap-3">
                                        <button 
                                            type="button"
                                            onClick={handleApproveTask}
                                            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center transition-all"
                                        >
                                            <ThumbsUp className="w-4 h-4 mr-2" /> ผ่าน (Approve)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsRejecting(true)}
                                            className="flex-1 py-2.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold flex items-center justify-center transition-all"
                                        >
                                            <Wrench className="w-4 h-4 mr-2" /> แก้ไข (Revise)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in">
                                        <textarea 
                                            className="w-full p-3 border border-red-200 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="ระบุจุดที่ต้องแก้ไข (Feedback)..."
                                            rows={2}
                                            value={reviseNote}
                                            onChange={e => setReviseNote(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button 
                                                type="button" 
                                                onClick={() => setIsRejecting(false)}
                                                className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={handleReviseTask}
                                                className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg shadow-sm"
                                            >
                                                ยืนยันส่งคืน
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- CONTENT FORM --- */}
                {activeTab === 'CONTENT' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {isTaskDone ? (
                            // --- PERFORMANCE MODE UI ---
                            <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100 space-y-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-green-100 p-2 rounded-lg text-green-700">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-green-800">บันทึกผลลัพธ์ (Performance)</h3>
                                        <p className="text-xs text-green-600">งานเสร็จแล้ว! อย่าลืมกลับมากรอกเลขหลังจากผ่านไป 7 วันนะ</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 flex items-center"><Eye className="w-3 h-3 mr-1"/> Views / Reach</label>
                                        <input type="number" value={performance.views} onChange={e => setPerformance({...performance, views: Number(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 flex items-center"><ThumbsUp className="w-3 h-3 mr-1"/> Likes</label>
                                        <input type="number" value={performance.likes} onChange={e => setPerformance({...performance, likes: Number(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 flex items-center"><Share2 className="w-3 h-3 mr-1"/> Shares</label>
                                        <input type="number" value={performance.shares} onChange={e => setPerformance({...performance, shares: Number(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500 flex items-center"><MessageCircle className="w-3 h-3 mr-1"/> Comments</label>
                                        <input type="number" value={performance.comments} onChange={e => setPerformance({...performance, comments: Number(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-gray-700 focus:ring-2 focus:ring-green-500 outline-none" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 flex items-center"><DollarSign className="w-3 h-3 mr-1"/> Revenue (รายได้โดยประมาณ)</label>
                                    <input type="number" value={performance.revenue} onChange={e => setPerformance({...performance, revenue: Number(e.target.value)})} className="w-full p-2.5 rounded-xl border border-gray-200 font-bold text-green-700 focus:ring-2 focus:ring-green-500 outline-none" placeholder="0.00" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">บทวิเคราะห์ (Reflection) - อะไรเวิร์ค/ไม่เวิร์ค?</label>
                                    <textarea 
                                        rows={3}
                                        value={performance.reflection}
                                        onChange={e => setPerformance({...performance, reflection: e.target.value})}
                                        className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
                                        placeholder="เช่น คลิปนี้คนชอบช่วงต้นมาก แต่ช่วงท้ายคนออกเยอะ..."
                                    />
                                </div>
                            </div>
                        ) : null}

                        {/* Standard Fields (Hidden partially if viewing performance but kept in DOM or structured?) -> Let's show them below for context */}
                        <div className={`space-y-6 ${isTaskDone ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            {/* Title & Format */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Topic <span className="text-red-500">*</span></label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-indigo-50/30 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold" placeholder="ชื่อคอนเทนต์..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Format</label>
                                    <select value={contentFormat} onChange={(e) => setContentFormat(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none">
                                        <option value="">-- กรุณาเลือก --</option>
                                        {formatOptions.length > 0 ? (
                                            formatOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                        ) : (
                                            <option disabled>ไม่มีข้อมูล (กรุณาเพิ่ม Master Data)</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Channel & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Channel</label>
                                    <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none">
                                        {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                                    </select>
                                </div>
                                
                                {/* Status Field */}
                                {/* Status */}
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Status
                                    </label>

                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                                    >
                                        <option value="">-- กรุณาเลือก --</option>

                                        {statusOptions.length > 0 ? (
                                            statusOptions.map(opt => (
                                                <option key={opt.key} value={opt.key}>
                                                    {opt.label}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>
                                                ไม่มีข้อมูล (กรุณาเพิ่ม Master Data)
                                            </option>
                                        )}
                                    </select>
                                </div>

                            </div>

                            {/* Platform Selection */}
                            {selectedChannelObj && selectedChannelObj.platforms.length > 0 && (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex flex-wrap gap-2">
                                        {selectedChannelObj.platforms.map(p => {
                                            const Icon = PLATFORM_ICONS[p];
                                            const isSelected = targetPlatforms.includes(p);
                                            return (
                                                <button key={p} type="button" onClick={() => togglePlatform(p)} className={`flex items-center px-3 py-1.5 rounded-lg border text-sm font-bold transition-all relative ${isSelected ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm ring-1 ring-indigo-500' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                                    <Icon className="w-4 h-4 mr-1.5" />{p}{isSelected && <Check className="w-3 h-3 ml-1.5 text-indigo-500" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {/* Pillar & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Pillar</label>
                                    <select value={pillar} onChange={(e) => setPillar(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none">
                                        <option value="">-- กรุณาเลือก --</option>
                                        {pillarOptions.length > 0 ? (
                                            pillarOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)
                                        ) : (
                                            <option disabled>ไม่มีข้อมูล (กรุณาเพิ่ม Master Data)</option>
                                        )}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Category</label>
                                    {/* Changed from Input+Datalist to Select */}
                                    <select 
                                        value={category} 
                                        onChange={(e) => setCategory(e.target.value)} 
                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none"
                                    >
                                        <option value="">-- กรุณาเลือก --</option>
                                        {categoryOptions.length > 0 ? (
                                            categoryOptions.map(cat => (
                                                <option key={cat.key} value={cat.key}>{cat.label}</option>
                                            ))
                                        ) : (
                                            <option disabled>ไม่มีข้อมูล (กรุณาเพิ่ม Master Data)</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {/* Stock & Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div onClick={() => setIsStock(!isStock)} className={`flex items-center p-2 rounded-lg cursor-pointer transition-all ${isStock ? 'text-indigo-700 font-bold' : 'text-gray-600'}`}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${isStock ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-400'}`}>
                                        {isStock && <Layout className="w-3 h-3 text-white" />}
                                    </div>
                                    <span>เก็บเข้า Stock (ยังไม่ระบุวัน)</span>
                                </div>
                                <div className={`space-y-1 transition-all duration-300 ${isStock ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Publish Date</label>
                                    <div className="relative">
                                        <CalIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setStartDate(e.target.value); }} disabled={isStock} className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* People */}
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                {[
                                    { label: 'Idea Owner', icon: Lightbulb, list: ideaOwnerIds, setter: setIdeaOwnerIds, color: 'yellow' },
                                    { label: 'Editor', icon: Video, list: editorIds, setter: setEditorIds, color: 'purple' },
                                    { label: 'Sub / Help', icon: UserIcon, list: assigneeIds, setter: setAssigneeIds, color: 'green' }
                                ].map((role) => (
                                    <div key={role.label} className="space-y-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase flex items-center"><role.icon className="w-3 h-3 mr-1"/> {role.label}</label>
                                        <div className="flex flex-wrap gap-1">
                                            {usersForSelection.map((user) => (
                                                <button key={`${role.label}-${user.id}`} type="button" onClick={() => toggleUserSelection(user.id, role.list, role.setter)} className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center p-0 overflow-hidden ${role.list.includes(user.id) ? `ring-2 ring-${role.color}-400 border-${role.color}-400` : 'border-gray-200 opacity-60 hover:opacity-100'} ${!user.isActive ? 'grayscale opacity-50' : ''}`} title={user.name + (!user.isActive ? ' (Inactive)' : '')}>
                                                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{user.name.charAt(0).toUpperCase()}</div>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description & Remark */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">IDEA / Brief</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm" placeholder="รายละเอียดไอเดีย..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-gray-700">Remark (หมายเหตุ)</label>
                                    <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={3} className="w-full px-4 py-3 bg-yellow-50 border border-yellow-100 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none resize-none text-sm" placeholder="Note เพิ่มเติม..." />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TASK FORM (Simplified) --- */}
                {activeTab === 'TASK' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* Similar structure but simpler */}
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">ชื่องาน <span className="text-red-500">*</span></label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        {/* ... date, status, assignee ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">เริ่มวันที่</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-700">Due Date</label>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                            </div>
                        </div>

                        {/* --- Moved: Difficulty & Hours (Gamification) --- */}
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-emerald-800 uppercase flex items-center">
                                    <Star className="w-3 h-3 mr-1" /> Gamification
                                </span>
                                <span className="text-xs font-black text-white bg-emerald-500 px-2 py-0.5 rounded-full shadow-sm">
                                    Projected: +{totalProjectedXP} XP
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase flex items-center">
                                        <BarChart3 className="w-3 h-3 mr-1" /> Level ความยาก
                                    </label>
                                    <select 
                                        value={difficulty} 
                                        onChange={(e) => setDifficulty(e.target.value as any)} 
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium"
                                    >
                                        {Object.entries(DIFFICULTY_LABELS).map(([key, val]) => (
                                            <option key={key} value={key}>{val.label} (+{val.xp} XP)</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase flex items-center">
                                        <Timer className="w-3 h-3 mr-1" /> Est. Hours (ชม.)
                                    </label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="0.5"
                                        value={estimatedHours} 
                                        onChange={(e) => setEstimatedHours(Number(e.target.value))} 
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none text-sm font-medium"
                                        placeholder="0"
                                    />
                                    <p className="text-[10px] text-emerald-600 text-right">+20 XP / ชม.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center"><UserIcon className="w-4 h-4 mr-1"/> ผู้รับผิดชอบ</label>
                            <div className="flex flex-wrap gap-2">
                                {usersForSelection.map((user) => (
                                    <button key={`assignee-${user.id}`} type="button" onClick={() => toggleUserSelection(user.id, assigneeIds, setAssigneeIds)} className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm border transition-all ${assigneeIds.includes(user.id) ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-gray-200 text-gray-600'} ${!user.isActive ? 'grayscale opacity-50' : ''}`}>
                                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">{user.name.charAt(0).toUpperCase()}</div>}
                                        <span>{user.name.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-semibold text-gray-700">รายละเอียด</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none" placeholder="Note กันลืม..." />
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-gray-100 bg-white sticky bottom-0">
                    <div>
                    {initialData && onDelete && (
                        <button type="button" onClick={() => { if(confirm('แน่ใจนะว่าจะลบงานนี้?')) { onDelete(initialData.id); onClose(); } }} className="text-red-500 text-sm hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg flex items-center transition-colors">
                        <Trash2 className="w-4 h-4 mr-2" /> ลบ
                        </button>
                    )}
                    </div>
                    <div className="flex space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                            {viewMode === 'DETAILS' ? 'ยกเลิก' : 'กลับ'}
                        </button>
                        <button type="submit" className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all active:scale-95 ${activeTab === 'CONTENT' ? (isTaskDone ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200') : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
                        {initialData ? 'บันทึกแก้ไข' : 'สร้างรายการ'}
                        </button>
                    </div>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
