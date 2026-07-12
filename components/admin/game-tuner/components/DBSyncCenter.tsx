import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { DEFAULT_GAME_CONFIG } from '../../../../lib/gameLogic';
import { useToast } from '../../../../context/ToastContext';
import { 
    ShieldCheck, ShieldAlert, AlertTriangle, Check, 
    ChevronDown, ChevronUp, Wrench, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DBSyncCenterProps {
    onSyncSuccess: () => Promise<void>;
}

export const DBSyncCenter: React.FC<DBSyncCenterProps> = ({ onSyncSuccess }) => {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [showDBCenter, setShowDBCenter] = useState(false);
    
    const [verification, setVerification] = useState<{
        status: 'idle' | 'checking' | 'synced' | 'mismatch' | 'error';
        missingKeys: string[];
        partialKeys: { key: string; missingSubKeys: string[] }[];
        totalDbRows: number;
        checkedAt: string | null;
    }>({
        status: 'idle',
        missingKeys: [],
        partialKeys: [],
        totalDbRows: 0,
        checkedAt: null
    });

    // Verification Logic
    const runVerification = useCallback(async () => {
        setVerification(prev => ({ ...prev, status: 'checking' }));
        try {
            const { data, error } = await supabase
                .from('game_configs')
                .select('key, value');

            if (error) throw error;

            const dbConfigMap: Record<string, any> = {};
            if (data) {
                data.forEach((row: any) => {
                    dbConfigMap[row.key] = row.value;
                });
            }

            const missingKeys: string[] = [];
            const partialKeys: { key: string; missingSubKeys: string[] }[] = [];

            // Compare DEFAULT_GAME_CONFIG to database keys
            for (const [key, defaultValue] of Object.entries(DEFAULT_GAME_CONFIG)) {
                if (!(key in dbConfigMap)) {
                    missingKeys.push(key);
                } else {
                    const dbValue = dbConfigMap[key];
                    
                    // If it's a plain object, do deep key check
                    if (defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
                        const missingSubKeys: string[] = [];
                        for (const subKey of Object.keys(defaultValue)) {
                            if (dbValue === null || dbValue === undefined || !(subKey in dbValue)) {
                                missingSubKeys.push(subKey);
                            }
                        }
                        if (missingSubKeys.length > 0) {
                            partialKeys.push({ key, missingSubKeys });
                        }
                    }
                }
            }

            const status = (missingKeys.length > 0 || partialKeys.length > 0) ? 'mismatch' : 'synced';

            setVerification({
                status,
                missingKeys,
                partialKeys,
                totalDbRows: data ? data.length : 0,
                checkedAt: new Date().toLocaleTimeString('th-TH')
            });
        } catch (err) {
            console.error("Verification failed:", err);
            setVerification({
                status: 'error',
                missingKeys: [],
                partialKeys: [],
                totalDbRows: 0,
                checkedAt: new Date().toLocaleTimeString('th-TH')
            });
        }
    }, []);

    const handleRepair = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            // Fetch current database configurations to merge
            const { data, error } = await supabase
                .from('game_configs')
                .select('*');

            if (error) throw error;

            const dbConfigMap: Record<string, any> = {};
            if (data) {
                data.forEach((row: any) => {
                    dbConfigMap[row.key] = row.value;
                });
            }

            const promises = [];

            // Iterate and upsert
            for (const [key, defaultValue] of Object.entries(DEFAULT_GAME_CONFIG)) {
                let newValue = defaultValue;

                if (key in dbConfigMap) {
                    const dbValue = dbConfigMap[key];
                    
                    if (
                        defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue) &&
                        dbValue && typeof dbValue === 'object' && !Array.isArray(dbValue)
                    ) {
                        newValue = {
                            ...defaultValue,
                            ...dbValue
                        };
                    } else {
                        newValue = dbValue;
                    }
                }

                promises.push(
                    supabase
                        .from('game_configs')
                        .upsert({
                            key,
                            value: newValue,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'key' })
                );
            }

            await Promise.all(promises);
            
            showToast('ซ่อมแซมและซิงก์โครงสร้าง Database สำเร็จ! 🛠️✨', 'success');
            await onSyncSuccess();
            await runVerification();
        } catch (err) {
            console.error("Repair failed:", err);
            showToast('เกิดข้อผิดพลาดในการซ่อมแซม Database', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Run verification on initial load
    useEffect(() => {
        runVerification();
    }, [runVerification]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                border rounded-3xl p-5 shadow-sm transition-all duration-300 mb-6
                ${verification.status === 'synced' ? 'bg-emerald-50/50 border-emerald-100' : ''}
                ${verification.status === 'mismatch' ? 'bg-amber-50/50 border-amber-200' : ''}
                ${verification.status === 'checking' ? 'bg-slate-50/50 border-slate-100' : ''}
                ${verification.status === 'error' ? 'bg-rose-50/50 border-rose-200' : ''}
            `}
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3.5">
                    <div className={`
                        p-2.5 rounded-2xl flex items-center justify-center shadow-sm
                        ${verification.status === 'synced' ? 'bg-emerald-500 text-white shadow-emerald-500/10' : ''}
                        ${verification.status === 'mismatch' ? 'bg-amber-500 text-white shadow-amber-500/10' : ''}
                        ${verification.status === 'checking' ? 'bg-indigo-500 text-white shadow-indigo-500/10' : ''}
                        ${verification.status === 'error' ? 'bg-rose-500 text-white shadow-rose-500/10' : ''}
                    `}>
                        {verification.status === 'synced' && <ShieldCheck className="w-5 h-5" />}
                        {verification.status === 'mismatch' && <AlertTriangle className="w-5 h-5" />}
                        {verification.status === 'checking' && <RefreshCw className="w-5 h-5 animate-spin" />}
                        {verification.status === 'error' && <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            Database Config Synchronization
                            <span className="text-xs font-mono font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                                {verification.totalDbRows} Rows Active
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {verification.status === 'synced' && 'ฐานข้อมูลกับฝั่ง Client ซิงก์ตรงกันสมบูรณ์แล้ว ทุกคีย์และฟิลด์ทำงานปกติ'}
                            {verification.status === 'mismatch' && 'พบข้อมูลคอนฟิกบางคีย์หรือบางฟิลด์ขาดหายไปใน Database (ระบบใช้ Default Fallback อยู่)'}
                            {verification.status === 'checking' && 'กำลังตรวจสอบโครงสร้างตารางข้อมูลเพื่อหาค่าที่ขาดหาย...'}
                            {verification.status === 'error' && 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาตรวจสอบสิทธิ์'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
                    <button
                        onClick={() => setShowDBCenter(!showDBCenter)}
                        className="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all border border-slate-200/60 bg-white"
                    >
                        {showDBCenter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {showDBCenter ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียด'}
                    </button>

                    <button
                        onClick={runVerification}
                        disabled={verification.status === 'checking'}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200/60 bg-white transition-all"
                        title="ตรวจสอบใหม่อีกครั้ง"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${verification.status === 'checking' ? 'animate-spin' : ''}`} />
                    </button>

                    {verification.status === 'mismatch' && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRepair}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/10 transition-all border border-amber-600/10"
                        >
                            <Wrench className="w-3.5 h-3.5" />
                            ซ่อมแซมและอัปเดต DB
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Expanded Detail Panel */}
            <AnimatePresence>
                {showDBCenter && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100/80 pt-4 mt-4 space-y-4"
                    >
                        {verification.status === 'synced' ? (
                            <div className="p-4 bg-emerald-50/30 border border-emerald-100/50 rounded-2xl flex items-center gap-3">
                                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                    <Check className="w-4 h-4" />
                                </div>
                                <p className="text-xs text-emerald-700">
                                    ยอดเยี่ยม! ข้อมูลในฐานข้อมูล Supabase ครบถ้วนตามมาตรฐานระบบ (เทียบกับ <strong>DEFAULT_GAME_CONFIG</strong> บนระบบ) ไม่มีโครงสร้างตกหล่นใดๆ ทั้งสิ้น
                                </p>
                            </div>
                        ) : verification.status === 'mismatch' ? (
                            <div className="space-y-3">
                                <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                                        <AlertTriangle className="w-4 h-4" />
                                        โครงสร้างที่ขาดหายไปใน Database:
                                    </div>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                        ข้อมูลคอนฟิกที่ตกหล่นจะทำให้ระบบต้องดึงค่า Default Fallback จากไฟล์ <code>gameLogic.ts</code> มาทำงานแทนชั่วคราว คุณสามารถกดปุ่ม <strong>"ซ่อมแซมและอัปเดต DB"</strong> เพื่อทำการย้ายค่าและซิงก์ฟิลด์เหล่านี้ขึ้นระบบอัตโนมัติได้อย่างปลอดภัย โดยไม่มีการเขียนทับค่าส่วนตัวของคุณ!
                                    </p>
                                </div>

                                {/* Mismatch breakdown list */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Missing Keys */}
                                    {verification.missingKeys.length > 0 && (
                                        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2.5">
                                            <h4 className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                                คีย์ที่ไม่มีเลยใน Database ({verification.missingKeys.length})
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {verification.missingKeys.map(key => (
                                                    <span key={key} className="text-[10px] font-mono font-semibold px-2 py-1 bg-rose-50 text-rose-600 border border-rose-100/60 rounded-lg">
                                                        {key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Partial Keys */}
                                    {verification.partialKeys.length > 0 && (
                                        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl space-y-2.5">
                                            <h4 className="text-xs font-black text-amber-600 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                คีย์ที่มีแล้วแต่ฟิลด์บางส่วนตกหล่น ({verification.partialKeys.length})
                                            </h4>
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                                {verification.partialKeys.map(item => (
                                                    <div key={item.key} className="text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                                        <div className="font-bold text-slate-700 font-mono text-[11px]">{item.key}</div>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.missingSubKeys.map(sub => (
                                                                <span key={sub} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-50 text-slate-600 rounded">
                                                                    -{sub}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl text-xs text-rose-700">
                                เกิดข้อผิดพลาดในการตรวจสอบฐานข้อมูล กรุณาลองตรวจสอบการตั้งค่าเชื่อมต่อ Supabase หรือติดต่อผู้ดูแลระบบเพื่อเช็คตาราง <code>game_configs</code>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-3">
                            <div>ตรวจสอบความสอดคล้องโดยเปรียบเทียบกับ <code>DEFAULT_GAME_CONFIG</code> ใน <code>lib/gameLogic.ts</code></div>
                            <div>ตรวจสอบล่าสุดเมื่อ: {verification.checkedAt || 'ยังไม่ได้ระบุ'}</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
