import React, { useState } from 'react';
import { MeetingAgendaItem, TaskAsset } from '../../types';
import { Paperclip, Plus, Link as LinkIcon } from 'lucide-react';
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

    return (
        <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4"> {/* FIX: Reduced padding and gap (gap-6 -> gap-4) */}
            
            {/* AGENDA CARD */}
            <MeetingAgenda 
                agenda={agenda}
                onToggle={onToggleAgenda}
                onDelete={onDeleteAgenda}
                onAdd={onAddAgenda}
            />

            {/* ATTACHMENTS SECTION */}
            <div className="flex flex-col gap-2">
                 <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                        <Paperclip className="w-3.5 h-3.5 mr-2" /> ไฟล์แนบ (Attachments)
                    </h4>
                </div>

                <div className="flex flex-wrap gap-2">
                    {assets.map(asset => (
                        <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md h-9">
                            <LinkIcon className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> 
                            <span className="font-bold truncate max-w-[120px]">{asset.name || asset.url}</span>
                        </a>
                    ))}
                    
                    <button 
                        onClick={() => setIsLinkModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all border border-indigo-100 hover:border-indigo-200 h-9"
                    >
                        <Plus className="w-3.5 h-3.5" /> เพิ่มไฟล์
                    </button>
                </div>
            </div>

            {/* FIX: Removed large divider margin to bring notes closer */}
            <div className="h-px bg-gray-100"></div>

            {/* NOTES COMPONENT */}
            <MeetingNotes 
                initialContent={content}
                onUpdate={setContent}
                onBlur={onBlurContent}
            />

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