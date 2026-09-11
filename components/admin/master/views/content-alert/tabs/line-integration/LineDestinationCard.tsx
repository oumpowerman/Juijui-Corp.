import React from 'react';
import { Info, MessageSquare, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface LineDestinationCardProps {
    targetDestination: string;
    onChangeDestination: (val: string) => void;
}

export const LineDestinationCard: React.FC<LineDestinationCardProps> = ({
    targetDestination,
    onChangeDestination,
}) => {
    return (
        <motion.div
            id="line-destination-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                        ปลายทางห้องแชต LINE (Target LINE Group / Room)
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        ระบุรหัสประจำห้อง (LINE Group ID / Room ID) ที่ต้องการให้บอทแจ้งเตือนคอนเทนต์ยิงข้อความไป
                    </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-2xl text-xs border border-emerald-200 self-start sm:self-auto shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    LINE Flex Message V2
                </div>
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">
                        LINE Group ID หรือ Room ID:
                    </label>
                    <input
                        type="text"
                        value={targetDestination}
                        onChange={(e) => onChangeDestination(e.target.value)}
                        placeholder="เช่น C1234567890abcdef... (เว้นว่างไว้หากต้องการใช้กลุ่มกลางเริ่มต้นของบริษัท)"
                        className="w-full px-4 py-3 text-xs bg-slate-50 border border-gray-200 rounded-2xl font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all shadow-2xs"
                    />
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                        <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>
                            <strong>คำแนะนำการใช้งาน:</strong> หากไม่ได้ระบุค่า ระบบจะส่งเข้า LINE Group เริ่มต้นของบริษัท หรือส่งแจ้งเตือนเข้าแชตของผู้ที่ถูกมอบหมายงาน (Assignee/Editor) โดยตรง
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
