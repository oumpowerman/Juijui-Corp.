import React from 'react';
import { Trophy, Coins, Minus, Plus, Clock, TrendingUp, Info } from 'lucide-react';
import { ConfigSlider, StatPreview } from './components/SharedComponents';
import { motion } from 'framer-motion';

interface EconomyTunerProps {
    localConfig: any;
    handleChange: (section: string, key: string, value: any) => void;
}

const EconomyTuner: React.FC<EconomyTunerProps> = ({ localConfig, handleChange }) => {
    return (
        <div className="space-y-8">
            {/* Section 1: Leveling System */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-white/40 shadow-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">ระบบเลเวล (Leveling System)</h3>
                        <p className="text-xs text-slate-500">กำหนดความยากง่ายในการอัปเลเวลและรางวัลที่ได้รับ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <ConfigSlider 
                            label="XP Base / Level" 
                            value={localConfig.LEVELING_SYSTEM?.base_xp_per_level || 1000} 
                            min={500} max={5000} step={100} unit="XP"
                            icon={Trophy} color="amber"
                            onChange={(v: number) => handleChange('LEVELING_SYSTEM', 'base_xp_per_level', v)}
                        />
                        <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-start gap-1">
                            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            ยิ่งค่าสูง ผู้เล่นต้องทำภารกิจมากขึ้นเพื่ออัปเลเวล (ชะลอความเฟ้อของเลเวล)
                        </p>
                    </div>
                    <div>
                        <ConfigSlider 
                            label="Bonus Coin (Level Up)" 
                            value={localConfig.LEVELING_SYSTEM?.level_up_bonus_coins || 500} 
                            min={0} max={2000} step={50} unit="JP"
                            icon={Coins} color="yellow"
                            onChange={(v: number) => handleChange('LEVELING_SYSTEM', 'level_up_bonus_coins', v)}
                        />
                        <p className="text-[10px] text-slate-400 mt-2 ml-1 flex items-start gap-1">
                            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            จำนวนเหรียญที่แจกฟรีเมื่อเลเวลอัป (ระวังแจกเยอะเกินไปจะทำให้ของในร้านค้าดูราคาถูกลง)
                        </p>
                    </div>
                </div>
            </motion.div>
            
            {/* Section 2: Hourly Rate */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-indigo-50/80 backdrop-blur-sm p-6 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="flex-1">
                    <h4 className="font-bold text-indigo-800 text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Hourly Rate (ค่าแรงรายชั่วโมง)
                    </h4>
                    <p className="text-xs text-indigo-600 mt-1">
                        ใช้คำนวณ XP จากระยะเวลาทำงานจริง: <br/>
                        <code className="bg-white/50 px-1 rounded text-indigo-700 font-bold">Hours x Rate = XP Bonus</code>
                    </p>
                    <p className="text-[10px] text-indigo-400 mt-2">
                        * ส่งผลต่อ XP ที่ได้จากการ Check-out และการทำ Task ที่มีการระบุเวลา
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-indigo-50">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleChange('GLOBAL_MULTIPLIERS', 'XP_PER_HOUR', (localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20) - 5)} className="p-3 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-colors"><Minus className="w-4 h-4" /></motion.button>
                    <div className="text-center min-w-[80px]">
                        <span className="block text-3xl font-black text-indigo-600">{localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20}</span>
                        <span className="text-[10px] font-bold text-indigo-300 uppercase">XP / Hr</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleChange('GLOBAL_MULTIPLIERS', 'XP_PER_HOUR', (localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20) + 5)} className="p-3 bg-indigo-50 rounded-xl text-indigo-600 hover:bg-indigo-100 transition-colors"><Plus className="w-4 h-4" /></motion.button>
                </div>
            </motion.div>

            {/* Section 3: Stats Preview */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
            >
                <StatPreview 
                    title="Estimated Time to Lv.2" 
                    value={`~${Math.ceil((localConfig.LEVELING_SYSTEM?.base_xp_per_level || 1000) / ((localConfig.DIFFICULTY_XP?.MEDIUM || 100) + ((localConfig.GLOBAL_MULTIPLIERS?.XP_PER_HOUR || 20) * 2)))} Jobs`} 
                    subtext="คำนวณจากงานระดับกลาง (2 ชม.)"
                    icon={Clock} color="slate"
                />
                <StatPreview 
                    title="Economic Health" 
                    value="Stable" 
                    subtext="อัตราเงินเฟ้ออยู่ในเกณฑ์ปกติ"
                    icon={TrendingUp} color="emerald"
                />
            </motion.div>
        </div>
    );
};

export default EconomyTuner;
