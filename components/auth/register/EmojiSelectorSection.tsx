import React from 'react';
import { EMOJI_POOL } from '../../../constants/emojis';

export interface EmojiSelectorSectionProps {
  selectedEmoji: string;
  setSelectedEmoji: (emoji: string) => void;
  takenEmojis?: string[];
  error?: string;
}

export const EmojiSelectorSection: React.FC<EmojiSelectorSectionProps> = ({
  selectedEmoji,
  setSelectedEmoji,
  takenEmojis = [],
  error,
}) => {
  return (
    <div 
      id="register-selectedEmoji-container" 
      className={`space-y-2 p-4 shadow-inner rounded-2xl border-2 transition-all duration-300 ${
        error ? 'bg-red-50/20 border-red-200/60' : 'bg-indigo-50/20 border-indigo-100/50'
      }`}
    >
      <div className="flex justify-between items-center">
        <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5 uppercase">
          <span>✨ เลือกอิโมจิประจำตัว *</span>
          <span className="text-[10px] font-medium text-indigo-400 font-sans lowercase">
            (ใช้สำหรับวิ่งบนลู่วิ่งแข่ง และสะสมแต้ม)
          </span>
        </label>
        <span className="font-mono text-lg select-none px-3 py-1 bg-white rounded-xl border border-indigo-100 shadow-sm">
          {selectedEmoji || '👾'}
        </span>
      </div>
      
      <div className="grid grid-cols-10 gap-1.5 max-h-[115px] overflow-y-auto p-1.5 bg-white/70 rounded-xl border border-indigo-50/50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {EMOJI_POOL.map((emo) => {
          const isTaken = takenEmojis.includes(emo);
          const isSelected = selectedEmoji === emo;
          return (
            <button
              key={emo}
              type="button"
              disabled={isTaken}
              onClick={() => setSelectedEmoji(emo)}
              className={`text-xl p-1 rounded-lg transition-transform duration-100 ease-out flex items-center justify-center relative select-none
                ${isSelected ? 'bg-indigo-500 scale-110 shadow-md border border-indigo-600 ring-2 ring-indigo-200 z-10 text-white' : 'hover:scale-105 active:scale-95'}
                ${isTaken ? 'opacity-25 bg-slate-100 cursor-not-allowed filter grayscale line-through' : 'cursor-pointer hover:bg-indigo-50'}
              `}
              title={isTaken ? 'เพื่อนในทีมเลือกไปแล้วครับ' : 'คลิกเพื่อเลือกอิโมจินี้'}
            >
              <span className="leading-none">{emo}</span>
              {isTaken && (
                <span className="absolute text-[8px] bottom-0 right-0">🔒</span>
              )}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 mt-1 ml-1 animate-in fade-in duration-300">
          {error}
        </p>
      )}
    </div>
  );
};

export default EmojiSelectorSection;
