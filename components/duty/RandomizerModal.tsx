
import React from 'react';
import { X, Dices, Sparkles, Wand2, RefreshCw, CheckCircle2, User as UserIcon, Repeat, Hourglass, Calendar, Clock, Info, Users } from 'lucide-react';
import { format } from 'date-fns';
import { User, Duty, DutyConfig } from '../../types';

const WEEK_DAYS_MAP = [
    { num: 1, label: 'จันทร์' },
    { num: 2, label: 'อังคาร' },
    { num: 3, label: 'พุธ' },
    { num: 4, label: 'พฤหัส' },
    { num: 5, label: 'ศุกร์' },
];

interface RandomizerModalProps {
    isOpen: boolean;
    onClose: () => void;
    stage: 'IDLE' | 'SHUFFLING' | 'RESULT';
    loadingText: string;
    
    // Config State
    mode: 'ROTATION' | 'DURATION';
    setMode: (m: 'ROTATION' | 'DURATION') => void;
    startDate: Date;
    setStartDate: (d: Date) => void;
    durationWeeks: number;
    setDurationWeeks: (n: number) => void;
    
    // Participants
    users: User[];
    selectedIds: string[];
    onToggleUser: (id: string) => void;
    onSelectAll: () => void;
    onClearAll: () => void;
    
    // Actions
    onStart: () => void;
    onReset: () => void; // Go back to IDLE
    onConfirm: () => void; // Close
    
    // Data
    configs: DutyConfig[];
    previewDuties: Duty[];
}

