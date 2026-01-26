import React from 'react';
import { Check, Sparkles } from 'lucide-react';

interface MeetingDecisionsTabProps {
    decisions: string;
    setDecisions: (val: string) => void;
    onBlurDecisions: () => void;
}

const MeetingDecisionsTab: React.FC<MeetingDecisionsTabProps> = ({ decisions, setDecisions, onBlurDecisions }) => {
    return (
        <div className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
            <div className="bg-emerald-50/50 p-10 rounded-[3rem] border-4 border-dashed border-emerald-100 w-full max-w-3xl h-full max-h-[600px] relative flex flex-col group hover:border-emerald-200 transition-colors">
                    
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full font-hand font-bold shadow-sm border border-white">
                        ✨ ข้อสรุปวันนี้ ✨
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