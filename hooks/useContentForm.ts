
import React, { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Task, Status, Priority, ContentPillar, ContentFormat, Platform, TaskAsset, Channel, MasterOption, TaskPerformance, Difficulty, AssigneeType } from '../types';

interface UseContentFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    channels: Channel[];
    masterOptions: MasterOption[];
    onSave: (task: Task) => void;
}

export const useContentForm = ({ initialData, selectedDate, channels, masterOptions, onSave }: UseContentFormProps) => {
    // --- State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [remark, setRemark] = useState('');
    
    // Dates & Status
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isStock, setIsStock] = useState(false);
    const [status, setStatus] = useState<string>(''); 
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [tags, setTags] = useState<string[]>([]);
    
    // Content Specifics
    const [channelId, setChannelId] = useState<string>('');
    const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
    const [pillar, setPillar] = useState<string>('');
    const [contentFormat, setContentFormat] = useState<string>('');
    const [category, setCategory] = useState('');
    const [publishedLinks, setPublishedLinks] = useState<Record<string, string>>({}); 

    // Production Info
    const [shootDate, setShootDate] = useState('');
    const [shootLocation, setShootLocation] = useState('');

    // People
    const [ideaOwnerIds, setIdeaOwnerIds] = useState<string[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]); // Support/Sub
    
    // Other
    const [assets, setAssets] = useState<TaskAsset[]>([]);
    const [performance, setPerformance] = useState<TaskPerformance | undefined>(undefined);
    
    // Script Integration
    const [scriptId, setScriptId] = useState<string | undefined>(undefined);
    
    const [error, setError] = useState('');

    // --- Options from Master Data ---
    const formatOptions = masterOptions.filter(o => o.type === 'FORMAT' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const pillarOptions = masterOptions.filter(o => o.type === 'PILLAR' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const categoryOptions = masterOptions.filter(o => o.type === 'CATEGORY' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);
    const statusOptions = masterOptions.filter(o => o.type === 'STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    // --- Initialization ---
    useEffect(() => {
        if (initialData && initialData.type === 'CONTENT') {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setRemark(initialData.remark || '');
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setIsStock(!!initialData.isUnscheduled);
            setStatus(initialData.status);
            setPriority(initialData.priority);
            setTags(initialData.tags || []);
            
            setChannelId(initialData.channelId || '');
            // Ensure array consistency for platforms
            setTargetPlatforms(Array.isArray(initialData.targetPlatforms) ? initialData.targetPlatforms : []);
            setPillar(initialData.pillar || '');
            setContentFormat(initialData.contentFormat || '');
            setCategory(initialData.category || '');
            setPublishedLinks(initialData.publishedLinks || {});

            // Production Info Safety Check
            setShootDate(initialData.shootDate && isValid(new Date(initialData.shootDate)) ? format(initialData.shootDate, 'yyyy-MM-dd') : '');
            setShootLocation(initialData.shootLocation || '');

            setIdeaOwnerIds(initialData.ideaOwnerIds || []);
            setEditorIds(initialData.editorIds || []);
            setAssigneeIds(initialData.assigneeIds || []);
            
            setAssets(initialData.assets || []);
            setPerformance(initialData.performance);
            setScriptId(initialData.scriptId); // Link script
        } else {
            // Defaults for New Content
            setTitle('');
            setDescription('');
            setRemark('');
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            setIsStock(false);
            
            const defaultStatus = statusOptions.find(o => o.isDefault)?.key || (statusOptions.length > 0 ? statusOptions[0].key : 'TODO');
            setStatus(defaultStatus);
            
            setPriority('MEDIUM');
            setTags([]);
            
            if (channels.length > 0) setChannelId(channels[0].id);
            else setChannelId('');

            setTargetPlatforms(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
            setPillar(pillarOptions.find(o => o.isDefault)?.key || '');
            setContentFormat(formatOptions.find(o => o.isDefault)?.key || '');
            
            const defaultCat = categoryOptions.find(o => o.isDefault);
            setCategory(defaultCat ? defaultCat.key : '');

            setShootDate('');
            setShootLocation('');
            
            setIdeaOwnerIds([]);
            setEditorIds([]);
            setAssigneeIds([]);
            setAssets([]);
            setPerformance(undefined);
            setPublishedLinks({});
            setScriptId(undefined);
        }
        setError('');
    }, [initialData, selectedDate, channels, masterOptions]); 

    // --- Handlers ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('อย่าลืมตั้งชื่อคอนเทนต์นะ!');
            return;
        }
        if (!channelId) {
            setError('กรุณาเลือกช่องทาง (Channel) ด้วยครับ');
            return;
        }
        if (!isStock && new Date(startDate) > new Date(endDate)) {
            setError('วันเริ่มต้องมาก่อนวันจบสิครับผม');
            return;
        }

        // 1. Date Conversion (Fix Timezone issues by using explicit construction)
        const [sy, sm, sd] = startDate.split('-').map(Number);
        const startObj = new Date(sy, sm - 1, sd);
        
        const [ey, em, ed] = endDate.split('-').map(Number);
        const endObj = new Date(ey, em - 1, ed);

        // 2. Production Date Conversion (Must be precise for Trip Grouping)
        let finalShootDate = undefined;
        if (shootDate) {
            const [shy, shm, shd] = shootDate.split('-').map(Number);
            finalShootDate = new Date(shy, shm - 1, shd);
        }

        const newTask: Task = {
            id: initialData ? initialData.id : crypto.randomUUID(),
            type: 'CONTENT',
            title,
            description,
            remark,
            status: status as Status,
            priority,
            tags,
            
            // Dates
            startDate: startObj,
            endDate: endObj,
            isUnscheduled: isStock,

            // Content Fields (Crucial for Weekly Quests)
            channelId,
            targetPlatforms: targetPlatforms, // Array format is key for Quest Matching
            pillar: pillar as ContentPillar,
            contentFormat: contentFormat as ContentFormat,
            category,
            publishedLinks,

            // Production Info (Crucial for Trip Manager)
            shootDate: finalShootDate,
            shootLocation: shootLocation.trim() || undefined,

            // People
            ideaOwnerIds,
            editorIds,
            assigneeIds, // Support

            // Assets & Script
            assets,
            performance,
            scriptId, // Linkage
            
            // Defaults
            difficulty: 'MEDIUM',
            estimatedHours: 0,
            assigneeType: 'TEAM'
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
        setter(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const addAsset = (newAsset: TaskAsset) => setAssets(prev => [...prev, newAsset]);
    const removeAsset = (id: string) => setAssets(prev => prev.filter(a => a.id !== id));

    return {
        // State
        title, setTitle,
        description, setDescription,
        remark, setRemark,
        startDate, setStartDate,
        endDate, setEndDate,
        isStock, setIsStock,
        status, setStatus,
        priority, setPriority,
        
        channelId, setChannelId,
        targetPlatforms, 
        pillar, setPillar,
        contentFormat, setContentFormat,
        category, setCategory,
        publishedLinks, handleLinkChange,

        shootDate, setShootDate,
        shootLocation, setShootLocation,

        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        assigneeIds, setAssigneeIds,
        assets, 
        performance,
        scriptId, setScriptId,

        error,
        
        // Options
        formatOptions,
        pillarOptions,
        categoryOptions,
        statusOptions,

        // Actions
        handleSubmit,
        togglePlatform,
        toggleUserSelection,
        addAsset,
        removeAsset
    };
};
