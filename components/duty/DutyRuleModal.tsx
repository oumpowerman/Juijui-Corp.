
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    X, ShieldCheck, AlertTriangle, Zap, Clock, CheckCircle, 
    HeartHandshake, Coins, Trophy, Ban, Scale, MessageCircle,
    Camera, ArrowRightCircle, Sparkles, Info, Skull
} from 'lucide-react';
import { useGameConfig } from '../../context/GameConfigContext';
import BaseModal from '../common/BaseModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// --- Sub-components ---

const StatBadge = ({ type, value }: { type: 'XP' | 'HP' | 'COIN' | 'JP', value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    const prefix = isPositive ? '+' : '';
    
    let colorClass = '';
    if (type === 'XP') colorClass = 'bg-gradient-to-b from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';
    if (type === 'HP') colorClass = isPositive ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]' : 'bg-gradient-to-b from-rose-50 to-rose-100 text-rose-700 border-rose-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';
    if (type === 'COIN' || type === 'JP') colorClass = isPositive ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]' : 'bg-gradient-to-b from-orange-50 to-orange-100 text-orange-700 border-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]';

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border ${colorClass} shadow-sm whitespace-nowrap`}>
            {prefix}{value} {type}
        </span>
    );
};

const RuleCard = ({ 
    icon: Icon, 
    title, 
    description, 
    colorTheme, 
    stats,
    delay = 0
}: { 
    icon: any, 
    title: string, 
    description: React.ReactNode, 
    colorTheme: 'emerald' | 'rose' | 'orange' | 'purple' | 'blue' | 'indigo' | 'yellow' | 'pink',
    stats?: { xp?: number, hp?: number, coins?: number, jp?: number },
    delay?: number
}) => {
    const themeMap = {
        emerald: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/60 text-emerald-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(16,185,129,0.1)]',
        rose: 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/60 text-rose-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(244,63,94,0.1)]',
        orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/60 text-orange-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(249,115,22,0.1)]',
        purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/60 text-purple-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(168,85,247,0.1)]',
        blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/60 text-blue-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(59,130,246,0.1)]',
        indigo: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200/60 text-indigo-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(99,102,241,0.1)]',
        yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200/60 text-yellow-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(234,179,8,0.1)]',
        pink: 'bg-gradient-to-br from-pink-50 to-pink-100/50 border-pink-200/60 text-pink-600 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(236,72,153,0.1)]',
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/60 border-t-white rounded-2xl p-4 shadow-sm transition-all"
        >
            <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${themeMap[colorTheme]}`}>
                    <Icon className="w-6 h-6 drop-shadow-sm" />
                </div>
                <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 text-base drop-shadow-sm">{title}</h3>
                        {stats && (
                            <div className="flex flex-wrap gap-1 justify-end">
                                {stats.xp !== undefined && <StatBadge type="XP" value={stats.xp} />}
                                {stats.hp !== undefined && <StatBadge type="HP" value={stats.hp} />}
                                {stats.coins !== undefined && <StatBadge type="COIN" value={stats.coins} />}
                                {stats.jp !== undefined && <StatBadge type="JP" value={stats.jp} />}
                            </div>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed font-medium">
                        {description}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const SectionHeader = ({ title, icon: Icon, color }: { title: string, icon: any, color: string }) => (
    <div className="flex items-center gap-2 mb-4 mt-6 first:mt-0 top-0 bg-slate-50/90 backdrop-blur-md py-2 z-10 border-b border-gray-200/60 shadow-[0_4px_10px_-10px_rgba(0,0,0,0.1)]">
        <Icon className={`w-5 h-5 ${color} drop-shadow-sm`} />
        <h2 className={`font-bold text-lg ${color} drop-shadow-sm`}>{title}</h2>
    </div>
);

// --- Main Modal ---

const DutyRuleModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'SWAP' | 'TRIBUNAL'>('GENERAL');
    const { config } = useGameConfig();

    // Extract dynamic values
    const globals = config?.GLOBAL_MULTIPLIERS || {};
    const penalties = config?.PENALTY_RATES || {};
    const autoJudge = config?.AUTO_JUDGE_CONFIG || {};

    return (
        <BaseModal 
            isOpen={isOpen} 
            onClose={onClose}
            windowClassName="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
            backdropClassName="bg-slate-900/40 backdrop-blur-sm"
            zIndex={100}
        >
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 sm:p-8 text-white relative shrink-0 overflow-hidden shadow-[inset_0_-10px_20px_-10px_rgba(0,0,0,0.2)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl" />

                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-colors z-20 backdrop-blur-md shadow-inner"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-4 mb-3 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(0,0,0,0.1)] border border-white/30 relative">
                        <ShieldCheck className="w-8 h-8 text-white drop-shadow-md" />
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-100 drop-shadow-sm flex items-center gap-2">
                            กติกาการทำเวร
                        </h2>
                        <p className="text-amber-50 text-sm sm:text-base font-medium opacity-90 drop-shadow-sm">
                            ระบบจัดการความรับผิดชอบและรางวัล
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6 relative z-10 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'GENERAL', label: 'การทำเวรปกติ', icon: Clock },
                        { id: 'SWAP', label: 'การแลก & ช่วยเหลือ', icon: HeartHandshake },
                        { id: 'TRIBUNAL', label: 'บทลงโทษ & อุทธรณ์', icon: Scale }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                                activeTab === tab.id 
                                ? 'bg-gradient-to-b from-white to-slate-50 text-amber-600 shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_-2px_0_rgba(0,0,0,0.05)] border border-white/50' 
                                : 'bg-white/10 text-white hover:bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-transparent'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto overscroll-none bg-slate-50/50 flex-1 relative">
                
                {/* Tab 1: GENERAL */}
                {activeTab === 'GENERAL' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        <SectionHeader title="หน้าที่และความรับผิดชอบ" icon={Clock} color="text-amber-600" />
                        <RuleCard 
                            icon={Trophy} colorTheme="emerald" title="ทำเวรสำเร็จ (On-Time)" delay={0.1}
                            stats={{ xp: globals.XP_DUTY_COMPLETE || 20, jp: globals.COIN_DUTY || 5 }}
                            description={
                                <span>
                                    ถ่ายรูปหลักฐานการทำเวรส่งในระบบภายในวันที่ได้รับมอบหมาย จะได้รับรางวัลทั้ง XP และเหรียญ JP ตอบแทนความรับผิดชอบ
                                </span>
                            }
                        />
                        <RuleCard 
                            icon={Camera} colorTheme="blue" title="การส่งหลักฐาน & ห้ามส่งล่วงหน้า (Proof)" delay={0.2}
                            description={
                                <span>
                                    ต้องถ่ายรูปงานที่ทำเสร็จแล้วในวันที่กำหนดเท่านั้น <span className="font-bold text-blue-700">ระบบไม่อนุญาตให้ติ๊กหรือส่งหลักฐานล่วงหน้าก่อนถึงวันเวรจริง</span> และจะบันทึกเวลาส่งงานพร้อมส่งแจ้งเตือนเข้าห้องแชททีมอัตโนมัติ
                                </span>
                            }
                        />
                        
                        <SectionHeader title="ช่วงเวลาผ่อนผัน (Grace Period)" icon={Zap} color="text-indigo-600" />
                        <RuleCard 
                            icon={Clock} colorTheme="indigo" title="โอกาสส่งงานช่วงผ่อนผัน" delay={0.3}
                            description={
                                <span>
                                    หากลืมทำเวรในวันที่กำหนด ระบบจะยังไม่ตัดสินว่าละเลยทันที แต่จะเปิดช่วงผ่อนผันให้รีบส่งงานย้อนหลังได้จนถึงเวลา <span className="font-bold text-indigo-600">{autoJudge.duty_grace_hour || 10}:00 น.</span> ของวันถัดไป
                                </span>
                            }
                        />
                        <RuleCard 
                            icon={Ban} colorTheme="rose" title="วันหยุด & การลา" delay={0.4}
                            description="ระบบจะไม่สุ่มเวรในวันหยุดบริษัท และหากตรงกับวันหยุดพิเศษหรือคุณมีใบลาที่ได้รับการอนุมัติแล้ว (APPROVED) ระบบจะยกเว้นเวร (EXCUSED) ให้อัตโนมัติโดยไม่เสียคะแนน"
                        />
                    </motion.div>
                )}

                {/* Tab 2: SWAP */}
                {activeTab === 'SWAP' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        <SectionHeader title="ระบบแลกเวร (Duty Swap)" icon={ArrowRightCircle} color="text-purple-600" />
                        <RuleCard 
                            icon={ArrowRightCircle} colorTheme="purple" title="การแลกเวร" delay={0.1}
                            description="หากติดธุระ สามารถส่งคำขอแลกเวรกับเพื่อนได้ โดยเพื่อนต้องกด 'Accept' ในกล่องข้อความแจ้งเตือนแลกเวรเพื่อยืนยันการสลับหน้าที่"
                        />
                        <RuleCard 
                            icon={Info} colorTheme="blue" title="เงื่อนไขการแลก" delay={0.2}
                            description={
                                <span>
                                    กดขอแลกได้เฉพาะ <span className="font-bold text-blue-700">เวรของตัวเองที่ยังไม่ได้ทำ และยังไม่หลุดเข้าสถานะขาดเวร ขึ้นศาล หรือถูกละเลย</span> เท่านั้น
                                </span>
                            }
                        />

                        <SectionHeader title="ระบบช่วยเหลือ (Hero Assist)" icon={HeartHandshake} color="text-rose-600" />
                        <RuleCard 
                            icon={Sparkles} colorTheme="pink" title="เป็นฮีโร่ช่วยเพื่อน" delay={0.3}
                            stats={{ xp: globals.XP_DUTY_ASSIST || 30, jp: globals.COIN_DUTY || 5 }}
                            description={
                                <span>
                                    หากเห็นเพื่อนงานยุ่ง สามารถกดปุ่ม <span className="font-bold text-pink-600">"Assist"</span> บนการ์ดเวรของเพื่อนเพื่อถ่ายรูปส่งงานแทนได้ ฮีโร่ผู้ช่วยจะได้รับทั้งโบนัส XP และเหรียญ JP!
                                </span>
                            }
                        />
                        <RuleCard 
                            icon={CheckCircle} colorTheme="emerald" title="ผลของการช่วย" delay={0.4}
                            description="เพื่อนที่ถูกช่วยจะถือว่าทำเวรเสร็จสมบูรณ์ (รอดพ้นบทลงโทษทั้งหมด) แต่แต้มรางวัลในรอบนั้นจะมอบให้กับฮีโร่ผู้มาช่วยแทน"
                        />
                    </motion.div>
                )}

                {/* Tab 3: TRIBUNAL */}
                {activeTab === 'TRIBUNAL' && (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                        <SectionHeader title="ศาลตัดสินเวร & ทางเลือกการแก้ไข (Duty Tribunal)" icon={Scale} color="text-rose-600" />
                        
                        <RuleCard 
                            icon={AlertTriangle} colorTheme="orange" title="ส่งงานล่าช้าในช่วงผ่อนผัน (Late Submit)" delay={0.1}
                            stats={{ xp: globals.XP_DUTY_LATE_SUBMIT || 5, hp: -(penalties.HP_PENALTY_DUTY_LATE_SUBMIT || 5) }}
                            description={
                                <span>
                                    การส่งงานย้อนหลังในช่วงเวลาผ่อนผัน (หลังเที่ยงคืนแต่ก่อน <span className="font-bold text-orange-600">{autoJudge.duty_grace_hour || 10}:00 น.</span> ของวันถัดไป) จะถูกหัก HP เล็กน้อยเป็นค่าปรับล่าช้า แต่ยังได้รับ XP ความรับผิดชอบปลอบใจ
                                </span>
                            }
                        />
                        
                        <RuleCard 
                            icon={Scale} colorTheme="indigo" title="ขอแก้ตัวที่ศาล (Tribunal Redeem)" delay={0.15}
                            stats={{ xp: globals.XP_DUTY_LATE_SUBMIT || 5, hp: -(penalties.HP_PENALTY_DUTY_LATE_SUBMIT || 5) }}
                            description={
                                <span>
                                    เมื่อเวรเข้าสู่สถานะรอขึ้นศาล (<span className="font-bold text-indigo-600">AWAITING TRIBUNAL</span>) การถ่ายรูปส่งงานแก้ตัวจะช่วยให้รอดพ้นโทษหนัก <span className="font-bold text-rose-600">-{penalties.HP_PENALTY_MISSED_DUTY || 20} HP</span> (เสียเพียงค่าปรับส่งช้า <span className="font-bold text-rose-600">-{penalties.HP_PENALTY_DUTY_LATE_SUBMIT || 5} HP</span> และได้ <span className="font-bold text-blue-600">+{globals.XP_DUTY_LATE_SUBMIT || 5} XP</span>) หรือหากเป็นการกู้คืนจากสถานะละเลยที่ถูกหักคะแนนไปแล้ว ระบบจะคืนให้ <span className="font-bold text-emerald-600">+{penalties.HP_REFUND_DUTY_REDEEM || 10} HP</span>
                                </span>
                            }
                        />

                        <RuleCard 
                            icon={MessageCircle} colorTheme="blue" title="การอุทธรณ์แจ้งเหตุจำเป็น (Appeal)" delay={0.2}
                            description="หากมีเหตุจำเป็นสุดวิสัย (เช่น ป่วยกะทันหัน หรือติดภารกิจด่วน) สามารถยื่นอุทธรณ์พร้อมแนบรูปหลักฐานในหน้าศาลเพื่อเปลี่ยนสถานะเป็นรอตรวจสอบ (UNDER REVIEW) ให้ Admin พิจารณายกเว้นโทษได้"
                        />

                        <RuleCard 
                            icon={Ban} colorTheme="rose" title="ยอมรับผิดในชั้นศาล (Accept Fault)" delay={0.25}
                            stats={{ hp: -(penalties.HP_PENALTY_MISSED_DUTY || 20) }}
                            description={
                                <span>
                                    หากลืมทำเวรจริงและไม่ต้องการส่งงานแก้ตัว สามารถกดปุ่ม <span className="font-bold text-rose-600">"ฉันลืมทำเวรจริงๆ"</span> เพื่อรับโทษหัก HP และเคลียร์สถานะเวรนั้นให้จบสิ้นทันที
                                </span>
                            }
                        />

                        <SectionHeader title="บทลงโทษกรณีปล่อยปละละเลย (2 ขั้นตอน)" icon={Skull} color="text-rose-700" />
                        
                        <RuleCard 
                            icon={Skull} colorTheme="rose" title="ขั้นที่ 1: ละเลยเวรเกินกำหนด (Abandoned Duty)" delay={0.3}
                            stats={{ hp: -(penalties.HP_PENALTY_MISSED_DUTY || 20) }}
                            description={
                                <span>
                                    หากปล่อยเวรทิ้งไว้จนเลยเวลาผ่อนผันครบ <span className="font-bold text-rose-600">{autoJudge.negligence_threshold_days || 1} วันทำการ</span> ระบบจะตัดสินเป็นสถานะ <span className="font-bold text-rose-600">ABANDONED (FAILED)</span> หักคะแนนทันที และแสดงการ์ดแจ้งเตือนบน Dashboard บังคับให้กดรับทราบความผิด (ล็อกหน้าจอนับถอยหลัง 5 วินาที)
                                </span>
                            }
                        />

                        <RuleCard 
                            icon={Ban} colorTheme="rose" title="ขั้นที่ 2: เพิกเฉยซ้ำซ้อนจนเวรใหม่มาถึง (Negligence Protocol)" delay={0.35}
                            stats={{ hp: -(autoJudge.negligence_penalty_hp || 20) }}
                            description={
                                <span>
                                    หากมีเวรที่ติดสถานะ <span className="font-bold text-rose-600">ABANDONED</span> ค้างอยู่แล้วยังไม่ยอมกดรับทราบเพื่อเคลียร์ จนกระทั่งถึงวันที่มีเวรรอบใหม่ของตัวเองวนมาถึง ระบบจะเปิดโปรโตคอลลงทัณฑ์หักคะแนนซ้ำเป็นรอบที่ 2 อีก <span className="font-bold text-rose-600">-{autoJudge.negligence_penalty_hp || 20} HP</span> และบังคับเคลียร์เวรเก่าอัตโนมัติ
                                </span>
                            }
                        />
                    </motion.div>
                )}

            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200/60 bg-white shrink-0 relative z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <button 
                    onClick={onClose}
                    className="w-full py-3.5 bg-gradient-to-b from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold transition-all active:scale-[0.98] shadow-[0_4px_15px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 border border-amber-700/50"
                >
                    <CheckCircle className="w-5 h-5 drop-shadow-sm" />
                    <span className="drop-shadow-sm">รับทราบและเข้าใจกฎกติกา</span>
                </button>
            </div>
        </BaseModal>
    );
};

export default DutyRuleModal;
