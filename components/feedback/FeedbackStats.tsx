
import React from 'react';
import { FeedbackItem } from '../../types';
import { Quote, Sparkles } from 'lucide-react';

interface FeedbackStatsProps {
    items: FeedbackItem[];
}

const FeedbackStats: React.FC<FeedbackStatsProps> = ({ items }) => {
    const approved = items.filter(i => i.status === 'APPROVED');
    const shoutouts = approved.filter(i => i.type === 'SHOUTOUT').length;
    const ideas = approved.filter(i => i.type === 'IDEA').length;

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-center">
                    <div className="text-2xl font-black text-pink-500 mb-1">{shoutouts}</div>
                    <div className="text-xs font-bold text-pink-400 uppercase">Shoutouts</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
                    <div className="text-2xl font-black text-amber-500 mb-1">{ideas}</div>
                    <div className="text-xs font-bold text-amber-400 uppercase">Ideas</div>
                </div>
            </div>

            {/* Quote of the day (Static for now, can be random) */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
                <Quote className="absolute top-4 left-4 w-8 h-8 text-white/20 fill-white/20" />
                <div className="relative z-10 text-center">
                    <p className="text-sm font-medium leading-relaxed italic mb-4">
                        "Feedback is the breakfast of champions."
                    </p>
                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">
                        — Ken Blanchard
                    </p>
                </div>
                <Sparkles className="absolute bottom-[-10px] right-[-10px] w-24 h-24 text-white/10 animate-pulse" />
            </div>

            {/* Guidelines */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-3 text-sm">ข้อตกลงร่วมกัน 🤝</h4>
                <ul className="space-y-2 text-xs text-gray-500 list-disc pl-4">
                    <li>ติเพื่อก่อ (Constructive Feedback) เสมอ</li>
                    <li>ใช้ถ้อยคำสุภาพ ให้เกียรติซึ่งกันและกัน</li>
                    <li>หากเป็นเรื่องละเอียดอ่อน แนะนำให้ส่งแบบ Issue ถึงแอดมินโดยตรง</li>
                    <li>Admin ขอสงวนสิทธิ์ลบข้อความที่ไม่เหมาะสม</li>
                </ul>
            </div>
        </div>
    );
};

export default FeedbackStats;
