import React from 'react';
import { Clock, Sparkles, Save } from 'lucide-react';
import TimePickerModal from '../../../../ui/TimePickerModal';
import ServerAddonsSection from './ServerAddonsSection';
import MultipleShiftsCard from './MultipleShiftsCard';
import AttendanceRaceCard from './addons/AttendanceRaceCard';

export interface WorkTimeConfig {
    start: string;
    end: string;
    buffer: string;
    minHours: string;
    otThreshold: string;
    checkoutPenaltyTime: string;
    dailySummaryDelayHours: string;
    dailySummaryTime?: string;
    lineSummaryDestination: string;
    enableAttendanceRace: string;
    lateAlertMode?: string;
    lateAlertOffset?: string;
    multipleShiftsEnabled?: string;
    multipleShiftsList?: string;
    lineApprovalMode?: string;
    lineHeaderTitle?: string;
    lateAlertTargetRoles?: string;
    checkoutPenaltyTargetRoles?: string;
    checkoutAlertEnabled?: string;
    checkoutAlertMode?: string;
    checkoutAlertOffset?: string;
    checkoutAlertTargetRoles?: string;
    adminAbsentPenaltyEnabled?: string;
    absentPenaltyEnabled?: string;
    absentPenaltyTime?: string;
    absentPenaltyTargetRoles?: string;
    forgotCheckInLimitHours?: string;
    lineSubmissionAlertMode?: string;
    monthlySummaryTime?: string;
    monthlySummaryDay?: string;
    monthlySummaryMode?: string;
    monthlySummaryFebDay?: string;
    monthlyOTSummaryTime?: string;
    monthlyOTSummaryDay?: string;
    monthlyOTSummaryMode?: string;
    lateEntryStrictEndTime?: string;
}

interface WorkTimeCardProps {
    tempTimeConfig: WorkTimeConfig;
    setTempTimeConfig: React.Dispatch<React.SetStateAction<WorkTimeConfig>>;
    otJpRate: string;
    setOtJpRate: React.Dispatch<React.SetStateAction<string>>;
    isStartTimeOpen: boolean;
    setIsStartTimeOpen: (open: boolean) => void;
    isEndTimeOpen: boolean;
    setIsEndTimeOpen: (open: boolean) => void;
    isCheckoutPenaltyTimeOpen: boolean;
    setIsCheckoutPenaltyTimeOpen: (open: boolean) => void;
    handleSaveTimeConfig: () => Promise<void>;
}

