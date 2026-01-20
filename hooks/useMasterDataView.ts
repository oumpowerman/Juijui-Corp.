
import React, { useState } from 'react';
import { MasterOption, Reward } from '../types';
import { useMasterData } from './useMasterData';
import { useRewards } from './useRewards';
import { useMaintenance } from './useMaintenance';

export type MasterTab = 'PILLAR' | 'FORMAT' | 'CATEGORY' | 'STATUS' | 'INVENTORY' | 'POSITION' | 'REWARDS' | 'MAINTENANCE';

export const useMasterDataView = () => {
    // --- Hooks ---
    const { masterOptions, isLoading: masterLoading, addMasterOption, updateMasterOption, deleteMasterOption } = useMasterData();
    const { rewards, isLoading: rewardsLoading, addReward, updateReward, deleteReward } = useRewards(null);
    const maintenance = useMaintenance();

    // --- Local State ---
    const [activeTab, setActiveTab] = useState<MasterTab>('PILLAR');
    
    // Form States
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Extended Form Data to support parentKey
    const [formData, setFormData] = useState({ 
        key: '', 
        label: '', 
        color: 'bg-gray-100 text-gray-700', 
        sortOrder: 0, 
        isActive: true,
        parentKey: '' // Added for nested relations
    });
    
    const [rewardFormData, setRewardFormData] = useState<Partial<Reward>>({ title: '', description: '', cost: 100, icon: '🎁', isActive: true });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Maintenance Config
    const [cleanupMonths, setCleanupMonths] = useState(6);
    const [cleanupTargetStatuses, setCleanupTargetStatuses] = useState<string[]>(['DONE']);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);
    const [isBackupVerified, setIsBackupVerified] = useState(false);

    // --- Computed ---
    // General filter for simple tabs
    const filteredOptions = masterOptions.filter(o => o.type === activeTab);

    // --- Handlers ---
    const handleEdit = (option: MasterOption) => {
        setEditingId(option.id);
        setFormData({ 
            key: option.key, 
            label: option.label, 
            color: option.color || 'bg-gray-100 text-gray-700', 
            sortOrder: option.sortOrder, 
            isActive: option.isActive,
            parentKey: option.parentKey || ''
        });
        setIsEditing(true);
    };

    const handleCreate = (overrideType?: string, defaultParentKey?: string) => {
        setEditingId(null);
        // Calculate sort order based on current list length (simple auto-increment)
        const currentCount = masterOptions.filter(o => o.type === (overrideType || activeTab)).length;
        
        setFormData({ 
            key: '', 
            label: '', 
            color: 'bg-gray-100 text-gray-700', 
            sortOrder: currentCount + 1, 
            isActive: true,
            parentKey: defaultParentKey || ''
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent, explicitType?: string) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (activeTab === 'REWARDS') {
                if (editingId) await updateReward(editingId, rewardFormData);
                else await addReward(rewardFormData as any);
            } else {
                // Determine Type: explicitType overrides activeTab (useful for Sub-items like L2 or Responsibilities)
                const targetType = explicitType || activeTab;
                
                const payload = { 
                    type: targetType as any, 
                    key: formData.key.toUpperCase().replace(/\s+/g, '_'), 
                    label: formData.label, 
                    color: formData.color, 
                    sortOrder: formData.sortOrder, 
                    isActive: formData.isActive,
                    parentKey: formData.parentKey || undefined
                };
                
                if (editingId) await updateMasterOption({ id: editingId, ...payload });
                else await addMasterOption(payload);
            }
            setIsEditing(false);
            setEditingId(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reward Specific Handlers
    const handleCreateReward = () => {
        setEditingId(null);
        setRewardFormData({ title: '', description: '', cost: 100, icon: '🎁', isActive: true });
        setIsEditing(true);
    };

    const handleEditReward = (reward: Reward) => {
        setEditingId(reward.id);
        setRewardFormData({ 
            title: reward.title, 
            description: reward.description, 
            cost: reward.cost, 
            icon: reward.icon, 
            isActive: reward.isActive 
        });
        setIsEditing(true);
    };

    const handlePrepareBackupUI = async () => {
        const data = await maintenance.prepareBackup();
        if (data) setIsBackupModalOpen(true);
    };

    const handleOpenCleanupModal = () => {
        setConfirmDeleteText('');
        setIsBackupVerified(false);
        setIsCleanupModalOpen(true);
    };

    const toggleCleanupStatus = (statusKey: string) => {
        setCleanupTargetStatuses(prev => 
            prev.includes(statusKey) 
            ? prev.filter(s => s !== statusKey) 
            : [...prev, statusKey]
        );
    };

    return {
        // Data & Loading
        masterOptions, masterLoading, 
        addMasterOption, updateMasterOption, deleteMasterOption, 
        rewards, rewardsLoading, deleteReward,
        filteredOptions,
        
        // Maintenance Hook Access
        maintenance,

        // UI State
        activeTab, setActiveTab,
        isEditing, setIsEditing,
        editingId, setEditingId, // Export setEditingId for custom close logic
        formData, setFormData,
        rewardFormData, setRewardFormData,
        isSubmitting,

        // Maintenance Local State
        cleanupMonths, setCleanupMonths,
        cleanupTargetStatuses, setCleanupTargetStatuses,
        isBackupModalOpen, setIsBackupModalOpen,
        isCleanupModalOpen, setIsCleanupModalOpen,
        confirmDeleteText, setConfirmDeleteText,
        isStatusSelectorOpen, setIsStatusSelectorOpen,
        isBackupVerified, setIsBackupVerified,

        // Actions
        handleEdit,
        handleCreate,
        handleSubmit,
        handleCreateReward,
        handleEditReward,
        handlePrepareBackupUI,
        handleOpenCleanupModal,
        toggleCleanupStatus
    };
};
