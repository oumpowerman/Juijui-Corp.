
import React, { useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Dices, Sparkles, Wand2, RefreshCw, User as UserIcon, Repeat, Hourglass, Calendar, Download, Copy, Loader2, Save, Info, Check, ArrowRight, PlayCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { User, Duty, DutyConfig } from '../../types';
import html2canvas from 'html2canvas';
import DraftGrid from './randomizer/DraftGrid';
import ExportTemplate from './randomizer/ExportTemplate';
import CustomDatePicker from '../common/CustomDatePicker';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface RandomizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    duties: Duty[];
    users: User[];
    configs: DutyConfig[];
    calculateDuties: (start: Date, mode: 'ROTATION' | 'DURATION', weeks: number, selectedUsers: User[]) => Promise<Duty[]>;
    onSaveToDB: (duties: Duty[]) => Promise<void>;
}

const RandomizerModal: React.FC<RandomizerModalProps> = ({ 
    isOpen, onClose, duties, users, configs, calculateDuties, onSaveToDB
}) => {
    const { showAlert, showConfirm } = useGlobalDialog();

    // --- STATE ---
    const [stage, setStage] = useState<'CONFIG' | 'DRAFT'>('CONFIG');
    const [isShuffling, setIsShuffling] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    
    // Config State
    const [mode, setMode] = useState<'ROTATION' | 'DURATION'>('ROTATION');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [durationWeeks, setDurationWeeks] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>(users.filter(u => u.isActive).map(u => u.id));

    // Draft State
    const [draftDuties, setDraftDuties] = useState<Duty[]>([]);
    const [swapSourceIndex, setSwapSourceIndex] = useState<number | null>(null);

    // Export
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // --- LOGIC ---
    
    const handleStart = async () => {
        if (selectedIds.length === 0) {
            await showAlert('กรุณาเลือกสมาชิกผู้โชคดีอย่างน้อย 1 คนครับ', 'ข้อมูลไม่ครบถ้วน 😅');
            return;
        }
        setIsShuffling(true);
        try {
            const selectedUsers = users.filter(u => selectedIds.includes(u.id));
            const results = await calculateDuties(startDate, mode, durationWeeks, selectedUsers);
            setDraftDuties(results);
            setStage('DRAFT');
        } catch (error) {
            console.error(error);
            await showAlert('เกิดข้อผิดพลาดในการสุ่มตารางเวร', 'ผิดพลาด ❌');
        } finally {
            setIsShuffling(false);
        }
    };

    const handleReset = () => {
        setStage('CONFIG');
        setDraftDuties([]);
    };

    const handleSave = async () => {
        // Find if there is any overlap with existing duties
        const draftDates = draftDuties.map(d => format(d.date, 'yyyy-MM-dd'));
        const hasConflict = duties.some(existing => {
            const existingDateStr = format(new Date(existing.date), 'yyyy-MM-dd');
            return draftDates.includes(existingDateStr);
        });

        const confirmMessage = hasConflict 
            ? 'พบรายการเวรเดิมในช่วงเวลาที่สุ่มใหม่! ต้องสร้างเวรใหม่ทับงานเก่าหรือไม่?' 
            : 'ตารางเวรใหม่จะถูกบันทึกลงระบบ และตารางเก่าในช่วงเวลาเดียวกันจะถูกทับ';

        const confirmed = await showConfirm(
            confirmMessage,
            '🚀 ยืนยันการใช้ตารางเวรนี้?'
        );

        if(confirmed) {
            setIsSaving(true);
            await onSaveToDB(draftDuties);
            setIsSaving(false);
            onClose();
        }
    };

    // --- DRAFT MANIPULATION ---
    const groupedDraft = useMemo(() => {
        const groups: Record<string, Duty[]> = {};
        draftDuties.forEach(duty => {
            const dateKey = format(duty.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(duty);
        });
        return Object.keys(groups).sort().map(dateKey => ({
            date: new Date(dateKey),
            duties: groups[dateKey]
        }));
    }, [draftDuties]);

    const handleReplaceUser = (index: number, newUserId: string) => {
        setDraftDuties(prev => {
            const next = [...prev];
            next[index].assigneeId = newUserId;
            return next;
        });
    };

    const handleSwapInit = (index: number) => {
        if (swapSourceIndex === null) {
            setSwapSourceIndex(index);
        } else {
            // Swap!
            setDraftDuties(prev => {
                const next = [...prev];
                const temp = next[swapSourceIndex].assigneeId;
                next[swapSourceIndex].assigneeId = next[index].assigneeId;
                next[index].assigneeId = temp;
                return next;
            });
            setSwapSourceIndex(null);
        }
    };

    const handleRemoveDay = async (date: Date) => {
        const confirmed = await showConfirm(
            'รายการเวรทั้งหมดในวันที่เลือกจะหายไปจาก Draft นี้',
            'ลบรายการเวรของวันนี้?'
        );
        if(confirmed) {
             setDraftDuties(prev => prev.filter(d => d.date.getTime() !== date.getTime()));
        }
    };

    const handleCopyImage = async () => {
        if (!exportRef.current) return;
        setIsCopying(true);
        try {
            const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#f1f5f9' });
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Failed to generate image blob');
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2500);
        } catch (error) {
            console.error(error);
            await showAlert('เบราว์เซอร์ไม่รองรับการคัดลอกรูปภาพลง Clipboard โดยตรง กรุณาใช้ปุ่ม Save Image แทนครับ', 'ไม่สามารถคัดลอกรูปได้ ⚠️');
        } finally {
            setIsCopying(false);
        }
    };

    const handleDownloadImage = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#f1f5f9' });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Duty_Roster_${format(new Date(), 'yyyy-MM-dd')}.png`;
            link.click();
        } catch (error) { 
            console.error(error); 
            await showAlert('ไม่สามารถบันทึกรูปภาพได้ กรุณาลองใหม่อีกครั้ง', 'เกิดข้อผิดพลาด ❌');
        } 
        finally { setIsExporting(false); }
    };

    const toggleUserId = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2.5 sm:p-4 font-sans overflow-hidden">
                    {/* Backdrop with fade transition */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={!isShuffling && !isSaving ? onClose : undefined}
                    />

                    {/* Modal Card with spring scale/fade transition */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 16 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] relative border-2 sm:border-4 border-white ring-1 ring-gray-200 z-10"
                    >
                        {/* Overlay Loader */}
                        {isShuffling && (
                            <div className="absolute inset-0 z-50 bg-indigo-600/95 flex flex-col items-center justify-center text-white p-6 sm:p-8 text-center animate-in fade-in">
                                <Dices className="w-16 h-16 sm:w-20 sm:h-20 animate-spin mb-4 sm:mb-6 text-yellow-300" />
                                <h3 className="text-2xl sm:text-3xl font-bold animate-pulse">กำลังเขย่าไพ่...</h3>
                                <p className="text-indigo-200 mt-2 text-xs sm:text-sm">Shuffling Duties</p>
                            </div>
                        )}

                        {/* Header */}
                        <div className="px-4 py-3 sm:px-8 sm:py-5 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden shrink-0">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                            
                            <div className="relative z-10 text-white min-w-0 pr-2">
                                <h3 className="text-base sm:text-2xl font-bold flex items-center gap-2">
                                    {stage === 'DRAFT' ? <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 shrink-0" /> : <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300 shrink-0" />}
                                    <span className="truncate">{stage === 'DRAFT' ? 'ตรวจสอบตาราง (Review)' : 'สุ่มเวร (Randomizer)'}</span>
                                </h3>
                                <p className="text-indigo-100 text-[11px] sm:text-sm font-medium mt-0.5 sm:mt-1 opacity-90 truncate max-w-[210px] xs:max-w-xs sm:max-w-none">
                                    {stage === 'DRAFT' ? 'ปรับเปลี่ยนได้ตามใจชอบ ก่อนกดบันทึกจริง' : 'เลือกโหมดและผู้โชคดีที่จะได้ทำเวร'}
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-1.5 sm:gap-2 relative z-10 shrink-0">
                                {stage === 'CONFIG' && (
                                     <button 
                                        onClick={() => setShowInfo(!showInfo)} 
                                        className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm"
                                        title="คำแนะนำโหมด"
                                        aria-label="คำแนะนำโหมด"
                                     >
                                        <Info className="w-4 h-4 sm:w-6 sm:h-6" />
                                     </button>
                                )}
                                <button 
                                    onClick={onClose} 
                                    className="p-1.5 sm:p-2 bg-white/20 hover:bg-red-500 hover:text-white text-indigo-50 rounded-full transition-colors backdrop-blur-sm"
                                    title="ปิด"
                                    aria-label="ปิด"
                                >
                                    <X className="w-4 h-4 sm:w-6 sm:h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-3.5 sm:p-6 md:p-8 overflow-y-auto flex-1 bg-[#f8fafc]">
                            
                            {/* INFO ALERT */}
                            {showInfo && stage === 'CONFIG' && (
                                <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-2.5 sm:gap-3 text-xs sm:text-sm text-blue-800 animate-in slide-in-from-top-2">
                                    <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-1">ความต่างของ 2 โหมด</p>
                                        <ul className="list-disc pl-4 space-y-1 text-[11px] sm:text-xs opacity-90">
                                            <li><b>Rotation (วนจนครบ):</b> เหมาะสำหรับจัดเวรระยะยาว ระบบจะรันไปเรื่อยๆ จนกว่าทุกคนจะได้ทำเวรครบ 1 รอบ</li>
                                            <li><b>Duration (ช่วงเวลา):</b> เหมาะสำหรับจัดเฉพาะกิจ เช่น "สัปดาห์นี้" หรือ "เดือนนี้" ระบบจะสุ่มคนลงในวันที่กำหนด (อาจมีคนซ้ำ)</li>
                                        </ul>
                                    </div>
                                    <button onClick={() => setShowInfo(false)} className="ml-auto text-blue-400 hover:text-blue-600"><X className="w-4 h-4"/></button>
                                </div>
                            )}

                            {stage === 'CONFIG' ? (
                                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                                    
                                    {/* 1. Mode Selector Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        <button 
                                            onClick={() => setMode('ROTATION')} 
                                            className={`
                                                relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 text-left transition-all group h-full flex flex-col
                                                ${mode === 'ROTATION' 
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 ring-2 ring-indigo-200 ring-offset-1 sm:ring-offset-2' 
                                                    : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md'}
                                            `}
                                        >
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 transition-colors ${mode === 'ROTATION' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <h4 className={`text-base sm:text-lg font-bold ${mode === 'ROTATION' ? 'text-indigo-800' : 'text-gray-600'}`}>วนจนครบ (Rotation)</h4>
                                            <p className="text-xs text-gray-500 mt-1 sm:mt-2 font-medium leading-relaxed">
                                                จัดคิวให้ทุกคนได้ทำเวรอย่างน้อย 1 ครั้ง เรียงลำดับความยุติธรรม
                                            </p>
                                            {mode === 'ROTATION' && <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-indigo-500"><Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" /></div>}
                                        </button>

                                        <button 
                                            onClick={() => setMode('DURATION')} 
                                            className={`
                                                relative overflow-hidden p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border-2 text-left transition-all group h-full flex flex-col
                                                ${mode === 'DURATION' 
                                                    ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100 ring-2 ring-orange-200 ring-offset-1 sm:ring-offset-2' 
                                                    : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-md'}
                                            `}
                                        >
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2.5 sm:mb-4 transition-colors ${mode === 'DURATION' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                <Hourglass className="w-5 h-5 sm:w-6 sm:h-6" />
                                            </div>
                                            <h4 className={`text-base sm:text-lg font-bold ${mode === 'DURATION' ? 'text-orange-800' : 'text-gray-600'}`}>ตามช่วงเวลา (Duration)</h4>
                                            <p className="text-xs text-gray-500 mt-1 sm:mt-2 font-medium leading-relaxed">
                                                ระบุวันเริ่ม-จบ แล้วสุ่มคนลงในช่องว่าง (อาจมีคนได้ทำซ้ำ)
                                            </p>
                                            {mode === 'DURATION' && <div className="absolute top-3 right-3 sm:top-4 sm:right-4 text-orange-500"><Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" /></div>}
                                        </button>
                                    </div>
                                    
                                    {/* 2. Settings Box */}
                                    <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-colors ${mode === 'ROTATION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-orange-50/50 border-orange-100'}`}>
                                        <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4 flex items-center ${mode === 'ROTATION' ? 'text-indigo-400' : 'text-orange-400'}`}>
                                            <Settings2 className="w-3 h-3 mr-2" /> Settings
                                        </h4>
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block ml-1">เริ่มวันที่ (Start Date)</label>
                                                <CustomDatePicker 
                                                    selected={startDate}
                                                    onChange={(date) => date && setStartDate(date)}
                                                />
                                            </div>
                                            {mode === 'DURATION' && (
                                                <div className="flex-1 animate-in fade-in slide-in-from-left-2">
                                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block ml-1">ระยะเวลา (Weeks)</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 shadow-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all bg-white appearance-none cursor-pointer text-sm" 
                                                            value={durationWeeks} 
                                                            onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
                                                        >
                                                            <option value={1}>1 สัปดาห์</option>
                                                            <option value={2}>2 สัปดาห์</option>
                                                            <option value={4}>4 สัปดาห์</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▼</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Participants (Avatar Grid) */}
                                    <div>
                                        <div className="flex justify-between items-end mb-3 sm:mb-4 px-1 sm:px-2">
                                            <div>
                                                <h4 className="text-sm sm:text-md font-kanit font-bold text-gray-700">ผู้ท้าชิง (Participants)</h4>
                                                <p className="text-xs sm:text-[14px] font-kanit text-gray-400 font-medium">เลือกคนที่จะร่วมชะตากรรม ({selectedIds.length}/{users.length})</p>
                                            </div>
                                            <div className="flex gap-1.5 sm:gap-2">
                                                <button 
                                                    onClick={() => setSelectedIds(users.map(u => u.id))} 
                                                    className="text-[11px] sm:text-[12px] bg-gray-100 text-gray-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                                >
                                                    Select All
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedIds([])} 
                                                    className="text-[11px] sm:text-[12px] bg-gray-100 text-gray-600 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 max-h-[190px] sm:max-h-[220px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                            {users.map(u => {
                                                const isSelected = selectedIds.includes(u.id);
                                                return (
                                                    <button 
                                                        key={u.id}
                                                        onClick={() => toggleUserId(u.id)}
                                                        className={`
                                                            group relative flex flex-col items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-200 border-2
                                                            ${isSelected 
                                                                ? 'bg-white border-green-400 shadow-sm scale-100 opacity-100' 
                                                                : 'bg-transparent border-transparent opacity-60 grayscale hover:grayscale-0 hover:bg-gray-100'}
                                                        `}
                                                    >
                                                        <div className="relative">
                                                            <img 
                                                                src={u.avatarUrl} 
                                                                alt={u.name} 
                                                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover transition-transform ${isSelected ? 'group-active:scale-90' : ''}`}
                                                            />
                                                            {isSelected && (
                                                                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm animate-in zoom-in">
                                                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3px]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[11px] sm:text-[12px] font-kanit font-medium truncate w-full text-center ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
                                                            {u.name.split(' ')[0]}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                // --- DRAFT MODE ---
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    {swapSourceIndex !== null && (
                                        <div className="sticky top-0 z-20 bg-indigo-600 text-white text-xs font-bold p-2.5 sm:p-3 rounded-xl mb-3 sm:mb-4 flex items-center justify-between shadow-lg animate-pulse">
                                            <span className="flex items-center gap-2"><ArrowRight className="w-4 h-4"/> เลือกคนที่จะสลับด้วย...</span>
                                            <button onClick={() => setSwapSourceIndex(null)} className="bg-white/20 hover:bg-white/30 p-1 rounded-full"><X className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                    <DraftGrid 
                                        groupedDuties={groupedDraft}
                                        users={users}
                                        onReplaceUser={handleReplaceUser}
                                        onRemoveDay={handleRemoveDay}
                                        onSwapInit={handleSwapInit}
                                        swapSourceIndex={swapSourceIndex}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 sm:p-4 md:p-5 border-t border-gray-100 bg-white shrink-0">
                            {stage === 'CONFIG' ? (
                                <div className="flex items-center justify-between gap-2.5 sm:gap-3 w-full">
                                    <button 
                                        onClick={onClose} 
                                        className="px-4 py-2 sm:px-6 sm:py-2.5 text-gray-500 font-kanit font-medium hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-colors text-xs sm:text-base shrink-0"
                                    >
                                        ยกเลิก
                                    </button>

                                    <button 
                                        onClick={handleStart} 
                                        disabled={selectedIds.length === 0} 
                                        className="flex-1 sm:flex-initial px-4 py-2 sm:px-8 sm:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm font-kanit"
                                    >
                                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> 
                                        Start Randomizer
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
                                    {/* Action row on mobile / Left group on desktop */}
                                    <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
                                        <button 
                                            onClick={handleReset} 
                                            className="px-3 py-2 sm:px-5 sm:py-2.5 text-gray-600 font-kanit font-semibold hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-colors text-xs sm:text-sm flex items-center gap-1.5 bg-gray-50 sm:bg-transparent border sm:border-0 border-gray-200"
                                            title="สุ่มใหม่"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                            <span>สุ่มใหม่</span>
                                        </button>

                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <button 
                                                onClick={handleCopyImage} 
                                                disabled={isCopying} 
                                                className={`px-3 py-2 sm:px-4 sm:py-2.5 border rounded-xl sm:rounded-2xl font-bold transition-all flex items-center text-xs sm:text-sm ${
                                                    isCopied 
                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                                        : 'bg-white border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200'
                                                }`}
                                                title="คัดลอกรูปภาพลงคลิปบอร์ด"
                                            >
                                                {isCopying ? (
                                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 animate-spin" />
                                                ) : isCopied ? (
                                                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                                                )}
                                                <span>{isCopied ? 'Copied!' : 'Copy Image'}</span>
                                            </button>

                                            <button 
                                                onClick={handleDownloadImage} 
                                                disabled={isExporting} 
                                                className="px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl sm:rounded-2xl hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center text-xs sm:text-sm"
                                                title="บันทึกไฟล์รูปภาพ"
                                            >
                                                {isExporting ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 animate-spin"/> : <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"/>} 
                                                <span>Save Image</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Primary Confirm button */}
                                    <button 
                                        onClick={handleSave} 
                                        disabled={isSaving} 
                                        className="w-full sm:w-auto px-4 py-2.5 sm:px-6 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center text-xs sm:text-sm font-kanit"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin"/> : <Save className="w-4 h-4 mr-1.5"/>} 
                                        <span>Confirm & Save</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Hidden Export Template */}
                    <ExportTemplate ref={exportRef} groupedDuties={groupedDraft} users={users} />
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

// Helper Icon for Settings
const Settings2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);

export default RandomizerModal;
