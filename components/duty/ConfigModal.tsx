
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, type Variants, type PanInfo } from 'framer-motion';
import { X, Settings, Save, ArchiveRestore, Users, Sparkles, AlertTriangle, HardDrive, RefreshCw, LogOut, AlignLeft } from 'lucide-react';
import { DutyConfig } from '../../types';
import { useGlobalDialog } from '../../context/GlobalDialogContext';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    configs: DutyConfig[];
    onUpdateConfig: (dayNum: number, field: keyof DutyConfig, value: any) => void;
    onUpdateTitle: (dayNum: number, index: number, value: string) => void;
    onUpdateDescription?: (dayNum: number, index: number, value: string) => void;
    onSave: () => void;
    onCleanup: () => void;
}

const WEEK_DAYS_MAP = [
    { num: 1, label: 'Mon', shortTh: 'จ.', full: 'วันจันทร์', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { num: 2, label: 'Tue', shortTh: 'อ.', full: 'วันอังคาร', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { num: 3, label: 'Wed', shortTh: 'พ.', full: 'วันพุธ', color: 'bg-green-100 text-green-700 border-green-200' },
    { num: 4, label: 'Thu', shortTh: 'พฤ.', full: 'วันพฤหัสบดี', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { num: 5, label: 'Fri', shortTh: 'ศ.', full: 'วันศุกร์', color: 'bg-blue-100 text-blue-700 border-blue-200' },
];

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
    },
};

const mobileModalVariants: Variants = {
    hidden: { opacity: 0, y: '100%' },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 340, damping: 32, mass: 0.85 },
    },
    exit: {
        opacity: 0,
        y: '100%',
        transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const },
    },
};

const desktopModalVariants: Variants = {
    hidden: { opacity: 0, scale: 0.94, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 360, damping: 30, mass: 0.8 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 12,
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
    },
};

