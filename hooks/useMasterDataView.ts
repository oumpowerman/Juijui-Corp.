
import React, { useState } from 'react';
import { MasterOption, Reward, DashboardConfig } from '../types';
import { useMasterData } from './useMasterData';
import { useRewards } from './useRewards';
import { useDashboardConfig } from './useDashboardConfig';
import { useMaintenance } from './useMaintenance';

export type MasterTab = 
    // Workflow
    | 'STATUS' | 'TASK_STATUS' | 'PROJECT_TYPE' | 'TAG_PRESET' | 'SHOOT_LOCATION' | 'EVENT_TYPE' | 'YEARLY'
    // Content
    | 'PILLAR' | 'FORMAT' | 'CATEGORY' | 'SCRIPT_CATEGORY'
    // Inventory
    | 'INVENTORY' | 'ITEM_CONDITION'
    // Production
    | 'MEETING_CATEGORY'
    // HR & Team
    | 'POSITION' | 'LEAVE_TYPE' | 'ATTENDANCE_RULES' | 'LOCATIONS'
    // QC
    | 'REJECTION_REASON'
    // System
    | 'REWARDS' | 'GREETINGS' | 'DASHBOARD' | 'MAINTENANCE' | 'WIKI_CATEGORY' | 'GAME_TUNING'; 

export const useMasterDataView = () => {
    // --- Hooks ---
    const { masterOptions, isLoading: masterLoading, addMasterOption, updateMasterOption, deleteMasterOption } = useMasterData();
    const { rewards, isLoading: rewardsLoading, addReward, updateReward, deleteReward } = useRewards(null);
    const { configs: dashboardConfigs, isLoading: dashboardLoading, updateConfig: updateDashboardConfig } = useDashboardConfig();
    const maintenance = useMaintenance();

    // --- Local State ---
    const [activeTab, setActiveTab] = useState<MasterTab>('STATUS');
    
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
    
    // Dashboard Config Editing State
    const [editingDashboardConfig, setEditingDashboardConfig] = useState<DashboardConfig | null>(null);
    const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);

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

    // Dashboard Config Handlers
    const handleEditDashboardConfig = (config: DashboardConfig) => {
        setEditingDashboardConfig(config);
        setIsDashboardModalOpen(true);
    };

    const handleSaveDashboardConfig = async (id: string, updates: Partial<DashboardConfig>) => {
        await updateDashboardConfig(id, updates);
        setIsDashboardModalOpen(false);
        setEditingDashboardConfig(null);
    };

    const handlePrepareBackupUI = async () => {
        // Pass default backup options when triggered from UI without specific options
        const data = await maintenance.prepareBackup({
            tasks: true,
            contents: true,
            chats: true,
            profiles: true
        });
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
        dashboardConfigs, dashboardLoading,
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
        
        // Dashboard UI State
        editingDashboardConfig, 
        isDashboardModalOpen, 
        setIsDashboardModalOpen,

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
        handleEditDashboardConfig,
        handleSaveDashboardConfig,
        handlePrepareBackupUI,
        handleOpenCleanupModal,
        toggleCleanupStatus
    };
};
