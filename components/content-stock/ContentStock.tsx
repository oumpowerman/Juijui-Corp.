import React, { useMemo, useCallback } from 'react';
import { Task, Channel, User, MasterOption } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import MentorTip from '../MentorTip';
import { useStockSync } from '../../hooks/useStockSync';
import AppBackground, { BackgroundTheme } from '../common/AppBackground';
import { useContentStockController } from '../../hooks/useContentStockController';
import { useShootQueueContext } from '../../context/ShootQueueContext';

// Sub-Components
import StockHeader from './stock/StockHeader';
import StockFilterBar from './stock/StockFilterBar';
import StockQuickFilters from './stock/StockQuickFilters';
import StockTable from './stock/StockTable';
import StockInventoryModal from './stock/inventory/StockInventoryModal';
import { StockImportPreviewModal } from './stock/StockImportPreviewModal';
import StockShootQueue from './stock/StockShootQueue';
import AnalyticsEntryModal from '../analytics/AnalyticsEntryModal';

interface ContentStockProps {
  tasks: Task[]; // Sync Source
  channels: Channel[];
  users: User[];
  masterOptions: MasterOption[];
  onSchedule: (task: Task) => void;
  onEdit: (task: Task) => void;
  onAdd: () => void;
  onOpenSettings: () => void;
  onAddToWorkbox?: (task: Task) => void;
  onEditScript?: (scriptId: string) => void;
}

