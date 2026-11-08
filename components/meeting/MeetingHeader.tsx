import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    Tag,
    Users,
    Maximize2,
    Minimize2,
    Copy,
    Check,
    ChevronDown,
    X,
    ArrowLeft,
    Video,
    ExternalLink,
    RefreshCw,
    Link2,
    Building2,
    Globe,
    CalendarPlus,
    Loader2
} from 'lucide-react';
import { MeetingCategory, MeetingType, MeetingPlatform, User, MasterOption } from '../../types';
import AttendeeSelectorModal from './AttendeeSelectorModal';
import MeetingTagInput from './MeetingTagInput';
import DatePickerModal, { formatDisplayDate } from '../common/DatePickerModal';
import TimePickerModal from '../common/TimePickerModal';
import {
    detectMeetingPlatform,
    getMeetingPlatformInfo,
    buildGoogleCalendarTemplateUrl
} from '../../utils/googleCalendarLink';
import { useToast } from '../../context/ToastContext';

interface MeetingHeaderProps {
    title: string;
    setTitle: (val: string) => void;
    onBlurTitle: () => void;
    date: Date;
    setDate: (val: Date) => void;
    onBlurDate: (d: Date) => void;
    category: MeetingCategory;
    setCategory: (val: MeetingCategory) => void;
    onBlurCategory: (c: MeetingCategory) => void;
    projectTags: string[];
    setProjectTags: (val: string[]) => void;
    onBlurTags: (t: string[]) => void;
    attendees: string[];
    onUpdateAttendees: (ids: string[]) => void;
    attendance: Record<string, any>;
    onUpdateRSVP: (uid: string, status: any) => void;
    startTime: string;
    setStartTime: (val: string) => void;
    onBlurStartTime: (t: string) => void;
    endTime: string;
    setEndTime: (val: string) => void;
    onBlurEndTime: (t: string) => void;
    users: User[];
    currentUser: User;
    masterOptions: MasterOption[];
    isExpanded: boolean;
    onToggleExpand: () => void;
    isCopied: boolean;
    onCopySummary: () => void;
    onReturnToActive?: () => void;
    activeMeetingTitle?: string;

    // Online Meeting & Google Calendar Props
    meetingType?: MeetingType;
    meetUrl?: string;
    meetPlatform?: MeetingPlatform;
    googleCalendarEventId?: string;
    googleCalendarLink?: string;
    isCalendarSyncing?: boolean;
    onUpdateOnlineSettings?: (updates: {
        meetingType: MeetingType;
        meetUrl?: string;
        meetPlatform?: MeetingPlatform;
    }) => void;
    onSyncGoogleCalendar?: (options?: { createMeet?: boolean }) => Promise<void>;
}

const timeToMinutes = (t: string): number => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

const addOneHourToTime = (t: string): string => {
    const [h, m] = (t || '09:00').split(':').map(Number);
    const safeH = isNaN(h) ? 9 : h;
    const safeM = isNaN(m) ? 0 : m;
    const nextH = (safeH + 1) % 24;
    return `${String(nextH).padStart(2, '0')}:${String(safeM).padStart(2, '0')}`;
};

