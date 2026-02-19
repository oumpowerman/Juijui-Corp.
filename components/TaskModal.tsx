
import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Paperclip, MessageSquare, History, Film, CheckSquare, Book, Sparkles, Layout, Activity, Truck, FileText } from 'lucide-react';
import { Task, Channel, TaskType, User, MasterOption, Script } from '../types';
import TaskComments from './TaskComments';
import TaskAssets from './TaskAssets';
import TaskHistory from './task/TaskHistory';
import TaskWiki from './task/TaskWiki';
import ContentForm from './task/ContentForm';
import GeneralTaskForm from './task/GeneralTaskForm';
import LogisticsTab from './task/LogisticsTab';
import ScriptEditor from './script/ScriptEditor'; // Import ScriptEditor
import { useScripts } from '../hooks/useScripts'; // Import Hook

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onUpdate?: (task: Task) => void; 
  onDelete?: (taskId: string) => void;
  initialData?: Task | null;
  selectedDate?: Date | null;
  channels: Channel[];
  users: User[];
  lockedType?: TaskType | null; 
  masterOptions?: MasterOption[];
  currentUser?: User; 
  projects?: Task[]; 
}

// --- 🎨 UI CONFIGURATION: Contextual Themes ---
const TAB_CONFIGS: Record<string, { color: string, icon: any, label: string }> = {
    DETAILS: { color: 'indigo', icon: Layout, label: 'รายละเอียด' },
    LOGISTICS: { color: 'cyan', icon: Truck, label: 'งานย่อย' },
    SCRIPT: { color: 'rose', icon: FileText, label: 'สคริปต์' },
    COMMENTS: { color: 'emerald', icon: MessageSquare, label: 'แชท' },
    ASSETS: { color: 'amber', icon: Paperclip, label: 'ไฟล์' },
    HISTORY: { color: 'slate', icon: History, label: 'ประวัติ' },
    WIKI: { color: 'sky', icon: Book, label: 'คู่มือ' },
};

