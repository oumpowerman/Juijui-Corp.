import React, { useState } from 'react';
import { WorkStatus } from '../../types';
import { WORK_STATUS_CONFIG } from '../../constants';
import { Palmtree, MessageCircle, Sparkles, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileStatusSectionProps {
  workStatus: WorkStatus;
  leaveStart: string;
  leaveEnd: string;
  feeling: string;
  onStatusChange: (status: WorkStatus) => void;
  onLeaveStartChange: (val: string) => void;
  onLeaveEndChange: (val: string) => void;
  onFeelingChange: (val: string) => void;
}

const FUNNY_FEELINGS = [
    "ปวดหลัง... 👵",
    "อยากกินหมูกระทะ 🥓",
    "Error 404: Energy Not Found 🔋",
    "งานคือเงิน เงินคืองาน 💸",
    "ง่วงนอนตลอดเวลา 😴",
    "ร่างทองพร้อมลุย! ✨",
    "สมองไหล... 🫠",
    "รอวันศุกร์ 🎉",
    "ปั่นงานยิกๆ 🔥",
    "ขอชาไข่มุกด่วน 🧋"
];

const ProfileStatusSection: React.FC<ProfileStatusSectionProps> = ({
  workStatus,
  leaveStart,
  leaveEnd,
  feeling,
  onStatusChange,
  onLeaveStartChange,
  onLeaveEndChange,
  onFeelingChange
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const randomFeeling = () => {
      const random = FUNNY_FEELINGS[Math.floor(Math.random() * FUNNY_FEELINGS.length)];
      onFeelingChange(random);
  };

  return (
    <div className="flex-1 w-full space-y-5">
        {/* Work Status Toggle */}
        <div className="bg-indigo-50/30 p-4 sm:p-5 rounded-3xl border border-indigo-100/50">
            <label className="block text-xs font-bold text-indigo-400 uppercase mb-3 tracking-wider">สถานะการทำงาน</label>
            <div className="flex flex-wrap gap-2">
                {Object.entries(WORK_STATUS_CONFIG).map(([key, config]) => (
                    <motion.button
                        key={key}
                        type="button"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onStatusChange(key as WorkStatus)}
                        className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm ${
                            workStatus === key 
                            ? `${(config as any).color} ring-4 ring-offset-0 ring-white border-transparent shadow-md` 
                            : 'bg-white border-indigo-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200'
                        }`}
                    >
                        <span className="text-base drop-shadow-sm">{(config as any).icon}</span> {(config as any).label.split('(')[0]}
                    </motion.button>
                ))}
            </div>
        </div>

        {/* Leave Date Range (Conditional) */}
        <AnimatePresence>
            {(workStatus === 'SICK' || workStatus === 'VACATION') && (
                <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                >
                    <div className="bg-orange-50/50 border border-orange-100 p-4 sm:p-5 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/40 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 opacity-50"></div>
                        
                        <label className="block text-xs font-bold text-orange-500 uppercase mb-3 flex items-center gap-1.5 relative z-10">
                            <Palmtree className="w-4 h-4" /> ระบุวันลา (Leave Period)
                        </label>
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 relative z-10">
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] font-bold text-orange-300 ml-1 uppercase">Start Date</span>
                                <input 
                                    type="date" 
                                    value={leaveStart} 
                                    onChange={e => onLeaveStartChange(e.target.value)}
                                    className="w-full p-3 rounded-2xl border-2 border-orange-100 bg-white text-sm font-bold text-orange-900 focus:outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all shadow-sm"
                                />
                            </div>
                            <div className="hidden md:flex items-center justify-center pt-5">
                                <span className="text-orange-300 font-black text-xl">➜</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="text-[10px] font-bold text-orange-300 ml-1 uppercase">End Date</span>
                                <input 
                                    type="date" 
                                    value={leaveEnd} 
                                    onChange={e => onLeaveEndChange(e.target.value)}
                                    className="w-full p-3 rounded-2xl border-2 border-orange-100 bg-white text-sm font-bold text-orange-900 focus:outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Feeling Input & Preview */}
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <label className="block text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                    ความรู้สึกวันนี้
                    <button 
                        type="button"
                        onClick={() => setShowInfo(!showInfo)}
                        className="p-1 hover:bg-violet-100 rounded-full transition-colors text-violet-300 hover:text-violet-500"
                    >
                        <Info className="w-3.5 h-3.5" />
                    </button>
                </label>
                
                {/* Preview Bubble Label */}
                <span className="text-[10px] font-black text-violet-300 uppercase tracking-widest">Preview Bubble</span>
            </div>

            {/* Info Explanation */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className="bg-violet-600 text-white p-3 rounded-2xl text-[10px] font-bold leading-relaxed shadow-lg shadow-violet-200 relative"
                    >
                        <button 
                            onClick={() => setShowInfo(false)}
                            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        ข้อความนี้จะปรากฏเป็น "Bubble" ลอยอยู่เหนือรูปโปรไฟล์ของคุณในหน้า Dashboard เพื่อให้เพื่อนร่วมทีมเห็นว่าคุณกำลังรู้สึกอย่างไร หรือกำลังทำอะไรอยู่! ✨
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bubble Preview Area */}
            <div className="relative h-14 flex items-center justify-center bg-violet-50/30 rounded-2xl border border-dashed border-violet-200 overflow-hidden">
                <AnimatePresence mode="wait">
                    {feeling ? (
                        <motion.div
                            key={feeling}
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.8 }}
                            className="relative"
                        >
                            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-violet-100 text-xs font-bold text-violet-700 flex items-center gap-2">
                                {feeling}
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-violet-100 rotate-45"></div>
                            </div>
                        </motion.div>
                    ) : (
                        <span className="text-[10px] text-violet-300 font-medium italic">พิมพ์ข้อความเพื่อดูตัวอย่าง...</span>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative group">
                <input 
                    type="text" 
                    value={feeling}
                    onChange={e => onFeelingChange(e.target.value)}
                    className="w-full pl-12 pr-14 py-4 bg-violet-50/50 border-2 border-violet-100 rounded-2xl text-sm font-bold text-violet-900 outline-none focus:bg-white focus:border-violet-300 focus:ring-4 focus:ring-violet-100 transition-all placeholder:text-violet-300 shadow-sm group-hover:bg-white"
                    placeholder="สเตตัสวันนี้..."
                />
                <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-300 group-focus-within:text-violet-500 transition-colors pointer-events-none" />
                
                <motion.button 
                    type="button" 
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={randomFeeling} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white text-pink-400 hover:text-pink-500 hover:shadow-md rounded-xl border border-pink-100 transition-all" 
                    title="สุ่มคำคม"
                >
                    <Sparkles className="w-4 h-4 fill-pink-100" />
                </motion.button>
            </div>
        </div>
    </div>
  );
};

export default ProfileStatusSection;
