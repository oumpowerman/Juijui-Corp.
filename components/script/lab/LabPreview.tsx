
import React, { useMemo } from 'react';
import { LabSequenceItem } from './ScriptLabView';
import { Eye, FileText, Hash, Type } from 'lucide-react';

interface LabPreviewProps {
    sequence: LabSequenceItem[];
    labTitle: string;
}

const LabPreview: React.FC<LabPreviewProps> = ({ sequence, labTitle }) => {
    const mergedContent = useMemo(() => {
        return sequence.map(item => {
            if (item.type === 'BRIDGE') {
                return `<div class="my-4 p-4 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl">
                    <p class="text-[10px] font-black text-amber-500/50 uppercase tracking-widest mb-2">--- ${item.title} ---</p>
                    <p class="text-white italic">${item.content || '(ไม่มีเนื้อหา Bridge)'}</p>
                </div>`;
            }
            return `<div class="mb-8 pb-4 border-b border-white/5">
                <p class="text-[16px] font-medium text-indigo-400/80 uppercase tracking-widest mb-2">${item.title}</p>
                <div class="text-white/95 leading-8 space-y-3">${item.content}</div>
            </div>`;
        }).join('');
    }, [sequence]);

    const stats = useMemo(() => {
        // Strip HTML for word count
        const textOnly = mergedContent.replace(/<[^>]*>/g, ' ');
        const words = textOnly.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = textOnly.length;
        const scriptsCount = sequence.filter(i => i.type === 'SCRIPT').length;
        const bridgesCount = sequence.filter(i => i.type === 'BRIDGE').length;
        return { words, chars, scriptsCount, bridgesCount };
    }, [mergedContent, sequence]);

    return (
        <div className="h-full border-l border-white/10 bg-white/[0.01] flex flex-col shrink-0 font-kanit font-bold">
            {/* Preview Header */}
            <div className="p-6 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Eye className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Live Preview</h3>
                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">ผลลัพธ์การผสมแบบ Real-time</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[12px] font-bold text-white/20 uppercase tracking-widest mb-1">Scripts / Bridges</p>
                        <p className="text-md font-bold text-white">{stats.scriptsCount} / {stats.bridgesCount}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[12px] font-bold text-white/20 uppercase tracking-widest mb-1">Total Words</p>
                        <p className="text-md font-bold text-white">{stats.words.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Content Preview Area */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin bg-[#0f1117]">
                <div className="max-w-full mx-auto space-y-8">
                    {/* Title Header in Preview */}
                    <div className="text-center space-y-2 mb-12">
                        <h1 className="text-[24px] font-bold text-white/90">{labTitle}</h1>
                        <div className="h-1 w-12 bg-indigo-500 mx-auto rounded-full opacity-50" />
                    </div>

                    {/* Merged Content Display */}
                     <div className="max-w-none">
                        {sequence.length > 0 ? (
                            <div 
                                className="font-medium text-[20px] leading-8 text-white/95 space-y-6"
                                dangerouslySetInnerHTML={{ __html: mergedContent }}
                            />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-center opacity-10">
                                <FileText className="w-16 h-16 mb-4" />
                                <p className="text-lg font-medium uppercase tracking-widest">ไม่มีเนื้อหาพรีวิว</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center">
                    Characters: {stats.chars.toLocaleString()} | Estimated Reading: {Math.ceil(stats.words / 150)} min
                </p>
            </div>
        </div>
    );
};

export default LabPreview;