const TaskModal: React.FC<TaskModalProps> = ({ 
    isOpen, onClose, onSave, onUpdate, onDelete, initialData, selectedDate, channels, users, lockedType, masterOptions = [], currentUser, projects = [] 
}) => {
  // Main View State
  const [viewMode, setViewMode] = useState<'DETAILS' | 'COMMENTS' | 'ASSETS' | 'HISTORY' | 'WIKI' | 'LOGISTICS' | 'SCRIPT'>('DETAILS');
  
  // Tab State (Content vs Task) - Synced with props
  const [activeTab, setActiveTab] = useState<TaskType>('CONTENT');

  // Script Data for General Task
  const { getScriptById, updateScript } = useScripts(currentUser || { id: '', name: '', role: 'MEMBER' } as User);
  const [taskScript, setTaskScript] = useState<Script | null>(null);

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

  // Load Script if viewing script tab
  useEffect(() => {
      if (viewMode === 'SCRIPT' && initialData?.scriptId) {
          const loadScript = async () => {
              const script = await getScriptById(initialData.scriptId!);
              setTaskScript(script);
          };
          loadScript();
      }
  }, [viewMode, initialData?.scriptId]);

  const assetCount = initialData?.assets?.length || 0;
  const isContent = initialData?.type === 'CONTENT' || activeTab === 'CONTENT';
  const hasLinkedScript = initialData?.type === 'TASK' && !!initialData.scriptId;

  // --- Theme Logic ---
  const currentTheme = TAB_CONFIGS[viewMode] || TAB_CONFIGS.DETAILS;
  const themeColor = currentTheme.color;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-950/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300 font-kanit">
      
      {/* Dynamic Border Container */}
      <div className={`
          bg-white w-full sm:max-w-4xl h-full sm:h-[90vh] sm:rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col 
          border-[6px] transition-colors duration-500
          border-${themeColor}-100 ring-1 ring-${themeColor}-200
      `}>
        
        {/* --- DYNAMIC HEADER --- */}
        <div className={`
            px-6 py-4 border-b flex justify-between items-center shrink-0 transition-colors duration-500
            bg-${themeColor}-50/50 border-${themeColor}-100
        `}>
            <div className="flex items-center gap-4">
                {viewMode !== 'DETAILS' && (
                    <button 
                        onClick={() => setViewMode('DETAILS')} 
                        className={`p-2 rounded-xl transition-all active:scale-90 border bg-white border-${themeColor}-200 text-${themeColor}-400 hover:text-${themeColor}-600 hover:bg-${themeColor}-50`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h2 className={`text-2xl font-black tracking-tight flex items-center gap-2 text-slate-800 transition-colors`}>
                        {viewMode === 'DETAILS' ? (
                             initialData ? (initialData.title || 'แก้ไขงาน') : (activeTab === 'CONTENT' ? '🎬 สร้างคอนเทนต์ใหม่' : '⚡ สร้างภารกิจใหม่')
                        ) : (
                            <span className={`flex items-center gap-2 text-${themeColor}-600`}>
                                {React.createElement(currentTheme.icon, { className: "w-6 h-6" })}
                                {currentTheme.label}
                            </span>
                        )}
                    </h2>
                    
                    {/* Meta Badge */}
                    {viewMode === 'DETAILS' && (
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest border uppercase ${activeTab === 'CONTENT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {activeTab}
                            </span>
                            {initialData && <span className="text-[10px] text-gray-400 font-mono">ID: {initialData.id.slice(0,8)}</span>}
                        </div>
                    )}
                </div>
            </div>
            
            <button 
                onClick={onClose} 
                className={`p-2 rounded-full transition-all border border-transparent hover:rotate-90 bg-white/50 text-slate-400 hover:text-${themeColor}-500 hover:bg-white`}
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* --- LIQUID NAVIGATION (Floating Capsule) --- */}
        {initialData && (
            <div className="px-6 pt-4 pb-2 bg-white shrink-0 z-20">
                <div className="flex bg-gray-100/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide relative gap-1">
                    {[
                        { id: 'DETAILS', label: 'รายละเอียด', icon: Layout },
                        ...(isContent ? [{ id: 'LOGISTICS', label: 'งานย่อย', icon: Truck }] : []),
                        ...(hasLinkedScript ? [{ id: 'SCRIPT', label: 'สคริปต์', icon: FileText }] : []),
                        { id: 'COMMENTS', label: 'แชท', icon: MessageSquare },
                        { id: 'ASSETS', label: 'ไฟล์', icon: Paperclip, count: assetCount },
                        { id: 'HISTORY', label: 'ประวัติ', icon: History },
                        { id: 'WIKI', label: 'คู่มือ', icon: Book }
                    ].map((tab) => {
                        const isActive = viewMode === tab.id;
                        const config = TAB_CONFIGS[tab.id];
                        // Dynamic styles based on active state
                        const activeClass = isActive 
                            ? `bg-white text-${config.color}-600 shadow-md scale-[1.02] ring-1 ring-black/5` 
                            : `text-slate-500 hover:bg-gray-200/50 hover:text-slate-700`;

                        return (
                            <button 
                                key={tab.id}
                                onClick={() => setViewMode(tab.id as any)}
                                className={`
                                    flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 ease-out flex items-center justify-center gap-2 whitespace-nowrap relative
                                    ${activeClass}
                                `}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                                {tab.label}
                                {tab.count && tab.count > 0 && (
                                    <span className={`
                                        absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-white
                                        ${isActive ? `bg-${config.color}-500` : 'bg-slate-400'}
                                    `}></span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- BODY CONTENT SWITCHER --- */}
        <div className="flex-1 overflow-hidden relative bg-white flex flex-col">
            
            {/* Animated Wrapper */}
            <div 
                key={viewMode} 
                className="flex-1 overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out"
            >
                {viewMode === 'HISTORY' && initialData ? (
                    <TaskHistory task={initialData} currentUser={currentUser} onSaveTask={onSave} />
                ) : viewMode === 'COMMENTS' && initialData && currentUser ? (
                    <div className="flex-1 overflow-hidden p-0 bg-gray-50">
                        <TaskComments taskId={initialData.id} taskType={initialData.type} currentUser={currentUser} />
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
                ) : viewMode === 'LOGISTICS' && initialData && currentUser ? (
                     <LogisticsTab 
                        parentContentId={initialData.id}
                        users={users}
                        currentUser={currentUser}
                        onUpdate={onUpdate}
                     />
                ) : viewMode === 'WIKI' ? (
                    <TaskWiki className="flex-1" />
                ) : viewMode === 'SCRIPT' && taskScript && currentUser ? (
                    // --- SCRIPT EDITOR EMBED ---
                    <div className="flex-1 relative overflow-hidden flex flex-col">
                        <ScriptEditor 
                            script={taskScript}
                            users={users}
                            channels={channels}
                            masterOptions={masterOptions}
                            currentUser={currentUser}
                            onClose={() => setViewMode('DETAILS')} // Back to details
                            onSave={updateScript}
                            onGenerateAI={async () => null} 
                            onPromote={() => {}} 
                        />
                    </div>
                ) : (
                    // Form Selection Logic (DETAILS)
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
                            projects={projects}
                            channels={channels}
                            onSave={(task) => { onSave(task); onClose(); }}
                            onDelete={onDelete}
                            onClose={onClose}
                        />
                    )
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
