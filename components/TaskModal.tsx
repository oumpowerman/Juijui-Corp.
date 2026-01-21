
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Paperclip, MessageSquare, History, Film, CheckSquare, Book, Sparkles } from 'lucide-react';
import { Task, Channel, TaskType, User, MasterOption } from '../types';
import TaskComments from './TaskComments';
import TaskAssets from './TaskAssets';
import TaskHistory from './task/TaskHistory';
import TaskWiki from './task/TaskWiki';
import ContentForm from './task/ContentForm';
import GeneralTaskForm from './task/GeneralTaskForm';

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

const TaskModal: React.FC<TaskModalProps> = ({ 
    isOpen, onClose, onSave, onDelete, initialData, selectedDate, channels, users, lockedType, masterOptions = [], currentUser 
}) => {
  // Main View State
  const [viewMode, setViewMode] = useState<'DETAILS' | 'COMMENTS' | 'ASSETS' | 'HISTORY' | 'WIKI'>('DETAILS');
  
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200 font-kanit">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border-4 border-indigo-50 transition-transform duration-300 transform translate-y-0">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2">
                {viewMode !== 'DETAILS' && (
                    <button onClick={() => setViewMode('DETAILS')} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                        {viewMode === 'HISTORY' ? '🕒 ไทม์แมชชีน (History)' : 
                        viewMode === 'COMMENTS' ? '💬 ความคิดเห็น (Comments)' : 
                        viewMode === 'ASSETS' ? '📂 ไฟล์แนบ (Assets)' : 
                        viewMode === 'WIKI' ? '📚 คู่มือ (Wiki)' :
                        (initialData ? '✏️ แก้ไขข้อมูล' : 
                            (activeTab === 'CONTENT' ? '🎬 สร้างคอนเทนต์ใหม่' : '⚡ สร้างงานทั่วไป')
                        )}
                    </h2>
                </div>
             </div>
             
             <div className="flex items-center gap-1">
                 {/* Wiki Button */}
                 <button 
                    type="button" 
                    onClick={() => setViewMode(prev => prev === 'WIKI' ? 'DETAILS' : 'WIKI')} 
                    className={`p-2 rounded-xl transition-all ${viewMode === 'WIKI' ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    title="คู่มือ (Wiki)"
                 >
                     <Book className="w-5 h-5" />
                 </button>

                 {initialData && (
                     <>
                        <button type="button" onClick={() => setViewMode(prev => prev === 'HISTORY' ? 'DETAILS' : 'HISTORY')} className={`p-2 rounded-xl transition-all ${viewMode === 'HISTORY' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <History className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={() => setViewMode(prev => prev === 'ASSETS' ? 'DETAILS' : 'ASSETS')} className={`p-2 rounded-xl transition-all relative ${viewMode === 'ASSETS' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <Paperclip className="w-5 h-5" />
                            {assetCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center border border-white">{assetCount}</span>}
                        </button>
                        <button type="button" onClick={() => setViewMode(prev => prev === 'COMMENTS' ? 'DETAILS' : 'COMMENTS')} className={`p-2 rounded-xl transition-all ${viewMode === 'COMMENTS' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <MessageSquare className="w-5 h-5" />
                        </button>
                     </>
                 )}
                 <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-red-500 ml-1">
                    <X className="w-6 h-6" />
                 </button>
             </div>
          </div>
          
          {/* STATIC TYPE INDICATOR */}
          {viewMode === 'DETAILS' && (
              <div className="flex items-center gap-2 mt-2">
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center border ${activeTab === 'CONTENT' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                      {activeTab === 'CONTENT' ? <Film className="w-3 h-3 mr-1.5" /> : <CheckSquare className="w-3 h-3 mr-1.5" />}
                      {activeTab === 'CONTENT' ? 'CONTENT (รายการ/คลิป)' : 'TASK (งานทั่วไป)'}
                  </div>
                  {initialData && (
                      <span className="text-xs text-gray-400 font-medium">#{initialData.id.slice(0,6)}</span>
                  )}
              </div>
          )}
        </div>

        {/* --- BODY CONTENT SWITCHER --- */}
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
                    currentUser={currentUser} // Optional now
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
                    currentUser={currentUser} // Pass currentUser to GeneralTaskForm
                    onSave={(task) => { onSave(task); onClose(); }}
                    onDelete={onDelete}
                    onClose={onClose}
                />
            )
        )}
      </div>
    </div>
  );
};

export default TaskModal;
