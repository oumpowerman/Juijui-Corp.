import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Download, 
  PackageSearch, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Wrench
} from 'lucide-react';

interface StockUtilitiesProps {
  onOpenInventory: () => void;
  onImportClick: () => void;
  onDownloadTemplate: () => void;
  isImporting: boolean;
}

const StockUtilities: React.FC<StockUtilitiesProps> = ({
  onOpenInventory,
  onImportClick,
  onDownloadTemplate,
  isImporting
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="flex items-center shrink-0 overflow-hidden"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md rounded-[1.25rem] border border-slate-200 shadow-sm whitespace-nowrap shrink-0"
          >
            {/* Inventory Analysis */}
            <button
              onClick={onOpenInventory}
              className="p-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-sm group active:scale-95 shrink-0"
              title="วิเคราะห์คลังคอนเทนต์"
            >
              <PackageSearch className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Import/Template Group */}
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200 shadow-inner shrink-0">
              <button
                onClick={onImportClick}
                disabled={isImporting}
                className="px-3 py-1.5 text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg flex items-center transition-all disabled:opacity-50 active:scale-95 shrink-0"
              >
                {isImporting ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Upload className="w-3 h-3 mr-1.5" />} IMPORT
              </button>
              <div className="w-[1px] h-3 bg-slate-300 mx-0.5 shrink-0" />
              <button
                onClick={onDownloadTemplate}
                className="px-3 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg flex items-center transition-all active:scale-95 shrink-0"
              >
                <Download className="w-3 h-3 mr-1.5" /> TEMPLATE
              </button>
            </div>

            {/* Collapse Button */}
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0"
              title="ย่อแถบเครื่องมือ"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="shrink-0"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5 transition-all shadow-sm group active:scale-95 whitespace-nowrap shrink-0"
            >
              <Wrench className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500" />
              <span className="text-[11px] font-black uppercase tracking-tight">Tools</span>
              <ChevronLeft className="ml-1 w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StockUtilities;
