
import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { Settings, Save, Heart, Edit2, Trash2, MapPin, Crosshair, Clock } from 'lucide-react';
import { useGameConfig } from '../../../../context/GameConfigContext';

interface AttendanceRulesViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onCreate: (type: string) => void;
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
}

const AttendanceRulesView: React.FC<AttendanceRulesViewProps> = ({ 
    masterOptions, onUpdate, onCreate, onEdit, onDelete 
}) => {
    // Game Config Context (For Syncing Scores)
    const { config, updateConfigValue } = useGameConfig();

    // Attendance Rules Local State
    const [tempTimeConfig, setTempTimeConfig] = useState<{ start: string, end: string, buffer: string, minHours: string }>({ start: '10:00', end: '19:00', buffer: '15', minHours: '9' });
    
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
        
        if (startOpt || endOpt || bufferOpt || minHoursOpt) {
            setTempTimeConfig({
                start: startOpt?.label || '10:00',
                end: endOpt?.label || '19:00',
                buffer: bufferOpt?.label || '15',
                minHours: minHoursOpt?.label || '9'
            });
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
    }, [masterOptions]);

    const handleSaveTimeConfig = async () => {
        const updateOrSkip = async (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                await onUpdate({ ...existing, label: val });
            } else {
                 console.warn(`Config ${key} missing, please add via Master Data if not seeded.`);
            }
        };

        await updateOrSkip('START_TIME', tempTimeConfig.start);
        await updateOrSkip('END_TIME', tempTimeConfig.end);
        await updateOrSkip('LATE_BUFFER', tempTimeConfig.buffer);
        await updateOrSkip('MIN_HOURS', tempTimeConfig.minHours);
        
        alert('บันทึกเวลาทำการเรียบร้อย ✅');
    };

    const handleSaveLocationConfig = async () => {
         const updateOrSkip = async (key: string, val: string) => {
            const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === key);
            if (existing) {
                await onUpdate({ ...existing, label: val });
            } else {
                alert(`ไม่พบ Config Key: ${key} กรุณาเพิ่มข้อมูล WORK_CONFIG -> ${key} ในหน้ารวมก่อนครับ`);
            }
        };

        await updateOrSkip('OFFICE_LAT', officeConfig.lat);
        await updateOrSkip('OFFICE_LNG', officeConfig.lng);
        await updateOrSkip('OFFICE_RADIUS', officeConfig.radius);
        
        alert('บันทึกพิกัดเรียบร้อย! 🗺️');
    };

    const getCurrentLocation = () => {
        setIsLocating(true);
        if (!navigator.geolocation) {
            alert('Browser ไม่รองรับ Geolocation');
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
                alert('ไม่สามารถระบุตำแหน่งได้: ' + err.message);
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
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase hidden sm:inline">Score (HP/XP)</span>
                    <input 
                        type="number" 
                        className={`w-14 px-1 py-1 text-center rounded-md border text-xs font-black focus:outline-none focus:border-indigo-400 transition-colors ${getDisplayScore(opt) < 0 ? 'text-red-500 bg-white border-red-200' : 'text-green-600 bg-white border-green-200'}`}
                        value={getDisplayScore(opt)}
                        onChange={(e) => handleScoreChange(opt, parseInt(e.target.value))}
                        title="คะแนนที่จะบวก/ลบ (ลบ = หัก HP, บวก = เพิ่ม XP)"
                    />
                </div>
                
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
                        onClick={() => { if(confirm('ยืนยันลบรายการนี้?')) onDelete(opt.id); }} 
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
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เวลาเข้างาน (Start Time)</label>
                            <input 
                                type="time" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                value={tempTimeConfig.start}
                                onChange={e => setTempTimeConfig(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เวลาเลิกงาน (End Time)</label>
                            <input 
                                type="time" 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-indigo-100 outline-none"
                                value={tempTimeConfig.end}
                                onChange={e => setTempTimeConfig(prev => ({ ...prev, end: e.target.value }))}
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

            {/* 3. Scoring Rules */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center">
                        <Heart className="w-5 h-5 mr-2 text-red-500" />
                        กติกาการให้คะแนน (Game Config Sync)
                    </h3>
                    <div className="text-xs text-gray-500 font-medium">
                        * คะแนนติดลบ = หัก HP, คะแนนบวก = เพิ่ม XP
                    </div>
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
