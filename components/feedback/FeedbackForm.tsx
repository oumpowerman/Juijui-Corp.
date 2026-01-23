
import React, { useState } from 'react';
import { Send, Lightbulb, ShieldAlert, Heart, Ghost, Eye } from 'lucide-react';
import { FeedbackType } from '../../types';

interface FeedbackFormProps {
    onSubmit: (content: string, type: FeedbackType, isAnonymous: boolean) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit }) => {
    const [content, setContent] = useState('');
    const [type, setType] = useState<FeedbackType>('IDEA');
    const [isAnonymous, setIsAnonymous] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!content.trim()) return;
        onSubmit(content, type, isAnonymous);
        setContent('');
        // Keep type and anonymity state as user preference
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-5 mb-6">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center">
                📢 ส่งเสียงของคุณ (Speak Up)
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selector */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setType('IDEA')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${type === 'IDEA' ? 'bg-amber-50 border-amber-200 text-amber-700 ring-1 ring-amber-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Lightbulb className="w-4 h-4" /> เสนอไอเดีย
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('ISSUE')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${type === 'ISSUE' ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <ShieldAlert className="w-4 h-4" /> แจ้งปัญหา
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('SHOUTOUT')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${type === 'SHOUTOUT' ? 'bg-pink-50 border-pink-200 text-pink-700 ring-1 ring-pink-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Heart className="w-4 h-4" /> ชมเพื่อน
                    </button>
                </div>

                <div className="relative">
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={
                            type === 'IDEA' ? "มีไอเดียอะไรเจ๋งๆ บอกมาเลย..." :
                            type === 'ISSUE' ? "เจออะไรไม่โอเค บอกเราได้ (Admin จะเห็นคนเดียว)..." :
                            "อยากชมใคร จัดไปเต็มที่..."
                        }
                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl outline-none text-sm min-h-[100px] resize-none transition-colors"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer select-none ${isAnonymous ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}
                            title={isAnonymous ? "ส่งแบบไม่ระบุตัวตน" : "ส่งแบบเปิดเผยชื่อ"}
                        >
                            {isAnonymous ? <Ghost className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isAnonymous ? 'Anonymous' : 'Public Name'}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end items-center gap-3 pt-1">
                    <p className="text-[10px] text-gray-400 mr-auto">
                        * {type === 'ISSUE' ? 'ข้อความนี้จะถูกส่งถึง Admin โดยตรงเท่านั้น' : 'ต้องผ่านการตรวจสอบจาก Admin ก่อนขึ้นบอร์ด'}
                    </p>
                    <button 
                        type="submit" 
                        disabled={!content.trim()}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        <Send className="w-4 h-4 mr-2" /> ส่งข้อความ
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FeedbackForm;