const ContentStock: React.FC<ContentStockProps> = ({
  tasks: globalTasks,
  channels,
  users,
  masterOptions,
  onSchedule,
  onEdit,
  onAdd,
  onOpenSettings,
  onAddToWorkbox,
  onEditScript
}) => {
  // 1. Grouped Controller Hooks
  const { filters, view, data, modals, importActions } = useContentStockController({
    globalTasks,
    channels,
    users,
    masterOptions
  });

  const { queueItems } = useShootQueueContext();
  const queueCount = queueItems?.length || 0;

  const handleJumpToPage1 = useCallback(() => {
    view.setCurrentPage(1);
  }, [view]);

  // --- HYBRID SYNC: Watch Global Tasks ---
  useStockSync(globalTasks, data.paginatedTasks, data.updateLocalItem, handleJumpToPage1);

  const bgTheme = useMemo(() => {
    const themes: BackgroundTheme[] = [
      'pastel-pink', 'pastel-blue', 'pastel-green', 'pastel-purple', 'pastel-orange', 'pastel-yellow', 'pastel-teal'
    ];
    return themes[Math.floor(Math.random() * themes.length)];
  }, []);

  return (
    <AppBackground theme={bgTheme} pattern="icons" className="p-4 md:p-8 min-h-screen overflow-x-hidden scrollbar-hide">
      <div className="relative z-10 space-y-4 animate-in fade-in duration-500 pb-20 max-w-full overflow-x-hidden scrollbar-hide">
        <MentorTip moduleId="CONTENT_STOCK" />

        {/* 2. Header & Controls */}
        <StockHeader 
          viewTab={view.viewTab}
          setViewTab={view.setViewTab}
          channels={channels}
          filterChannel={filters.filterChannel}
          setFilterChannel={filters.setFilterChannel}
          totalCount={data.totalCount}
          unassignedChannelCount={data.unassignedChannelCount}
          isLoading={data.isLoading}
          queueCount={queueCount}
          fileInputRef={importActions.fileInputRef}
          isImporting={importActions.isImporting}
          handleFileUpload={importActions.handleFileUpload}
          handleDownloadTemplate={importActions.handleDownloadTemplate}
          setIsInventoryModalOpen={modals.setIsInventoryModalOpen}
          onAdd={onAdd}
          onOpenSettings={onOpenSettings}
          setSearchParams={view.setSearchParams}
          users={users}
          masterOptions={masterOptions}
          handleProcessFile={importActions.handleProcessFile}
        />

        {/* 3. Main Views (List vs Shoot Queue) */}
        <AnimatePresence mode="wait">
          {view.viewTab === 'LIST' ? (
            <motion.div 
              key={`content-list-${view.contentSubTab}`}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3 relative overflow-visible w-full"
            >
              {/* Quick Filters */}
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}>
                <StockQuickFilters 
                  masterOptions={masterOptions}
                  filterState={filters}
                  currentTab={view.contentSubTab}
                  setTab={view.setContentSubTab}
                  overdueCount={data.overdueCount}
                  missingStorageCount={data.missingStorageCount}
                />
              </motion.div>

              {/* Filter Bar (Grouped filters prop) */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.1 }}
                className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-500/5 border border-white/60 p-1 relative z-50"
              >
                <StockFilterBar
                  filterState={filters}
                  contentSubTab={view.contentSubTab}
                  channels={channels}
                  masterOptions={masterOptions}
                  tasks={globalTasks}
                />
              </motion.div>

              {/* Stock Table */}
              <motion.div 
                initial={{ y: 40, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.2 }}
                className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white/80 overflow-hidden relative"
              >
                <StockTable
                  isLoading={data.isLoading || filters.isFiltering}
                  isFiltering={filters.isFiltering}
                  isOverdueFilterActive={filters.filterOnlyOverdue}
                  tasks={data.paginatedTasks}
                  channels={channels}
                  users={users}
                  masterOptions={masterOptions}
                  sortConfig={view.sortConfig}
                  onSort={(key) => view.handleSort(key as any)}
                  totalCount={data.totalCount}
                  currentPage={view.currentPage}
                  itemsPerPage={view.itemsPerPage}
                  onPageChange={view.setCurrentPage}
                  onEdit={onEdit}
                  onSchedule={onSchedule}
                  onToggleQueue={data.toggleShootQueue}
                  onAddToWorkbox={onAddToWorkbox}
                  onEditScript={onEditScript}
                  onOpenAnalytics={modals.setSelectedContentForAnalytics}
                  onTagClick={(tag) => filters.setSearchQuery(`#${tag} `)}
                  onUpdateLocalTask={data.updateLocalItem}
                  onUpdateSubChecklist={data.updateSubChecklistProgress}
                />

                {/* Scanning Ray effect during transitions */}
                <AnimatePresence>
                  {filters.isFiltering && (
                    <motion.div
                      initial={{ top: '-40%' }}
                      animate={{ top: '120%' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-40 z-50 pointer-events-none flex flex-col items-center"
                    >
                      <div className="w-full h-[2px] bg-indigo-500 shadow-[0_0_20px_2px_rgba(99,102,241,0.6)]" />
                      <div className="w-full h-full bg-gradient-to-b from-indigo-500/10 to-transparent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="shoot-queue-tab"
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <StockShootQueue 
                channels={channels}
                users={users}
                masterOptions={masterOptions}
                onEditContent={(thinTask) => {
                  const fullTask = globalTasks.find(t => t.id === thinTask.id);
                  onEdit(fullTask || thinTask);
                }}
                onEditScript={onEditScript}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Modals */}
        <AnimatePresence>
          {modals.isInventoryModalOpen && (
            <StockInventoryModal 
              isOpen={modals.isInventoryModalOpen}
              onClose={modals.closeInventoryModal}
              masterOptions={masterOptions}
              channels={channels}
              onEditTask={onEdit}
            />
          )}
        </AnimatePresence>

        <StockImportPreviewModal
          isOpen={modals.isImportPreviewOpen}
          onClose={() => modals.setIsImportPreviewOpen(false)}
          validationResult={modals.importValidationResult}
          isSubmitting={modals.isSubmittingImport}
          onConfirmImport={importActions.handleExecuteImport}
          onDownloadTemplate={importActions.handleDownloadTemplate}
          channels={channels}
          users={users}
          masterOptions={masterOptions}
        />

        {modals.selectedContentForAnalytics && (
          <AnalyticsEntryModal 
            content={modals.selectedContentForAnalytics as any}
            onClose={() => modals.setSelectedContentForAnalytics(null)}
            onSave={() => {}}
          />
        )}
      </div>
    </AppBackground>
  );
};

export default ContentStock;
