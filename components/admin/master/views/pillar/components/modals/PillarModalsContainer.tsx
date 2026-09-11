import React from 'react';
import { MasterOption, Channel, PillarFormData, CategoryFormData } from '../../types';
import { PillarModal } from './PillarModal';
import { CategoryModal } from './CategoryModal';

interface PillarModalsContainerProps {
    // Pillar Modal
    isPillarModalOpen: boolean;
    onClosePillarModal: () => void;
    pillarFormData: PillarFormData;
    setPillarFormData: React.Dispatch<React.SetStateAction<PillarFormData>>;
    onSavePillar: (e: React.FormEvent) => void;
    channels: Channel[];

    // Category Modal
    isCategoryModalOpen: boolean;
    onCloseCategoryModal: () => void;
    categoryFormData: CategoryFormData;
    setCategoryFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
    onSaveCategory: (e: React.FormEvent) => void;
    allPillars: MasterOption[];
}

export const PillarModalsContainer: React.FC<PillarModalsContainerProps> = ({
    isPillarModalOpen,
    onClosePillarModal,
    pillarFormData,
    setPillarFormData,
    onSavePillar,
    channels,
    isCategoryModalOpen,
    onCloseCategoryModal,
    categoryFormData,
    setCategoryFormData,
    onSaveCategory,
    allPillars
}) => {
    return (
        <>
            <PillarModal 
                isOpen={isPillarModalOpen}
                onClose={onClosePillarModal}
                formData={pillarFormData}
                setFormData={setPillarFormData}
                onSubmit={onSavePillar}
                channels={channels}
            />

            <CategoryModal 
                isOpen={isCategoryModalOpen}
                onClose={onCloseCategoryModal}
                formData={categoryFormData}
                setFormData={setCategoryFormData}
                onSubmit={onSaveCategory}
                allPillars={allPillars}
                channels={channels}
            />
        </>
    );
};

export default PillarModalsContainer;