const RandomizerModal: React.FC<RandomizerModalProps> = ({ 
    isOpen, onClose, stage, loadingText,
    mode, setMode, startDate, setStartDate, durationWeeks, setDurationWeeks,
    users, selectedIds, onToggleUser, onSelectAll, onClearAll,
    onStart, onReset, onConfirm,
    configs, previewDuties
}) => {
    if (!isOpen) return null;

    // Group preview for result display
    const groupedPreview = React.useMemo(() => {
        const groups: Record<string, Duty[]> = {};
        previewDuties.forEach(duty => {
            const dateKey = format(duty.date, 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(duty);
        });
        return Object.keys(groups).sort().map(dateKey => ({
            date: new Date(dateKey),
            duties: groups[dateKey]
        }));
    }, [previewDuties]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 relative border border-gray-100">
                {/* Shuffling Overlay */}
                {stage === 'SHUFFLING' && (
                    <div className="absolute inset-0 z-20 bg-indigo-600/95 flex flex-col items-center justify-center text-white p-8 text-center animate-in fade-in duration-300">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative bg-white text-indigo-600 p-4 rounded-full shadow-xl animate-bounce">
                                <Dices className="w-10 h-10" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-black mb-2 animate-pulse">{loadingText}</h3>
                        <p className="text-indigo-200 text-sm">กำลังจัดสรรเวรให้ครบทุกคน...</p>
                    </div>
                )}

                {/* Modal Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div>
                        <h3 className="text-xl font-black text-gray-800 flex items-center">
                            {stage === 'RESULT' ? <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> : <Wand2 className="w-5 h-5 mr-2 text-indigo-600" />}
                            {stage === 'RESULT' ? 'ผลการจับคู่ 🎉' : 'สุ่มเวรอัตโนมัติ (Auto Random)'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            {stage === 'RESULT' ? 'ตารางเวรที่ได้ในรอบนี้' : 'ระบบช่วยจัดตารางให้เป็นธรรม'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* RESULT STAGE */}
                {stage === 'RESULT' ? (
                    <div className="p-6 overflow-y-auto flex-1 bg-white">
                        <div className="space-y-4">
                            {groupedPreview.map((group, index) => (
                                <div 
                                    key={group.date.toISOString()} 
                                    className="flex flex-row gap-4 p-3 rounded-2xl border border-gray-100 bg-gray-50 hover:border-indigo-200 hover:shadow-sm transition-all animate-in slide-in-from-bottom-4"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Date Column */}
                                    <div className="flex flex-col items-center justify-center min-w-[70px] bg-white rounded-xl border border-gray-200 p-2 h-fit self-start shadow-sm">
                                        <span className="block text-xs text-gray-400 uppercase font-bold tracking-wider">{format(group.date, 'EEE')}</span>
                                        <span className="block text-xl font-black text-indigo-600">{format(group.date, 'd')}</span>
                                    </div>

                                    {/* Team Column */}
                                    <div className="flex-1 flex flex-col gap-2 justify-center">
                                        {/* Header for Group */}
                                        {group.duties.length > 1 && (
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center w-fit">
                                                    <Users className="w-3 h-3 mr-1" />
                                                    Team of {group.duties.length}
                                                </span>
                                                <div className="h-px bg-gray-200 flex-1"></div>
                                            </div>
                                        )}

                                        {/* Members List */}
                                        {group.duties.map((duty, idx) => {
                                            const user = users.find(u => u.id === duty.assigneeId);
                                            return (
                                                <div key={idx} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {user?.avatarUrl ? (
                                                            <img src={user.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover" />
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 border-2 border-white shadow-sm">
                                                                {user?.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 leading-tight">{user?.name}</p>
                                                            <p className="text-xs text-gray-500 font-medium">{duty.title}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            {previewDuties.length === 0 && <div className="text-center py-10 text-gray-400">ช่วงวันที่เลือกไม่มีวันทำการครับ (ติดเสาร์-อาทิตย์)</div>}
                        </div>
                    </div>
                ) : (
                    /* SELECTION STAGE */
                    <div className="p-6 overflow-y-auto flex-1 bg-white space-y-6">
                        {/* Random Mode Selector */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setMode('ROTATION')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${mode === 'ROTATION' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                            >
                                <Repeat className="w-6 h-6" />
                                <span className="text-xs font-bold">วนจนครบคน (Rotation)</span>
                            </button>
                            <button 
                                onClick={() => setMode('DURATION')}
                                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${mode === 'DURATION' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                            >
                                <Hourglass className="w-6 h-6" />
                                <span className="text-xs font-bold">กำหนดช่วงเวลา (Fixed)</span>
                            </button>
                        </div>

                        {/* Config Preview */}
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold text-indigo-800 uppercase flex items-center">
                                    <Info className="w-3 h-3 mr-1.5" /> สรุปกติกา (Rules)
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {WEEK_DAYS_MAP.map(day => {
                                    const cfg = configs.find(c => c.dayOfWeek === day.num);
                                    if (!cfg) return null;
                                    return (
                                        <div key={day.num} className="text-[10px] bg-white border border-indigo-100 rounded px-2 py-1 text-gray-600">
                                            {day.label}: <b>{cfg.requiredPeople} คน</b>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="border border-gray-200 rounded-xl p-4">
                            <div className={`grid gap-4 ${mode === 'DURATION' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center">
                                        <Calendar className="w-4 h-4 mr-1.5" /> เริ่มวันที่
                                    </label>
                                    <input 
                                        type="date" 
                                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-bold bg-white"
                                        value={format(startDate, 'yyyy-MM-dd')}
                                        onChange={(e) => setStartDate(new Date(e.target.value))}
                                    />
                                </div>
                                {mode === 'DURATION' && (
                                    <div className="animate-in fade-in slide-in-from-right-4">
                                        <label className="text-xs font-bold text-gray-600 uppercase mb-2 flex items-center">
                                            <Clock className="w-4 h-4 mr-1.5" /> จำนวน (สัปดาห์)
                                        </label>
                                        <select 
                                            className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-bold bg-white"
                                            value={durationWeeks}
                                            onChange={(e) => setDurationWeeks(parseInt(e.target.value))}
                                        >
                                            <option value={1}>1 สัปดาห์</option>
                                            <option value={2}>2 สัปดาห์</option>
                                            <option value={4}>1 เดือน (4 สัปดาห์)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            {mode === 'ROTATION' && (
                                <div className="mt-3 text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg flex items-start">
                                    <Info className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                    ระบบจะจัดเวรไปเรื่อยๆ จนกว่าทุกคนที่เลือกจะได้รับงานอย่างน้อย 1 ครั้ง
                                </div>
                            )}
                        </div>

                        {/* Participants */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-bold text-gray-700">ผู้เข้าร่วม ({selectedIds.length})</h4>
                                <div className="space-x-2">
                                    <button onClick={onSelectAll} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">เลือกทั้งหมด</button>
                                    <button onClick={onClearAll} className="text-[10px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold text-gray-600">ล้าง</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {users.map(user => {
                                    const isSelected = selectedIds.includes(user.id);
                                    return (
                                        <div key={user.id} onClick={() => onToggleUser(user.id)} className={`cursor-pointer flex items-center p-2 rounded-xl border-2 transition-all relative overflow-hidden group ${isSelected ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                            <div className="relative mr-3">
                                                {user.avatarUrl ? <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500"><UserIcon className="w-4 h-4" /></div>}
                                                {isSelected && <div className="absolute -bottom-1 -right-1 bg-indigo-500 rounded-full border-2 border-white p-0.5"><CheckCircle2 className="w-2 h-2 text-white" /></div>}
                                            </div>
                                            <div className="min-w-0"><p className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>{user.name}</p></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {stage === 'RESULT' ? (
                        <>
                            <button onClick={onReset} className="px-5 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold rounded-xl transition-colors flex items-center"><RefreshCw className="w-4 h-4 mr-2" /> สุ่มใหม่</button>
                            <button onClick={onConfirm} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> ตกลง (OK)</button>
                        </>
                    ) : (
                        <>
                            <button onClick={onClose} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition-colors">ยกเลิก</button>
                            <button onClick={onStart} disabled={selectedIds.length === 0} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"><Sparkles className="w-4 h-4 mr-2" /> เริ่มสุ่มเลย!</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RandomizerModal;