const ConfigModal: React.FC<ConfigModalProps> = ({ 
    isOpen, onClose, configs, onUpdateConfig, onUpdateTitle, onUpdateDescription, onSave, onCleanup 
}) => {
    const { showConfirm } = useGlobalDialog();
    const { isAuthenticated, isReady, login, logout, retry } = useGoogleDrive();
    const [activeDay, setActiveDay] = useState(1); // Default to Monday
    const [isMobile, setIsMobile] = useState<boolean>(() =>
        typeof window !== 'undefined' ? window.innerWidth < 640 : false
    );
    const dragControls = useDragControls();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(max-width: 639px)');
        const updateViewport = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsMobile(e.matches);
        };
        updateViewport(mediaQuery);
        mediaQuery.addEventListener('change', updateViewport);
        return () => mediaQuery.removeEventListener('change', updateViewport);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
        }
    };

    const handleCleanupClick = async () => {
        const confirmed = await showConfirm(
            'ระบบจะลบประวัติเวรที่เก่ากว่า 180 วันทิ้งถาวร เพื่อคืนพื้นที่ Database ยืนยันหรือไม่?',
            '⚠️ เขตอันตราย (Danger Zone)'
        );
        if (confirmed) {
            onCleanup();
        }
    };

    // Get current active config
    const currentConfig = configs.find(c => c.dayOfWeek === activeDay) || { 
        dayOfWeek: activeDay, requiredPeople: 1, taskTitles: [''], taskDescriptions: [''] 
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="duty-config-backdrop"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={onClose}
                    className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 font-sans"
                >
                    <motion.div
                        key={isMobile ? 'duty-config-mobile' : 'duty-config-desktop'}
                        variants={isMobile ? mobileModalVariants : desktopModalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        drag={isMobile ? 'y' : false}
                        dragControls={dragControls}
                        dragListener={false}
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.45 }}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-3xl rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:h-[85vh] relative border-t sm:border-4 border-white ring-1 ring-gray-100"
                    >
                        {/* 1. Rigid Header (with mobile drag-to-close support) */}
                        <div
                            onPointerDown={(e) => {
                                if (isMobile) dragControls.start(e);
                            }}
                            className="shrink-0 bg-white border-b border-gray-100 select-none touch-none sm:touch-auto"
                        >
                            {/* Mobile Pull Handle */}
                            <div className="sm:hidden flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
                                <div className="w-10 h-1.5 rounded-full bg-gray-300/90" />
                            </div>

                            <div className="px-4 py-3 sm:px-7 sm:py-5 flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-md shadow-indigo-200 shrink-0">
                                        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight truncate">
                                            ตั้งค่ากติกาเวร (Duty Rules)
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                                            กำหนดจำนวนคนและหน้าที่ในแต่ละวัน
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="min-w-[40px] min-h-[40px] p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl sm:rounded-full transition-colors flex items-center justify-center shrink-0"
                                    aria-label="ปิดหน้าต่าง"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* 2. Main Body Container */}
                        <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-row bg-[#f8fafc]">
                            
                            {/* LEFT / TOP: Day Selector (5-column compact grid on mobile, vertical sidebar on md+) */}
                            <div className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-gray-100 px-3.5 py-2.5 md:p-4 grid grid-cols-5 md:flex md:flex-col gap-1.5 md:gap-2 shrink-0">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-2 mb-1 hidden md:block">
                                    Select Day
                                </p>
                                {WEEK_DAYS_MAP.map((day) => {
                                    const isActive = activeDay === day.num;
                                    const dayConf = configs.find(c => c.dayOfWeek === day.num);
                                    const count = dayConf?.requiredPeople || 1;
                                    
                                    return (
                                        <button
                                            key={day.num}
                                            type="button"
                                            onClick={() => setActiveDay(day.num)}
                                            className={`
                                                flex flex-col md:flex-row items-center justify-center md:justify-between
                                                py-2 px-1.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-200 w-full relative overflow-hidden
                                                ${isActive 
                                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 md:translate-x-1' 
                                                    : 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                                }
                                            `}
                                        >
                                            <div className="flex flex-col md:flex-row items-center gap-0.5 md:gap-3 relative z-10">
                                                <span className={`hidden md:flex text-sm font-bold w-6 h-6 rounded-lg items-center justify-center ${isActive ? 'bg-white/20 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                                    {day.label.charAt(0)}
                                                </span>
                                                <span className="text-xs sm:text-sm font-bold leading-tight">
                                                    {day.label}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-semibold mt-0.5 md:mt-0 relative z-10 ${isActive ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                {count} คน
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* RIGHT: Scrollable Config Content */}
                            <div className="flex-1 min-h-0 p-4 sm:p-6 md:p-7 overflow-y-auto overscroll-contain flex flex-col">
                                
                                {/* Compact Single-Row Google Drive Status Bar */}
                                <div className="mb-4 sm:mb-6 px-3.5 py-2.5 sm:px-5 sm:py-3.5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                        <div className={`p-2 rounded-xl border shrink-0 ${isAuthenticated ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            <HardDrive className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                                    Google Drive
                                                </h4>
                                                <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${isAuthenticated ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                            </div>
                                            <p className="text-[10px] sm:text-xs font-medium text-gray-500 truncate">
                                                {isAuthenticated ? 'เชื่อมต่อแล้ว (Cloud Backup)' : 'ยังไม่ได้เชื่อมต่อ (Local)'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {isAuthenticated ? (
                                            <button 
                                                type="button"
                                                onClick={logout}
                                                className="min-w-[38px] min-h-[38px] p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95 border border-gray-100 hover:border-red-100 flex items-center justify-center"
                                                title="Logout"
                                            >
                                                <LogOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                            </button>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={login}
                                                className="px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100 active:scale-95 whitespace-nowrap"
                                            >
                                                เชื่อมต่อ
                                            </button>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={retry}
                                            className="min-w-[38px] min-h-[38px] p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-95 border border-gray-100 hover:border-indigo-100 flex items-center justify-center"
                                            title="Reload API"
                                        >
                                            <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${!isReady ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Day Heading */}
                                <div className="mb-4 sm:mb-5 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border ${WEEK_DAYS_MAP[activeDay-1].color}`}>
                                            {WEEK_DAYS_MAP[activeDay-1].label}
                                        </span>
                                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                                            {WEEK_DAYS_MAP[activeDay-1].full}
                                        </h2>
                                    </div>
                                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                                        {currentConfig.requiredPeople} ตำแหน่ง
                                    </span>
                                </div>

                                {/* Section 1: Number of People */}
                                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] shadow-sm border border-gray-100 mb-5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                        <Users className="w-4 h-4 mr-1.5 text-indigo-500" /> จำนวนคนเวร (Required People)
                                    </label>
                                    
                                    <div className="grid grid-cols-5 sm:flex sm:items-center gap-2 sm:gap-3">
                                        {[1, 2, 3, 4, 5].map(num => {
                                            const isSelected = currentConfig.requiredPeople === num;
                                            return (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => onUpdateConfig(activeDay, 'requiredPeople', num)}
                                                    className={`
                                                        h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-200 flex items-center justify-center border-2
                                                        ${isSelected 
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 sm:scale-105' 
                                                            : 'bg-gray-50/70 sm:bg-white text-gray-500 border-gray-100 hover:border-indigo-300 hover:text-indigo-600'
                                                        }
                                                    `}
                                                >
                                                    {num}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Section 2: Tasks Definition */}
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                        <Sparkles className="w-4 h-4 mr-1.5 text-indigo-500" /> หน้าที่รับผิดชอบและรายละเอียดงาน
                                    </label>

                                    <div className="space-y-3 sm:space-y-4">
                                        {Array.from({ length: currentConfig.requiredPeople }).map((_, idx) => (
                                            <motion.div
                                                key={`${activeDay}-${idx}`}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: idx * 0.04 }}
                                                className="group bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2.5 sm:space-y-3"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <input 
                                                            type="text"
                                                            className="w-full px-3.5 py-2 sm:py-2.5 bg-gray-50/80 focus:bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-400 placeholder:font-normal"
                                                            placeholder={`หัวข้อหน้าที่คนที่ ${idx + 1} (เช่น เวรครัว & ขยะ)`}
                                                            value={currentConfig.taskTitles[idx] || ''}
                                                            onChange={(e) => onUpdateTitle(activeDay, idx, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pl-0 sm:pl-11">
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 mb-1.5">
                                                        <AlignLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                        <span className="truncate">รายละเอียดงาน (แสดงในหน้าสุ่มเวรและตารางเวร)</span>
                                                    </div>
                                                    <textarea
                                                        rows={2}
                                                        className="w-full px-3.5 py-2 sm:py-2.5 bg-gray-50/80 focus:bg-white border-2 border-gray-100 rounded-xl text-xs sm:text-sm font-medium text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-gray-400 resize-y leading-relaxed"
                                                        placeholder={`เช่น • กวาดและถูพื้นห้องสตู\n• เช็ดโต๊ะกลาง\n• นำขยะไปทิ้งจุดรวม`}
                                                        value={currentConfig.taskDescriptions?.[idx] || ''}
                                                        onChange={(e) => onUpdateDescription?.(activeDay, idx, e.target.value)}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="mt-6 pt-5 border-t border-gray-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/80 p-3.5 sm:p-4 rounded-2xl border border-red-100">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-white rounded-xl text-red-500 shadow-sm shrink-0">
                                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h5 className="text-xs sm:text-sm font-bold text-red-800 truncate">ล้างข้อมูลเก่า (Maintenance)</h5>
                                                <p className="text-[11px] sm:text-xs text-red-600/90">ลบประวัติเวรที่เก่ากว่า 180 วันเพื่อคืนพื้นที่</p>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={handleCleanupClick}
                                            className="w-full sm:w-auto px-4 py-2.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5 shrink-0"
                                        >
                                            <ArchiveRestore className="w-4 h-4" />
                                            <span>Cleanup ประวัติเก่า</span>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* 3. Rigid Sticky Footer */}
                        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-white/95 backdrop-blur-md grid grid-cols-2 sm:flex sm:justify-end gap-2.5 sm:gap-3 relative z-20 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <button 
                                type="button"
                                onClick={onClose} 
                                className="w-full sm:w-auto px-5 py-2.5 sm:py-3 text-gray-600 font-bold bg-gray-100/80 hover:bg-gray-200/70 rounded-xl sm:rounded-2xl transition-colors text-sm flex items-center justify-center"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                type="button"
                                onClick={onSave} 
                                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                            >
                                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>บันทึกทั้งหมด</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ConfigModal;
