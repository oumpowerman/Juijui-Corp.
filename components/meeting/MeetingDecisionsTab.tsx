import React, { useState } from 'react';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { summarizeMeeting } from '../../services/geminiService';
import { useToast } from '../../context/ToastContext';

interface MeetingDecisionsTabProps {
    decisions: string;
    setDecisions: (val: string) => void;
    onBlurDecisions: () => void;
    content: string;
}

const MeetingDecisionsTab: React.FC<MeetingDecisionsTabProps> = ({ decisions, setDecisions, onBlurDecisions, content }) => {
    const { showToast } = useToast();
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleAISummary = async () => {
        if (!content || content.trim().length < 10) {
            showToast('กรุณากรอกบันทึกการประชุมก่อนสรุปครับ', 'warning');
            return;
        }

        setIsSummarizing(true);
        try {
            const summary = await summarizeMeeting(content);
            setDecisions(summary);
            showToast('สรุปมติที่ประชุมเรียบร้อยแล้ว ✨', 'success');
            // Trigger blur update manually if needed, or wait for user to blur
        } catch (error: any) {
            showToast(error.message || 'เกิดข้อผิดพลาดในการสรุป', 'error');
        } finally {
            setIsSummarizing(false);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
            <div className="bg-emerald-50/50 p-10 rounded-[3rem] border-4 border-dashed border-emerald-100 w-full max-w-3xl h-full max-h-[600px] relative flex flex-col group hover:border-emerald-200 transition-colors">
                    
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full font-hand font-bold shadow-sm border border-white flex items-center gap-2">
                        ✨ ข้อสรุปวันนี้ ✨
                        <button 
                            onClick={handleAISummary}
                            disabled={isSummarizing}
                            className="ml-2 p-1.5 bg-white rounded-full text-emerald-500 hover:text-emerald-600 hover:scale-110 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="สรุปด้วย AI"
                        >
                            {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        </button>
                    </div>
                    
                <h3 className="text-emerald-800 font-bold uppercase tracking-wider text-sm mb-4 flex items-center relative z-10">
                    <Check className="w-5 h-5 mr-2" /> สรุปมติที่ประชุม (Key Decisions)
                </h3>
                <textarea 
                    className="w-full flex-1 bg-transparent outline-none resize-none text-emerald-900 leading-loose font-medium placeholder:text-emerald-300/70 relative z-10 text-lg font-hand"
                    placeholder="- อนุมัติงบประมาณโปรเจกต์ X...&#10;- เลื่อนกำหนดการถ่ายทำเป็นวันจันทร์หน้า...&#10;- เปลี่ยนธีมสีหลักเป็นสีส้ม..."
                    value={decisions}
                    onChange={e => setDecisions(e.target.value)}
                    onBlur={onBlurDecisions}
                />
                
                <div className="mt-4 text-right">
                    <Sparkles className="w-6 h-6 text-emerald-300 inline-block animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default MeetingDecisionsTab;