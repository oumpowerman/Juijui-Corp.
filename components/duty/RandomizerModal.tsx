
import React, { useRef, useState, useMemo } from 'react';
import { X, Dices, Sparkles, Wand2, RefreshCw, User as UserIcon, Repeat, Hourglass, Calendar, Download, Loader2, Save, Info, Check, ArrowRight, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { User, Duty, DutyConfig } from '../../types';
import html2canvas from 'html2canvas';
import DraftGrid from './randomizer/DraftGrid';
import ExportTemplate from './randomizer/ExportTemplate';
import { useGlobalDialog } from '../../context/GlobalDialogContext';

interface RandomizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: User[];
    configs: DutyConfig[];
    calculateDuties: (start: Date, mode: 'ROTATION' | 'DURATION', weeks: number, selectedUsers: User[]) => Promise<Duty[]>;
    onSaveToDB: (duties: Duty[]) => Promise<void>;
}

const RandomizerModal: React.FC<RandomizerModalProps> = ({ 
    isOpen, onClose, users, configs, calculateDuties, onSaveToDB
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
        const confirmed = await showConfirm(
            'ตารางเวรใหม่จะถูกบันทึกลงระบบ และตารางเก่าในช่วงเวลาเดียวกันจะถูกทับ',
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

    const handleDownloadImage = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        try {
            const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300 font-sans">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 relative border-4 border-white ring-1 ring-gray-200">
                
                {/* Overlay Loader */}
                {isShuffling && (
                    <div className="absolute inset-0 z-50 bg-indigo-600/95 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in">
                        <Dices className="w-20 h-20 animate-spin mb-6 text-yellow-300" />
                        <h3 className="text-3xl font-black animate-pulse">กำลังเขย่าไพ่...</h3>
                        <p className="text-indigo-200 mt-2">Shuffling Duties</p>
                    </div>
                )}

                {/* Header */}
                <div className="px-8 py-6 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden shrink-0">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '20px 20px' }}></div>
                    
                    <div className="relative z-10 text-white">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                            {stage === 'DRAFT' ? <Sparkles className="w-6 h-6 text-yellow-300" /> : <Dices className="w-6 h-6 text-yellow-300" />}
                            {stage === 'DRAFT' ? 'ตรวจสอบตาราง (Review)' : 'สุ่มเวร (Randomizer)'}
                        </h3>
                        <p className="text-indigo-100 text-sm font-medium mt-1 opacity-90">
                            {stage === 'DRAFT' ? 'ปรับเปลี่ยนได้ตามใจชอบ ก่อนกดบันทึกจริง' : 'เลือกโหมดและผู้โชคดีที่จะได้ทำเวร'}
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                        {stage === 'CONFIG' && (
                             <button onClick={() => setShowInfo(!showInfo)} className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm">
                                <Info className="w-6 h-6" />
                             </button>
                        )}
                        <button onClick={onClose} className="p-2 bg-white/20 hover:bg-red-500 hover:text-white text-indigo-50 rounded-full transition-colors backdrop-blur-sm">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#f8fafc]">
                    
                    {/* INFO ALERT */}
                    {showInfo && stage === 'CONFIG' && (
                        <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-sm text-blue-800 animate-in slide-in-from-top-2">
                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">ความต่างของ 2 โหมด</p>
                                <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                                    <li><b>Rotation (วนจนครบ):</b> เหมาะสำหรับจัดเวรระยะยาว ระบบจะรันไปเรื่อยๆ จนกว่าทุกคนจะได้ทำเวรครบ 1 รอบ</li>
                                    <li><b>Duration (ช่วงเวลา):</b> เหมาะสำหรับจัดเฉพาะกิจ เช่น "สัปดาห์นี้" หรือ "เดือนนี้" ระบบจะสุ่มคนลงในวันที่กำหนด (อาจมีคนซ้ำ)</li>
                                </ul>
                            </div>
                            <button onClick={() => setShowInfo(false)} className="ml-auto text-blue-400 hover:text-blue-600"><X className="w-4 h-4"/></button>
                        </div>
                    )}

                    {stage === 'CONFIG' ? (
                        <div className="space-y-8">
                            
                            {/* 1. Mode Selector Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setMode('ROTATION')} 
                                    className={`
                                        relative overflow-hidden p-5 rounded-3xl border-2 text-left transition-all group h-full flex flex-col
                                        ${mode === 'ROTATION' 
                                            ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100 ring-2 ring-indigo-200 ring-offset-2' 
                                            : 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md'}
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${mode === 'ROTATION' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Repeat className="w-6 h-6" />
                                    </div>
                                    <h4 className={`text-lg font-black ${mode === 'ROTATION' ? 'text-indigo-800' : 'text-gray-600'}`}>วนจนครบ (Rotation)</h4>
                                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">
                                        จัดคิวให้ทุกคนได้ทำเวรอย่างน้อย 1 ครั้ง เรียงลำดับความยุติธรรม
                                    </p>
                                    {mode === 'ROTATION' && <div className="absolute top-4 right-4 text-indigo-500"><Check className="w-6 h-6 stroke-[3px]" /></div>}
                                </button>

                                <button 
                                    onClick={() => setMode('DURATION')} 
                                    className={`
                                        relative overflow-hidden p-5 rounded-3xl border-2 text-left transition-all group h-full flex flex-col
                                        ${mode === 'DURATION' 
                                            ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-100 ring-2 ring-orange-200 ring-offset-2' 
                                            : 'border-gray-200 bg-white hover:border-orange-200 hover:shadow-md'}
                                    `}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${mode === 'DURATION' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Hourglass className="w-6 h-6" />
                                    </div>
                                    <h4 className={`text-lg font-black ${mode === 'DURATION' ? 'text-orange-800' : 'text-gray-600'}`}>ตามช่วงเวลา (Duration)</h4>
                                    <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">
                                        ระบุวันเริ่ม-จบ แล้วสุ่มคนลงในช่องว่าง (อาจมีคนได้ทำซ้ำ)
                                    </p>
                                    {mode === 'DURATION' && <div className="absolute top-4 right-4 text-orange-500"><Check className="w-6 h-6 stroke-[3px]" /></div>}
                                </button>
                            </div>
                            
                            {/* 2. Settings Box */}
                            <div className={`p-6 rounded-3xl border transition-colors ${mode === 'ROTATION' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-orange-50/50 border-orange-100'}`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 flex items-center ${mode === 'ROTATION' ? 'text-indigo-400' : 'text-orange-400'}`}>
                                    <Settings2 className="w-3 h-3 mr-2" /> Settings
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block ml-1">เริ่มวันที่ (Start Date)</label>
                                        <div className="relative group">
                                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500" />
                                            <input 
                                                type="date" 
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all bg-white" 
                                                value={format(startDate, 'yyyy-MM-dd')} 
                                                onChange={(e) => setStartDate(new Date(e.target.value))} 
                                            />
                                        </div>
                                    </div>
                                    {mode === 'DURATION' && (
                                        <div className="flex-1 animate-in fade-in slide-in-from-left-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block ml-1">ระยะเวลา (Weeks)</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 shadow-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all bg-white appearance-none cursor-pointer" 
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
                                <div className="flex justify-between items-end mb-4 px-2">
                                    <div>
                                        <h4 className="text-md font-kanit font-bold text-gray-700">ผู้ท้าชิง (Participants)</h4>
                                        <p className="text-[14px] font-kanit text-gray-400 font-medium">เลือกคนที่จะร่วมชะตากรรม</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedIds(users.map(u => u.id))} 
                                            className="text-[12px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            onClick={() => setSelectedIds([])} 
                                            className="text-[12px] bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                    {users.map(u => {
                                        const isSelected = selectedIds.includes(u.id);
                                        return (
                                            <button 
                                                key={u.id}
                                                onClick={() => toggleUserId(u.id)}
                                                className={`
                                                    group relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-200 border-2
                                                    ${isSelected 
                                                        ? 'bg-white border-green-400 shadow-sm scale-100 opacity-100' 
                                                        : 'bg-transparent border-transparent opacity-60 grayscale hover:grayscale-0 hover:bg-gray-100'}
                                                `}
                                            >
                                                <div className="relative">
                                                    <img 
                                                        src={u.avatarUrl} 
                                                        alt={u.name} 
                                                        className={`w-12 h-12 rounded-full object-cover transition-transform ${isSelected ? 'group-active:scale-90' : ''}`}
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white shadow-sm animate-in zoom-in">
                                                            <Check className="w-3 h-3 stroke-[3px]" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`text-[12px] font-kanit font-medium truncate w-full text-center ${isSelected ? 'text-green-700' : 'text-gray-500'}`}>
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
                                <div className="sticky top-0 z-20 bg-indigo-600 text-white text-xs font-bold p-3 rounded-xl mb-4 flex items-center justify-between shadow-lg animate-pulse">
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
                <div className="p-5 border-t border-gray-100 bg-white flex justify-between items-center shrink-0">
                    <button 
                        onClick={stage === 'CONFIG' ? onClose : handleReset} 
                        className="px-6 py-3 text-gray-500 font-kanit font-medium hover:bg-gray-100 rounded-2xl transition-colors text-md"
                    >
                        {stage === 'CONFIG' ? 'ยกเลิก' : 'สุ่มใหม่'}
                    </button>

                    <div className="flex gap-3">
                        {stage === 'CONFIG' ? (
                            <button 
                                onClick={handleStart} 
                                disabled={selectedIds.length === 0} 
                                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                            >
                                <Sparkles className="w-5 h-5 mr-2" /> 
                                Start Randomizer
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={handleDownloadImage} 
                                    disabled={isExporting} 
                                    className="px-5 py-3 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:text-indigo-600 hover:border-indigo-200 transition-colors flex items-center text-sm"
                                >
                                    {isExporting ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Download className="w-5 h-5 mr-2"/>} 
                                    Save Image
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={isSaving} 
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center text-sm"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Save className="w-5 h-5 mr-2"/>} 
                                    Confirm & Save
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Hidden Export Template */}
            <ExportTemplate ref={exportRef} groupedDuties={groupedDraft} users={users} />
        </div>
    );
};

// Helper Icon for Settings
const Settings2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>
);

export default RandomizerModal;
