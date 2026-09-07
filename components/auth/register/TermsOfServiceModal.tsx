import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, X } from 'lucide-react';

export interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  policyData: { title: string; content: string } | null;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  policyData,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const difference = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (difference <= 15) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-slate-800 text-base">
                {policyData?.title || 'ข้อตกลงและเงื่อนไขการปฏิบัติงาน'}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                กรุณาเลื่อนลงไปด้านล่างสุดเพื่อเปิดใช้งานปุ่มยินยอม
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div
          onScroll={handleScroll}
          className="p-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex-1 text-sm text-slate-600 leading-relaxed font-sans space-y-4 text-left"
        >
          {policyData?.content ? (
            policyData.content.split('\n').map((line, idx) => {
              if (line.startsWith('###')) {
                return (
                  <h4 key={idx} className="font-black text-slate-850 text-base pt-3">
                    {line.replace('###', '').trim()}
                  </h4>
                );
              }
              if (line.startsWith('#')) {
                return (
                  <h3 key={idx} className="font-black text-slate-900 text-lg border-b pb-2">
                    {line.replace('#', '').trim()}
                  </h3>
                );
              }
              if (line.startsWith('-')) {
                return (
                  <li key={idx} className="ml-4 list-disc text-slate-600">
                    {line.replace('-', '').trim()}
                  </li>
                );
              }
              return <p key={idx}>{line}</p>;
            })
          ) : (
            <div className="text-center py-12 text-slate-400 italic">
              กำลังโหลดข้อมูลข้อตกลง...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs text-slate-400 flex-1 text-center sm:text-left">
            {!hasScrolledToBottom ? (
              <span className="animate-pulse">⚠️ กรุณาเลื่อนลงเพื่ออ่านรายละเอียดให้ครบถ้วน</span>
            ) : (
              <span className="text-green-600 font-bold">✓ อ่านรายละเอียดครบถ้วนแล้ว</span>
            )}
          </div>
          <button
            type="button"
            disabled={!hasScrolledToBottom}
            onClick={handleAccept}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white text-sm transition-all shadow-md
              ${hasScrolledToBottom 
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 cursor-pointer' 
                : 'bg-slate-300 shadow-none cursor-not-allowed'
              }
            `}
          >
            ฉันเข้าใจและยอมรับข้อตกลง
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TermsOfServiceModal;