const MeetingHeader: React.FC<MeetingHeaderProps> = React.memo(({
    title, setTitle, onBlurTitle,
    date, setDate, onBlurDate,
    startTime, setStartTime, onBlurStartTime,
    endTime, setEndTime, onBlurEndTime,
    category, setCategory, onBlurCategory,
    projectTags, setProjectTags, onBlurTags,
    attendees, onUpdateAttendees,
    attendance, onUpdateRSVP,
    users, currentUser, masterOptions,
    isExpanded, onToggleExpand,
    isCopied, onCopySummary,
    onReturnToActive, activeMeetingTitle,
    meetingType = 'ONSITE',
    meetUrl,
    meetPlatform,
    googleCalendarEventId,
    googleCalendarLink,
    isCalendarSyncing = false,
    onUpdateOnlineSettings,
    onSyncGoogleCalendar
}) => {
    const { showToast } = useToast();
    const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isMeetCopied, setIsMeetCopied] = useState(false);
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);

    // Online Settings Modal Local State
    const [draftType, setDraftType] = useState<MeetingType>(meetingType || 'ONSITE');
    const [draftUrl, setDraftUrl] = useState<string>(meetUrl || '');

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const selectedCategory = masterOptions.find(o => o.type === 'MEETING_CATEGORY' && o.key === category);

    // RSVP Logic
    const myStatus = attendance[currentUser.id] || 'INVITED';
    const isInvited = attendees.includes(currentUser.id);

    const platformInfo = useMemo(() => {
        if (!meetUrl) return null;
        return getMeetingPlatformInfo(meetPlatform, meetUrl);
    }, [meetPlatform, meetUrl]);

    const attendeeEmails = useMemo(() => {
        return users
            .filter(u => attendees.includes(u.id) && u.email && u.email.includes('@'))
            .map(u => u.email!);
    }, [users, attendees]);

    const quickCalendarTemplateUrl = useMemo(() => {
        return buildGoogleCalendarTemplateUrl({
            title,
            date,
            startTime,
            endTime,
            description: `นัดหมายการประชุม: ${title}`,
            meetUrl,
            attendeeEmails
        });
    }, [title, date, startTime, endTime, meetUrl, attendeeEmails]);

    const handleCopyMeetLink = () => {
        if (!meetUrl) return;
        navigator.clipboard.writeText(meetUrl);
        setIsMeetCopied(true);
        showToast('คัดลอกลิงก์ห้องประชุมออนไลน์แล้ว', 'success');
        setTimeout(() => setIsMeetCopied(false), 2000);
    };

    const handleOpenOnlineModal = () => {
        setDraftType(meetingType || (meetUrl ? 'ONLINE' : 'ONSITE'));
        setDraftUrl(meetUrl || '');
        setIsOnlineModalOpen(true);
    };

    const handleSaveOnlineModal = () => {
        if (!onUpdateOnlineSettings) return;
        const cleanUrl = draftType === 'ONSITE' ? '' : draftUrl.trim();
        onUpdateOnlineSettings({
            meetingType: draftType,
            meetUrl: cleanUrl || undefined,
            meetPlatform: cleanUrl ? detectMeetingPlatform(cleanUrl) : undefined
        });
        setIsOnlineModalOpen(false);
        showToast('อัปเดตตั้งค่าห้องประชุมออนไลน์แล้ว', 'success');
    };

    return (
        <div className="p-4 md:p-6 bg-white/40 backdrop-blur-md border-b border-white/60 relative z-30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 md:mb-4">
                <div className="flex-1 flex items-center gap-2 md:gap-3">
                    {onReturnToActive && (
                        <motion.button
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onClick={onReturnToActive}
                            className="bg-amber-500 p-2 md:p-2 rounded-xl shadow-lg shadow-amber-100 text-white hover:bg-amber-600 transition-all flex items-center gap-2 group shrink-0"
                            title={`กลับไปสู่การประชุมหลัก: ${activeMeetingTitle}`}
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                            <div className="hidden lg:block text-left pr-1">
                                <div className="text-[7px] font-bold uppercase opacity-70 leading-none">กลับไปที่</div>
                                <div className="text-[9px] font-bold truncate max-w-[80px] leading-tight">{activeMeetingTitle}</div>
                            </div>
                        </motion.button>
                    )}
                    
                    <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={onBlurTitle}
                        className="w-full text-lg md:text-2xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
                        placeholder="หัวข้อการประชุม..."
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-hide">
                    {/* My RSVP Status */}
                    {isInvited && (
                        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-white/60 shadow-sm shrink-0">
                             {myStatus === 'INVITED' ? (
                                  <>
                                    <button 
                                        onClick={() => onUpdateRSVP(currentUser.id, 'CONFIRMED')}
                                        className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] md:text-[10px] font-bold hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                                    >
                                        ยืนยันเข้าร่วม
                                    </button>
                                    <button 
                                        onClick={() => onUpdateRSVP(currentUser.id, 'DECLINED')}
                                        className="whitespace-nowrap px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[9px] md:text-[10px] font-bold hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                                    >
                                        ไม่สะดวก
                                    </button>
                                  </>
                             ) : (
                                  <div className={`px-3 md:px-4 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold flex items-center gap-1.5 md:gap-2 whitespace-nowrap shadow-sm border ${
                                      myStatus === 'CONFIRMED' ? 'bg-emerald-500 text-white border-emerald-400' :
                                      myStatus === 'PRESENT' ? 'bg-indigo-600 text-white border-indigo-500' :
                                      myStatus === 'DECLINED' ? 'bg-slate-200 text-slate-500 border-slate-300' : 'bg-amber-100 text-amber-600 border-amber-200'
                                  }`}>
                                      {myStatus === 'CONFIRMED' && <><Check className="w-3 h-3" /> ยืนยันแล้ว</>}
                                      {myStatus === 'PRESENT' && <><Check className="w-3 h-3" /> มาแล้ว!</>}
                                      {myStatus === 'DECLINED' && <X className="w-3 h-3" />}
                                      
                                      {myStatus !== 'PRESENT' && myStatus !== 'DECLINED' && (
                                          <button onClick={() => onUpdateRSVP(currentUser.id, 'INVITED')} className="ml-1 md:ml-2 opacity-50 hover:opacity-100">
                                              <X className="w-3 h-3" />
                                          </button>
                                      )}
                                      
                                      {myStatus === 'CONFIRMED' && (
                                           <button 
                                             onClick={() => onUpdateRSVP(currentUser.id, 'PRESENT')}
                                             className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-white/20 hover:bg-white/40 rounded border border-white/20"
                                           >
                                               Check-in
                                           </button>
                                      )}
                                  </div>
                             )}
                        </div>
                    )}

                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={onCopySummary}
                            className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-sm transition-all shadow-sm border ${isCopied ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-600 border-white/80 hover:bg-slate-50'}`}
                        >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden xs:inline">{isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกสรุป'}</span>
                        </button>
                        <button 
                            onClick={onToggleExpand}
                            className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl border border-white/80 shadow-sm transition-all"
                        >
                            {isExpanded ? <Minimize2 className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Online Meeting & Google Calendar Quick Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-2.5 rounded-2xl bg-white/75 border border-indigo-100/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    {/* Meeting Type Indicator / Edit Button */}
                    <button
                        type="button"
                        onClick={handleOpenOnlineModal}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                            meetingType === 'ONLINE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                                : meetingType === 'HYBRID'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70'
                        }`}
                        title="คลิกเพื่อตั้งค่ารูปแบบการประชุมและลิงก์ออนไลน์"
                    >
                        {meetingType === 'ONLINE' ? (
                            <Video className="w-3.5 h-3.5" />
                        ) : meetingType === 'HYBRID' ? (
                            <Globe className="w-3.5 h-3.5" />
                        ) : (
                            <Building2 className="w-3.5 h-3.5" />
                        )}
                        <span>
                            {meetingType === 'ONLINE'
                                ? 'ประชุมออนไลน์'
                                : meetingType === 'HYBRID'
                                    ? 'ประชุมไฮบริด'
                                    : 'ประชุมออนไซต์'}
                        </span>
                    </button>

                    {/* Primary Join Online Meeting CTA */}
                    {meetUrl && platformInfo ? (
                        <div className="flex items-center gap-1.5">
                            <a
                                href={meetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap ${platformInfo.btnBg}`}
                            >
                                <Video className="w-3.5 h-3.5" />
                                <span>{platformInfo.joinLabel}</span>
                                <ExternalLink className="w-3 h-3 opacity-80" />
                            </a>
                            <button
                                type="button"
                                onClick={handleCopyMeetLink}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all whitespace-nowrap"
                                title="คัดลอกลิงก์ห้องประชุม"
                            >
                                {isMeetCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{isMeetCopied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleOpenOnlineModal}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 transition-all whitespace-nowrap"
                                title="แก้ไขลิงก์ห้องประชุม"
                            >
                                <Link2 className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">เปลี่ยนลิงก์</span>
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handleOpenOnlineModal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 transition-all whitespace-nowrap"
                        >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>เพิ่มลิงก์ประชุม (Meet / Zoom / Teams)</span>
                        </button>
                    )}
                </div>

                {/* Google Calendar Actions */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {onSyncGoogleCalendar && (
                        <button
                            type="button"
                            disabled={isCalendarSyncing}
                            onClick={() => onSyncGoogleCalendar({ createMeet: !meetUrl })}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                                googleCalendarEventId
                                    ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                            } disabled:opacity-60`}
                            title={
                                googleCalendarEventId
                                    ? 'ซิงค์ข้อมูลล่าสุดและส่งอีเมลอัปเดตไปยังผู้เข้าร่วมใน Google Calendar'
                                    : 'สร้างนัดหมายบน Google Calendar และเสกลิงก์ Google Meet อัตโนมัติ'
                            }
                        >
                            {isCalendarSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : googleCalendarEventId ? (
                                <RefreshCw className="w-3.5 h-3.5" />
                            ) : (
                                <Video className="w-3.5 h-3.5" />
                            )}
                            <span>
                                {isCalendarSyncing
                                    ? 'กำลังซิงค์ปฏิทิน...'
                                    : googleCalendarEventId
                                        ? 'อัปเดตลง Google Calendar'
                                        : !meetUrl
                                            ? 'ยิง Google Meet & ลงปฏิทิน'
                                            : 'ซิงค์ลง Google Calendar'}
                            </span>
                        </button>
                    )}

                    {googleCalendarLink && (
                        <a
                            href={googleCalendarLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all whitespace-nowrap"
                            title="เปิดดูอีเวนต์นี้ใน Google Calendar"
                        >
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="hidden sm:inline">ดูในปฏิทิน</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                    )}

                    {/* Fallback Quick Add to Google Calendar Link (works without OAuth) */}
                    <a
                        href={quickCalendarTemplateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-all whitespace-nowrap"
                        title="เพิ่มลง Google Calendar ด่วนผ่านลิงก์มาตรฐาน (ไม่ต้องเชื่อม API)"
                    >
                        <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ปฏิทินด่วน</span>
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">

                {/* Common DatePickerModal Trigger */}
                <button
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative group hover:bg-white hover:border-indigo-200 transition-all cursor-pointer text-left"
                >
                    <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-600 truncate">
                        {formatDisplayDate(date)}
                    </span>
                </button>
                <DatePickerModal
                    isOpen={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    selectedDate={date}
                    onSelect={(newDate) => {
                        setDate(newDate);
                        onBlurDate(newDate);
                    }}
                />

                {/* Common TimePickerModal Triggers */}
                <div className="flex items-center gap-2 bg-white/60 p-2 rounded-2xl border border-white/80 shadow-sm relative">
                    <Clock className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />
                    <div className="flex items-center gap-1 tabular-nums">
                        <button
                            type="button"
                            onClick={() => setShowStartTimePicker(true)}
                            className="text-[13px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg px-1.5 py-0.5 transition-colors cursor-pointer tabular-nums"
                            title="เลือกเวลาเริ่มประชุม"
                        >
                            {startTime || '09:00'}
                        </button>
                        <TimePickerModal 
                            isOpen={showStartTimePicker} 
                            onClose={() => setShowStartTimePicker(false)} 
                            initialTime={startTime}
                            title="เลือกเวลาเริ่มประชุม"
                            onSelect={(val) => {
                                setStartTime(val);
                                onBlurStartTime(val);
                                if (timeToMinutes(val) >= timeToMinutes(endTime)) {
                                    const nextEnd = addOneHourToTime(val);
                                    setEndTime(nextEnd);
                                    onBlurEndTime(nextEnd);
                                }
                            }} 
                        />
                        <span className="text-slate-300">-</span>
                        <button
                            type="button"
                            onClick={() => setShowEndTimePicker(true)}
                            className="text-[13px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/70 rounded-lg px-1.5 py-0.5 transition-colors cursor-pointer tabular-nums"
                            title="เลือกเวลาสิ้นสุดการประชุม"
                        >
                            {endTime || '10:00'}
                        </button>
                        <TimePickerModal 
                            isOpen={showEndTimePicker} 
                            onClose={() => setShowEndTimePicker(false)} 
                            initialTime={endTime}
                            title="เลือกเวลาสิ้นสุดการประชุม"
                            onSelect={(val) => {
                                setEndTime(val);
                                onBlurEndTime(val);
                            }} 
                        />
                    </div>
                </div>

                {/* Custom Category Dropdown */}
                <div className="flex items-center gap-3 bg-white/60 p-1.5 md:p-2 rounded-2xl border border-white/80 shadow-sm relative shrink-0 min-w-[140px]">
                    <div className={`p-1.5 rounded-lg ${selectedCategory?.color ? selectedCategory.color.split(' ')[0] : 'bg-slate-100'}`}>
                         <Tag className={`w-3.5 h-3.5 ${selectedCategory?.color ? selectedCategory.color.split(' ')[1] : 'text-slate-400'}`} />
                    </div>
                    
                    <button 
                         onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                         className={`flex items-center justify-between w-full text-[11px] md:text-xs font-bold transition-all ${selectedCategory?.color ? selectedCategory.color.split(' ')[1] : 'text-slate-600'}`}
                    >
                         <span className="truncate mr-2">
                            {selectedCategory?.label || 'เลือกหมวดหมู่'}
                         </span>
                         <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 opacity-50 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryDropdownOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-[60]" 
                                onClick={() => setIsCategoryDropdownOpen(false)} 
                            />
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="absolute top-full left-0 mt-2 w-[200px] bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 z-[70] p-2 overflow-hidden"
                            >
                                <div className="max-h-[300px] overflow-y-auto scrollbar-hide space-y-1">
                                    {masterOptions.filter(o => o.type === 'MEETING_CATEGORY').map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => {
                                                setCategory(opt.key as MeetingCategory);
                                                onBlurCategory(opt.key as MeetingCategory);
                                                setIsCategoryDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group ${category === opt.key ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${opt.color ? opt.color.split(' ')[0] : 'bg-slate-200'}`} />
                                            <span className={`text-[11px] md:text-xs font-bold leading-none ${category === opt.key ? 'text-indigo-600' : 'text-slate-600'}`}>
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Project Tag Input */}
                <div className="flex items-center gap-3 bg-white/60 p-1 rounded-2xl border border-white/80 shadow-sm">
                    <span className="ml-3 text-amber-500 font-bold text-[10px]">#</span>
                    <MeetingTagInput 
                        tags={projectTags}
                        onTagsChange={(tags) => {
                            setProjectTags(tags);
                            onBlurTags(tags);
                        }}
                        placeholder="Tag..."
                    />
                </div>

                {/* Attendees Button */}
                <button 
                    onClick={() => setIsAttendeesModalOpen(true)}
                    className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm relative group hover:bg-white transition-all overflow-hidden"
                >
                    <Users className="w-4 h-4 text-indigo-400" />
                    <div className="flex -space-x-1.5 overflow-hidden flex-1">
                        {users.filter(u => attendees.includes(u.id)).slice(0, 3).map(u => {
                            const status = attendance[u.id] || 'INVITED';
                            const statusColor = status === 'CONFIRMED' ? 'border-emerald-400' : status === 'PRESENT' ? 'border-indigo-500' : status === 'DECLINED' ? 'border-rose-400 grayscale' : 'border-white';
                            return (
                                <img key={u.id} src={u.avatarUrl} className={`w-6 h-6 rounded-full border-2 shadow-sm ${statusColor}`} title={`${u.name} (${status})`} />
                            );
                        })}
                        {attendees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-400">
                                +{attendees.length - 3}
                            </div>
                        )}
                        {attendees.length === 0 && <span className="text-xs font-bold text-slate-300">เชิญ...</span>}
                    </div>
                    {/* Tiny stats */}
                    <div className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded tabular-nums">
                        {Object.values(attendance).filter(s => s === 'CONFIRMED' || s === 'PRESENT').length}/{attendees.length}
                    </div>
                </button>
            </div>

            <AttendeeSelectorModal 
                isOpen={isAttendeesModalOpen}
                onClose={() => setIsAttendeesModalOpen(false)}
                users={users}
                selectedIds={attendees}
                onConfirm={onUpdateAttendees}
            />

            {/* Online Meeting Settings Modal (3-Layer Responsive Contract) */}
            {createPortal(
                <AnimatePresence>
                    {isOnlineModalOpen && (
                        <div
                            className="fixed inset-0 z-[10020] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsOnlineModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* 1. Rigid Header */}
                                <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                                            ตั้งค่าการประชุมออนไลน์ & ปฏิทิน
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            กำหนดรูปแบบการประชุม วางลิงก์ Zoom/Teams หรือสร้าง Google Meet อัตโนมัติ
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsOnlineModalOpen(false)}
                                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* 2. Scrollable Body */}
                                <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-600">
                                            รูปแบบการประชุม
                                        </label>
                                        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                                            {([
                                                { key: 'ONSITE' as MeetingType, label: 'ออนไซต์', icon: Building2 },
                                                { key: 'ONLINE' as MeetingType, label: 'ออนไลน์', icon: Video },
                                                { key: 'HYBRID' as MeetingType, label: 'ไฮบริด', icon: Globe }
                                            ]).map((item) => {
                                                const Icon = item.icon;
                                                const active = draftType === item.key;
                                                return (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={() => setDraftType(item.key)}
                                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                                                            active
                                                                ? 'bg-white text-indigo-600 shadow-sm'
                                                                : 'text-slate-600 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span>{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {draftType !== 'ONSITE' && (
                                        <div className="space-y-3">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">
                                                    ลิงก์ห้องประชุมออนไลน์ (Google Meet / Zoom / MS Teams / LINE)
                                                </label>
                                                <div className="relative">
                                                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="url"
                                                        value={draftUrl}
                                                        onChange={(e) => setDraftUrl(e.target.value)}
                                                        placeholder="https://meet.google.com/... หรือ https://zoom.us/..."
                                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 rounded-xl outline-none text-sm font-semibold text-slate-700"
                                                    />
                                                </div>
                                                {draftUrl.trim() && (
                                                    <div className="flex items-center justify-between text-xs pt-1">
                                                        <span className="text-slate-500">แพลตฟอร์มที่ตรวจพบ:</span>
                                                        <span className={`font-bold px-2 py-0.5 rounded-md border ${getMeetingPlatformInfo(undefined, draftUrl).badgeBg}`}>
                                                            {getMeetingPlatformInfo(undefined, draftUrl).label}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {onSyncGoogleCalendar && (
                                                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-emerald-900">
                                                            ต้องการเสกลิงก์ Google Meet อัตโนมัติ?
                                                        </div>
                                                        <p className="text-[11px] text-emerald-700 mt-0.5">
                                                            สร้างห้อง Google Meet ใหม่และซิงค์ลง Google Calendar ของผู้เข้าร่วมทุกคนทันที
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={isCalendarSyncing}
                                                        onClick={async () => {
                                                            setIsOnlineModalOpen(false);
                                                            await onSyncGoogleCalendar({ createMeet: true });
                                                        }}
                                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 whitespace-nowrap flex items-center gap-1.5"
                                                    >
                                                        <Video className="w-3.5 h-3.5" />
                                                        <span>เสก Google Meet</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* 3. Rigid Sticky Footer */}
                                <div className="flex-shrink-0 px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                                    <button
                                        type="button"
                                        onClick={() => setIsOnlineModalOpen(false)}
                                        className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
                                    >
                                        ยกเลิก
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveOnlineModal}
                                        className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                                    >
                                        บันทึกการตั้งค่า
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
});

export default MeetingHeader;
