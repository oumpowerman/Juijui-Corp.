
import React, { useState } from 'react';
import { X, Trophy, Heart, Coins, Gavel, ArrowLeft, MousePointer2, CircuitBoard, Sparkles, ChevronRight, Zap, Target } from 'lucide-react';

interface GameRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RULES_DATA = [
    {
        id: 'XP',
        title: 'ระบบเลเวล (Level & XP)',
        subtitle: 'Experience Points',
        icon: Trophy,
        theme: 'amber', 
        description: 'แต้มสะสมเพื่อเลื่อนขั้น ยิ่งเลเวลสูง ยิ่งได้รับสิทธิพิเศษและเงินรางวัล!',
        details: [
            {
                head: 'สูตรคำนวณ XP (Calculation)',
                content: (
                    <div className="space-y-2">
                        <p>XP ที่ได้ = <b>(Base Difficulty)</b> + <b>(Hours × 20)</b> + <b>Bonus</b></p>
                        <div className="bg-amber-100/50 p-3 rounded-lg text-xs border border-amber-200">
                            <p className="font-bold mb-1">🎯 Base Difficulty (ค่าความยาก):</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li><b>Easy:</b> +50 XP (งานทั่วไป)</li>
                                <li><b>Medium:</b> +100 XP (งานมาตรฐาน)</li>
                                <li><b>Hard:</b> +250 XP (งานยาก/งานใหญ่)</li>
                            </ul>
                        </div>
                    </div>
                )
            },
            {
                head: 'โบนัสพิเศษ (Bonus Events)',
                content: (
                    <ul className="list-none space-y-1 text-xs">
                         <li className="flex items-center gap-2">⚡ <b>Time Bonus:</b> +20 XP ต่อชั่วโมงที่ประเมินไว้</li>
                         <li className="flex items-center gap-2">🚀 <b>Early Bird:</b> +50 XP (ส่งก่อน Deadline 24 ชม.)</li>
                         <li className="flex items-center gap-2">🧹 <b>Duty Clean:</b> +20 XP (ทำเวรเสร็จ)</li>
                    </ul>
                )
            },
            {
                head: 'ตารางเลเวล (Leveling)',
                content: (
                    <div>
                        <p className="mb-2">เลเวลอัปทุกๆ <b>1,000 XP</b></p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/60 p-2 rounded-lg border border-amber-100">
                            <span>Lv.1 : 0 - 999 XP</span>
                            <span>Lv.2 : 1,000 XP</span>
                            <span>Lv.3 : 2,000 XP</span>
                            <span>Lv.4 : 3,000 XP</span>
                            <span className="col-span-2 text-center text-amber-600 font-bold mt-1">...และต่อไปเรื่อยๆ</span>
                        </div>
                    </div>
                )
            }
        ]
    },
    {
        id: 'HP',
        title: 'พลังชีวิต (Health Points)',
        subtitle: 'Vitality & Discipline',
        icon: Heart,
        theme: 'rose',
        description: 'ค่าพลังที่แสดงถึงวินัยและความรับผิดชอบ เริ่มต้นที่ 100 HP ห้ามหมดหลอดเด็ดขาด!',
        details: [
            {
                head: 'สาเหตุที่ HP ลดลง (Damage Taken)',
                content: (
                    <ul className="space-y-2 text-xs font-medium">
                        <li className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 text-rose-800 flex justify-between items-center">
                            <span>🔥 <b>ส่งงานช้า (Overdue):</b></span>
                            <span className="font-black text-red-500">-5 HP / วัน</span>
                        </li>
                        <li className="bg-rose-50 p-2.5 rounded-lg border border-rose-100 text-rose-800 flex justify-between items-center">
                            <span>🧹 <b>โดดเวร (Missed Duty):</b></span>
                            <span className="font-black text-red-500">-10 HP ทันที</span>
                        </li>
                    </ul>
                )
            },
            {
                head: 'สถานะวิกฤต (Critical State)',
                content: 'หาก HP < 30% กรอบรูปจะกลายเป็นสีแดงกระพริบ 🚨 เพื่อเตือนให้รีบแก้ไขสถานการณ์ (หากเหลือ 0 อาจถูกพักงาน)'
            },
            {
                head: 'การฟื้นฟู (Recovery)',
                content: 'ซื้อ "ยาแก้ปวดหลัง (Heal Potion)" ที่ร้านค้า (+20 HP) หรือทำความดีพิเศษเพื่อล้างโทษ'
            }
        ]
    },
    {
        id: 'COIN',
        title: 'เงินรางวัล (Juijui Points)',
        subtitle: 'Currency & Rewards',
        icon: Coins,
        theme: 'indigo',
        description: 'สกุลเงินดิจิทัลในองค์กร สะสมไว้ซื้อไอเทมช่วยชีวิต หรือแลกของรางวัลจริง',
        details: [
            {
                head: 'ช่องทางหาเงิน (Earning)',
                content: (
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                        <li><b>ปิดงาน (Done):</b> +10 JP/งาน</li>
                        <li><b>ส่งไว (Early):</b> โบนัส +20 JP</li>
                        <li><b>ทำเวร (Duty):</b> +5 JP</li>
                        <li className="text-indigo-600 font-bold">🎉 Level Up: รับเงินก้อนโต +500 JP!</li>
                    </ul>
                )
            },
            {
                head: 'บทลงโทษ (Fines)',
                content: 'ส่งงานช้าเกินกำหนด ปรับวันละ 5 JP (สูงสุด 50 JP ต่อหนึ่งงาน)'
            },
            {
                head: 'ใช้ทำอะไร? (Spending)',
                content: 'เข้า Item Shop เพื่อซื้อไอเทมเทพๆ เช่น บัตรกันเวร, Time Warp หรือแลกของรางวัลจริง (ขนม/เครื่องดื่ม)'
            }
        ]
    },
    {
        id: 'JUDGE',
        title: 'ระบบตุลาการ (The Judge)',
        subtitle: 'Automated System',
        icon: Gavel,
        theme: 'slate',
        description: 'AI อัจฉริยะที่คอยเฝ้าดูความประพฤติของคุณแบบเงียบๆ... และลงดาบเมื่อทำผิดกฎ',
        details: [
            {
                head: 'เวลาทำงาน (Execution Time)',
                content: 'The Judge จะตื่นขึ้นมาตรวจสอบระบบทุกเที่ยงคืน หรือทุกครั้งที่คุณ Login เข้าใช้งาน'
            },
            {
                head: 'สิ่งที่ตรวจจับ (Detection)',
                content: (
                    <div className="text-xs space-y-2">
                        <p>1. <b>งานค้าง (Overdue):</b> งานที่เลย Deadline แต่ยังไม่กด Done</p>
                        <p>2. <b>เวรค้าง (Missed Duty):</b> เวรเมื่อวานที่ยังไม่ได้ติ๊ก Check</p>
                    </div>
                )
            },
            {
                head: 'ทางรอด (Immunity)',
                content: 'ใช้ไอเทม "Time Warp" ย้อนเวลาลบสถานะสาย หรือใช้ "Duty Shield" เพื่อป้องกันการหักคะแนนจากเวร'
            }
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

    // Color mapper for dynamic styling
    const getThemeStyles = (theme: string) => {
        const styles: Record<string, any> = {
            amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-600', ring: 'ring-amber-100', gradient: 'from-amber-500 to-orange-500' },
            rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', icon: 'text-rose-600', ring: 'ring-rose-100', gradient: 'from-rose-500 to-pink-600' },
            indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', icon: 'text-indigo-600', ring: 'ring-indigo-100', gradient: 'from-indigo-500 to-violet-600' },
            slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', icon: 'text-slate-600', ring: 'ring-slate-100', gradient: 'from-slate-600 to-slate-800' },
        };
        return styles[theme] || styles.slate;
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
            
            {/* Main Holographic Container */}
            <div className="bg-white w-full max-w-5xl h-[85vh] md:h-[700px] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative animate-in zoom-in-95 duration-300 border-[6px] border-white ring-1 ring-gray-300">
                
                {/* --- LEFT PANEL: Navigation Grid --- */}
                <div className="w-full md:w-2/5 bg-gray-50/80 border-r border-gray-200 flex flex-col p-6 relative overflow-hidden">
                    {/* Decor Background */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    {/* Header */}
                    <div className="relative z-10 mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-900 text-white rounded-xl shadow-lg">
                                <CircuitBoard className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">GAME MANUAL</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Documentation v2.1</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">เลือกหัวข้อเพื่อดูข้อมูลเชิงลึก</p>
                    </div>

                    {/* Navigation Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3 relative z-10 overflow-y-auto pr-1 pb-4 scrollbar-hide flex-1">
                        {RULES_DATA.map((rule) => {
                            const isActive = selectedRule?.id === rule.id;
                            const theme = getThemeStyles(rule.theme);
                            
                            return (
                                <button
                                    key={rule.id}
                                    onClick={() => setSelectedRule(rule)}
                                    className={`
                                        group relative p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 overflow-hidden
                                        ${isActive 
                                            ? `bg-white border-${rule.theme}-400 shadow-xl shadow-${rule.theme}-100 scale-[1.02] ring-2 ${theme.ring}` 
                                            : 'bg-white border-transparent hover:border-gray-200 hover:bg-white/60 shadow-sm hover:shadow-md'
                                        }
                                    `}
                                >
                                    {/* Active Glow Bar */}
                                    {isActive && <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${theme.gradient}`}></div>}
                                    
                                    <div className={`p-3 rounded-xl shrink-0 transition-colors ${isActive ? `${theme.bg} ${theme.icon}` : 'bg-gray-50 text-gray-400 group-hover:text-gray-600'}`}>
                                        <rule.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-black text-sm truncate ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{rule.title}</h3>
                                        <p className="text-[10px] text-gray-400 font-medium truncate">{rule.subtitle}</p>
                                    </div>
                                    {isActive && <ChevronRight className={`w-4 h-4 ${theme.icon}`} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer / Mobile Close */}
                    <div className="mt-auto md:hidden pt-4 border-t border-gray-200">
                         <button onClick={handleClose} className="w-full py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-600">ปิดหน้าต่าง</button>
                    </div>
                </div>

                {/* --- RIGHT PANEL: Data Terminal --- */}
                <div className={`
                    flex-1 bg-white relative transition-all duration-500 flex flex-col
                    ${!selectedRule ? 'items-center justify-center' : ''}
                `}>
                    {/* Close Button (Desktop) */}
                    <button onClick={handleClose} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors z-20 hidden md:block">
                        <X className="w-6 h-6" />
                    </button>

                    {selectedRule ? (
                        <div className="w-full h-full flex flex-col animate-in slide-in-from-right-8 duration-500">
                            {/* Terminal Header */}
                            <div className={`relative h-48 shrink-0 overflow-hidden flex items-end p-8 bg-gradient-to-r ${getThemeStyles(selectedRule.theme).gradient}`}>
                                {/* Pattern */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '24px 24px' }}></div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                
                                <div className="relative z-10 text-white">
                                    <div className="flex items-center gap-3 mb-2 opacity-80">
                                        <selectedRule.icon className="w-6 h-6" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{selectedRule.subtitle}</span>
                                    </div>
                                    <h1 className="text-4xl font-black tracking-tight mb-2">{selectedRule.title}</h1>
                                    <p className="text-white/80 font-medium text-sm max-w-lg">{selectedRule.description}</p>
                                </div>
                            </div>

                            {/* Content Scroll */}
                            <div className="flex-1 overflow-y-auto p-8 bg-white/50 relative">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-0" 
                                    style={{ 
                                        backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', 
                                        backgroundSize: '40px 40px' 
                                    }}
                                ></div>

                                <div className="space-y-6 relative z-10 max-w-2xl">
                                    {selectedRule.details.map((detail, idx) => (
                                        <div key={idx} className="group">
                                            <h4 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center ${getThemeStyles(selectedRule.theme).text}`}>
                                                <Sparkles className="w-3 h-3 mr-2" />
                                                {detail.head}
                                            </h4>
                                            <div className="bg-white/80 p-5 rounded-2xl border border-gray-100 shadow-sm text-gray-600 text-sm leading-relaxed group-hover:border-indigo-100 group-hover:shadow-md transition-all">
                                                {detail.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Empty State
                        <div className="text-center opacity-40 select-none pointer-events-none p-6">
                             <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gray-100 animate-pulse">
                                <MousePointer2 className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 mb-2">Ready to Scan</h3>
                            <p className="text-gray-400">Select a module from the left panel to view data.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GameRulesModal;
