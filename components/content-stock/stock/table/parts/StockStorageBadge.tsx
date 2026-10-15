import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HardDrive, Check, Copy } from 'lucide-react';
import { useStorage } from '../../../../../context/StorageContext';

interface StockStorageBadgeProps {
    driveLabel?: string;
    localPath?: string;
    storageHubId?: string;
}

export const StockStorageBadge: React.FC<StockStorageBadgeProps> = ({
    driveLabel,
    localPath,
    storageHubId
}) => {
    const { storageConfigs } = useStorage();
    const [tooltipCoords, setTooltipCoords] = React.useState({ top: 0, left: 0 });
    const [isTooltipHovered, setIsTooltipHovered] = React.useState(false);
    const [isCopied, setIsCopied] = React.useState(false);
    const copyTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const badgeRef = React.useRef<HTMLDivElement>(null);

    const hub = storageHubId 
        ? storageConfigs.find(c => c.id === storageHubId)
        : storageConfigs.find(c => c.label === driveLabel);
    const displayLabel = hub ? hub.label : driveLabel;
    const fullPath = hub ? `${hub.currentLetter}${localPath}` : (localPath || '');

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

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!fullPath) return;

        if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(fullPath);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = fullPath;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }

        setIsCopied(true);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => {
            setIsCopied(false);
        }, 1500);
    };

    React.useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        };
    }, []);

    if (!localPath || (!displayLabel && !storageHubId)) return null;

    return (
        <div 
            ref={badgeRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCopy}
            className="inline-flex"
        >
            <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors duration-200 shadow-sm select-none ${
                    isCopied
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-300 ring-2 ring-emerald-400/20'
                        : 'text-teal-700 bg-teal-50 hover:bg-teal-100/90 border border-teal-200/60 hover:border-teal-300'
                }`}
                title={isCopied ? 'คัดลอกเรียบร้อยแล้ว!' : 'คลิกเพื่อคัดลอก Local Path'}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isCopied ? (
                        <motion.span 
                            key="copied"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                        >
                            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[2.5]" />
                            <span>คัดลอกแล้ว!</span>
                        </motion.span>
                    ) : (
                        <motion.span 
                            key="idle"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                        >
                            <HardDrive className="w-2.5 h-2.5 text-teal-600" />
                            <span>{displayLabel || 'Storage'}</span>
                        </motion.span>
                    )}
                </AnimatePresence>
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
                        <div className="text-[8px] text-teal-600 uppercase tracking-widest mb-0.5 opacity-80 flex items-center justify-between">
                            <span className="flex items-center gap-1 font-semibold">
                                <HardDrive className="w-2.5 h-2.5 text-teal-500 animate-pulse" />
                                ที่อยู่ไฟล์ในเครื่อง (Local Path) 🖥️
                            </span>
                        </div>
                        <div className="font-mono text-[9px] text-slate-700 bg-slate-50 border border-slate-100 p-2 rounded-xl break-all select-all leading-normal">
                            {fullPath}
                        </div>
                        <div className="flex items-center gap-1 text-[8px] text-teal-600/90 font-medium pt-0.5">
                            <Copy className="w-2.5 h-2.5 text-teal-500" />
                            <span>คลิกป้ายเพื่อคัดลอก Path 📋</span>
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
