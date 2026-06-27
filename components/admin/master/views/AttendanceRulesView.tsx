
import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { Settings, Save, Heart, Edit2, Trash2, MapPin, Crosshair, Clock, Sparkles } from 'lucide-react';
import { useGameConfig } from '../../../../context/GameConfigContext';
import { useGlobalDialog } from '../../../../context/GlobalDialogContext'; // Added
import { supabase } from '../../../../lib/supabase'; // Needed for direct inserts
import TimePickerModal from '../../../ui/TimePickerModal';

interface AttendanceRulesViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    onCreate: (type: string) => void;
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
}

// Internal Component for Score Input to handle focus and local state
const ScoreInput = ({ 
    initialValue, 
    onSave 
}: { 
    initialValue: number; 
    onSave: (val: number) => void;
}) => {
    const [val, setVal] = useState(initialValue.toString());

    useEffect(() => {
        setVal(initialValue.toString());
    }, [initialValue]);

    const handleBlur = () => {
        const num = parseInt(val);
        if (!isNaN(num) && num !== initialValue) {
            onSave(num);
        } else if (isNaN(num)) {
            setVal(initialValue.toString()); // Revert if invalid
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    const isNegative = parseInt(val) < 0;

    return (
        <input 
            type="number" 
            className={`w-14 px-1 py-1 text-center rounded-md border text-xs font-black focus:outline-none focus:border-indigo-400 transition-colors ${isNegative ? 'text-red-500 bg-white border-red-200' : 'text-green-600 bg-white border-green-200'}`}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            title="คะแนนที่จะบวก/ลบ (ลบ = หัก HP, บวก = เพิ่ม XP)"
        />
    );
};

const AttendanceRulesView: React.FC<AttendanceRulesViewProps> = ({ 
    masterOptions, onUpdate, onAdd, onCreate, onEdit, onDelete 
}) => {
    // Game Config Context (For Syncing Scores)
    const { config, updateConfigValue } = useGameConfig();
    const { showAlert, showConfirm } = useGlobalDialog(); // Destructure

    // Attendance Rules Local State
    const [tempTimeConfig, setTempTimeConfig] = useState<{ start: string, end: string, buffer: string, minHours: string, otThreshold: string, checkoutPenaltyTime: string }>({ start: '10:00', end: '19:00', buffer: '15', minHours: '9', otThreshold: '2', checkoutPenaltyTime: '06:00' });
    const [isStartTimeOpen, setIsStartTimeOpen] = useState(false);
    const [isEndTimeOpen, setIsEndTimeOpen] = useState(false);
    const [isCheckoutPenaltyTimeOpen, setIsCheckoutPenaltyTimeOpen] = useState(false);
    const [otJpRate, setOtJpRate] = useState<string>('10');
    
    // Location Config State
    const [officeConfig, setOfficeConfig] = useState<{ lat: string, lng: string, radius: string }>({ lat: '', lng: '', radius: '500' });
    const [isLocating, setIsLocating] = useState(false);

    // Sync Temp Config with Loaded Data
    useEffect(() => {
        // Time & Duration
        const startOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'START_TIME');
        const endOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'END_TIME');
        const bufferOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LATE_BUFFER');
        const minHoursOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'MIN_HOURS');
        const otThresholdOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OT_THRESHOLD_HOURS');
        const checkoutPenaltyTimeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKOUT_PENALTY_TIME');
        
        if (startOpt || endOpt || bufferOpt || minHoursOpt || otThresholdOpt || checkoutPenaltyTimeOpt) {
            setTempTimeConfig({
                start: startOpt?.label || '10:00',
                end: endOpt?.label || '19:00',
                buffer: bufferOpt?.label || '15',
                minHours: minHoursOpt?.label || '9',
                otThreshold: otThresholdOpt?.label || '2',
                checkoutPenaltyTime: checkoutPenaltyTimeOpt?.label || '06:00'
            });
        }

        if (config?.GLOBAL_MULTIPLIERS?.OT_JP_RATE_PER_HOUR !== undefined) {
            setOtJpRate(config.GLOBAL_MULTIPLIERS.OT_JP_RATE_PER_HOUR.toString());
        }

        // Location
        const latOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LAT');
        const lngOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_LNG');
        const radOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'OFFICE_RADIUS');

        if (latOpt || lngOpt || radOpt) {
            setOfficeConfig({
                lat: latOpt?.label || '',
                lng: lngOpt?.label || '',
                radius: radOpt?.label || '500'
            });
        }
    }, [masterOptions, config]);

    const handleSaveTimeConfig = async () => {
        const updateOrInsert = async (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                await onUpdate({ ...existing, label: val });
            } else {
                 // Insert new if missing
                 await onAdd({
                    type: 'WORK_CONFIG',
                    key: key,
                    label: val,
                    color: '',
                    isActive: true,
                    sortOrder: 0
                });
            }
        };

        await updateOrInsert('START_TIME', tempTimeConfig.start);
        await updateOrInsert('END_TIME', tempTimeConfig.end);
        await updateOrInsert('LATE_BUFFER', tempTimeConfig.buffer);
        await updateOrInsert('MIN_HOURS', tempTimeConfig.minHours);
        await updateOrInsert('OT_THRESHOLD_HOURS', tempTimeConfig.otThreshold);
        await updateOrInsert('CHECKOUT_PENALTY_TIME', tempTimeConfig.checkoutPenaltyTime);
        
        // Save OT JP Rate to Game Config GLOBAL_MULTIPLIERS
        const parsedRate = parseInt(otJpRate, 10);
        if (!isNaN(parsedRate)) {
            const currentMultipliers = config.GLOBAL_MULTIPLIERS || {};
            await updateConfigValue('GLOBAL_MULTIPLIERS', {
                ...currentMultipliers,
                OT_JP_RATE_PER_HOUR: parsedRate
            });
        }
        
        await showAlert('บันทึกเวลาทำการเรียบร้อย ✅', 'สำเร็จ');
    };

    const handleSaveLocationConfig = async () => {
         const updateOrInsert = async (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                await onUpdate({ ...existing, label: val });
            } else {
                // Insert new if missing
                await onAdd({
                    type: 'WORK_CONFIG',
                    key: key,
                    label: val,
                    color: '',
                    isActive: true,
                    sortOrder: 0
                });
            }
        };

        await updateOrInsert('OFFICE_LAT', officeConfig.lat);
        await updateOrInsert('OFFICE_LNG', officeConfig.lng);
        await updateOrInsert('OFFICE_RADIUS', officeConfig.radius);
        
        await showAlert('บันทึกพิกัดเรียบร้อย! 🗺️', 'สำเร็จ');
    };

    const getCurrentLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            showAlert('Browser ไม่รองรับ Geolocation', 'Error');
            setIsLocating(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setOfficeConfig(prev => ({
                    ...prev,
                    lat: pos.coords.latitude.toString(),
                    lng: pos.coords.longitude.toString()
                }));
                setIsLocating(false);
            },
            (err) => {
                showAlert('ไม่สามารถระบุตำแหน่งได้: ' + err.message, 'Error');
                setIsLocating(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleScoreChange = async (option: MasterOption, newScore: number) => {
        // 1. Update Master Option (For Sort Order / UI persistence)
        await onUpdate({ ...option, sortOrder: newScore });

        // 2. Update Game Config (For Actual Logic)
        // ATTENDANCE_RULES structure: { [KEY]: { xp, hp, coins } }
        const currentRules = config.ATTENDANCE_RULES || {};
        const key = option.key; // e.g., 'LATE', 'ABSENT'
        
        // Logic: Negative score -> HP penalty, Positive score -> XP reward
        const newRule = {
            xp: newScore > 0 ? newScore : 0,
            hp: newScore < 0 ? newScore : 0,
            coins: 0 // Keep coins 0 for now (or manage via advanced settings)
        };

        const updatedRules = {
            ...currentRules,
            [key]: newRule
        };

        await updateConfigValue('ATTENDANCE_RULES', updatedRules);
    };

    // Helper to get score from Game Config first (Source of Truth), fallback to sortOrder
    const getDisplayScore = (opt: MasterOption) => {
        const rule = config.ATTENDANCE_RULES?.[opt.key];
        if (rule) {
            // If HP is negative, show that. Else show XP.
            if (rule.hp < 0) return rule.hp;
            if (rule.xp > 0) return rule.xp;
            return 0;
        }
        return opt.sortOrder; // Fallback
    };

    const attendanceTypes = masterOptions.filter(o => o.type === 'ATTENDANCE_TYPE');
    const leaveTypes = masterOptions.filter(o => o.type === 'LEAVE_TYPE');

    const renderListItem = (opt: MasterOption) => (
        <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 group hover:border-indigo-200 transition-all relative">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${opt.color?.split(' ')[0] || 'bg-gray-400'}`}></div>
                <span className="text-sm font-bold text-gray-700">{opt.label}</span>
            </div>
            <div className="flex items-center gap-3">
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm p-0.5 absolute right-2 md:relative md:right-0 md:bg-transparent md:border-0 md:shadow-none md:p-0">
                    <button 
                        onClick={() => onEdit(opt)} 
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="แก้ไขชื่อ/สี"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={async () => { if(await showConfirm('ยืนยันลบรายการนี้?', 'ลบข้อมูล')) onDelete(opt.id); }} 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                        title="ลบรายการ"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* 1. Work Configuration (Time) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-800 flex items-center mb-6">
                    <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                    ตั้งค่าเวลาทำการ (Hybrid Logic)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">เวลาเข้างาน (Start Time)</label>
                            <button
                                type="button"
                                onClick={() => setIsStartTimeOpen(true)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between group hover:border-indigo-400 transition-all shadow-sm"
                            >
                                {tempTimeConfig.start}
                                <Clock className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </button>
                            <TimePickerModal 
                                isOpen={isStartTimeOpen}
                                onClose={() => setIsStartTimeOpen(false)}
                                initialTime={tempTimeConfig.start}
                                onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, start: val }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">เวลาเลิกงาน (End Time)</label>
                            <button
                                type="button"
                                onClick={() => setIsEndTimeOpen(true)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 flex items-center justify-between group hover:border-indigo-400 transition-all shadow-sm"
                            >
                                {tempTimeConfig.end}
                                <Clock className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </button>
                            <TimePickerModal 
                                isOpen={isEndTimeOpen}
                                onClose={() => setIsEndTimeOpen(false)}
                                initialTime={tempTimeConfig.end}
                                onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, end: val }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">ชั่วโมงขั้นต่ำ (Min Hours)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    value={tempTimeConfig.minHours}
                                    onChange={e => setTempTimeConfig(prev => ({ ...prev, minHours: e.target.value }))}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Hrs</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">อนุโลมสายได้ (Late Buffer)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    value={tempTimeConfig.buffer}
                                    onChange={e => setTempTimeConfig(prev => ({ ...prev, buffer: e.target.value }))}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Min</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เกณฑ์ลืมออกงาน (OT Threshold)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    value={tempTimeConfig.otThreshold}
                                    onChange={e => setTempTimeConfig(prev => ({ ...prev, otThreshold: e.target.value }))}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">Hrs</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">อัตราคะแนน OT (OT JP Rate)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full pl-4 pr-16 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    value={otJpRate}
                                    onChange={e => setOtJpRate(e.target.value)}
                                    placeholder="10"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">JP/ชม.</span>
                            </div>
                        </div>
                </div>

                {/* Server-Side Automated Checks Sub-section */}
                <div className="mt-8 pt-6 border-t border-dashed border-gray-100">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                        ระบบตรวจสอบและเตือนสติเซิร์ฟเวอร์ (Server-Side Automated Reminders & Penalties)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Plan B Info Card */}
                        <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/60 flex flex-col justify-between">
                            <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 mb-2">
                                    📋 แผนที่ B (Active)
                                </span>
                                <h5 className="font-bold text-sm text-gray-800 mb-1">เตือนสติพนักงานเมื่อลืมเข้างาน</h5>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    เซิร์ฟเวอร์จะคำนวณเวลางานอัตโนมัติ และแจ้งเตือนแถบสีแดงเข้า LINE ทันทีเมื่อเลยเวลาเข้างานที่กำหนดไว้
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-indigo-100/40 flex items-center justify-between text-xs font-bold text-indigo-700">
                                <span>⏰ เวลาทำงานของนาฬิกาปลุกเซิร์ฟเวอร์วันนี้:</span>
                                <span className="bg-indigo-100/80 px-2 py-1 rounded-lg">
                                    {(() => {
                                        const [h, m] = tempTimeConfig.start.split(':').map(Number);
                                        const buf = parseInt(tempTimeConfig.buffer) || 0;
                                        const date = new Date();
                                        date.setHours(h, m + buf + 1);
                                        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} น.`;
                                    })()}
                                </span>
                            </div>
                        </div>

                        {/* Plan C Config Card */}
                        <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 flex flex-col justify-between">
                            <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 mb-2">
                                    🛠️ แผนที่ C (Active)
                                </span>
                                <h5 className="font-bold text-sm text-gray-800 mb-1">ตรวจเช็คพนักงานลืมออกงานข้ามวัน</h5>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    เซิร์ฟเวอร์จะตื่นเช้าตรู่ของวันใหม่มาตรวจเช็ค และหักแต้ม/ส่งคำเตือนลืมตอกบัตรออกของเมื่อวานโดยอัตโนมัติ
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-amber-100/40 flex items-center justify-between gap-4">
                                <span className="text-xs font-bold text-amber-800">⏰ ตั้งเวลาตรวจเช็คของเซิร์ฟเวอร์:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCheckoutPenaltyTimeOpen(true)}
                                        className="px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-800 flex items-center gap-1 hover:border-amber-400 transition-all shadow-sm"
                                    >
                                        {tempTimeConfig.checkoutPenaltyTime} น.
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                    </button>
                                    <TimePickerModal 
                                        isOpen={isCheckoutPenaltyTimeOpen}
                                        onClose={() => setIsCheckoutPenaltyTimeOpen(false)}
                                        initialTime={tempTimeConfig.checkoutPenaltyTime}
                                        onSelect={(val) => setTempTimeConfig(prev => ({ ...prev, checkoutPenaltyTime: val }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                     <button 
                            onClick={handleSaveTimeConfig}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200 flex items-center"
                        >
                            <Save className="w-4 h-4 mr-2" /> บันทึกกฎการเข้างาน
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    * <b>Hybrid Rule:</b> พนักงานจะถือว่าทำงานครบสมบูรณ์ เมื่อกดออกหลังเวลาเลิกงาน <b>หรือ</b> ทำงานครบชั่วโมงขั้นต่ำที่กำหนด
                </p>
            </div>

            {/* 2. Location Configuration (NEW) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50 pointer-events-none"></div>
                <h3 className="font-bold text-gray-800 flex items-center mb-6 relative z-10">
                    <MapPin className="w-5 h-5 mr-2 text-orange-500" />
                    ตั้งค่าพิกัดออฟฟิศ (Office Location)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Latitude</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-100 outline-none"
                            placeholder="13.xxxxxx"
                            value={officeConfig.lat}
                            onChange={e => setOfficeConfig(prev => ({ ...prev, lat: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-2">
                         <label className="block text-xs font-bold text-gray-500 mb-1">Longitude</label>
                        <input 
                            type="text" 
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-100 outline-none"
                            placeholder="100.xxxxxx"
                            value={officeConfig.lng}
                            onChange={e => setOfficeConfig(prev => ({ ...prev, lng: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">รัศมี (เมตร)</label>
                        <input 
                            type="number" 
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-orange-100 outline-none"
                            placeholder="Default: 500"
                            value={officeConfig.radius}
                            onChange={e => setOfficeConfig(prev => ({ ...prev, radius: e.target.value }))}
                        />
                    </div>
                    <div className="col-span-2 flex items-end gap-2">
                         <button 
                            onClick={getCurrentLocation}
                            disabled={isLocating}
                            className="flex-1 bg-orange-50 text-orange-600 border border-orange-100 px-3 py-2.5 rounded-xl font-bold hover:bg-orange-100 transition-all text-xs flex items-center justify-center gap-2"
                        >
                            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} /> 
                            {isLocating ? 'Locating...' : 'ดึงพิกัดปัจจุบัน'}
                        </button>
                        <button 
                            onClick={handleSaveLocationConfig}
                            className="flex-1 bg-orange-500 text-white px-3 py-2.5 rounded-xl font-bold hover:bg-orange-600 transition-all text-xs shadow-md shadow-orange-100"
                        >
                            บันทึกพิกัด
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. Scoring Rules - REMOVED and moved to Game Balancing */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Heart className="w-5 h-5 mr-2 text-gray-400" />
                        จัดการประเภทการลา & สถานะ (Types Management)
                    </h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Attendance Types */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">สถานะการเข้างาน (Attendance Types)</h4>
                        <div className="space-y-3">
                            {attendanceTypes.map(opt => renderListItem(opt))}
                            <button onClick={() => onCreate('ATTENDANCE_TYPE')} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition-all">+ เพิ่มสถานะ</button>
                        </div>
                    </div>

                    {/* Leave Types */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ประเภทการลา (Leave Types)</h4>
                        <div className="space-y-3">
                            {leaveTypes.map(opt => renderListItem(opt))}
                            <button onClick={() => onCreate('LEAVE_TYPE')} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition-all">+ เพิ่มประเภทลา</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRulesView;
