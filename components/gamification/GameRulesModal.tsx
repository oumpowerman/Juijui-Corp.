
import React, { useState } from 'react';
import { X, Trophy, Heart, Coins, Gavel, ArrowLeft, Star, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface GameRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type RuleCategory = 'XP' | 'HP' | 'COIN' | 'JUDGE';

const RULES_DATA = [
    {
        id: 'XP',
        title: 'ระบบเลเวล (XP)',
        subtitle: 'ยิ่งทำเยอะ ยิ่งเวลสูง',
        icon: Trophy,
        color: 'from-yellow-400 to-orange-500',
        shadow: 'shadow-orange-200',
        textColor: 'text-orange-600',
        description: 'ค่าประสบการณ์ที่บ่งบอกความเก๋าเกมของคุณ ยิ่งเลเวลสูง ยิ่งได้รับการยอมรับ!',
        details: [
            { icon: Star, text: 'งานเสร็จตรงเวลา: ได้ XP ตามความยาก (Easy/Medium/Hard)' },
            { icon: Zap, text: 'งานด่วน/งานเผา: ได้โบนัส XP พิเศษ' },
            { icon: ShieldCheck, text: 'ทำเวรครบ: รับ XP เล็กน้อยเป็นกำลังใจ' },
            { icon: Trophy, text: 'เลเวลอัป: ทุกๆ 1,000 XP จะขึ้นเลเวลใหม่' }
        ]
    },
    {
        id: 'HP',
        title: 'พลังชีวิต (HP)',
        subtitle: 'ดูแลสุขภาพการทำงาน',
        icon: Heart,
        color: 'from-red-400 to-pink-500',
        shadow: 'shadow-pink-200',
        textColor: 'text-pink-600',
        description: 'หลอดเลือดของคุณ หากลดเหลือ 0 อาจจะโดนบทลงโทษสถานหนัก (หรือโดนบ่นชุดใหญ่)!',
        details: [
            { icon: AlertTriangle, text: 'ส่งงานช้า: ลด HP ทันที และลดต่อเนื่องทุกวัน' },
            { icon: AlertTriangle, text: 'โดดเวร: ลด HP หนักมาก ระวังให้ดี!' },
            { icon: Heart, text: 'การฟื้นฟู: ซื้อยาเติมเลือดได้ที่ร้านค้า (Item Shop)' },
            { icon: ShieldCheck, text: 'HP < 30%: สถานะจะแจ้งเตือนวิกฤต' }
        ]
    },
    {
        id: 'COIN',
        title: 'เงินรางวัล (JP)',
        subtitle: 'Juijui Points ใช้แทนเงิน',
        icon: Coins,
        color: 'from-indigo-400 to-purple-500',
        shadow: 'shadow-indigo-200',
        textColor: 'text-indigo-600',
        description: 'สกุลเงินดิจิทัลประจำออฟฟิศ สะสมไว้แลกของรางวัลหรือตัวช่วยต่างๆ',
        details: [
            { icon: Coins, text: 'Earn: ได้รับเมื่อปิดงาน (Done) หรือทำภารกิจสำเร็จ' },
            { icon: Star, text: 'Bonus: ส่งงานก่อนกำหนด ได้ Coin พิเศษ' },
            { icon: Zap, text: 'Shop: นำไปแลก "บัตรกันเวร", "ลบประวัติสาย" หรือของรางวัลจริง' },
            { icon: AlertTriangle, text: 'Penalty: ส่งช้าเกินกำหนด อาจโดนปรับเงิน!' }
        ]
    },
    {
        id: 'JUDGE',
        title: 'ตุลาการ (The Judge)',
        subtitle: 'ระบบตัดคะแนนอัตโนมัติ',
        icon: Gavel,
        color: 'from-slate-600 to-slate-800',
        shadow: 'shadow-slate-300',
        textColor: 'text-slate-600',
        description: 'AI ที่คอยเฝ้าดูความประพฤติของคุณแบบเงียบๆ... อย่าให้มันจับได้',
        details: [
            { icon: Zap, text: 'Auto Check: ตรวจสอบทุกครั้งที่คุณเข้าหน้าเว็บ' },
            { icon: AlertTriangle, text: 'Late Detection: เจองานค้างปุ๊บ หัก HP ปั๊บ' },
            { icon: ShieldCheck, text: 'Duty Watcher: ตรวจเวรเมื่อวาน ใครไม่ส่งรูป โดนหัก!' },
            { icon: Heart, text: 'Mercy: ถ้าใช้ไอเทมกันไว้ Judge จะมองไม่เห็นความผิด' }
        ]
    }
];

const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
    const [selectedRule, setSelectedRule] = useState<typeof RULES_DATA[0] | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setSelectedRule(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-sans">
            <div className="bg-white w-full max-w-2xl h-[600px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300 border-4 border-white/50 ring-1 ring-gray-200">
                
                {/* Header Background */}
                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-br from-indigo-50 to-blue-50 z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-48 h-48 bg-pink-200/30 rounded-full blur-3xl"></div>
                </div>

                {/* Top Bar */}
                <div className="relative z-10 px-6 py-5 flex justify-between items-center">
                    {selectedRule ? (
                        <button 
                            onClick={() => setSelectedRule(null)} 
                            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-bold bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/50"
                        >
                            <ArrowLeft className="w-5 h-5" /> กลับ
                        </button>
                    ) : (
                        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            <span className="text-3xl">🎮</span> คู่มือการเล่น
                        </h2>
                    )}
                    <button onClick={handleClose} className="p-2 bg-white/50 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-red-500 backdrop-blur-sm border border-white/50">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="relative z-10 flex-1 p-6 overflow-y-auto scrollbar-hide">
                    {selectedRule ? (
                        // --- DETAIL VIEW ---
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${selectedRule.color} flex items-center justify-center shadow-lg mb-6 mx-auto transform hover:scale-110 transition-transform duration-500`}>
                                <selectedRule.icon className="w-10 h-10 text-white" />
                            </div>
                            
                            <h3 className={`text-3xl font-black text-center mb-2 ${selectedRule.textColor}`}>
                                {selectedRule.title}
                            </h3>
                            <p className="text-center text-gray-500 font-medium mb-8 max-w-md mx-auto">
                                {selectedRule.description}
                            </p>

                            <div className="space-y-4">
                                {selectedRule.details.map((detail, idx) => (
                                    <div 
                                        key={idx} 
                                        className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-start gap-4 hover:shadow-md transition-all hover:border-indigo-100"
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                    >
                                        <div className={`p-2 rounded-xl bg-gray-50 ${selectedRule.textColor}`}>
                                            <detail.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 leading-relaxed pt-1">
                                                {detail.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // --- GRID VIEW ---
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-300">
                            {RULES_DATA.map((rule) => (
                                <button
                                    key={rule.id}
                                    onClick={() => setSelectedRule(rule)}
                                    className={`
                                        relative group overflow-hidden rounded-[2rem] p-6 text-left border border-white/60 bg-white/40 hover:bg-white transition-all duration-300
                                        hover:shadow-xl hover:-translate-y-1 shadow-sm
                                    `}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${rule.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                                    
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rule.color} flex items-center justify-center shadow-lg ${rule.shadow} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <rule.icon className="w-7 h-7 text-white" />
                                    </div>
                                    
                                    <h3 className="text-lg font-black text-gray-800 mb-1 group-hover:text-indigo-900">
                                        {rule.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {rule.subtitle}
                                    </p>
                                    
                                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        <div className="bg-gray-100 p-2 rounded-full">
                                            <ArrowLeft className="w-4 h-4 text-gray-400 rotate-180" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer Decor */}
                {!selectedRule && (
                    <div className="p-6 text-center text-xs text-gray-400 font-medium bg-white/30 backdrop-blur-sm border-t border-gray-100">
                        "Work Hard, Play Harder, Juijui Together!" 🍹
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameRulesModal;
