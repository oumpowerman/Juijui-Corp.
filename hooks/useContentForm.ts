
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, Status, Priority, ContentPillar, ContentFormat, Platform, TaskAsset, Channel, MasterOption, TaskPerformance } from '../types';

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
    const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
    const [tags, setTags] = useState<string[]>([]);
    
    // Content Specifics
    const [channelId, setChannelId] = useState<string>('');
    const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
    const [pillar, setPillar] = useState<string>('');
    const [contentFormat, setContentFormat] = useState<string>('');
    const [category, setCategory] = useState('');
    const [publishedLinks, setPublishedLinks] = useState<Record<string, string>>({}); 

    // People
    const [ideaOwnerIds, setIdeaOwnerIds] = useState<string[]>([]);
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]); // Support/Sub
    
    // Other
    const [assets, setAssets] = useState<TaskAsset[]>([]);
    const [performance, setPerformance] = useState<TaskPerformance | undefined>(undefined);
    
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
            setTargetPlatforms(initialData.targetPlatforms || []);
            setPillar(initialData.pillar || '');
            setContentFormat(initialData.contentFormat || '');
            setCategory(initialData.category || '');
            setPublishedLinks(initialData.publishedLinks || {});

            setIdeaOwnerIds(initialData.ideaOwnerIds || []);
            setEditorIds(initialData.editorIds || []);
            setAssigneeIds(initialData.assigneeIds || []);
            
            setAssets(initialData.assets || []);
            setPerformance(initialData.performance);
        } else {
            // Defaults for New Content
            setTitle('');
            setDescription('');
            setRemark('');
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            setIsStock(false);
            
            // Set Default Status
            const defaultStatus = statusOptions.find(o => o.isDefault)?.key || (statusOptions.length > 0 ? statusOptions[0].key : 'TODO');
            setStatus(defaultStatus);
            
            setPriority(Priority.MEDIUM);
            setTags([]);
            
            // Default Channel
            if (channels.length > 0) setChannelId(channels[0].id);
            else setChannelId('');

            setTargetPlatforms(['YOUTUBE', 'FACEBOOK', 'TIKTOK', 'INSTAGRAM']);
            setPillar(pillarOptions.find(o => o.isDefault)?.key || '');
            setContentFormat(formatOptions.find(o => o.isDefault)?.key || '');
            
            const defaultCat = categoryOptions.find(o => o.isDefault);
            setCategory(defaultCat ? defaultCat.key : '');
            
            setIdeaOwnerIds([]);
            setEditorIds([]);
            setAssigneeIds([]);
            setAssets([]);
            setPerformance(undefined);
            setPublishedLinks({});
        }
        setError('');
    }, [initialData, selectedDate, channels, masterOptions]); // Re-run when these change

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
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isUnscheduled: isStock,

            // Content Fields
            channelId,
            targetPlatforms,
            pillar: pillar as ContentPillar,
            contentFormat: contentFormat as ContentFormat,
            category,
            publishedLinks,

            // People
            ideaOwnerIds,
            editorIds,
            assigneeIds, // Support

            // Assets & Metrics
            assets,
            performance,
            
            // Defaults for Gamification (Hidden in Content Form)
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

        ideaOwnerIds, setIdeaOwnerIds,
        editorIds, setEditorIds,
        assigneeIds, setAssigneeIds,
        assets, 
        performance,

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
