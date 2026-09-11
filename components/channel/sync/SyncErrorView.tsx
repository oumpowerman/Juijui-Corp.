import React from 'react';
import { AlertCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';

interface SyncErrorViewProps {
  errorMessage?: string | null;
  onRetry?: () => void;
  onClose: () => void;
}

export const SyncErrorView: React.FC<SyncErrorViewProps> = ({
  errorMessage,
  onRetry,
  onClose,
}) => {
  return (
    <div className="space-y-5">
      <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-5 text-center">
        <div className="inline-flex p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20 mb-2.5">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h4 className="text-base font-bold text-slate-900 tracking-tight">
          การซิงค์ข้อมูลไม่สมบูรณ์
        </h4>
        <p className="text-xs text-rose-700 mt-1.5 max-w-md mx-auto leading-relaxed">
          {errorMessage || 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย หรือเซิร์ฟเวอร์ตอบสนองล่าช้า กรุณาลองใหม่อีกครั้ง'}
        </p>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          คำแนะนำในการแก้ไข:
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 pl-1">
          <li>ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของเครื่องคุณ</li>
          <li>หากมีการเปิด Social Media Platform ที่ลิงก์ไม่ถูกต้อง สามารถแก้ไขได้ใน Master Data</li>
          <li>คุณสามารถกดปุ่ม "ลองใหม่อีกครั้ง" ด้านล่างเพื่อเริ่มการซิงค์ใหม่</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all"
        >
          ปิด
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
        )}
      </div>
    </div>
  );
};
