import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Hammer, Pause, Archive } from 'lucide-react';
import { ChannelItem, StockDisplayMode, springTransition } from '../types';
import { getColorClasses, getChannelTooltip } from '../utils/channelStackUtils';

interface ChannelTabItemProps {
  item: ChannelItem;
  index: number;
  isSelected: boolean;
  selectIndex: number;
  displayMode: StockDisplayMode;
  effectiveExpanded: boolean;
  isFirst?: boolean;
  isInsideGroupDrawer?: boolean;
  unassignedCount?: number;
  onToggle: (id: string) => void;
}

export const ChannelTabItem: React.FC<ChannelTabItemProps> = ({
  item,
  index,
  isSelected,
  selectIndex,
  displayMode,
  effectiveExpanded,
  isFirst = false,
  isInsideGroupDrawer = false,
  unassignedCount,
  onToggle,
}) => {
  const { bgClass } = getColorClasses(item.color);
  const hasRank = selectIndex !== -1;
  const itemTooltip = getChannelTooltip(item);

  const smoothTransition = { duration: 0.22, ease: [0.2, 0, 0, 1] } as const;

  return (
    <motion.button
      type="button"
      onClick={() => onToggle(item.id)}
      title={itemTooltip}
      animate={{
        marginLeft: isInsideGroupDrawer
          ? 2
          : isFirst 
            ? 0 
            : effectiveExpanded 
              ? (displayMode === 'logo' ? 6 : 8) 
              : isSelected 
                ? 4 
                : (displayMode === 'logo' ? -10 : -14),
        y: isSelected ? -6 : 0,
        scale: isSelected ? 1.04 : 1,
        zIndex: isSelected ? 50 : 20 - index,
      }}
      whileHover={{ 
        scale: isSelected ? 1.06 : 1.03, 
        y: isInsideGroupDrawer ? -7 : -10, 
        rotate: isSelected ? 0 : index % 2 === 0 ? 1 : -1,
        zIndex: 60,
        transition: { type: 'spring', stiffness: 400, damping: 24 }
      }}
      whileTap={{ scale: 0.97 }}
      transition={smoothTransition}
      className={`
        relative h-11 transition-colors border flex items-center gap-2.5 shrink-0 outline-none select-none cursor-pointer
        ${displayMode === 'logo'
          ? 'rounded-full pr-4 pl-3 text-xs'
          : 'rounded-t-2xl rounded-b-xl pr-4 pl-3.5 text-xs'
        }
        ${item.isAll
          ? isSelected
            ? 'bg-gradient-to-r from-indigo-50/95 via-purple-50/95 to-indigo-50/95 border-indigo-300 text-indigo-900 shadow-lg shadow-indigo-200/50'
            : 'bg-white text-slate-600 border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-indigo-300 hover:text-indigo-700'
          : item.isUnassigned
            ? isSelected
              ? 'bg-amber-50/95 border-amber-300 text-amber-900 shadow-lg shadow-amber-200/50'
              : 'bg-amber-50/60 text-amber-800 border-amber-200/90 shadow-[0_4px_12px_rgba(245,158,11,0.08)] hover:border-amber-300 hover:text-amber-900'
            : isSelected
              ? item.status === 'PLANNING'
                ? 'bg-amber-50/95 border-2 border-dashed border-amber-400 text-amber-950 shadow-lg shadow-amber-200/60'
                : item.status === 'PAUSED'
                  ? 'bg-orange-50/95 border-orange-300 text-orange-950 shadow-lg shadow-orange-200/40 opacity-95'
                  : item.status === 'ARCHIVED'
                    ? 'bg-slate-100/95 border-slate-300 text-slate-700 shadow-md shadow-slate-200/50 grayscale-[0.4]'
                    : 'bg-white/95 border-violet-300 text-violet-700 backdrop-blur-xl shadow-lg shadow-violet-200/50'
              : item.status === 'PLANNING'
                ? 'bg-gradient-to-b from-amber-50/40 via-white to-orange-50/20 text-amber-900 border-2 border-dashed border-amber-300/80 shadow-[0_4px_12px_rgba(245,158,11,0.06)] hover:border-amber-400 hover:text-amber-950'
                : item.status === 'PAUSED'
                  ? 'bg-slate-50/90 text-slate-500 border-slate-200/80 opacity-80 hover:opacity-100 hover:border-orange-300 hover:text-slate-700'
                  : item.status === 'ARCHIVED'
                    ? 'bg-slate-100/70 text-slate-400 border-slate-200/70 grayscale-[0.65] opacity-70 hover:grayscale-0 hover:opacity-100 hover:border-slate-300 hover:text-slate-600'
                    : 'bg-white text-slate-500 border-slate-200/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-slate-300 hover:text-slate-700'
        }
      `}
      style={{
        borderRadius: displayMode === 'logo' ? '24px' : '16px 16px 12px 12px',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Miniature Physical Filing Tab protruding from the folder */}
      {displayMode === 'classic' && (
        <div 
          className={`absolute -top-1.5 left-4 px-2 py-0.25 rounded-t-md text-[7px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center justify-center gap-1 h-3 ${
            item.isUnassigned
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-200'
              : item.status === 'PLANNING'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-amber-200'
                : item.status === 'PAUSED'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-200'
                  : item.status === 'ARCHIVED'
                    ? 'bg-gradient-to-r from-slate-500 to-zinc-600 shadow-slate-200'
                    : item.isAll
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      : `bg-gradient-to-r from-indigo-500 to-indigo-600 ${bgClass}`
          }`}
          style={{ fontSize: '7px', zIndex: 10 }}
        >
          {item.status === 'PLANNING' && <Hammer className="w-2 h-2 shrink-0" />}
          {item.status === 'PAUSED' && <Pause className="w-1.5 h-1.5 shrink-0 fill-current" />}
          {item.status === 'ARCHIVED' && <Archive className="w-2 h-2 shrink-0" />}
          <span>
            {item.isAll
              ? 'ALL'
              : item.isUnassigned
                ? 'UNASSIGNED'
                : hasRank
                  ? `SEL #${selectIndex + 1}`
                  : item.status === 'PLANNING'
                    ? `PLAN • ${item.serial}`
                    : item.status === 'PAUSED'
                      ? `PAUSE • ${item.serial}`
                      : item.status === 'ARCHIVED'
                        ? `ARCH • ${item.serial}`
                        : item.serial}
          </span>
        </div>
      )}

      {/* Tactile Inner Folder Document Line Mockup */}
      {displayMode === 'classic' && (
        <>
          <div className={`absolute top-1 left-4 right-6 h-[1.5px] rounded-full ${
            item.status === 'PLANNING'
              ? 'bg-amber-200/90'
              : item.status === 'PAUSED'
                ? 'bg-orange-200/80'
                : item.status === 'ARCHIVED'
                  ? 'bg-slate-200'
                  : isSelected
                    ? (item.isUnassigned ? 'bg-amber-200' : 'bg-violet-200')
                    : 'bg-slate-100'
          }`} />
          <div className={`absolute top-[7px] left-4 w-10 h-[1px] rounded-full ${
            item.status === 'PLANNING'
              ? 'bg-amber-100'
              : item.status === 'PAUSED'
                ? 'bg-orange-100'
                : item.status === 'ARCHIVED'
                  ? 'bg-slate-100'
                  : isSelected
                    ? (item.isUnassigned ? 'bg-amber-100' : 'bg-violet-100')
                    : 'bg-slate-50'
          }`} />
        </>
      )}

      {/* Indicator or Logo Image */}
      {displayMode === 'logo' ? (
        <div className={`relative w-6 h-6 rounded-full overflow-hidden border bg-slate-50 flex items-center justify-center shrink-0 shadow-sm ${
          item.status === 'PLANNING' 
            ? 'border-dashed border-amber-400 ring-1 ring-amber-300/70' 
            : item.status === 'PAUSED'
              ? 'border-orange-300 opacity-80'
              : item.status === 'ARCHIVED'
                ? 'border-slate-300 grayscale opacity-75'
                : 'border-slate-100/80'
        }`}>
          {item.isAll ? (
            <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
              ALL
            </div>
          ) : item.isUnassigned ? (
            <div className="w-full h-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
              ?
            </div>
          ) : item.logoUrl ? (
            <img 
              src={item.logoUrl} 
              alt={item.name} 
              className={`w-full h-full object-cover ${item.status === 'ARCHIVED' ? 'grayscale' : ''}`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-full h-full ${bgClass} flex items-center justify-center text-white text-[9px] font-bold ${item.status === 'ARCHIVED' ? 'grayscale' : ''}`}>
              {item.name.charAt(0)}
            </div>
          )}
          
          {/* Status Micro Corner Badges in Logo Mode */}
          {item.status === 'PLANNING' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white text-amber-950 flex items-center justify-center shadow-xs">
              <Hammer className="w-1.5 h-1.5 stroke-[2.5]" />
            </span>
          )}
          {item.status === 'PAUSED' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 border border-white shadow-xs" />
          )}
          {item.status === 'ARCHIVED' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-slate-400 border border-white shadow-xs" />
          )}
          {isSelected && !item.status && (
            <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          )}
        </div>
      ) : (
        /* Physical Indicator node with status or color */
        item.status === 'PLANNING' ? (
          <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
            <Hammer className="w-2 h-2" />
          </span>
        ) : item.status === 'PAUSED' ? (
          <span className="w-3.5 h-3.5 rounded-full bg-orange-100 border border-orange-300 text-orange-600 flex items-center justify-center shrink-0 shadow-xs">
            <Pause className="w-1.5 h-1.5 fill-current" />
          </span>
        ) : item.status === 'ARCHIVED' ? (
          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-300 text-slate-500 flex items-center justify-center shrink-0 shadow-xs">
            <Archive className="w-2 h-2" />
          </span>
        ) : (
          <span className={`w-2.5 h-2.5 rounded-full ${item.isUnassigned ? 'bg-amber-500 ring-2 ring-amber-300/60' : bgClass} shadow-[inset_0_1px_2.5px_rgba(255,255,255,0.45)] border border-black/5 shrink-0 relative flex items-center justify-center`}>
            {isSelected && (
              <motion.span 
                layoutId="activeSubTabNode"
                className="absolute w-1 h-1 rounded-full bg-white" 
              />
            )}
          </span>
        )
      )}

      {/* Channel label */}
      <span className="overflow-hidden whitespace-nowrap block text-[11px] font-bold truncate text-left max-w-[130px] min-w-[36px]">
        {item.name}
      </span>

      {/* Operational Status Pill Badge */}
      {item.status === 'PLANNING' && (
        <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-100 text-amber-800 border border-amber-300/80 shrink-0 flex items-center gap-0.5 tracking-tight">
          <Hammer className="w-2 h-2 shrink-0" />
          <span>เตรียมงาน</span>
        </span>
      )}
      {item.status === 'PAUSED' && (
        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-orange-100 text-orange-800 border border-orange-200 shrink-0 flex items-center gap-0.5 tracking-tight">
          <Pause className="w-1.5 h-1.5 fill-current shrink-0" />
          <span>พักช่อง</span>
        </span>
      )}
      {item.status === 'ARCHIVED' && (
        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200 text-slate-600 border border-slate-300 shrink-0 flex items-center gap-0.5 tracking-tight">
          <Archive className="w-2 h-2 shrink-0" />
          <span>ปิดตัว</span>
        </span>
      )}

      {/* Vibrant Orange Noti Badge for Unassigned Channel Count */}
      {item.isUnassigned && unassignedCount !== undefined && unassignedCount > 0 && (
        <span 
          className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-300 ring-2 ring-white ml-0.5 shrink-0 animate-in zoom-in-50 duration-200"
          title={`มี ${unassignedCount} รายการที่ไม่มีช่องทาง`}
        >
          {unassignedCount}
        </span>
      )}
      
      {/* Visual Multi-Selection Index badge or Checkmark */}
      <AnimatePresence>
        {isSelected && (
          <motion.span 
            initial={{ opacity: 0, scale: 0.5, x: 5 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 5 }}
            className={`flex items-center gap-1 text-[10px] ${
              item.isUnassigned 
                ? 'text-amber-600' 
                : item.status === 'PLANNING' 
                  ? 'text-amber-700' 
                  : item.status === 'PAUSED' 
                    ? 'text-orange-700' 
                    : item.status === 'ARCHIVED' 
                      ? 'text-slate-600' 
                      : 'text-violet-500'
            }`}
          >
            {item.isAll ? (
              <Sparkles className="w-3.5 h-3.5 fill-violet-200 text-violet-500" />
            ) : (
              <div className={`flex items-center justify-center w-4 h-4 rounded-full font-semibold text-[9px] border ${
                item.isUnassigned 
                  ? 'bg-amber-100 text-amber-800 border-amber-300' 
                  : item.status === 'PLANNING'
                    ? 'bg-amber-200 text-amber-900 border-amber-400'
                    : item.status === 'PAUSED'
                      ? 'bg-orange-200 text-orange-900 border-orange-300'
                      : item.status === 'ARCHIVED'
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-violet-100 text-violet-700 border-violet-200'
              }`}>
                {selectIndex !== -1 ? selectIndex + 1 : <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            )}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
