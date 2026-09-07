import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';

export interface ForgotConfirmModalProps {
  email: string;
  isLoading: boolean;
  onSendReset: () => void;
  onCancel: () => void;
}

export const ForgotConfirmModal: React.FC<ForgotConfirmModalProps> = ({
  email,
  isLoading,
  onSendReset,
  onCancel,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-amber-50/85 border-2 border-amber-100 p-6 md:p-8 rounded-[2rem] text-center"
    >
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
        <AlertCircle className="w-8 h-8 text-amber-600" />
      </div>
      <h4 className="text-xl font-black text-slate-800 mb-2">
        ตรวจสอบอีเมลให้ชัวร์ก่อนนะครับ 🔍
      </h4>
      <p className="text-slate-500 text-sm font-medium mb-4 leading-relaxed">
        ระบบกู้คืนรหัสผ่าน{' '}
        <span className="text-red-500 font-extrabold">จะไม่มีการแจ้งเตือนใด ๆ</span>{' '}
        หากระบุอีเมลไม่ตรงกับในฐานข้อมูล (เพื่อความปลอดภัยทางข้อมูล) กรุณาสะกดทีละตัวอักษรให้ถูกต้อง
      </p>

      <div className="bg-white border border-amber-200/60 rounded-2xl p-4 mb-6 shadow-sm">
        <span className="text-xs font-bold text-slate-400 block mb-1">
          อีเมลที่คุณระบุคือ:
        </span>
        <span className="text-md font-black text-indigo-600 break-all select-all block py-1 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          {email}
        </span>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={onSendReset}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-xl shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังส่งอีเมลกู้คืน...</span>
            </>
          ) : (
            <span>ใช่, อีเมลนี้สะกดถูกต้องแน่นอน 👍</span>
          )}
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={onCancel}
          className="w-full py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-sm border border-slate-200 transition-all outline-none"
        >
          แก้ไขสะกดคำ / เปลี่ยนอีเมล
        </button>
      </div>
    </motion.div>
  );
};

export default ForgotConfirmModal;
