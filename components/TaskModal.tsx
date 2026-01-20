
import React, { useState } from 'react';
import { X, ArrowLeft, Paperclip, MessageSquare, History, Film, CheckSquare, TrendingUp, Book } from 'lucide-react';
import { Task, Channel, TaskType, User, MasterOption } from '../types';
import TaskComments from './TaskComments';
import TaskAssets from './TaskAssets';
import TaskHistory from './task/TaskHistory';
import TaskWiki from './task/TaskWiki'; // Import Wiki
import TaskForm from './task/TaskForm'; // Import New Form
import { useTaskForm } from '../hooks/useTaskForm'; // Keep for logic if needed or pass props

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
  const [activeTab, setActiveTab] = useState<TaskType>(lockedType || (initialData?.type || 'CONTENT'));

  // Calculate Asset Count for Badge
  const assetCount = initialData?.assets?.length || 0;

  if (!isOpen) return null;

  const isTaskDone = initialData && (initialData.status === 'DONE' || initialData.status === 'APPROVE');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200 font-kanit">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] border-4 border-indigo-50 transition-transform duration-300 transform translate-y-0">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
                {viewMode !== 'DETAILS' && (
                    <button onClick={() => setViewMode('DETAILS')} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
                    {viewMode === 'HISTORY' ? '🕒 ไทม์แมชชีน' : 
                     viewMode === 'COMMENTS' ? '💬 เม้าท์มอย' : 
                     viewMode === 'ASSETS' ? '📂 คลังสมบัติ' : 
                     viewMode === 'WIKI' ? '📚 คู่มือ (Wiki)' :
                     (initialData ? '✏️ แก้ไขงาน' : '✨ สร้างงานใหม่')}
                </h2>
             </div>
             
             <div className="flex items-center gap-1.5">
                 {/* Wiki Button - Always visible or only on create/edit? Visible always is better */}
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
          
          {/* TAB SWITCHER (Only in Details mode) */}
          {!lockedType && viewMode === 'DETAILS' && (
              <div className="flex bg-gray-100 p-1.5 rounded-2xl relative overflow-hidden shadow-inner border border-gray-200">
                  <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${activeTab === 'CONTENT' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}></div>
                  <button type="button" onClick={() => setActiveTab('CONTENT')} className={`relative z-10 flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'CONTENT' ? 'text-indigo-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}>
                      <Film className="w-4 h-4 mr-2" /> CONTENT (อาหาร)
                  </button>
                  <button type="button" onClick={() => setActiveTab('TASK')} className={`relative z-10 flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'TASK' ? 'text-emerald-600 scale-105' : 'text-gray-500 hover:text-gray-700'}`}>
                      <CheckSquare className="w-4 h-4 mr-2" /> TASK (คนปรุง)
                  </button>
                  
                  {/* Performance Button (If Done) - Optional, maybe better inside Content Form */}
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
                        // Optimistic update wrapper
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
            // Default: Form View
            <TaskForm 
                initialData={initialData}
                selectedDate={selectedDate}
                channels={channels}
                users={users}
                lockedType={lockedType}
                masterOptions={masterOptions}
                currentUser={currentUser}
                onSave={(task) => { onSave(task); onClose(); }}
                onDelete={onDelete}
                onClose={onClose}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        )}
      </div>
    </div>
  );
};

export default TaskModal;
