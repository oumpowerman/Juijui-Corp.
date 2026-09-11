import React from 'react';
import { MasterOption } from '../../../../types';
import { 
    usePillarMasterLogic,
    PillarStatsHeader,
    PillarToolbar,
    PillarGroupedView,
    PillarMatrixView,
    PillarModalsContainer
} from './pillar';

interface PillarCategoryMasterViewProps {
    masterOptions: MasterOption[];
    activeTab?: string;
    onEdit?: (option: MasterOption) => void;
    onCreate?: (type: string, parentKey?: string) => void;
    onDelete?: (id: string) => void;
}

export const PillarCategoryMasterView: React.FC<PillarCategoryMasterViewProps> = ({
    masterOptions
}) => {
    const controller = usePillarMasterLogic(masterOptions);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* 1. TOP STATS BAR */}
            <PillarStatsHeader stats={controller.stats} />

            {/* 2. TOOLBAR & CONTROLS */}
            <PillarToolbar 
                searchQuery={controller.searchQuery}
                setSearchQuery={controller.setSearchQuery}
                viewMode={controller.viewMode}
                setViewMode={controller.setViewMode}
                expandAll={controller.expandAll}
                collapseAll={controller.collapseAll}
                handleOpenCreatePillar={controller.handleOpenCreatePillar}
                handleOpenCreateCategory={controller.handleOpenCreateCategory}
                selectedPlatform={controller.selectedPlatform}
                setSelectedPlatform={controller.setSelectedPlatform}
                channelGroups={controller.channelGroups}
                selectedGroupId={controller.selectedGroupId}
                setSelectedGroupId={controller.setSelectedGroupId}
                statusFilter={controller.statusFilter}
                setStatusFilter={controller.setStatusFilter}
                scopeFilter={controller.scopeFilter}
                setScopeFilter={controller.setScopeFilter}
                onResetFilters={controller.resetFilters}
                hasActiveFilters={controller.hasActiveFilters}
            />

            {/* 3. MAIN CONTENT (Grouped Accordion vs Matrix View) */}
            {controller.viewMode === 'grouped' ? (
                <PillarGroupedView 
                    filteredGlobalPillars={controller.filteredGlobalPillars}
                    filteredChannels={controller.filteredChannels}
                    expandedChannelIds={controller.expandedChannelIds}
                    toggleChannelExpand={controller.toggleChannelExpand}
                    handleOpenCreatePillar={controller.handleOpenCreatePillar}
                    categoriesByPillarKey={controller.categoriesByPillarKey}
                    pillarsByChannelId={controller.pillarsByChannelId}
                    statusFilter={controller.statusFilter}
                    searchQuery={controller.searchQuery}
                    channelGroups={controller.channelGroups}
                    onToggleActive={controller.handleToggleActive}
                    onOpenEditPillar={controller.handleOpenEditPillar}
                    onDeleteOption={controller.handleDeleteOption}
                    onOpenEditCategory={controller.handleOpenEditCategory}
                    activeInlinePillarKey={controller.activeInlinePillarKey}
                    inlineCategoryInputs={controller.inlineCategoryInputs}
                    onStartInlineAdd={(key) => controller.setActiveInlinePillarKey(key)}
                    onCancelInlineAdd={() => controller.setActiveInlinePillarKey(null)}
                    onInputChange={(val) => {
                        if (controller.activeInlinePillarKey) {
                            controller.setInlineCategoryInputs(prev => ({ 
                                ...prev, 
                                [controller.activeInlinePillarKey!]: val 
                            }));
                        }
                    }}
                    onInlineSubmit={controller.handleInlineAddCategory}
                />
            ) : (
                <PillarMatrixView 
                    matrixRows={controller.matrixRows}
                    selectedItemIds={controller.selectedItemIds}
                    handleSelectAllMatrix={controller.handleSelectAllMatrix}
                    handleToggleItemSelection={controller.handleToggleItemSelection}
                    handleBatchToggleActive={controller.handleBatchToggleActive}
                    handleBatchDelete={controller.handleBatchDelete}
                    setSelectedItemIds={controller.setSelectedItemIds}
                    handleToggleActive={controller.handleToggleActive}
                    handleOpenCreateCategory={controller.handleOpenCreateCategory}
                    handleOpenEditPillar={controller.handleOpenEditPillar}
                    handleOpenEditCategory={controller.handleOpenEditCategory}
                    handleDeleteOption={controller.handleDeleteOption}
                />
            )}

            {/* 4. MODALS (Pillar & Category) */}
            <PillarModalsContainer 
                isPillarModalOpen={controller.isPillarModalOpen}
                onClosePillarModal={() => controller.setIsPillarModalOpen(false)}
                pillarFormData={controller.pillarFormData}
                setPillarFormData={controller.setPillarFormData}
                onSavePillar={controller.handleSavePillar}
                channels={controller.channels}

                isCategoryModalOpen={controller.isCategoryModalOpen}
                onCloseCategoryModal={() => controller.setIsCategoryModalOpen(false)}
                categoryFormData={controller.categoryFormData}
                setCategoryFormData={controller.setCategoryFormData}
                onSaveCategory={controller.handleSaveCategory}
                allPillars={controller.allPillars}
            />
        </div>
    );
};

export default PillarCategoryMasterView;
