import React, { useState } from 'react';
import { Sparkles, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '../../../../../types';
import { useToast } from '../../../../../context/ToastContext';
import { useGlobalDialog } from '../../../../../context/GlobalDialogContext';

interface MemberHpAdjustDrawerProps {
    user: User;
    onClose: () => void;
    onSaveAdjustment: (user: User, amount: number, reason: string) => Promise<boolean>;
}

export const MemberHpAdjustDrawer: React.FC<MemberHpAdjustDrawerProps> = ({
    user,
    onClose,
    onSaveAdjustment
}) => {
    const currentHp = user.hp ?? 100;
    const maxHp = user.maxHp ?? 100;

    const [adjustHpAmount, setAdjustHpAmount] = useState<number>(10);
    const [adjustReason, setAdjustReason] = useState<string>('');
    const [isSavingHp, setIsSavingHp] = useState<boolean>(false);
    const { showAlert } = useGlobalDialog();

    const handleConfirm = async () => {
        if (adjustHpAmount === 0) {
            showAlert('กรุณาระบุจำนวน HP ที่ต้องการปรับ (+ หรือ -)', 'แจ้งเตือน');
            return;
        }

        const reasonText = adjustReason.trim() || 'GM ปรับแก้สถานะ HP ผ่านระบบลงเวลา';
        setIsSavingHp(true);
        try {
            const success = await onSaveAdjustment(user, adjustHpAmount, reasonText);
            if (success) {
                onClose();
            }
        } finally {
            setIsSavingHp(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
                height: { duration: 0.28, ease: [0.33, 1, 0.68, 1] },
                opacity: { duration: 0.2 }
            }}
            className="overflow-hidden"
        >
            <div className="pt-3 border-t border-purple-100/80">
                <div className="bg-purple-50/80 rounded-2xl p-3.5 sm:p-4 border border-purple-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-black text-purple-900">
                                ปรับค่า HP ของ {user.name}
                            </span>
                        </div>
                        <span className="text-[11px] font-bold text-purple-700">
                            HP ปัจจุบัน: {currentHp} / {maxHp}
                        </span>
                    </div>

                    {/* HP Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button 
                            type="button"
                            onClick={() => setAdjustHpAmount(10)} 
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                adjustHpAmount === 10 ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                            }`}
                        >
                            +10
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAdjustHpAmount(25)} 
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                adjustHpAmount === 25 ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                            }`}
                        >
                            +25
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAdjustHpAmount(50)} 
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                adjustHpAmount === 50 ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-100'
                            }`}
                        >
                            +50
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAdjustHpAmount(-10)} 
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                adjustHpAmount === -10 ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                        >
                            -10
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAdjustHpAmount(-25)} 
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                adjustHpAmount === -25 ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                        >
                            -25
                        </button>
                        <button 
                            type="button"
                            onClick={() => setAdjustHpAmount(Math.max(0, maxHp - currentHp))} 
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors ml-auto cursor-pointer"
                        >
                            เติมเต็ม 100%
                        </button>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-1">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                จำนวน HP (+/-)
                            </label>
                            <input 
                                type="number"
                                value={adjustHpAmount}
                                onChange={(e) => setAdjustHpAmount(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-black focus:ring-2 focus:ring-purple-500/20 outline-none"
                                placeholder="เช่น 20 หรือ -10"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 mb-1 block">
                                เหตุผลในการปรับ (แจ้งเตือน & บันทึก Log)
                            </label>
                            <input 
                                type="text"
                                value={adjustReason}
                                onChange={(e) => setAdjustReason(e.target.value)}
                                placeholder="เช่น ชดเชยระบบ, แก้ไขเวลาเข้างาน..."
                                className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isSavingHp}
                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                            {isSavingHp ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Check className="w-3.5 h-3.5" />
                            )}
                            <span>ยืนยันปรับค่า HP</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
