
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, Status, Priority, TaskType, ContentPillar, ContentFormat, Platform, TaskAsset, AssetCategory, Channel, MasterOption, User, TaskPerformance, Difficulty } from '../types';

interface UseTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    channels: Channel[];
    lockedType?: TaskType | null;
    masterOptions: MasterOption[];
    onSave: (task: Task) => void;
}

export const useTaskForm = ({ initialData, selectedDate, channels, lockedType, masterOptions, onSave }: UseTaskFormProps) => {
    // Form State
    const [activeTab, setActiveTab] = useState<TaskType>('CONTENT');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [remark, setRemark] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<string>(''); // Default empty, wait for master data
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [tags, setTags] = useState<string[]>([]);
    
    // Content Specific
    const [channelId, setChannelId] = useState<string>('');
    const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>([]);
    const [pillar, setPillar] = useState<string>('');
    const [contentFormat, setContentFormat] = useState<string>('');
    const [category, setCategory] = useState('');
    
    // Gamification
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [estimatedHours, setEstimatedHours] = useState<number>(0);

    const [ideaOwnerIds, setIdeaOwnerIds] = useState<string[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [isStock, setIsStock] = useState(false);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [assets, setAssets] = useState<TaskAsset[]>([]);

    // Performance Metrics (NEW)
    const [performance, setPerformance] = useState<TaskPerformance>({
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        revenue: 0,
        reflection: ''
    });

    const [error, setError] = useState('');

    // Derived Options
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    // Initialization Logic
    useEffect(() => {
        if (lockedType) {
            setActiveTab(lockedType);
        } else if (initialData) {
            setActiveTab(initialData.type);
        } else {
            setActiveTab('CONTENT');
        }

        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setRemark(initialData.remark || '');
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setStatus(initialData.status);
            setPriority(initialData.priority);
            setTags(initialData.tags || []);
            setChannelId(initialData.channelId || channels[0]?.id || '');
            setTargetPlatforms(initialData.targetPlatforms || []);
            
            // For editing, use existing data
            setPillar(initialData.pillar || '');
            setContentFormat(initialData.contentFormat || '');
            setCategory(initialData.category || '');
            
            setIdeaOwnerIds(initialData.ideaOwnerIds || []);
            setEditorIds(initialData.editorIds || []);
            setIsStock(!!initialData.isUnscheduled);
            setAssigneeIds(initialData.assigneeIds || []);
            setAssets(initialData.assets || []);
            setDifficulty(initialData.difficulty || 'MEDIUM');
            setEstimatedHours(initialData.estimatedHours || 0);
            
            if (initialData.performance) {
                setPerformance(initialData.performance);
            } else {
                setPerformance({ views: 0, likes: 0, shares: 0, comments: 0, revenue: 0, reflection: '' });
            }
        } else {
            // --- Defaults for New Task ---
            setTitle('');
            setDescription('');
            setRemark('');
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            
            // Logic: Strictly use Master Data Default. If no default, fallback to EMPTY string.
            const defaultStatus = statusOptions.find(o => o.isDefault)?.key;
            // If no default status is set in Master Data, check if there are ANY statuses. If so, pick first. If not, empty.
            if (defaultStatus) {
                setStatus(defaultStatus);
            } else if (statusOptions.length > 0) {
                setStatus(statusOptions[0].key);
            } else {
                setStatus(''); // No statuses defined in system
            }

            setPriority(Priority.MEDIUM);
            setTags([]);
            const defaultCh = channels[0];
            setChannelId(defaultCh?.id || '');
            setTargetPlatforms(defaultCh?.platforms?.[0] ? [defaultCh.platforms[0]] : []);
            
            // Logic: If no default set, leave empty
            setPillar(pillarOptions.find(o => o.isDefault)?.key || '');
            setContentFormat(formatOptions.find(o => o.isDefault)?.key || '');
            const defaultCat = categoryOptions.find(o => o.isDefault);
            setCategory(defaultCat ? defaultCat.key : ''); 

            setIdeaOwnerIds([]);
            setEditorIds([]);
            setIsStock(false);
            setAssigneeIds([]);
            setAssets([]);
            setDifficulty('MEDIUM');
            setEstimatedHours(0);
            setPerformance({ views: 0, likes: 0, shares: 0, comments: 0, revenue: 0, reflection: '' });
        }
        setError('');
    }, [initialData, selectedDate, channels, lockedType, masterOptions]); 

    // Platform Logic: Auto-select default if current selection is invalid for new channel
    useEffect(() => {
        const selectedChannel = channels.find(c => c.id === channelId);
        if (selectedChannel && selectedChannel.platforms.length > 0) {
            if (targetPlatforms.length === 0) {
                setTargetPlatforms([selectedChannel.platforms[0]]);
            } else {
               const validPlatforms = targetPlatforms.filter(p => selectedChannel.platforms.includes(p));
               if (validPlatforms.length === 0) {
                   setTargetPlatforms([selectedChannel.platforms[0]]);
               } else {
                   setTargetPlatforms(validPlatforms);
               }
            }
        }
    }, [channelId, channels]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('อย่าลืมตั้งชื่องานนะ!');
            return;
        }
        
        // Strict Validation: Must select status if statuses exist
        if (statusOptions.length > 0 && !status) {
            setError('กรุณาเลือกสถานะ (Status)');
            return;
        }
        
        const shouldCheckDate = activeTab === 'TASK' || (activeTab === 'CONTENT' && !isStock);
        if (shouldCheckDate && new Date(startDate) > new Date(endDate)) {
            setError('วันเริ่มต้องมาก่อนวันจบสิครับผม');
            return;
        }

        if (activeTab === 'CONTENT' && !channelId) {
           setError('เลือกช่องทาง (Brand) ที่จะลงด้วยนะ');
           return;
        }

        const newTask: Task = {
            id: initialData ? initialData.id : crypto.randomUUID(),
            type: activeTab,
            title,
            description,
            remark,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: status as Status, 
            priority,
            tags,
            assets,
            difficulty,
            estimatedHours,
            
            ...(activeTab === 'CONTENT' ? {
                channelId,
                targetPlatforms,
                pillar: pillar as ContentPillar,
                contentFormat: contentFormat as ContentFormat,
                category,
                ideaOwnerIds,
                editorIds,
                isUnscheduled: isStock,
                assigneeIds,
                performance // Add Performance Data
            } : {
                assigneeIds,
                isUnscheduled: false,
                performance: undefined
            })
        };

        onSave(newTask);
    };

    // Helper functions
    const togglePlatform = (p: Platform) => {
        setTargetPlatforms(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
    };

    const toggleUserSelection = (userId: string, currentList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const addAsset = (newAsset: TaskAsset) => setAssets(prev => [...prev, newAsset]);
    const removeAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));

    return {
        // State
        activeTab, setActiveTab,
        title, setTitle,
        description, setDescription,
        remark, setRemark,
        startDate, setStartDate,
        endDate, setEndDate,
        status, setStatus,
        priority, setPriority,
        tags, setTags,
        channelId, setChannelId,
        targetPlatforms, 
        pillar, setPillar,
        contentFormat, setContentFormat,
        category, setCategory,
        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        isStock, setIsStock,
        assigneeIds, setAssigneeIds,
        assets, 
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        error, setError,
        performance, setPerformance, // Export Performance

        // Options
        formatOptions,
        pillarOptions,
        categoryOptions,
        statusOptions,

        // Handlers
        handleSubmit,
        togglePlatform,
        toggleUserSelection,
        addAsset,
        removeAsset
    };
};
