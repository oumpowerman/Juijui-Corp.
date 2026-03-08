
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HelpCircle, MessageSquare, Book, LifeBuoy, Sparkles, ArrowRight, ChevronLeft, Zap, Shield, Globe, Layout } from 'lucide-react';

interface NexusHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type HelpTopic = 'intro' | 'guide' | 'community';

const NexusHelpModal: React.FC<NexusHelpModalProps> = ({ isOpen, onClose }) => {
    const [selectedTopic, setSelectedTopic] = useState<HelpTopic | null>(null);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setSelectedTopic(null); // Reset topic when closing
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const helpItems = [
        { 
            id: 'intro' as HelpTopic,
            icon: Sparkles, 
            title: 'Nexus Hub คืออะไร?', 
            desc: 'ศูนย์กลางการจัดการเครื่องมือและทรัพยากรภายนอกทั้งหมดของคุณ เชื่อมต่อทุกอย่างไว้ในที่เดียว',
            color: 'bg-indigo-50 text-indigo-600'
        },
        { 
            id: 'guide' as HelpTopic,
            icon: Book, 
            title: 'คู่มือการใช้งาน', 
            desc: 'เรียนรู้วิธีการใช้งาน Nexus อย่างมืออาชีพ ตั้งแต่การเพิ่มลิงก์ไปจนถึงการจัดการข้อมูล',
            color: 'bg-emerald-50 text-emerald-600'
        },
        { 
            id: 'community' as HelpTopic,
            icon: MessageSquare, 
            title: 'การสนับสนุนชุมชน', 
            desc: 'เข้าร่วมกลุ่ม Discord ของเราเพื่อพูดคุยกับผู้ใช้งานคนอื่นๆ และขอความช่วยเหลือ',
            color: 'bg-blue-50 text-blue-600'
        }
    ];

    const renderDetail = () => {
        switch (selectedTopic) {
            case 'intro':
                return (
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                    >
                        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                            <h4 className="text-lg font-black text-indigo-900 mb-2">Command Center ส่วนตัว</h4>
                            <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                                Nexus Hub ถูกออกแบบมาเพื่อแก้ปัญหา "ลิงก์กระจัดกระจาย" โดยรวบรวมทุกอย่างไม่ว่าจะเป็นวิดีโอ YouTube, เอกสาร Notion หรือ Google Sheets มาไว้ในที่เดียว พร้อมระบบจัดหมวดหมู่อัตโนมัติ
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Layout className="w-5 h-5 text-indigo-500 mb-2" />
                                <h5 className="text-xs font-black text-slate-800 uppercase">Unified UI</h5>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">หน้าตาเดียวสำหรับทุกแพลตฟอร์ม</p>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <Zap className="w-5 h-5 text-amber-500 mb-2" />
                                <h5 className="text-xs font-black text-slate-800 uppercase">AI Powered</h5>
                                <p className="text-[10px] text-slate-500 font-bold mt-1">ดึงข้อมูลอัตโนมัติด้วย Gemini</p>
                            </div>
                        </div>
                    </motion.div>
                );
            case 'guide':
                return (
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-4"
                    >
                        <div className="space-y-3">
                            {[
                                { step: '01', title: 'คัดลอกลิงก์', desc: 'Copy URL จาก YouTube, Notion หรือ Google Sheets' },
                                { step: '02', title: 'วางและเชื่อมต่อ', desc: 'วางลิงก์ในช่องค้นหาด้านบน ระบบจะตรวจจับแพลตฟอร์มอัตโนมัติ' },
                                { step: '03', title: 'AI ประมวลผล', desc: 'รอสักครู่เพื่อให้ AI ดึงชื่อและคำอธิบายที่เหมาะสมมาให้' },
                                { step: '04', title: 'จัดการและใช้งาน', desc: 'คลิกที่ Card เพื่อเปิดลิงก์ หรือกดแก้ไขเพื่อปรับแต่งข้อมูล' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                    <span className="text-lg font-black text-indigo-200 group-hover:text-indigo-500 transition-colors">{item.step}</span>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-800">{item.title}</h5>
                                        <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'community':
                return (
                    <motion.div 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="space-y-6"
                    >
                        <div className="p-6 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-xl font-black mb-2">เข้าร่วม Discord</h4>
                                <p className="text-sm text-blue-100 font-medium mb-4">พูดคุยกับนักพัฒนาและผู้ใช้งานคนอื่นๆ เพื่อแลกเปลี่ยนไอเดียและขอความช่วยเหลือ</p>
                                <button className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg">
                                    Join Discord Server
                                </button>
                            </div>
                            <MessageSquare className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 -rotate-12" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-bold text-slate-700">แจ้งปัญหา (Report Bug)</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-indigo-500" />
                                    <span className="text-sm font-bold text-slate-700">เสนอแนะฟีเจอร์ใหม่</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-300" />
                            </div>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white/95 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-center bg-white/50 shrink-0">
                            <div className="flex items-center gap-4">
                                <AnimatePresence mode="wait">
                                    {selectedTopic ? (
                                        <motion.button
                                            key="back"
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: -10, opacity: 0 }}
                                            onClick={() => setSelectedTopic(null)}
                                            className="p-3 bg-slate-100 rounded-2xl text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </motion.button>
                                    ) : (
                                        <motion.div 
                                            key="icon"
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200"
                                        >
                                            <HelpCircle className="w-6 h-6 text-white" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                        {selectedTopic ? helpItems.find(t => t.id === selectedTopic)?.title : 'ศูนย์ช่วยเหลือ'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                                        {selectedTopic ? 'Topic Details' : 'Support & Resources'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-slate-300" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                            <AnimatePresence mode="wait">
                                {!selectedTopic ? (
                                    <motion.div 
                                        key="list"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        {helpItems.map((item, idx) => (
                                            <motion.div 
                                                key={item.id}
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                onClick={() => setSelectedTopic(item.id)}
                                                className="group p-5 bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="text-sm font-black text-slate-800">{item.title}</h4>
                                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-1" />
                                                </div>
                                            </motion.div>
                                        ))}

                                        <div className="mt-6 p-6 bg-indigo-600 rounded-[2rem] text-white overflow-hidden relative group">
                                            <div className="relative z-10 space-y-2">
                                                <h4 className="text-lg font-black tracking-tight">ต้องการความช่วยเหลือ?</h4>
                                                <p className="text-xs text-indigo-100 font-medium">ทีมงานของเราพร้อมช่วยเหลือคุณตลอด 24 ชั่วโมง หากมีปัญหาในการใช้งาน</p>
                                                <button className="mt-2 px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-colors">
                                                    ติดต่อเรา
                                                </button>
                                            </div>
                                            <LifeBuoy className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
                                        </div>
                                    </motion.div>
                                ) : (
                                    renderDetail()
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50/50 border-t border-slate-100 shrink-0">
                            <button 
                                onClick={onClose}
                                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default NexusHelpModal;
