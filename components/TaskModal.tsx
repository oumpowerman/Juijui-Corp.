
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Paperclip, MessageSquare, History, Film, CheckSquare, Book, Sparkles, Layout, Activity, Truck } from 'lucide-react';
import { Task, Channel, TaskType, User, MasterOption } from '../types';
import TaskComments from './TaskComments';
import TaskAssets from './TaskAssets';
import TaskHistory from './task/TaskHistory';
import TaskWiki from './task/TaskWiki';
import ContentForm from './task/ContentForm';
import GeneralTaskForm from './task/GeneralTaskForm';
import LogisticsTab from './task/LogisticsTab';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onUpdate?: (task: Task) => void; // New prop for live updates without closing
  onDelete?: (taskId: string) => void;
  initialData?: Task | null;
  selectedDate?: Date | null;
  channels: Channel[];
  users: User[];
  lockedType?: TaskType | null; 
  masterOptions?: MasterOption[];
  currentUser?: User; 
  projects?: Task[]; // Added projects list for linking
}

const TaskModal: React.FC<TaskModalProps> = ({ 
    isOpen, onClose, onSave, onUpdate, onDelete, initialData, selectedDate, channels, users, lockedType, masterOptions = [], currentUser, projects = [] 
}) => {
  // Main View State
  const [viewMode, setViewMode] = useState<'DETAILS' | 'COMMENTS' | 'ASSETS' | 'HISTORY' | 'WIKI' | 'LOGISTICS'>('DETAILS');
  
  // Tab State (Content vs Task) - Synced with props
  const [activeTab, setActiveTab] = useState<TaskType>('CONTENT');

  // Sync state when modal opens or props change
  useEffect(() => {
      if (isOpen) {
          setViewMode('DETAILS');
          if (initialData) {
              setActiveTab(initialData.type);
          } else if (lockedType) {
              setActiveTab(lockedType);
          } else {
              setActiveTab('CONTENT');
          }
      }
  }, [isOpen, initialData, lockedType]);

  const assetCount = initialData?.assets?.length || 0;
  const isContent = initialData?.type === 'CONTENT' || activeTab === 'CONTENT';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md sm:p-4 animate-in fade-in duration-300 font-kanit">
      <div className="bg-white w-full sm:max-w-3xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] border-4 border-white transition-all">
        
        {/* --- DYNAMIC HEADER --- */}
        <div className="px-8 py-5 border-b border-gray-100 bg-white sticky top-0 z-20 flex justify-between items-center">
            <div className="flex items-center gap-4">
                {viewMode !== 'DETAILS' && (
                    <button onClick={() => setViewMode('DETAILS')} className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-all active:scale-90">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        {viewMode === 'HISTORY' ? '🕒 ไทม์แมชชีน (History)' : 
                        viewMode === 'COMMENTS' ? '💬 ความคิดเห็น (Chat)' : 
                        viewMode === 'ASSETS' ? '📂 คลังไฟล์ (Assets)' : 
                        viewMode === 'WIKI' ? '📚 คู่มือ (Wiki)' :
                        viewMode === 'LOGISTICS' ? '🚛 งานย่อย (Logistics)' :
                        (initialData ? '✏️ จัดการข้อมูล' : 
                            (activeTab === 'CONTENT' ? '🎬 สร้างคอนเทนต์' : '⚡ สร้างงานทั่วไป')
                        )}
                    </h2>
                    {viewMode === 'DETAILS' && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest border uppercase ${activeTab === 'CONTENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                {activeTab}
                            </span>
                            {initialData && <span className="text-[10px] text-gray-400 font-mono">ID: {initialData.id.slice(0,8)}</span>}
                        </div>
                    )}
                </div>
            </div>
            
            <button onClick={onClose} className="p-2.5 hover:bg-red-50 rounded-full transition-all text-gray-400 hover:text-red-500">
                <X className="w-6 h-6 stroke-[3px]" />
            </button>
        </div>

        {/* --- MAIN TABS (For Edit Mode) --- */}
        {initialData && (
            <div className="flex bg-gray-50/80 border-b border-gray-100 p-1.5 gap-1.5 shrink-0 px-8 overflow-x-auto scrollbar-hide">
                <button 
                    onClick={() => setViewMode('DETAILS')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap px-3 ${viewMode === 'DETAILS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:bg-white/50'}`}
                >
                    <Layout className="w-4 h-4" /> รายละเอียด
                </button>
                
                {isContent && (
                    <button 
                        onClick={() => setViewMode('LOGISTICS')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap px-3 ${viewMode === 'LOGISTICS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:bg-white/50'}`}
                    >
                        <Truck className="w-4 h-4" /> งานย่อย
                    </button>
                )}

                <button 
                    onClick={() => setViewMode('COMMENTS')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap px-3 ${viewMode === 'COMMENTS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:bg-white/50'}`}
                >
                    <MessageSquare className="w-4 h-4" /> แชทคุยงาน
                </button>
                <button 
                    onClick={() => setViewMode('ASSETS')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 relative whitespace-nowrap px-3 ${viewMode === 'ASSETS' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:bg-white/50'}`}
                >
                    <Paperclip className="w-4 h-4" /> ไฟล์แนบ
                    {assetCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center border-2 border-white">{assetCount}</span>}
                </button>
                <button 
                    onClick={() => setViewMode('HISTORY')}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 whitespace-nowrap px-3 ${viewMode === 'HISTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:bg-white/50'}`}
                >
                    <History className="w-4 h-4" /> ประวัติ
                </button>
                <button 
                    onClick={() => setViewMode('WIKI')}
                    className={`p-2 rounded-xl text-xs font-black transition-all flex items-center justify-center whitespace-nowrap ${viewMode === 'WIKI' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-gray-400 hover:bg-white/50'}`}
                    title="คู่มือ"
                >
                    <Book className="w-4 h-4" />
                </button>
            </div>
        )}

        {/* --- BODY CONTENT SWITCHER --- */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
            {viewMode === 'HISTORY' && initialData ? (
                <TaskHistory task={initialData} currentUser={currentUser} onSaveTask={onSave} />
            ) : viewMode === 'COMMENTS' && initialData && currentUser ? (
                <div className="flex-1 overflow-hidden p-0 bg-gray-50">
                    <TaskComments taskId={initialData.id} currentUser={currentUser} />
                </div>
            ) : viewMode === 'ASSETS' && initialData ? (
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    <TaskAssets 
                        assets={initialData.assets || []} 
                        onAdd={(newAsset) => {
                            const updatedAssets = [...(initialData.assets || []), newAsset];
                            onSave({ ...initialData, assets: updatedAssets });
                        }} 
                        onDelete={(id) => {
                            const updatedAssets = (initialData.assets || []).filter(a => a.id !== id);
                            onSave({ ...initialData, assets: updatedAssets });
                        }} 
                    />
                </div>
            ) : viewMode === 'LOGISTICS' && initialData ? (
                 <LogisticsTab 
                    parentContentId={initialData.id}
                    users={users}
                    onUpdate={onUpdate}
                 />
            ) : viewMode === 'WIKI' ? (
                <TaskWiki className="flex-1" />
            ) : (
                // Form Selection Logic
                activeTab === 'CONTENT' ? (
                    <ContentForm 
                        key={initialData ? `content-${initialData.id}` : 'new-content'}
                        initialData={initialData}
                        selectedDate={selectedDate}
                        channels={channels}
                        users={users}
                        masterOptions={masterOptions}
                        currentUser={currentUser} 
                        onSave={(task) => { onSave(task); onClose(); }}
                        onDelete={onDelete}
                        onClose={onClose}
                    />
                ) : (
                    <GeneralTaskForm 
                        key={initialData ? `task-${initialData.id}` : 'new-task'}
                        initialData={initialData}
                        selectedDate={selectedDate}
                        users={users}
                        masterOptions={masterOptions}
                        currentUser={currentUser} 
                        projects={projects} // Pass Projects here
                        onSave={(task) => { onSave(task); onClose(); }}
                        onDelete={onDelete}
                        onClose={onClose}
                    />
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
