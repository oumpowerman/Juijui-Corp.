
import { useState } from 'react';
import { Task, NotificationPreferences, TaskType } from '../types';
import { useToast } from '../context/ToastContext';

// Default preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
    newAssignments: true,
    upcomingDeadlines: true,
    taskCompletions: true,
    systemUpdates: false,
    emailAlerts: false,
};

const safeParse = (key: string, fallback: any) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        return fallback;
    }
};

export const useUI = () => {
    const { showToast } = useToast();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [lockedTaskType, setLockedTaskType] = useState<TaskType | null>(null); // New State

    const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>(() => {
        return safeParse('juijui_notification_prefs', DEFAULT_PREFERENCES);
    });

    const updateNotificationSettings = (p: NotificationPreferences) => {
        setNotificationSettings(p);
        localStorage.setItem('juijui_notification_prefs', JSON.stringify(p));
        showToast('Settings Updated (Local Only)', 'success');
    };

    // Updated to accept type for locking
    const handleAddTask = (type?: TaskType) => { 
        setEditingTask(null); 
        setSelectedDate(new Date());
        setLockedTaskType(type || null); // Lock type if provided
        setIsModalOpen(true); 
    };

    const handleEditTask = (t: Task) => { 
        setEditingTask(t); 
        setSelectedDate(null);
        setLockedTaskType(null); // Unlock when editing existing (usually)
        setIsModalOpen(true); 
    };

    const handleSelectDate = (d: Date, type?: TaskType) => { 
        setEditingTask(null); 
        setSelectedDate(d); 
        setLockedTaskType(type || null); // Pass Type to Lock
        setIsModalOpen(true); 
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Delay reset to avoid UI jumping during close animation
        setTimeout(() => setLockedTaskType(null), 300);
    };

    return {
        isModalOpen,
        setIsModalOpen,
        editingTask,
        setEditingTask,
        selectedDate,
        setSelectedDate,
        lockedTaskType, // Export
        notificationSettings,
        updateNotificationSettings,
        handleAddTask,
        handleEditTask,
        handleSelectDate,
        closeModal
    };
};
