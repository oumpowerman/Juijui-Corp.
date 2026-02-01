
import React from 'react';
import { FileText, Loader2, ExternalLink, PlusCircle } from 'lucide-react';
import { ScriptSummary } from '../../../types';

interface CFScriptLinkerProps {
    hasContentId: boolean;
    linkedScript: ScriptSummary | null;
    isLoadingScript: boolean;
    onOpenScript: () => void;
    onCreateScript: () => void;
}

const CFScriptLinker: React.FC<CFScriptLinkerProps> = ({ 
    hasContentId, linkedScript, isLoadingScript, onOpenScript, onCreateScript 
}) => {
    if (!hasContentId) return null;

    return (
        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shadow-sm border border-rose-200">
                    <FileText className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-800 text-sm flex items-center">
                        📜 บท/สคริปต์ (Script)
                        {linkedScript && (
                            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${linkedScript.status === 'DONE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                {linkedScript.status}
                            </span>
                        )}
                    </h4>
                    <p className="text-xs text-gray-500">
                        {linkedScript ? `Last updated: ${new Date(linkedScript.updatedAt).toLocaleDateString()}` : 'ยังไม่มีบทสำหรับงานนี้'}
                    </p>
                </div>
            </div>

            <div>
                {isLoadingScript ? (
                    <div className="p-2"><Loader2 className="w-5 h-5 animate-spin text-rose-500"/></div>
                ) : linkedScript ? (
                    <button 
                        type="button"
                        onClick={onOpenScript}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm active:scale-95"
                    >
                        เปิดอ่านบท <ExternalLink className="w-3 h-3" />
                    </button>
                ) : (
                    <button 
                        type="button"
                        onClick={onCreateScript}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all active:scale-95"
                    >
                        <PlusCircle className="w-3.5 h-3.5" /> สร้างบทใหม่
                    </button>
                )}
            </div>
        </div>
    );
};

export default CFScriptLinker;
