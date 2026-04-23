import React from 'react';
import { Zap, Coins, Award, Info } from 'lucide-react';
import { ConfigSlider, RuleEditor } from './components/SharedComponents';
import { motion } from 'framer-motion';

interface QuestsTunerProps {
    localConfig: any;
    handleChange: (section: string, key: string, value: any) => void;
    setLocalConfig: (config: any) => void;
    setIsDirty: (dirty: boolean) => void;
}

const QuestsTuner: React.FC<QuestsTunerProps> = ({ localConfig, handleChange, setLocalConfig, setIsDirty }) => {
    
    const handleKPIRuleChange = (key: string, field: 'xp' | 'hp' | 'coins', val: number) => {
        const rules = { ...localConfig.KPI_REWARDS };
        if (!rules[key]) rules[key] = { xp: 0, hp: 0, coins: 0 };
        rules[key] = { ...rules[key], [field]: val };
        
        setLocalConfig((prev: any) => ({ ...prev, KPI_REWARDS: rules }));
        setIsDirty(true);
    };

    return (
        <div className="space-y-8">
            {/* Section 1: Task Difficulty Rewards */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Zap className="w-4 h-4" /></div>
                    <h4 className="text-sm font-bold text-slate-700">ค่าตอบแทนตามความยาก (Difficulty Rewards)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ConfigSlider 
                        label="Easy Task" 
                        value={localConfig.DIFFICULTY_XP?.EASY || 50} 
                        min={10} max={200} step={10} unit="XP"
                        icon={Zap} color="green"
                        onChange={(v: number) => handleChange('DIFFICULTY_XP', 'EASY', v)}
                    />
                    <ConfigSlider 
                        label="Medium Task" 
                        value={localConfig.DIFFICULTY_XP?.MEDIUM || 100} 
                        min={50} max={500} step={10} unit="XP"
                        icon={Zap} color="blue"
                        onChange={(v: number) => handleChange('DIFFICULTY_XP', 'MEDIUM', v)}
                    />
                    <ConfigSlider 
                        label="Hard Task" 
                        value={localConfig.DIFFICULTY_XP?.HARD || 250} 
                        min={100} max={1000} step={50} unit="XP"
                        icon={Zap} color="purple"
                        onChange={(v: number) => handleChange('DIFFICULTY_XP', 'HARD', v)}
                    />
                </div>
                <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Info className="w-3 h-3" />
                    ค่า XP นี้เป็นค่าพื้นฐาน (Base XP) ที่จะได้รับเมื่อทำภารกิจสำเร็จ ยังไม่รวมโบนัสจากเวลาหรือคุณภาพงาน
                </p>
            </motion.div>

            {/* Section 2: Coin Rewards */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-yellow-50/50 backdrop-blur-sm rounded-3xl border border-yellow-100"
            >
                <h4 className="text-sm font-bold text-yellow-800 mb-4 flex items-center">
                    <Coins className="w-5 h-5 mr-2" /> Global Coin Rewards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <ConfigSlider 
                            label="Per Task" 
                            value={localConfig.GLOBAL_MULTIPLIERS?.COIN_TASK || 10} 
                            min={0} max={100} step={5} unit="JP"
                            color="yellow"
                            onChange={(v: number) => handleChange('GLOBAL_MULTIPLIERS', 'COIN_TASK', v)}
                        />
                        <p className="text-[10px] text-yellow-600/70 mt-1 ml-1">
                            เหรียญที่ได้ทันทีเมื่อจบงาน 1 งาน
                        </p>
                    </div>
                    <div>
                        <ConfigSlider 
                            label="Early Bonus" 
                            value={localConfig.GLOBAL_MULTIPLIERS?.COIN_BONUS_EARLY || 20} 
                            min={0} max={100} step={5} unit="JP"
                            color="yellow"
                            onChange={(v: number) => handleChange('GLOBAL_MULTIPLIERS', 'COIN_BONUS_EARLY', v)}
                        />
                        <p className="text-[10px] text-yellow-600/70 mt-1 ml-1">
                            โบนัสพิเศษเมื่อส่งงานก่อนกำหนด (Early Submission)
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Section 3: KPI Rewards */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-green-50/50 backdrop-blur-sm rounded-3xl border border-green-100"
            >
                <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-bold text-green-800 flex items-center">
                        <Award className="w-5 h-5 mr-2" /> KPI Rewards (รางวัลประเมินผล)
                    </h4>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Monthly / Quarterly</span>
                </div>
                
                <div className="space-y-3">
                    {/* Grade A */}
                    <RuleEditor 
                        label="Grade A (Excellent)" 
                        ruleKey="A" 
                        rule={localConfig.KPI_REWARDS?.A || { xp: 0, hp: 0, coins: 0 }} 
                        onChange={handleKPIRuleChange}
                    />
                    <p className="text-[10px] text-green-600/60 pl-2 border-l-2 border-green-200 ml-1">
                        รางวัลสำหรับพนักงานที่มีผลงานยอดเยี่ยม (เกรด A) จะได้รับเมื่อสิ้นรอบการประเมิน
                    </p>

                    {/* Grade B */}
                    <div className="mt-4">
                        <RuleEditor 
                            label="Grade B (Good)" 
                            ruleKey="B" 
                            rule={localConfig.KPI_REWARDS?.B || { xp: 0, hp: 0, coins: 0 }} 
                            onChange={handleKPIRuleChange}
                        />
                         <p className="text-[10px] text-green-600/60 pl-2 border-l-2 border-green-200 ml-1 mt-1">
                            รางวัลมาตรฐานสำหรับพนักงานที่มีผลงานดี (เกรด B)
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default QuestsTuner;