const WorkTimeCard: React.FC<WorkTimeCardProps> = ({
    tempTimeConfig,
    setTempTimeConfig,
    otJpRate,
    setOtJpRate,
    isStartTimeOpen,
    setIsStartTimeOpen,
    isEndTimeOpen,
    setIsEndTimeOpen,
    isCheckoutPenaltyTimeOpen,
    setIsCheckoutPenaltyTimeOpen,
    handleSaveTimeConfig,
}) => {
    return (
        <div id="work-time-card" className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 flex items-center mb-6">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                ตั้งค่าเวลาทำการ (Hybrid Logic)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">เวลาเข้างาน (Start Time)</label>
                    <button
                        id="btn-start-time"
                        type="button"
                        onClick={() => setIsStartTimeOpen(true)}
                        className="w-full px-4 py-3 bg-indigo-50/30 text-indigo-700 border border-indigo-100/80 rounded-xl font-bold flex items-center justify-between group hover:bg-indigo-50/50 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 transition-all shadow-sm outline-none"
                    >
                        {tempTimeConfig.start}
                        <Clock className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
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
                        id="btn-end-time"
                        type="button"
                        onClick={() => setIsEndTimeOpen(true)}
                        className="w-full px-4 py-3 bg-indigo-50/30 text-indigo-700 border border-indigo-100/80 rounded-xl font-bold flex items-center justify-between group hover:bg-indigo-50/50 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 transition-all shadow-sm outline-none"
                    >
                        {tempTimeConfig.end}
                        <Clock className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
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
                            id="input-min-hours"
                            type="number" 
                            className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 outline-none transition-all"
                            value={tempTimeConfig.minHours}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, minHours: e.target.value }))}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">Hrs</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">อนุโลมสายได้ (Late Buffer)</label>
                    <div className="relative">
                        <input 
                            id="input-late-buffer"
                            type="number" 
                            className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 outline-none transition-all"
                            value={tempTimeConfig.buffer}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, buffer: e.target.value }))}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">Min</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">เกณฑ์ลืมออกงาน (OT Threshold)</label>
                    <div className="relative">
                        <input 
                            id="input-ot-threshold"
                            type="number" 
                            className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 outline-none transition-all"
                            value={tempTimeConfig.otThreshold}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, otThreshold: e.target.value }))}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">Hrs</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">อัตราคะแนน OT (OT JP Rate)</label>
                    <div className="relative">
                        <input 
                            id="input-ot-jp-rate"
                            type="number" 
                            className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 outline-none transition-all"
                            value={otJpRate}
                            onChange={e => setOtJpRate(e.target.value)}
                            placeholder="10"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">JP/ชม.</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">ระยะเวลายื่นลืมลงเวลาเข้า (Forgot Limit)</label>
                    <div className="relative">
                        <input 
                            id="input-forgot-checkin-limit-hours"
                            type="number" 
                            className="w-full pl-4 pr-14 py-3 border border-gray-200 rounded-xl font-bold text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/70 outline-none transition-all"
                            value={tempTimeConfig.forgotCheckInLimitHours || '12'}
                            onChange={e => setTempTimeConfig(prev => ({ ...prev, forgotCheckInLimitHours: e.target.value }))}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">Hrs / ชม.</span>
                    </div>
                </div>
            </div>

            {/* Strict Shift End Time for Late Entry Option */}
            <div className="mt-6 p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        ยึดเวลาออกงานตามกะปกติเมื่อขอเข้าสาย (ไม่ต้องทำงานชดเชยตาม MinHours)
                    </h4>
                    <p className="text-[11px] text-amber-700/80 leading-relaxed">
                        เมื่อเปิดใช้งาน: กรณีพนักงานขอเข้าสาย (ไม่ว่าจะได้รับอนุมัติหรือถูกปฏิเสธ) เวลาเลิกงานที่อนุญาตให้ออกได้จะยึดตามเวลาเลิกงานปกติของกะ (เช่น 17:00 น.) โดยไม่นำเวลาที่เข้าสายไปบวกเพิ่มเป็นเวลาทำงานชดเชย
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-amber-200/80 shrink-0 self-end sm:self-auto">
                    <span className={`text-xs font-bold ${tempTimeConfig.lateEntryStrictEndTime === 'true' ? 'text-amber-700' : 'text-gray-400'}`}>
                        {tempTimeConfig.lateEntryStrictEndTime === 'true' ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}
                    </span>
                    <button
                        id="btn-toggle-late-strict-end-time"
                        type="button"
                        onClick={() => setTempTimeConfig(prev => ({
                            ...prev,
                            lateEntryStrictEndTime: prev.lateEntryStrictEndTime === 'true' ? 'false' : 'true'
                        }))}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                            tempTimeConfig.lateEntryStrictEndTime === 'true' ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                        aria-label="Toggle late entry strict end time mode"
                    >
                        <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                                tempTimeConfig.lateEntryStrictEndTime === 'true' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Weekly Attendance Race (Gamification) */}
            <AttendanceRaceCard tempTimeConfig={tempTimeConfig} setTempTimeConfig={setTempTimeConfig} />

            {/* Multiple Shifts Configuration Section */}
            <MultipleShiftsCard tempTimeConfig={tempTimeConfig} setTempTimeConfig={setTempTimeConfig} />

            {/* Server-Side Automated Checks Section */}
            <div className="mt-8 pt-6 border-t border-dashed border-gray-100">
                <ServerAddonsSection tempTimeConfig={tempTimeConfig} setTempTimeConfig={setTempTimeConfig} />
            </div>

            <div className="mt-6 flex justify-end">
                <button 
                    id="btn-save-work-time"
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
    );
};

export default WorkTimeCard;
