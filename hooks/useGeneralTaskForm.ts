
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task, Status, Priority, MasterOption, Difficulty, AssigneeType } from '../types';

interface UseGeneralTaskFormProps {
    initialData?: Task | null;
    selectedDate?: Date | null;
    users: any[];
    masterOptions: MasterOption[];
    onSave: (task: Task) => void;
}

export const useGeneralTaskForm = ({ initialData, selectedDate, masterOptions, onSave }: UseGeneralTaskFormProps) => {
    // --- State ---
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    
    // Status & Dates
    const [status, setStatus] = useState<string>(''); 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Task Specifics
    const [assigneeType, setAssigneeType] = useState<AssigneeType>('INDIVIDUAL'); // Changed Default to INDIVIDUAL
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [targetPosition, setTargetPosition] = useState('');
    const [caution, setCaution] = useState('');
    const [importance, setImportance] = useState('');
    
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
            setStartDate(initialData.startDate ? format(initialData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            setEndDate(initialData.endDate ? format(initialData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
            
            setAssigneeType(initialData.assigneeType || 'INDIVIDUAL');
            setAssigneeIds(initialData.assigneeIds || []);
            setTargetPosition(initialData.targetPosition || '');
            setCaution(initialData.caution || '');
            setImportance(initialData.importance || '');
            
            setDifficulty(initialData.difficulty || 'MEDIUM');
            setEstimatedHours(initialData.estimatedHours || 0);
        } else {
            // Defaults
            setTitle('');
            setDescription('');
            
            const defaultStatus = taskStatusOptions.find(o => o.isDefault)?.key || (taskStatusOptions.length > 0 ? taskStatusOptions[0].key : 'TODO');
            setStatus(defaultStatus);
            
            const defaultDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
            setStartDate(defaultDate);
            setEndDate(defaultDate);
            
            setAssigneeType('INDIVIDUAL'); // Ensure Default is Solo
            setAssigneeIds([]);
            setTargetPosition('');
            setCaution('');
            setImportance('');
            
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
            priority: 'MEDIUM', // Task always medium or calculated
            tags: [],
            
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
            
            // Gamification
            difficulty,
            estimatedHours,
            
            // Empty Content Fields
            assets: [],
            reviews: [],
            logs: []
        };

        onSave(newTask);
    };

    const toggleUserSelection = (userId: string) => {
        if (assigneeType === 'INDIVIDUAL') {
            // Only allow one
            setAssigneeIds(prev => prev.includes(userId) ? [] : [userId]);
        } else {
            // Allow multiple
            setAssigneeIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
        }
    };

    return {
        title, setTitle,
        description, setDescription,
        status, setStatus,
        startDate, setStartDate,
        endDate, setEndDate,
        
        assigneeType, setAssigneeType,
        assigneeIds, setAssigneeIds,
        targetPosition, setTargetPosition,
        caution, setCaution,
        importance, setImportance,
        
        difficulty, setDifficulty,
        estimatedHours, setEstimatedHours,
        
        error,
        taskStatusOptions,
        handleSubmit,
        toggleUserSelection
    };
};
