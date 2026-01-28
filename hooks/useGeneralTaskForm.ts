
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, Status, Priority, MasterOption, Difficulty, AssigneeType } from '../types';

interface UseGeneralTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: any[];
    masterOptions: MasterOption[];
    onSave: (task: Task) => void;
    projects?: Task[]; // Add projects prop
}

export const useGeneralTaskForm = ({ initialData, selectedDate, masterOptions, onSave, projects = [] }: UseGeneralTaskFormProps) => {
    // --- State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    // Status & Dates
    const [status, setStatus] = useState<string>(''); 
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Task Specifics
    const [assigneeType, setAssigneeType] = useState<AssigneeType>('INDIVIDUAL'); 
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [targetPosition, setTargetPosition] = useState('');
    const [caution, setCaution] = useState('');
    const [importance, setImportance] = useState('');
    
    // Hidden Fields (Preservation) & Linking
    const [contentId, setContentId] = useState<string | undefined>(undefined);
    const [showOnBoard, setShowOnBoard] = useState(false);
    
    // Gamification
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const [estimatedHours, setEstimatedHours] = useState<number>(0);

    const [error, setError] = useState('');

    const taskStatusOptions = masterOptions.filter(o => o.type === 'TASK_STATUS' && o.isActive).sort((a,b) => a.sortOrder - b.sortOrder);

    // --- Initialization ---
    useEffect(() => {
        if (initialData && initialData.type === 'TASK') {
            setTitle(initialData.title);
            setDescription(initialData.description);
            setStatus(initialData.status);
            setPriority(initialData.priority);
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            
            setAssigneeType(initialData.assigneeType || 'INDIVIDUAL');
            setAssigneeIds(initialData.assigneeIds || []);
            setTargetPosition(initialData.targetPosition || '');
            setCaution(initialData.caution || '');
            setImportance(initialData.importance || '');
            
            // Link & Board State
            setContentId(initialData.contentId);
            setShowOnBoard(initialData.showOnBoard || false);
            
            setDifficulty(initialData.difficulty || 'MEDIUM');
            setEstimatedHours(initialData.estimatedHours || 0);
        } else {
            // Defaults
            setTitle('');
            setDescription('');
            
            const defaultStatus = taskStatusOptions.find(o => o.isDefault)?.key || (taskStatusOptions.length > 0 ? taskStatusOptions[0].key : 'TODO');
            setStatus(defaultStatus);
            setPriority('MEDIUM');
            
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            
            setAssigneeType('INDIVIDUAL'); 
            setAssigneeIds([]);
            setTargetPosition('');
            setCaution('');
            setImportance('');
            
            setContentId(undefined);
            setShowOnBoard(false);
            
            setDifficulty('MEDIUM');
            setEstimatedHours(0);
        }
        setError('');
    }, [initialData, selectedDate, masterOptions]);

    // --- Handlers ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            setError('อย่าลืมตั้งชื่องานนะ!');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setError('วันเริ่มต้องมาก่อนวันจบสิครับผม');
            return;
        }

        const newTask: Task = {
            id: initialData ? initialData.id : crypto.randomUUID(),
            type: 'TASK',
            title,
            description,
            status: status as Status, 
            priority,
            tags: initialData?.tags || [], // Preserve Tags
            
            // Dates
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isUnscheduled: false,

            // People & Type
            assigneeType,
            assigneeIds,
            targetPosition: assigneeType === 'INDIVIDUAL' ? targetPosition : undefined,
            
            // Details
            caution,
            importance,
            
            // Context / Parent Link (CRITICAL FIX)
            contentId: contentId,
            showOnBoard: showOnBoard,
            
            // Gamification
            difficulty,
            estimatedHours,
            
            // Empty Content Fields
            assets: initialData?.assets || [],
            reviews: initialData?.reviews || [],
            logs: []
        };

        onSave(newTask);
    };

    const toggleUserSelection = (userId: string) => {
        if (assigneeType === 'INDIVIDUAL') {
            setAssigneeIds(prev => prev.includes(userId) ? [] : [userId]);
        } else {
            setAssigneeIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
        }
    };
    
    const handleSetParentProject = (id: string | null) => {
        setContentId(id || undefined);
    };

    return {
        title, setTitle,
        description, setDescription,
        status, setStatus,
        priority, setPriority,
        startDate, setStartDate,
        endDate, setEndDate,
        
        assigneeType, setAssigneeType,
        assigneeIds, setAssigneeIds,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        
        contentId, handleSetParentProject,
        
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        
        error,
        taskStatusOptions,
        handleSubmit,
        toggleUserSelection
    };
};
