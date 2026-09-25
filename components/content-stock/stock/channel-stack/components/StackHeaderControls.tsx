import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderHeart, Layers, AlignLeft, Folder, Image, ArrowLeftRight } from 'lucide-react';
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
}) => {
  return (
    <motion.div 
      layout
      transition={springTransition}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex items-center gap-3.5 shrink-0 group relative select-none h-[86px] min-h-[86px]"
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

        {/* Selected Count Badge in Compact Mode */}
        <AnimatePresence>
          {isCompact && (
            <motion.span
              key="compact-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={springTransition}
              className={`absolute -bottom-1 -right-1.5 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black border-2 border-white shadow-md z-20 ${
                activeCount > 0
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              {activeCount > 0 ? activeCount : totalChannelsCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Expanded Controls & Information */}
      <AnimatePresence initial={false}>
        {!isCompact && (
          <motion.div
            key="header-controls-expanded-body"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col justify-center overflow-hidden whitespace-nowrap h-full"
          >
            {/* Activity Indicator Label */}
            <div className="flex items-center gap-1.5 h-3.5">
              <motion.span 
                animate={{ 
                  scale: activeCount > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{ repeat: activeCount > 0 ? Infinity : 0, duration: 2, ease: "easeInOut" }}
                className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.7)]' : 'bg-indigo-400/60'}`} 
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 leading-none">
                {activeCount > 0 ? 'MULTI FILTER ACTIVE' : 'ALL RACKS OFFLINE'}
              </span>
            </div>
            
            {/* Title & Selected Counter Badge */}
            <h4 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2 mt-0.5 h-5">
              <span>แฟ้มแยกช่อง</span>
              
              <AnimatePresence mode="wait">
                <motion.span 
                  key={activeCount}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center justify-center bg-indigo-50 px-2 py-0.5 rounded-full text-[10px] text-indigo-600 font-semibold border border-indigo-100/60 shadow-xs"
                >
                  {activeCount > 0 ? `เลือกอยู่ ${activeCount} ช่อง` : `ทั้งหมด (${totalChannelsCount})`}
                </motion.span>
              </AnimatePresence>
            </h4>

            {/* Mode Switchers: Vertical 1-Click Toggles */}
            <div className="flex flex-col gap-1 mt-1 w-fit">
              {/* Button 1: Grouping Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChangeGroupingMode(viewGroupingMode === 'grouped' ? 'flat' : 'grouped')}
                title={viewGroupingMode === 'grouped' ? 'คลิกเพื่อสลับเป็น: ทั้งหมด' : 'คลิกเพื่อสลับเป็น: จัดกลุ่ม'}
                className={`h-[22px] min-w-[85px] px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 border shadow-xs select-none group/btn ${
                  viewGroupingMode === 'grouped'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100 hover:border-indigo-300'
                    : 'bg-slate-100/90 text-slate-600 border-slate-200 hover:bg-slate-200/80 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    {viewGroupingMode === 'grouped' ? (
                      <motion.span
                        key="icon-grouped"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center shrink-0"
                      >
                        <Layers className="w-3 h-3 text-indigo-600" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon-flat"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center shrink-0"
                      >
                        <AlignLeft className="w-3 h-3 text-slate-600" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={viewGroupingMode}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="leading-none whitespace-nowrap"
                    >
                      {viewGroupingMode === 'grouped' ? 'จัดกลุ่ม' : 'ทั้งหมด'}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <ArrowLeftRight className="w-2.5 h-2.5 opacity-40 group-hover/btn:opacity-90 group-hover/btn:rotate-180 transition-all duration-300 shrink-0" />
              </motion.button>

              {/* Button 2: Display Style Toggle */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChangeDisplayMode(displayMode === 'classic' ? 'logo' : 'classic')}
                title={displayMode === 'classic' ? 'คลิกเพื่อสลับเป็น: โชว์โลโก้' : 'คลิกเพื่อสลับเป็น: แบบแฟ้ม'}
                className={`h-[22px] min-w-[85px] px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center justify-between gap-1.5 border shadow-xs select-none group/btn ${
                  displayMode === 'classic'
                    ? 'bg-amber-50/80 text-amber-800 border-amber-200/80 hover:bg-amber-100 hover:border-amber-300'
                    : 'bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    {displayMode === 'classic' ? (
                      <motion.span
                        key="icon-classic"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center shrink-0"
                      >
                        <Folder className="w-3 h-3 text-amber-600" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="icon-logo"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="flex items-center shrink-0"
                      >
                        <Image className="w-3 h-3 text-purple-600" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={displayMode}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="leading-none whitespace-nowrap"
                    >
                      {displayMode === 'classic' ? 'แบบแฟ้ม' : 'โชว์โลโก้'}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <ArrowLeftRight className="w-2.5 h-2.5 opacity-40 group-hover/btn:opacity-90 group-hover/btn:rotate-180 transition-all duration-300 shrink-0" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
