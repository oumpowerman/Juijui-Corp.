import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';

interface StockStorageBadgeProps {
    driveLabel?: string;
    localPath?: string;
}

export const StockStorageBadge: React.FC<StockStorageBadgeProps> = ({
    driveLabel,
    localPath
}) => {
    const [tooltipCoords, setTooltipCoords] = React.useState({ top: 0, left: 0 });
    const [isTooltipHovered, setIsTooltipHovered] = React.useState(false);
    const badgeRef = React.useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (badgeRef.current) {
            const rect = badgeRef.current.getBoundingClientRect();
            setTooltipCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX + (rect.width / 2)
            });
            setIsTooltipHovered(true);
        }
    };

    const handleMouseLeave = () => {
        setIsTooltipHovered(false);
    };

    if (!driveLabel || !localPath) return null;

    return (
        <div 
            ref={badgeRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
        >
            <motion.div 
                whileHover={{ scale: 1.05 }}
                className="text-[9px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/50 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-help transition-all duration-300 shadow-sm"
            >
                <HardDrive className="w-2.5 h-2.5 text-teal-600" />
                <span>{driveLabel}</span>
            </motion.div>
            
            {/* React Portal Hover Tooltip */}
            {isTooltipHovered && createPortal(
                <div 
                    style={{ 
                        position: 'absolute', 
                        top: `${tooltipCoords.top}px`, 
                        left: `${tooltipCoords.left}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 9999 
                    }}
                    className="pointer-events-none mb-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div 
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="bg-white/95 backdrop-blur-xl text-teal-950 text-[10px] font-bold px-3 py-2.5 rounded-2xl shadow-xl border border-teal-100 flex flex-col gap-1.5 min-w-[220px] max-w-[340px]"
                    >
                        <div className="text-[8px] text-teal-600 uppercase tracking-widest mb-0.5 opacity-80 flex items-center gap-1">
                            <HardDrive className="w-2.5 h-2.5 text-teal-500 animate-pulse" />
                            <span>ที่อยู่ไฟล์ในเครื่อง (Local Path) 🖥️</span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-650 bg-slate-50 border border-slate-100 p-2 rounded-xl break-all select-all leading-normal">
                            {localPath}
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[6px] border-transparent border-t-white" />
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};
