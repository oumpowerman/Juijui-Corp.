import React from 'react';
import { FileText, Loader2, Link, PlusCircle, X } from 'lucide-react';
import { ScriptSummary } from '../../../types';

interface GTScriptLinkerProps {
    scriptId: string | undefined;
    linkedScript: ScriptSummary | null;
    isLoadingScript: boolean;
    onSelectScript: () => void;
    onCreateScript: () => void;
    onOpenScript: (script: ScriptSummary) => void;
    onUnlink: () => void;
}

const GTScriptLinker: React.FC<GTScriptLinkerProps> = ({ 
    scriptId, linkedScript, isLoadingScript, onSelectScript, onCreateScript, onOpenScript, onUnlink 
}) => {
    
    return (
        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-rose-800 font-bold text-sm uppercase tracking-wide">
                     <FileText className="w-4 h-4" /> สคริปต์ (Script Attachment)
                 </div>
                 {scriptId && (
                     <button onClick={onUnlink} className="text-[10px] text-gray-400 hover:text-red-500 underline flex items-center">
                         <X className="w-3 h-3 mr-1" /> Unlink
                     </button>
                 )}
            </div>

            {scriptId ? (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-rose-200">
                    {isLoadingScript ? (
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด...
                        </div>
                    ) : linkedScript ? (
                        <>
                            <div className="flex-1 min-w-0 mr-3">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{linkedScript.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${linkedScript.status === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    {linkedScript.status}
                                </span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => onOpenScript(linkedScript)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors whitespace-nowrap"
                            >
                                เปิดอ่าน
                            </button>
                        </>
                    ) : (
                        <div className="text-red-400 text-xs">ไม่พบข้อมูลสคริปต์ (ID: {scriptId})</div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button"
                        onClick={onSelectScript}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-dashed border-rose-300 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-50 transition-all"
                    >
                        <Link className="w-3.5 h-3.5" /> เลือกที่มีอยู่
                    </button>
                    <button 
                        type="button"
                        onClick={onCreateScript}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition-all"
                    >
                        <PlusCircle className="w-3.5 h-3.5" /> สร้างใหม่
                    </button>
                </div>
            )}
        </div>
    );
};

export default GTScriptLinker;