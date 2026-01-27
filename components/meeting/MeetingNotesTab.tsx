
import React, { useState } from 'react';
import { MeetingAgendaItem, TaskAsset } from '../../types';
import { Paperclip, Plus, Link as LinkIcon, File } from 'lucide-react';
import MeetingAgenda from './MeetingAgenda';
import MeetingNotes from './MeetingNotes';
import AddLinkModal from './AddLinkModal';

interface MeetingNotesTabProps {
    agenda: MeetingAgendaItem[];
    onAddAgenda: (topic: string) => void;
    onToggleAgenda: (id: string) => void;
    onDeleteAgenda: (id: string) => void;

    assets: TaskAsset[];
    onAddAsset: (name: string, url: string) => void; 

    content: string;
    setContent: (val: string) => void;
    onBlurContent: () => void;
}

const MeetingNotesTab: React.FC<MeetingNotesTabProps> = ({
    agenda, onAddAgenda, onToggleAgenda, onDeleteAgenda,
    assets, onAddAsset,
    content, setContent, onBlurContent
}) => {
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);

    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-6 relative h-full">
            
            {/* TOP ROW: Assets & Agenda (Hidden in Focus Mode) */}
            {/* We keep this mounted but hidden via CSS or null return to preserve state if needed, 
                but for cleaner DOM in Focus Mode, we conditionally render */}
            {!isFocusMode && (
                <div className="flex flex-col-reverse lg:flex-row gap-6 shrink-0 min-h-[160px] animate-in fade-in slide-in-from-top-4 duration-500">
                    
                    {/* LEFT: Attachments Panel */}
                    <div className="flex-1 bg-white rounded-[2rem] border border-gray-200 shadow-sm p-5 flex flex-col relative overflow-hidden group">
                         {/* Header */}
                         <div className="flex items-center justify-between mb-4 relative z-10">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center">
                                <Paperclip className="w-4 h-4 mr-2 text-indigo-400" /> ไฟล์แนบ (Attachments)
                            </h4>
                            <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{assets.length}</span>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap content-start gap-2 relative z-10 max-h-[200px] lg:max-h-none">
                            {assets.length === 0 && (
                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 py-4 border-2 border-dashed border-gray-100 rounded-xl">
                                    <File className="w-8 h-8 mb-1 opacity-20" />
                                    <span className="text-[10px]">ยังไม่มีไฟล์แนบ</span>
                                </div>
                            )}
                            {assets.map(asset => (
                                <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" className="group flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all shadow-sm h-10 max-w-full">
                                    <div className="p-1 bg-white rounded-lg border border-gray-100 shrink-0 group-hover:border-indigo-100">
                                        <LinkIcon className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:text-indigo-500" /> 
                                    </div>
                                    <span className="font-bold truncate">{asset.name || asset.url}</span>
                                </a>
                            ))}
                            
                            <button 
                                onClick={() => setIsLinkModalOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg active:scale-95 h-10"
                            >
                                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">เพิ่มไฟล์</span>
                            </button>
                        </div>

                        {/* Decor */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
                    </div>

                    {/* RIGHT: Agenda Widget (Fixed Width on Desktop) */}
                    <div className="w-full lg:w-96 shrink-0 h-full">
                        <MeetingAgenda 
                            agenda={agenda}
                            onToggle={onToggleAgenda}
                            onDelete={onDeleteAgenda}
                            onAdd={onAddAgenda}
                        />
                    </div>
                </div>
            )}

            {/* BOTTOM ROW: Notes (Handles Fullscreen internally via CSS class in MeetingNotes) */}
            <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isFocusMode ? 'z-[100]' : 'min-h-[400px]'}`}>
                <MeetingNotes 
                    initialContent={content}
                    onUpdate={setContent}
                    onBlur={onBlurContent}
                    isFocused={isFocusMode}
                    onToggleFocus={() => setIsFocusMode(!isFocusMode)}
                />
            </div>

            {/* ATTACH MODAL */}
            <AddLinkModal 
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                onSave={onAddAsset}
            />
        </div>
    );
};

export default MeetingNotesTab;
