
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, Status, Priority, TaskType, ContentPillar, ContentFormat, Platform, TaskAsset, Channel, MasterOption, TaskPerformance, Difficulty, AssigneeType } from '../types';

interface UseTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    channels: Channel[];
    lockedType?: TaskType | null;
    masterOptions: MasterOption[];
    onSave: (task: Task) => void;
}

export const useTaskForm = ({ initialData, selectedDate, channels, lockedType, masterOptions, onSave }: UseTaskFormProps) => {
    // Basic Fields
    const [activeTab, setActiveTab] = useState<TaskType>('CONTENT');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [remark, setRemark] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<string>(''); 
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [tags, setTags] = useState<string[]>([]);
    
    // Content Specific
    const [channelId, setChannelId] = useState<string>('');
    const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>([]);
    const [pillar, setPillar] = useState<string>('');
    const [contentFormat, setContentFormat] = useState<string>('');
    const [category, setCategory] = useState('');
    
    // People & Assets
    const [ideaOwnerIds, setIdeaOwnerIds] = useState<string[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [assets, setAssets] = useState<TaskAsset[]>([]);
    const [isStock, setIsStock] = useState(false);
    
    // Gamification
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [estimatedHours, setEstimatedHours] = useState<number>(0);

    // NEW FIELDS (This was missing)
    const [assigneeType, setAssigneeType] = useState<AssigneeType>('TEAM');
    const [targetPosition, setTargetPosition] = useState('');
    const [caution, setCaution] = useState('');
    const [importance, setImportance] = useState('');
    const [publishedLinks, setPublishedLinks] = useState<Record<string, string>>({}); 

    // Metrics
    const [performance, setPerformance] = useState<TaskPerformance>({
        views: 0, likes: 0, shares: 0, comments: 0, revenue: 0, reflection: ''
    });

    const [error, setError] = useState('');

    // Filter Options
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    
    const contentStatusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const taskStatusOptions = masterOptions.filter(o => o.type === 'TASK_STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const statusOptions = activeTab === 'CONTENT' ? contentStatusOptions : taskStatusOptions;

    // Initialization
    useEffect(() => {
        let targetType: TaskType = 'CONTENT';
        if (lockedType) targetType = lockedType;
        else if (initialData) targetType = initialData.type;
        setActiveTab(targetType);

        if (initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setRemark(initialData.remark || '');
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setStatus(initialData.status);
            setPriority(initialData.priority);
            setTags(initialData.tags || []);
            setChannelId(initialData.channelId || ''); 
            setTargetPlatforms(initialData.targetPlatforms || []);
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
            
            // Map New Fields
            setAssigneeType(initialData.assigneeType || 'TEAM');
            setTargetPosition(initialData.targetPosition || '');
            setCaution(initialData.caution || '');
            setImportance(initialData.importance || '');
            setPublishedLinks(initialData.publishedLinks || {}); 
            
            setPerformance(initialData.performance || { views: 0, likes: 0, shares: 0, comments: 0, revenue: 0, reflection: '' });
        } else {
            // Defaults
            setTitle('');
            setDescription('');
            setRemark('');
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            setPriority(Priority.MEDIUM);
            setTags([]);
            setChannelId(''); 
            setTargetPlatforms(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
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
            
            // New Defaults
            setAssigneeType('TEAM');
            setTargetPosition('');
            setCaution('');
            setImportance('');
            setPublishedLinks({});
        }
        setError('');
    }, [initialData, selectedDate, channels, lockedType, masterOptions]); 

    // Handle Status Reset on Tab Change (For New Tasks)
    useEffect(() => {
        if (!initialData) {
            const relevantOptions = activeTab === 'CONTENT' ? contentStatusOptions : taskStatusOptions;
            const defaultStatus = relevantOptions.find(o => o.isDefault)?.key || (relevantOptions.length > 0 ? relevantOptions[0].key : 'TODO');
            setStatus(defaultStatus);
        }
    }, [activeTab, masterOptions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('อย่าลืมตั้งชื่องานนะ!');
            return;
        }
        if (!status) {
            setError('กรุณาเลือกสถานะ (Status) ด้วยครับ');
            return;
        }
        const shouldCheckDate = activeTab === 'TASK' || (activeTab === 'CONTENT' && !isStock);
        if (shouldCheckDate && new Date(startDate) > new Date(endDate)) {
            setError('วันเริ่มต้องมาก่อนวันจบสิครับผม');
            return;
        }
        if (activeTab === 'CONTENT' && !channelId) {
           setError('กรุณาเลือกช่องทาง (Channel) ด้วยครับ');
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
            
            // New Fields Mapping
            assigneeType,
            targetPosition: assigneeType === 'INDIVIDUAL' ? targetPosition : undefined,
            caution,
            importance,
            
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
                performance,
                publishedLinks: publishedLinks
            } : {
                assigneeIds,
                isUnscheduled: false,
                performance: undefined
            })
        };

        onSave(newTask);
    };

    const togglePlatform = (p: Platform) => {
        setTargetPlatforms(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
    };

    const handleLinkChange = (platform: string, url: string) => {
        setPublishedLinks(prev => ({ ...prev, [platform]: url }));
    };

    const toggleUserSelection = (userId: string, currentList: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (assigneeType === 'INDIVIDUAL' && setter === setAssigneeIds) {
            // If individual, allow only one
            setter(prev => prev.includes(userId) ? [] : [userId]);
        } else {
            setter(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
        }
    };

    const addAsset = (newAsset: TaskAsset) => setAssets(prev => [...prev, newAsset]);
    const removeAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));

    return {
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
        
        // Export New Fields
        assigneeType, setAssigneeType,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        publishedLinks, handleLinkChange,

        error, setError,
        performance, setPerformance, 

        formatOptions,
        pillarOptions,
        categoryOptions,
        statusOptions,

        handleSubmit,
        togglePlatform,
        toggleUserSelection,
        addAsset,
        removeAsset
    };
};
