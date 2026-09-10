import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  Download, 
  PackageSearch, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Wrench,
  Sparkles
} from 'lucide-react';
import { Channel, MasterOption, User } from '../../../types';
import { StockImportGuideModal } from './StockImportGuideModal';

interface StockUtilitiesProps {
  onOpenInventory: () => void;
  onImportClick?: () => void;
  onDownloadTemplate?: () => void;
  isImporting: boolean;
  channels?: Channel[];
  users?: User[];
  masterOptions?: MasterOption[];
  onProcessFile?: (file: File) => Promise<void>;
  compact?: boolean;
}

const springTransition = { type: 'spring', stiffness: 380, damping: 30 } as const;

const StockUtilities: React.FC<StockUtilitiesProps> = ({
  onOpenInventory,
  onImportClick,
  onDownloadTemplate,
  isImporting,
  channels = [],
  users = [],
  masterOptions = [],
  onProcessFile,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const handleOpenGuide = () => {
    setIsGuideModalOpen(true);
  };

  const handleProcessAndClose = async (file: File) => {
    setIsGuideModalOpen(false);
    if (onProcessFile) {
      await onProcessFile(file);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/80 shadow-sm">
                  {/* Inventory Analysis */}
                  <button
                      id="btn-stock-inventory-analysis"
                      onClick={onOpenInventory}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-sm group active:scale-95"
                      title="วิเคราะห์คลังคอนเทนต์"
                  >
                      <PackageSearch className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </button>

                  {/* Import/Template Group */}
                  <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-sm">
                      <button
                          id="btn-open-stock-import-guide"
                          onClick={handleOpenGuide}
                          disabled={isImporting}
                          className="px-3 py-1.5 text-[10px] font-black text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg flex items-center transition-all disabled:opacity-50 active:scale-95 group"
                      >
                          {isImporting ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                          ) : (
                            <Upload className="w-3 h-3 mr-1.5 text-indigo-500 group-hover:scale-110 transition-transform" />
                          )} 
                          IMPORT
                      </button>
                      <div className="w-[1px] h-3 bg-slate-300 mx-0.5"></div>
                      <button
                          id="btn-open-stock-template-guide"
                          onClick={handleOpenGuide}
                          className="px-3 py-1.5 text-[10px] font-black text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg flex items-center transition-all active:scale-95"
                          title="ดูคำแนะนำและดาวน์โหลดแม่แบบ Template"
                      >
                          <Download className="w-3 h-3 mr-1.5" /> TEMPLATE
                      </button>
                  </div>
              </div>

              <button 
                  id="btn-stock-collapse-tools"
                  onClick={() => setIsExpanded(false)}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-2xl border border-slate-200 transition-all active:scale-95"
              >
                  <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
              <motion.div
                key="tools-collapsed-wrap"
                layout
                transition={springTransition}
                className="flex items-center shrink-0"
              >
                <motion.button
                    layout
                    transition={springTransition}
                    id="btn-stock-expand-tools"
                    onClick={() => setIsExpanded(true)}
                    title="เครื่องมือและนำเข้า (Tools)"
                    className={`flex items-center justify-center h-11 bg-white border border-slate-200/90 rounded-2xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 shadow-sm group active:scale-95 shrink-0 cursor-pointer overflow-hidden ${
                      compact ? 'w-11 px-0' : 'px-4 gap-2'
                    }`}
                >
                    <Wrench className="w-4 h-4 group-hover:rotate-45 transition-transform duration-500 shrink-0" />
                    <AnimatePresence initial={false}>
                      {!compact && (
                        <motion.div
                          key="tools-text-group"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                          className="flex items-center gap-1 overflow-hidden whitespace-nowrap"
                        >
                          <span className="text-[11px] font-black uppercase tracking-tight">Tools</span>
                          <ChevronLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                </motion.button>
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Guide & Import Modal */}
      <StockImportGuideModal 
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        channels={channels}
        users={users}
        masterOptions={masterOptions}
        onProcessFile={handleProcessAndClose}
        isProcessing={isImporting}
        onDownloadCSVTemplate={onDownloadTemplate}
      />
    </>
  );
};

export default StockUtilities;
