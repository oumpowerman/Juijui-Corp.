
import React, { useState, useEffect } from 'react';
import { MasterOption } from '../../../../types';
import { Coins, Save, AlertCircle, Loader2 } from 'lucide-react';

interface PayrollRulesViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
}

const REQUIRED_CONFIGS = [
    { key: 'LATE_PENALTY', label: 'หักมาสาย (บาท/ครั้ง)', default: '50', desc: 'หักเมื่อเข้างานหลัง 10:00 น.' },
    { key: 'ABSENT_PENALTY', label: 'หักขาดงาน (บาท/วัน)', default: '500', desc: 'หักเมื่อไม่มาทำงานโดยไม่ลา' },
    { key: 'MISSED_DUTY_PENALTY', label: 'หักเบี้ยวเวร (บาท/ครั้ง)', default: '100', desc: 'หักเมื่อไม่ส่งงานเวรทำความสะอาด' },
];

const PayrollRulesView: React.FC<PayrollRulesViewProps> = ({ masterOptions, onUpdate, onAdd }) => {
    const [values, setValues] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Sync DB values to Local State
    useEffect(() => {
        const initialValues: Record<string, string> = {};
        REQUIRED_CONFIGS.forEach(conf => {
            const found = masterOptions.find(o => o.type === 'PAYROLL_CONFIG' && o.key === conf.key);
            initialValues[conf.key] = found ? found.label : ''; // If empty string, it means not set yet
        });
        setValues(initialValues);
    }, [masterOptions]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            for (const conf of REQUIRED_CONFIGS) {
                const val = values[conf.key] || '0';
                const found = masterOptions.find(o => o.type === 'PAYROLL_CONFIG' && o.key === conf.key);

                if (found) {
                    // Update existing
                    if (found.label !== val) {
                        await onUpdate({ ...found, label: val });
                    }
                } else {
                    // Create new
                    await onAdd({
                        type: 'PAYROLL_CONFIG',
                        key: conf.key,
                        label: val,
                        color: 'bg-white', // Not used but required
                        sortOrder: 0,
                        isActive: true
                    });
                }
            }
            alert('บันทึกค่าปรับเรียบร้อย ✅');
        } catch (error) {
            console.error(error);
            alert('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center text-lg">
                            <Coins className="w-6 h-6 mr-2 text-yellow-500" />
                            ตั้งค่าการหักเงิน (Payroll Penalties)
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">กำหนดอัตราค่าปรับเมื่อพนักงานทำผิดกฎระเบียบ</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {REQUIRED_CONFIGS.map((conf) => (
                        <div key={conf.key} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-1">
                                {conf.label}
                            </label>
                            <div className="relative mb-2">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">฿</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="w-full pl-8 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-bold text-lg text-gray-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                                    placeholder={conf.default}
                                    value={values[conf.key] ?? ''}
                                    onChange={(e) => setValues(prev => ({ ...prev, [conf.key]: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-start gap-1.5 text-[10px] text-gray-500 bg-white/50 p-2 rounded-lg border border-gray-200/50">
                                <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                                {conf.desc}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-end pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Save className="w-5 h-5 mr-2" />}
                        บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
            
            <div className="text-center text-xs text-gray-400">
                * ค่าปรับเหล่านี้จะถูกนำไปคำนวณอัตโนมัติในหน้า "Payroll Editor" เมื่อกดสร้างรอบบัญชีใหม่
            </div>
        </div>
    );
};

export default PayrollRulesView;
