import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderHeart, Layers, AlignLeft, Folder, Image, ArrowLeftRight, Link2 } from 'lucide-react';
import { StockDisplayMode, StockGroupingMode, springTransition } from '../types';

interface StackHeaderControlsProps {
  activeCount: number;
  totalChannelsCount: number;
  viewGroupingMode: StockGroupingMode;
  displayMode: StockDisplayMode;
  onChangeGroupingMode: (mode: StockGroupingMode) => void;
  onChangeDisplayMode: (mode: StockDisplayMode) => void;
  isCompact?: boolean;
  onExpand?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onShareLink?: () => void;
}

export const StackHeaderControls: React.FC<StackHeaderControlsProps> = ({
  activeCount,
  totalChannelsCount,
  viewGroupingMode,
  displayMode,
  onChangeGroupingMode,
  onChangeDisplayMode,
  isCompact = false,
  onExpand,
  onMouseEnter,
  onMouseLeave,
  onShareLink,
}) => {
  return (
    <motion.div 
      layout
      transition={springTransition}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex items-center gap-0 shrink-0 group relative select-none h-[86px] min-h-[86px]"
    >
      {/* Icon with Ambient Shimmer & Activity Pulse & Compact Badge */}
      <motion.div 
        whileHover={{ 
          rotate: isCompact ? [0, -8, 10, -4, 0] : [0, -10, 15, -5, 0],
          scale: 1.08,
          transition: { duration: 0.4 }
        }}
        whileTap={{ scale: 0.95 }}
        onClick={isCompact ? onExpand : undefined}
        title={
          isCompact 
            ? (activeCount > 0 
                ? `แฟ้มแยกช่อง: เลือกอยู่ ${activeCount} ช่อง (คลิกหรือชี้เพื่อเปิดการตั้งค่า)` 
                : `แฟ้มแยกช่อง: ทั้งหมด ${totalChannelsCount} ช่อง (คลิกหรือชี้เพื่อเปิดการตั้งค่า)`) 
            : undefined
        }
        className={`relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-300/50 text-white shrink-0 ${
          isCompact ? 'cursor-pointer hover:shadow-indigo-400/60' : ''
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-shimmer rounded-2xl pointer-events-none" />
        <FolderHeart className="w-5 h-5 relative z-10" />
        
        {/* Pulse Dot */}
        {activeCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2 z-10 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}

        {/* Selected / Total Count Badge (Always visible on the icon) */}
        <motion.span
          key={activeCount > 0 ? `active-${activeCount}` : `total-${totalChannelsCount}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springTransition}
          className={`absolute -bottom-1 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold border-2 border-white shadow-md z-20 ${
            activeCount > 0
              ? 'bg-purple-600 text-white'
              : 'bg-slate-700 text-white'
          }`}
        >
          {activeCount > 0 ? activeCount : totalChannelsCount}
        </motion.span>
      </motion.div>
      
      {/* Expanded Controls & Information (Balanced 2-Row Inline Layout) */}
      <AnimatePresence initial={false}>
        {!isCompact && (
          <motion.div
            key="header-controls-expanded-body"
            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
            animate={{ opacity: 1, width: 216, marginLeft: 14 }}
            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
            transition={springTransition}
            className="flex flex-col justify-center overflow-hidden whitespace-nowrap h-full gap-1.5"
          >
            {/* Row 1: Title and Share Link */}
            <div className="flex items-center justify-between pr-0.5">
              <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>แฟ้มแยกช่อง</span>
                {activeCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.7)] animate-pulse" />
                )}
              </h4>

              {/* Share Link Button */}
              {onShareLink && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareLink();
                  }}
                  title="คัดลอกลิงก์มุมมองนี้เพื่อแชร์ให้คนในทีม (Copy Filter Link)"
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 shadow-2xs transition-colors cursor-pointer select-none"
                >
                  <Link2 className="w-3 h-3 text-indigo-600" />
                  <span>แชร์ลิงก์</span>
                </motion.button>
              )}
            </div>

            {/* Row 2: Mode Switchers (Balanced Horizontal Segmented Pills) */}
            <div className="flex items-center gap-1.5">
              {/* Button 1: Grouping Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChangeGroupingMode(viewGroupingMode === 'grouped' ? 'flat' : 'grouped')}
                title={viewGroupingMode === 'grouped' ? 'คลิกเพื่อสลับเป็น: ทั้งหมด (ไม่จัดกลุ่ม)' : 'คลิกเพื่อสลับเป็น: จัดกลุ่มตามแคบิเน็ต'}
                className={`h-[24px] px-2.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs select-none group/btn ${
                  viewGroupingMode === 'grouped'
                    ? 'bg-indigo-50/90 text-indigo-700 border-indigo-200/90 hover:bg-indigo-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <span className="flex items-center shrink-0">
                  {viewGroupingMode === 'grouped' ? (
                    <Layers className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <AlignLeft className="w-3 h-3 text-slate-500" />
                  )}
                </span>
                
                <span className="leading-none whitespace-nowrap">
                  {viewGroupingMode === 'grouped' ? 'จัดกลุ่ม' : 'ทั้งหมด'}
                </span>

                <ArrowLeftRight className="w-2.5 h-2.5 opacity-40 group-hover/btn:opacity-90 group-hover/btn:rotate-180 transition-all duration-300 shrink-0 ml-0.5" />
              </motion.button>

              {/* Button 2: Display Style Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChangeDisplayMode(displayMode === 'classic' ? 'logo' : 'classic')}
                title={displayMode === 'classic' ? 'คลิกเพื่อสลับเป็น: โชว์โลโก้' : 'คลิกเพื่อสลับเป็น: แบบแฟ้ม'}
                className={`h-[24px] px-2.5 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs select-none group/btn ${
                  displayMode === 'classic'
                    ? 'bg-indigo-50/90 text-indigo-700 border-indigo-200/90 hover:bg-indigo-100'
                    : 'bg-purple-50/90 text-purple-700 border-purple-200/90 hover:bg-purple-100'
                }`}
              >
                <span className="flex items-center shrink-0">
                  {displayMode === 'classic' ? (
                    <Folder className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <Image className="w-3 h-3 text-purple-600" />
                  )}
                </span>
                
                <span className="leading-none whitespace-nowrap">
                  {displayMode === 'classic' ? 'แบบแฟ้ม' : 'โลโก้'}
                </span>

                <ArrowLeftRight className="w-2.5 h-2.5 opacity-40 group-hover/btn:opacity-90 group-hover/btn:rotate-180 transition-all duration-300 shrink-0 ml-0.5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
