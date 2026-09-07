import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar as CalendarIcon, Users, Bell, Sparkles, Check, ChevronRight, AlertCircle, Search, ChevronLeft } from 'lucide-react';
import { User, MeetingLog } from '../../types';
import { format, isBefore, startOfDay } from 'date-fns';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import AttendeeSelectorModal from './AttendeeSelectorModal';
import CustomDatePicker from '../common/CustomDatePicker';

// --- Sub-component for Past Meetings Search ---
interface PastMeetingsDrillDownProps {
    isOpen: boolean;
    onClose: () => void;
    meetings: MeetingLog[];
    onSelect: (meetingId: string) => void;
    selectedId?: string;
}

const PastMeetingsDrillDown: React.FC<PastMeetingsDrillDownProps> = ({ isOpen, onClose, meetings, onSelect, selectedId }) => {
    const [search, setSearch] = useState('');
    
    const filtered = useMemo(() => {
        return meetings.filter(m => 
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            (m.category && m.category.toLowerCase().includes(search.toLowerCase()))
        ).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [meetings, search]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div 
                    id="past-meetings-drilldown-modal"
                    className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        className="bg-white w-full max-w-lg sm:max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white ring-1 ring-gray-100 overflow-hidden flex flex-col h-[480px] sm:h-[520px] max-h-[85vh] my-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-800">ค้นหาการประชุมเก่า</h3>
                                <p className="text-xs sm:text-sm text-gray-500">เลือกการประชุมที่ต้องการติดตามผล</p>
                            </div>
                            <button 
                                id="close-past-meetings-btn"
                                onClick={onClose} 
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gray-50/50 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input 
                                    id="search-past-meetings-input"
                                    type="text"
                                    placeholder="ค้นหาชื่อการประชุม หรือหมวดหมู่..."
                                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl outline-none focus:border-indigo-200 transition-all font-bold text-gray-700 text-xs sm:text-sm"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                            {filtered.length === 0 ? (
                                <div className="text-center py-10 sm:py-12 text-gray-400 text-xs sm:text-sm">ไม่พบข้อมูลการประชุม</div>
                            ) : (
                                filtered.map(m => (
                                    <button
                                        key={m.id}
                                        id={`select-past-meeting-${m.id}`}
                                        onClick={() => { onSelect(m.id); onClose(); }}
                                        className={`w-full p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 transition-all text-left flex justify-between items-center ${selectedId === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-transparent hover:border-indigo-100 hover:bg-indigo-50/30'}`}
                                    >
                                        <div className="min-w-0 flex-1 pr-2">
                                            <div className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 ${selectedId === m.id ? 'text-indigo-200' : 'text-indigo-400'}`}>
                                                {format(m.date, 'd MMMM yyyy')}
                                            </div>
                                            <div className={`font-bold text-xs sm:text-sm truncate ${selectedId === m.id ? 'text-white' : 'text-gray-800'}`}>{m.title}</div>
                                            <div className={`text-[9px] sm:text-[10px] mt-1 shrink-0 ${selectedId === m.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'} px-2 py-0.5 rounded-full inline-block`}>
                                                {m.category || 'General'}
                                            </div>
                                        </div>
                                        {selectedId === m.id && <Check className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

interface MeetingStartupModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    meetings: MeetingLog[];
    onConfirm: (data: {
        title: string;
        date: Date;
        attendees: string[];
        referenceMeetingId?: string;
        notify: boolean;
    }) => void;
}

// Framer motion variants for smooth locked-height step sliding
const stepVariants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 30 : -30,
        opacity: 0,
        filter: 'blur(1px)'
    }),
    center: {
        x: 0,
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
            duration: 0.22,
            ease: [0.16, 1, 0.3, 1]
        }
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -30 : 30,
        opacity: 0,
        filter: 'blur(1px)',
        transition: {
            duration: 0.16,
            ease: [0.16, 1, 0.3, 1]
        }
    })
};

const MeetingStartupModal: React.FC<MeetingStartupModalProps> = ({ 
    isOpen, onClose, users, meetings, onConfirm 
}) => {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
    const [title, setTitle] = useState('');
    const [meetingDate, setMeetingDate] = useState<Date>(new Date());
    const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
    const [refMeetingId, setRefMeetingId] = useState<string | undefined>();
    const [shouldNotify, setShouldNotify] = useState(true);
    
    // Modal states
    const [isAttendeeModalOpen, setIsAttendeeModalOpen] = useState(false);
    const [isRefDrillDownOpen, setIsRefDrillDownOpen] = useState(false);

    // Reset step on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setDirection(1);
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // --- Helper Logic ---
    const pastMeetings = useMemo(() => {
        return [...meetings].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    }, [meetings]);

    const isPastDate = isBefore(startOfDay(meetingDate), startOfDay(new Date()));

    const handleNext = () => {
        if (step < 2) {
            setDirection(1);
            setStep(2);
        } else {
            handleConfirm();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setDirection(-1);
            setStep(1);
        }
    };

    const handleConfirm = () => {
        onConfirm({
            title: title.trim() || 'การประชุมใหม่',
            date: meetingDate,
            attendees: selectedAttendees,
            referenceMeetingId: refMeetingId,
            notify: shouldNotify
        });
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    id="meeting-startup-modal-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-indigo-950/40 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                        className="bg-white w-full max-w-lg md:max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 sm:border-4 border-white ring-1 ring-indigo-100/80 overflow-hidden relative flex flex-col h-[500px] sm:h-[530px] max-h-[88vh] my-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Decoration */}
                        <div className="absolute top-0 left-0 right-0 h-28 sm:h-32 bg-gradient-to-br from-indigo-50/90 via-purple-50/60 to-pink-50/40 -z-10 pointer-events-none" />
                        
                        {/* Header */}
                        <div className="p-4 sm:p-5 md:p-6 pb-2 sm:pb-2.5 flex justify-between items-start shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="px-2.5 py-0.5 sm:px-3 sm:py-0.5 bg-indigo-600 text-white rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-md shadow-indigo-200">
                                        Step {step} of 2
                                    </div>
                                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
                                </div>
                                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 tracking-tight transition-all duration-200">
                                    {step === 1 ? 'ตั้งค่าการประชุม' : 'เลือกผู้เข้าร่วมคอนเทนต์'}
                                </h2>
                                <p className="text-gray-500 font-medium text-xs sm:text-sm mt-0.5">
                                    {step === 1 ? 'กำหนดชื่อและวันที่สำหรับการประชุมครั้งนี้' : 'เลือกทีมงานและอ้างอิงเรื่องที่ผ่านมา'}
                                </p>
                            </div>
                            <button 
                                id="close-meeting-startup-modal-btn"
                                onClick={onClose} 
                                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl sm:rounded-2xl text-gray-400 hover:text-gray-600 transition-colors"
                                title="ปิด (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-4 sm:px-5 md:px-6 mb-2.5 sm:mb-3.5 shrink-0">
                            <div className="h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={false}
                                    animate={{ width: step === 1 ? '50%' : '100%' }}
                                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                />
                            </div>
                        </div>

                        {/* Body Content - Locked Height with Smooth Horizontal Slide */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-5 md:px-6 pb-2 scrollbar-thin scrollbar-thumb-indigo-100 relative">
                            <AnimatePresence custom={direction} mode="wait">
                                {step === 1 ? (
                                    <motion.div 
                                        key="step1"
                                        custom={direction}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="space-y-4 py-1"
                                    >
                                        {/* Title Input */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                                หัวข้อการประชุม
                                            </label>
                                            <input 
                                                id="meeting-title-input"
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleNext();
                                                    }
                                                }}
                                                placeholder="เช่น วางแผนคอนเทนต์สัปดาห์หน้า..."
                                                className="w-full py-2.5 px-4 sm:py-3 sm:px-5 bg-gray-50/80 border-2 border-transparent focus:border-indigo-200 focus:bg-white rounded-xl sm:rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm sm:text-base shadow-inner placeholder:text-gray-300"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Date Selection */}
                                        <div className="space-y-1.5 sm:space-y-2">
                                            <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                                เลือกวันที่และเวลาเริ่ม
                                            </label>
                                            <div className="flex flex-col gap-2 sm:gap-2.5">
                                                <CustomDatePicker 
                                                    selected={meetingDate}
                                                    onChange={(date) => date && setMeetingDate(date)}
                                                    showTimeSelect={true}
                                                    portalId="root"
                                                />

                                                <AnimatePresence>
                                                    {isPastDate && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="p-3 sm:p-3.5 bg-amber-50/90 border border-amber-200/80 rounded-xl sm:rounded-2xl flex gap-2.5 text-amber-700 overflow-hidden"
                                                        >
                                                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 text-amber-600" />
                                                            <p className="text-[11px] sm:text-xs font-medium leading-relaxed">
                                                                วันที่เลือก <span className="font-bold underline decoration-amber-400 decoration-2">{format(meetingDate, 'd MMM yyyy')}</span> เป็นอดีตไปแล้ว <br className="hidden sm:inline" />
                                                                ระบบจะทำการบันทึกข้อมูลย้อนหลังให้
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="step2"
                                        custom={direction}
                                        variants={stepVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="space-y-3.5 sm:space-y-4 py-1"
                                    >
                                        {/* Reference Past Meeting */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end px-0.5">
                                                <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    ติดตามผลจากงานเก่า (Optional)
                                                </label>
                                                <div className="flex items-center gap-2.5">
                                                    {refMeetingId && (
                                                        <button 
                                                            id="clear-ref-meeting-btn"
                                                            type="button"
                                                            onClick={() => setRefMeetingId(undefined)}
                                                            className="text-[10px] sm:text-[11px] font-bold text-rose-500 hover:text-rose-600 underline"
                                                        >
                                                            ล้างค่า
                                                        </button>
                                                    )}
                                                    <button 
                                                        id="open-ref-drilldown-btn"
                                                        type="button"
                                                        onClick={() => setIsRefDrillDownOpen(true)}
                                                        className="text-[10px] sm:text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                                                    >
                                                        ค้นหาทั้งหมด
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-indigo-50 -mx-1 px-1">
                                                {pastMeetings.length === 0 ? (
                                                    <div className="text-[10px] sm:text-xs text-gray-400 p-3 sm:p-3.5 border border-dashed border-gray-200 rounded-xl sm:rounded-2xl w-full text-center">
                                                        ไม่มีข้อมูลการประชุมก่อนหน้า
                                                    </div>
                                                ) : (
                                                    pastMeetings.map(m => (
                                                        <button
                                                            key={m.id}
                                                            id={`quick-past-meeting-${m.id}`}
                                                            type="button"
                                                            onClick={() => setRefMeetingId(refMeetingId === m.id ? undefined : m.id)}
                                                            className={`shrink-0 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border-2 transition-all flex flex-col gap-0.5 w-32 sm:w-36 text-left relative ${refMeetingId === m.id ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-200 shadow-md shadow-indigo-100' : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-slate-50/50'}`}
                                                        >
                                                            {refMeetingId === m.id && (
                                                                <div className="absolute top-1.5 right-1.5 p-0.5 bg-indigo-500 text-white rounded-full">
                                                                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3px]" />
                                                                </div>
                                                            )}
                                                            <div className="text-[9px] sm:text-[10px] font-bold text-indigo-500 uppercase">
                                                                {format(m.date, 'd MMM')}
                                                            </div>
                                                            <div className="font-bold text-[11px] sm:text-xs text-gray-700 truncate w-full">
                                                                {m.title}
                                                            </div>
                                                            <div className="text-[8px] sm:text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded self-start truncate max-w-full mt-0.5">
                                                                {m.category || 'General'}
                                                            </div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Attendee Selection */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center px-0.5">
                                                <label className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                    ใครจะมาประชุมบ้าง?
                                                </label>
                                                <span className="text-[10px] sm:text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">
                                                    {selectedAttendees.length} คน
                                                </span>
                                            </div>

                                            <div className="bg-gray-50/90 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex gap-2 sm:gap-3 items-center border border-gray-100">
                                                <div className="flex -space-x-2.5 sm:-space-x-3 overflow-hidden flex-1 px-1">
                                                    {selectedAttendees.slice(0, 5).map(uid => {
                                                        const u = users.find(user => user.id === uid);
                                                        if (!u) return null;
                                                        return (
                                                            <img 
                                                                key={u.id}
                                                                src={u.avatarUrl} 
                                                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 sm:border-3 border-white object-cover shadow-sm bg-white shrink-0" 
                                                                alt={u.name} 
                                                            />
                                                        );
                                                    })}
                                                    {selectedAttendees.length > 5 && (
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-2 sm:border-3 border-white bg-indigo-50 flex items-center justify-center text-indigo-600 text-[10px] sm:text-xs font-bold shadow-sm shrink-0">
                                                            +{selectedAttendees.length - 5}
                                                        </div>
                                                    )}
                                                    {selectedAttendees.length === 0 && (
                                                        <div className="text-[11px] sm:text-xs font-medium text-gray-400 px-1 italic">
                                                            ยังไม่ได้เลือกผู้เข้าร่วม
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    id="open-attendee-selector-btn"
                                                    type="button"
                                                    onClick={() => setIsAttendeeModalOpen(true)}
                                                    className="py-2 px-3 sm:py-2.5 sm:px-4 rounded-lg sm:rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                                                >
                                                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    <span className="text-xs font-medium uppercase tracking-wider">เลือกสมาชิก</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Notification Toggle */}
                                        <div className="flex items-center justify-between p-3 sm:p-3.5 bg-indigo-50/50 rounded-xl sm:rounded-2xl border border-indigo-100/80 shadow-xs">
                                            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 pr-2">
                                                <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl shrink-0 ${shouldNotify ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-gray-200 text-gray-500'} transition-all`}>
                                                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs sm:text-sm font-bold text-gray-700 truncate">แจ้งเตือนผู้เข้าร่วม</div>
                                                    <div className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">ส่งการแจ้งเตือนทันทีเมื่อเริ่มการประชุม</div>
                                                </div>
                                            </div>
                                            <button 
                                                id="toggle-notification-btn"
                                                type="button"
                                                onClick={() => setShouldNotify(!shouldNotify)}
                                                className={`w-11 h-6 sm:w-13 sm:h-7 rounded-full p-0.5 relative transition-all shrink-0 ${shouldNotify ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                            >
                                                <motion.div 
                                                    animate={{ x: shouldNotify ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 20 : 24) : 0 }}
                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md"
                                                />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 sm:p-5 md:p-6 pt-2 sm:pt-3 flex gap-2.5 sm:gap-3 shrink-0 bg-white/80 border-t border-gray-50">
                            {step === 2 && (
                                <button 
                                    id="startup-modal-back-btn"
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-gray-600 bg-gray-100 hover:bg-gray-200/80 transition-all tracking-wider uppercase flex items-center justify-center gap-1.5"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span>ย้อนกลับ</span>
                                </button>
                            )}
                            <button 
                                id="startup-modal-next-btn"
                                type="button"
                                onClick={handleNext}
                                className="flex-[2] py-2.5 sm:py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl sm:rounded-2xl font-medium text-xs sm:text-sm md:text-base tracking-wider sm:tracking-[0.12em] uppercase shadow-lg shadow-indigo-200 hover:shadow-indigo-400/40 active:scale-[0.98] transition-all flex items-center justify-center group"
                            >
                                <span>{step === 1 ? 'ขั้นตอนถัดไป' : 'เริ่มการประชุม'}</span>
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Child Modals */}
                    <AttendeeSelectorModal 
                        isOpen={isAttendeeModalOpen}
                        onClose={() => setIsAttendeeModalOpen(false)}
                        users={users}
                        selectedIds={selectedAttendees}
                        onConfirm={setSelectedAttendees}
                    />

                    <PastMeetingsDrillDown 
                        isOpen={isRefDrillDownOpen}
                        onClose={() => setIsRefDrillDownOpen(false)}
                        meetings={meetings}
                        selectedId={refMeetingId}
                        onSelect={setRefMeetingId}
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default MeetingStartupModal;
