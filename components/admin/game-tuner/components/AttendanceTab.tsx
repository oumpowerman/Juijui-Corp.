import React from 'react';
import { Clock, UserCheck, Calendar, RefreshCw, Zap, ShieldAlert, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { CollapsibleCard, RuleEditor, ConfigSlider } from './SharedComponents';
import { PRETTY_LABELS } from '../utils/tunerHelpers';

interface AttendanceTabProps {
    localConfig: any;
    handleChange: (section: string, key: string, value: any) => void;
    handleRuleChange: (key: string, field: 'xp' | 'hp' | 'coins', val: number) => void;
    searchTerm: string;
    filteredCoreStatusRules: any[];
    filteredAbsentRules: any[];
    filteredCheckoutRules: any[];
    filteredLeaveRules: any[];
    filteredSystemLockedRules: any[];
    getFilteredGroupItems: (groupId: string) => any[];
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
    localConfig,
    handleChange,
    handleRuleChange,
    searchTerm,
    filteredCoreStatusRules,
    filteredAbsentRules,
    filteredCheckoutRules,
    filteredLeaveRules,
    filteredSystemLockedRules,
    getFilteredGroupItems
}) => {
    const attendanceGroupItems = getFilteredGroupItems('ATTENDANCE');
    const findItem = (key: string) => attendanceGroupItems.find(item => item.key === key);

    const lateModeDynamic = localConfig?.PENALTY_RATES?.LATE_MODE_DYNAMIC ?? 0;
    const earlyLeaveModeDynamic = localConfig?.PENALTY_RATES?.EARLY_LEAVE_MODE_DYNAMIC ?? 1;

    const getRuleConfig = (key: string) => {
        const readOnlyKeys = [
            'OFFICE', 'SITE', 'WFH', 'APPEAL', 'LATE_ENTRY', 
            'FORGOT_CHECKIN', 'FORGOT_BOTH', 'OVERTIME', 'LEAVE',
            'LATE', 'EARLY_LEAVE'
        ];
        
        const isReadOnly = readOnlyKeys.includes(key);
        
        let message: string | undefined = undefined;
        if (key === 'OFFICE') {
            message = "ระบบจะคำนวณคะแนนผ่านเกณฑ์ 'มาตรงเวลา (ON_TIME)' หรือ 'มาสาย (LATE)' ในหัวข้อระบบปรับปรุงเวลาด้านล่างแทน";
        } else if (key === 'SITE') {
            message = "ระบบจะคำนวณคะแนนตามเกณฑ์ 'มาตรงเวลา (ON_TIME)' หรือ 'มาสาย (LATE)' เช่นเดียวกัน และบวกเบี้ยเลี้ยงเสริมตามนโยบายปฏิบัติงานนอกสถานที่";
        } else if (key === 'WFH') {
            message = "คะแนนเช็คอินตามเวลาปกติ แต่หากทำงานโดยไม่ได้รับอนุญาต ระบบจะหัก HP ตามเกณฑ์ 'โทษหัก WFH ไม่ได้รับอนุญาต' ในตัวแปรระบบด้านล่างแทน";
        } else if (key === 'APPEAL') {
            message = "เป็นสถานะรอตรวจสอบชั่วคราว ไม่มีผลคะแนนในตัวเอง คะแนนจริงจะเกิดขึ้นตามผลลัพธ์หลังแอดมินพิจารณาอนุมัติคำร้องสายแล้วเท่านั้น";
        } else if (key === 'LATE_ENTRY') {
            message = "ใช้เป็นประเภทคำร้องแจ้งเข้าสาย/ลงเวลาล่วงหน้า ไม่มีคะแนนฝังในกฎโดยตรง";
        } else if (key === 'FORGOT_CHECKIN') {
            message = "ใช้ระบุรูปแบบคำร้องแจ้งลืมลงเวลาเข้างาน ไม่มีคะแนนฝังในกฎโดยตรง";
        } else if (key === 'OVERTIME') {
            message = "ใช้ระบุคำร้องขอทำโอที คะแนนของโอทีจะคำนวณตามชั่วโมงที่แอดมินอนุมัติผ่านระบบโอทีโดยตรง";
        } else if (key === 'EARLY_LEAVE') {
            message = "🔒 รวบการตั้งค่าไว้ที่เดียวเพื่อความสะดวก: สามารถตั้งค่ากฎกลับก่อนเวลาทั้งหมดได้ทันทีในหัวข้อ 'ระบบวินัยกลับก่อนเวลา & วินัยพิเศษ' ที่อยู่ภายใต้ส่วน 'ตัวปรับตั้งค่าโบนัสและวินัยเช็คอิน' ด้านล่างครับ";
        } else if (key === 'LEAVE') {
            message = "ไม่มีการลาประเภทนี้โดยตรง ระบบจะไปใช้กฎและคะแนนแยกรายประเภทวันลา (ลาป่วย, ลาพักร้อน, ลากิจ, ฯลฯ) ในหัวข้อนโยบายวันลาด้านบนแทน";
        } else if (key === 'FORGOT_CHECKOUT') {
            message = "ลืมลงเวลาออกงาน: ระบบจะสแกนและหัก HP อัตโนมัติเมื่อสิ้นสุดวัน หากส่งคำร้องแก้ไขและแอดมินอนุมัติ จะได้รับ HP คืนบางส่วนตามเกณฑ์ 'คืนค่าลืมเช็คออก (CORRECTION_REFUND)'";
        } else if (key === 'FORGOT_BOTH') {
            message = "ลืมทั้งเข้าและออกงาน: เป็นประเภทคำร้องพิเศษ เมื่อได้รับการอนุมัติระบบจะลงเวลาและรับรางวัลตามปกติ พร้อมทั้งคืน HP จากการขาดงานให้อัตโนมัติ";
        } else if (key === 'CORRECTION_REFUND') {
            message = "คืนค่าลืมเช็คออก (Refund): จำนวน HP ที่ระบบจะคืนให้โดยอัตโนมัติเมื่อพนักงานลืมสแกนออกงาน แต่ยื่นใบขอแก้ไขแล้วได้รับอนุมัติ";
        } else if (key === 'ABSENT_REFUND') {
            message = "คืนค่าขาดงาน (Refund): จำนวน HP ที่ระบบจะคืนให้เมื่อพนักงานขาดงานไปแล้ว แต่ภายหลังได้รับการอนุมัติคำร้องแก้ไขเวลาเช็คอินย้อนหลัง";
        } else if (key === 'ON_TIME') {
            message = "มาตรงเวลา: เกณฑ์รางวัลพื้นฐาน (XP และ Coins) สำหรับพนักงานที่สแกนเข้างานภายในเวลาที่บริษัทกำหนด (เชื่อมโยงกับค่า 'XP พื้นฐานการเข้างาน' และ 'Coins พื้นฐานการเข้างาน' ในส่วนตัวปรับตั้งค่าโบนัสด้านล่างโดยอัตโนมัติ)";
        } else if (key === 'LATE') {
            message = "🔒 รวบการตั้งค่าไว้ที่เดียวเพื่อความสะดวก: สามารถตั้งค่ากฎการมาสายทั้งหมดได้ทันทีในหัวข้อ 'ระบบวินัยการมาสาย' ที่อยู่ภายใต้ส่วน 'ตัวปรับตั้งค่าโบนัสและวินัยเช็คอิน' ด้านล่างครับ";
        } else if (key === 'ABSENT') {
            message = "ขาดงาน: โทษปรับสูงสุดอัตโนมัติประจำวันเมื่อไม่สแกนเข้างานและไม่ยื่นใบลา หากส่งคำร้องแก้ไขและแอดมินอนุมัติ จะได้คืน HP บางส่วนตามเกณฑ์ 'คืนค่าขาดงาน (ABSENT_REFUND)'";
        } else if (key === 'NO_SHOW') {
            message = "ไม่มาและไม่แจ้ง: บทลงโทษขั้นรุนแรง (Critical Penalty) สำหรับกรณีพนักงานหายตัวไปโดยไม่แจ้งเหตุผลใดๆ";
        }
        
        return { isReadOnly, message };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Status Rules (ตารางสถานะปรับโครงสร้างใหม่) */}
            <div className="space-y-4">
                <div className="px-1">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        ระบบปรับแต่งกฎเกณฑ์การเข้าทำงานและวันลา (Attendance Tuner)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">ปรับสมดุลแต้มสุขภาพ (HP), ค่าประสบการณ์ (XP), และเหรียญรางวัล (Coins) ตามพฤติกรรมการเข้างานจริง</p>
                </div>

                {/* 1. กลุ่มสถานะหลักในการทำงาน (CORE_STATUS) */}
                {filteredCoreStatusRules.length > 0 && (
                    <CollapsibleCard
                        title="1. กลุ่มสถานะหลักในการทำงาน (Core Attendance Statuses)"
                        description="รางวัลและบทลงโทษประจำวันสำหรับพนักงานที่สแกนเข้างานตามเวลาปกติ เช่น มาตรงเวลา มาสาย หรือหายเงียบ"
                        icon={UserCheck}
                        colorClass="indigo"
                        defaultExpanded={true}
                        badgeText={`${filteredCoreStatusRules.length} สถานะหลัก`}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {filteredCoreStatusRules.map(option => {
                                const { isReadOnly, message } = getRuleConfig(option.key);
                                return (
                                    <div key={option.key} className="relative pl-3.5 group">
                                        <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-indigo-500'}`}></div>
                                        <RuleEditor 
                                            label={option.label} 
                                            ruleKey={option.key} 
                                            rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isReadOnly}
                                            message={message}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleCard>
                )}

                {/* 2. นโยบายขาดงานและการชดเชย (ABSENT_GROUP) */}
                {filteredAbsentRules.length > 0 && (
                    <CollapsibleCard
                        title="2. นโยบายขาดงานและการชดเชย (Absence & Refund Tuning)"
                        description="บทลงโทษการขาดงาน คู่กับ แต้มนโยบายคืนค่า HP ชดเชยย้อนหลังเพื่อความโปร่งใสและมองเห็นยอดสุทธิ (Net HP) ได้ง่ายขึ้น"
                        icon={ShieldAlert}
                        colorClass="rose"
                        defaultExpanded={true}
                        badgeText={`${filteredAbsentRules.length} สถานะขาดงาน`}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {filteredAbsentRules.map(option => {
                                const { isReadOnly, message } = getRuleConfig(option.key);
                                return (
                                    <div key={option.key} className="relative pl-3.5 group">
                                        <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-rose-500'}`}></div>
                                        <RuleEditor 
                                            label={option.label} 
                                            ruleKey={option.key} 
                                            rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isReadOnly}
                                            message={message}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleCard>
                )}

                {/* 3. นโยบายลืมลงเวลาออกและการชดเชย (CHECKOUT_GROUP) */}
                {filteredCheckoutRules.length > 0 && (
                    <CollapsibleCard
                        title="3. นโยบายลืมลงเวลาออกและการชดเชย (Forgot Checkout & Refund)"
                        description="บทลงโทษกรณีลืมแสกนตอกบัตรออกงาน คู่กับ แต้ม HP คืนชดเชยเมื่อยื่นคำร้องย้อนหลังสำเร็จ"
                        icon={RefreshCw}
                        colorClass="orange"
                        defaultExpanded={true}
                        badgeText={`${filteredCheckoutRules.length} สถานะลืมออก`}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {filteredCheckoutRules.map(option => {
                                const { isReadOnly, message } = getRuleConfig(option.key);
                                return (
                                    <div key={option.key} className="relative pl-3.5 group">
                                        <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-orange-500'}`}></div>
                                        <RuleEditor 
                                            label={option.label} 
                                            ruleKey={option.key} 
                                            rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isReadOnly}
                                            message={message}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleCard>
                )}

                {/* 4. นโยบายประเภทวันลา (LEAVE) */}
                {filteredLeaveRules.length > 0 && (
                    <CollapsibleCard
                        title="4. นโยบายประเภทวันลา (Leave Type Rules)"
                        description="รางวัลและผลกระทบของวันลาประเภทมาตรฐานที่สามารถปรับจูนสัดส่วนคะแนนได้โดยตรง"
                        icon={Calendar}
                        colorClass="emerald"
                        defaultExpanded={!!searchTerm}
                        badgeText={`${filteredLeaveRules.length} ประเภทวันลา`}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {filteredLeaveRules.map(option => {
                                const { isReadOnly, message } = getRuleConfig(option.key);
                                return (
                                    <div key={option.key} className="relative pl-3.5 group">
                                        <div className={`absolute left-0 top-1 bottom-1 w-1 rounded-full ${option.color?.includes('bg-') ? option.color : option.color?.replace('text-', 'bg-') || 'bg-emerald-500'}`}></div>
                                        <RuleEditor 
                                            label={option.label} 
                                            ruleKey={option.key} 
                                            rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isReadOnly}
                                            message={message}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleCard>
                )}

                {/* 5. สารบัญระบบและคำร้องประเภท Read-Only (SYSTEM_LOCKED) */}
                {filteredSystemLockedRules.length > 0 && (
                    <CollapsibleCard
                        title="5. สารบัญระบบและคำร้องประเภท Read-Only (System & Informational Rules)"
                        description="ประเภทวันหยุด สถานะการปฏิบัติงาน หรือข้อมูลเสริมที่ใช้ระบุรูปแบบคำร้อง ไม่มีผลคะแนนฝังในกฎโดยตรง ถูกล็อกยุบตัวไว้เพื่อให้แอดมินตั้งค่ากฎหลักได้สะดวกขึ้น"
                        icon={FileText}
                        colorClass="slate"
                        defaultExpanded={!!searchTerm}
                        badgeText={`${filteredSystemLockedRules.length} รายการระบบ`}
                    >
                        <div className="grid grid-cols-1 gap-4 opacity-85">
                            {filteredSystemLockedRules.map(option => {
                                const { isReadOnly, message } = getRuleConfig(option.key);
                                return (
                                    <div key={option.key} className="relative pl-3.5 group">
                                        <div className="absolute left-0 top-1 bottom-1 w-1 rounded-full bg-slate-400"></div>
                                        <RuleEditor 
                                            label={option.label} 
                                            ruleKey={option.key} 
                                            rule={localConfig.ATTENDANCE_RULES?.[option.key] || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isReadOnly}
                                            message={message}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleCard>
                )}
            </div>

            {/* General Attendance Multipliers */}
            {attendanceGroupItems.length > 0 && (
                <CollapsibleCard
                    title="ตัวปรับตั้งค่าโบนัสและวินัยเช็คอิน (Attendance Variables)"
                    description="บริหารรางวัลการเข้างานตรงเวลา/เช้าตรู่ และกำหนดกฎเหล็กวินัยสำหรับการเข้าสายหรือกลับก่อนเวลาทำงาน"
                    icon={Clock}
                    colorClass="indigo"
                    defaultExpanded={true}
                    badgeText={`${attendanceGroupItems.length} ตัวแปรระบบ`}
                >
                    <div className="space-y-6">
                        {/* กลุ่มที่ 1: ⏰ ระบบวินัยการมาสาย */}
                        {(() => {
                            const lateModeItem = findItem('LATE_MODE_DYNAMIC');
                            if (!lateModeItem) return null;
                            const isEnabled = lateModeItem.value === 1;
                            return (
                                <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-orange-50">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-orange-50 p-2 rounded-xl text-orange-600">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-orange-800 flex items-center gap-1.5 uppercase tracking-wider">
                                                    ⏰ ระบบวินัยการมาสาย (Late Entry Penalties & Config)
                                                </h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-medium">
                                                    เลือกวิธีการคำนวณบทลงโทษเมื่อพนักงานสแกนเข้างานสาย
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Switch Controls */}
                                        <div className="flex items-center gap-3 bg-orange-50/50 px-3 py-1.5 rounded-xl border border-orange-100/50 self-start md:self-auto">
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">โหมดการคำนวณ</span>
                                                <span className={`text-[10px] font-black ${isEnabled ? 'text-orange-600' : 'text-slate-600'}`}>
                                                    {isEnabled ? '📈 Dynamic (หักตามนาที)' : '🎯 Flat Rate (หักคงที่)'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(lateModeItem.section, lateModeItem.key, isEnabled ? 0 : 1)}
                                                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${isEnabled ? 'bg-orange-600' : 'bg-slate-200'}`}
                                            >
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Child Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {['HP_PENALTY_LATE_INTERVAL', 'HP_PENALTY_LATE_RATE'].map(key => {
                                            const item = findItem(key);
                                            if (!item) return null;
                                            const isChildDisabled = !isEnabled;
                                            return (
                                                <div key={item.key} className={`relative transition-all duration-300 ${isChildDisabled ? "opacity-40 pointer-events-none select-none" : ""}`}>
                                                    <ConfigSlider 
                                                        label={PRETTY_LABELS[item.key] || item.key} 
                                                        value={item.value} 
                                                        min={0} 
                                                        max={item.key.includes('INTERVAL') ? 120 : 50} 
                                                        step={item.key.includes('RATE') ? 0.5 : 1}
                                                        unit={item.key.includes('INTERVAL') ? 'นาที' : 'HP'}
                                                        icon={Zap} 
                                                        color={isChildDisabled ? "slate" : "orange"}
                                                        onChange={(v: number) => handleChange(item.section, item.key, v)}
                                                    />
                                                    {isChildDisabled && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/10 backdrop-blur-[0.5px] rounded-2xl">
                                                            <span className="bg-slate-800/90 text-white text-[9px] font-extrabold px-2 py-1 rounded-md shadow-md uppercase tracking-wider">
                                                                🔒 ทำงานเฉพาะโหมดมาสายแบบ Dynamic เท่านั้น
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Integrated Flat Rate RuleEditor for LATE */}
                                    <div className="mt-4 border-t border-orange-100 pt-4">
                                        <div className="text-xs font-black text-orange-800 mb-2 flex items-center gap-1.5">
                                            <span>🎯 ตั้งค่าแต้มปรับมาสายคงที่ (LATE Flat Rate Penalty)</span>
                                            {!isEnabled && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[9px] font-black uppercase tracking-wider animate-pulse">กำลังใช้จริง (Active)</span>}
                                        </div>
                                        <RuleEditor 
                                            label="สถิติมาสาย (LATE)" 
                                            ruleKey="LATE" 
                                            rule={localConfig.ATTENDANCE_RULES?.LATE || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isEnabled}
                                            message={isEnabled 
                                                ? "🔒 ถูกล็อกเนื่องจากเปิดใช้งานโหมด Dynamic (ระบบจะคำนวณหักตามสัดส่วนนาทีด้านบนแทน)" 
                                                : "✨ เปิดใช้งานอยู่ (สามารถปรับจูนแต้ม HP เสียหายคงที่ หรือรางวัล XP/Coins ได้ที่นี่ทันที)"}
                                        />
                                    </div>
                                </div>
                            );
                        })()}

                        {/* กลุ่มที่ 3: 🕒 ระบบวินัยกลับก่อนเวลา & วินัยพิเศษ */}
                        {(() => {
                            const earlyLeaveModeItem = findItem('EARLY_LEAVE_MODE_DYNAMIC');
                            if (!earlyLeaveModeItem) return null;
                            const isEnabled = earlyLeaveModeItem.value === 1;
                            return (
                                <div className="bg-white rounded-2xl p-4 border border-rose-100 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-rose-50">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-rose-50 p-2 rounded-xl text-rose-600">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-rose-800 flex items-center gap-1.5 uppercase tracking-wider">
                                                    🕒 ระบบวินัยกลับก่อนเวลา & วินัยพิเศษ (Early Leave & Special Discipline)
                                                </h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-medium">
                                                    สลับโหมดคำนวณหักสุขภาพพนักงานเมื่อกลับก่อนเวลา และโทษผิดวินัยอื่นๆ
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Switch Controls */}
                                        <div className="flex items-center gap-3 bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100/50 self-start md:self-auto">
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">โหมดการคำนวณ</span>
                                                <span className={`text-[10px] font-black ${isEnabled ? 'text-rose-600' : 'text-slate-600'}`}>
                                                    {isEnabled ? '📈 Dynamic (หักตามนาที)' : '🎯 Flat Rate (หักคงที่)'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleChange(earlyLeaveModeItem.section, earlyLeaveModeItem.key, isEnabled ? 0 : 1)}
                                                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 flex-shrink-0 ${isEnabled ? 'bg-rose-600' : 'bg-slate-200'}`}
                                            >
                                                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Child Settings & Special Settings */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        {['HP_PENALTY_EARLY_LEAVE_INTERVAL', 'HP_PENALTY_EARLY_LEAVE_RATE', 'HP_PENALTY_UNAUTHORIZED_WFH'].map(key => {
                                            const item = findItem(key);
                                            if (!item) return null;
                                            
                                            const isWfhKey = key === 'HP_PENALTY_UNAUTHORIZED_WFH';
                                            const isChildDisabled = !isEnabled && !isWfhKey;
                                            
                                            return (
                                                <div key={item.key} className={`relative transition-all duration-300 ${isChildDisabled ? "opacity-40 pointer-events-none select-none" : ""}`}>
                                                    <ConfigSlider 
                                                        label={PRETTY_LABELS[item.key] || item.key} 
                                                        value={item.value} 
                                                        min={0} 
                                                        max={item.key.includes('INTERVAL') ? 120 : 100} 
                                                        step={item.key.includes('RATE') ? 0.5 : 1}
                                                        unit={item.key.includes('INTERVAL') ? 'นาที' : 'HP'}
                                                        icon={Zap} 
                                                        color={isWfhKey ? "rose" : isChildDisabled ? "slate" : "rose"}
                                                        onChange={(v: number) => handleChange(item.section, item.key, v)}
                                                    />
                                                    {isChildDisabled && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/10 backdrop-blur-[0.5px] rounded-2xl">
                                                            <span className="bg-slate-800/90 text-white text-[9px] font-extrabold px-2 py-1 rounded-md shadow-md uppercase tracking-wider">
                                                                🔒 ทำงานเฉพาะโหมดกลับก่อนเวลาแบบ Dynamic เท่านั้น
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Integrated Flat Rate RuleEditor for EARLY_LEAVE */}
                                    <div className="mt-4 border-t border-rose-100 pt-4">
                                        <div className="text-xs font-black text-rose-800 mb-2 flex items-center gap-1.5">
                                            <span>🎯 ตั้งค่าแต้มปรับกลับก่อนเวลาคงที่ (EARLY_LEAVE Flat Rate Penalty)</span>
                                            {!isEnabled && <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black uppercase tracking-wider animate-pulse">กำลังใช้จริง (Active)</span>}
                                        </div>
                                        <RuleEditor 
                                            label="สถิติกลับก่อนเวลา (EARLY_LEAVE)" 
                                            ruleKey="EARLY_LEAVE" 
                                            rule={localConfig.ATTENDANCE_RULES?.EARLY_LEAVE || { xp: 0, hp: 0, coins: 0 }} 
                                            onChange={handleRuleChange} 
                                            readOnly={isEnabled}
                                            message={isEnabled 
                                                ? "🔒 ถูกล็อกเนื่องจากเปิดใช้งานโหมด Dynamic (ระบบจะคำนวณหักตามสัดส่วนนาทีด้านบนแทน)" 
                                                : "✨ เปิดใช้งานอยู่ (สามารถปรับจูนแต้ม HP เสียหายคงที่ หรือรางวัล XP/Coins ได้ที่นี่ทันที)"}
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </CollapsibleCard>
            )}
            
            {/* Empty State */}
            {filteredCoreStatusRules.length === 0 && filteredAbsentRules.length === 0 && filteredCheckoutRules.length === 0 && filteredLeaveRules.length === 0 && filteredSystemLockedRules.length === 0 && attendanceGroupItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-white/40 rounded-3xl border border-dashed">
                    ไม่พบข้อมูลตั้งค่าเกณฑ์เข้างานตามการค้นหาของคุณ 🔍
                </div>
            )}
        </motion.div>
    );
};
