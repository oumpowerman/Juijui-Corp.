import React from 'react';
import { Task, Channel, MasterOption } from '../../../types';
import StockSidePanel from '../../StockSidePanel';

interface CalendarStockDrawerProps {
  isStockOpen: boolean;
  onClose: () => void;
  isMobileLandscape: boolean;
  tasks: Task[];
  channels: Channel[];
  masterOptions?: MasterOption[];
  onSelectTask: (task: Task) => void;
  onMoveTask: (task: Task) => void;
  isMobileOverlay?: boolean;
}

export const CalendarStockDrawer: React.FC<CalendarStockDrawerProps> = ({
  isStockOpen,
  onClose,
  isMobileLandscape,
  tasks,
  channels,
  masterOptions = [],
  onSelectTask,
  onMoveTask,
  isMobileOverlay = false,
}) => {
  if (isMobileLandscape) return null;

  if (isMobileOverlay) {
    if (!isStockOpen) return null;
    return (
      <div 
        className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      >
        <div 
          className="
            absolute right-2 top-2 bottom-2 w-80
            rounded-3xl
            border border-white/50
            bg-white/80
            backdrop-blur-2xl
            shadow-[0_20px_60px_rgba(0,0,0,0.18)]
            animate-in slide-in-from-right duration-300
            overflow-hidden
          "
          onClick={e => e.stopPropagation()}
        >
          <StockSidePanel 
            isOpen={isStockOpen}
            onClose={onClose}
            tasks={tasks}
            channels={channels}
            masterOptions={masterOptions}
            onEditTask={onSelectTask}
            onMoveTask={onMoveTask}
          />
        </div>
      </div>
    );
  }

  // Desktop Sticky Panel
  return (
    <div 
      className={`
        shrink-0 hidden lg:block sticky top-24 self-start h-[calc(100vh-120px)]
        transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)]
        overflow-hidden
        rounded-3xl
        border border-white/50
        bg-white/40
        backdrop-blur-xl
        shadow-[0_10px_40px_rgba(0,0,0,0.08)]
        ${isStockOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10'}
      `}
    >
      <div className="w-80 h-full rounded-3xl overflow-hidden">
        <StockSidePanel 
          isOpen={isStockOpen}
          onClose={onClose}
          tasks={tasks}
          channels={channels}
          masterOptions={masterOptions}
          onEditTask={onSelectTask}
          onMoveTask={onMoveTask}
        />
      </div>
    </div>
  );
};

export default React.memo(CalendarStockDrawer);
