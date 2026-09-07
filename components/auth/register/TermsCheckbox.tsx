import React from 'react';

export interface TermsCheckboxProps {
  acceptedTerms: boolean;
  onToggle: () => void;
  onOpenModal: () => void;
  error?: string;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
  acceptedTerms,
  onToggle,
  onOpenModal,
  error,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      onOpenModal();
    } else {
      onToggle();
    }
  };

  return (
    <div className="space-y-1">
      <div 
        id="register-acceptedTerms-container" 
        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all duration-300 ${
          error ? 'bg-red-50/20 border-red-200/60' : 'bg-indigo-50/25 border-indigo-100/50'
        }`}
      >
        <input
          id="terms-checkbox"
          type="checkbox"
          checked={acceptedTerms}
          onChange={() => {
            if (!acceptedTerms) {
              onOpenModal();
            } else {
              onToggle();
            }
          }}
          className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 mt-0.5 cursor-pointer accent-pink-600"
        />
        <label 
          onClick={handleClick}
          className="text-xs text-slate-500 leading-relaxed cursor-pointer select-none"
        >
          ฉันได้เปิดอ่านและเข้าใจ{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="text-pink-600 font-bold hover:underline"
          >
            ข้อตกลงและระเบียบปฏิบัติการทำงาน
          </button>{' '}
          ขององค์กรครบถ้วน และตกลงที่จะปฏิบัติตามนโยบายนี้ทุกประการ *
        </label>
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 mt-1 ml-3 animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
};

export default TermsCheckbox;
