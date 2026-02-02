
import React, { useState, useCallback } from 'react';
import { Task } from '../types';

interface UseTeamDragDropProps {
    tasks: Task[];
    onTaskMove: (taskId: string, newAssigneeId: string, newDate: Date) => void;
}

export const useTeamDragDrop = ({ tasks, onTaskMove }: UseTeamDragDropProps) => {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // 1. Start Dragging
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        setIsDragging(true);
        // Set data for transfer
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
        
        // Optional: Set ghost image opacity or style here if needed
    }, []);

    // 2. Drag End (Cleanup)
    const handleDragEnd = useCallback(() => {
        setDraggedTaskId(null);
        setIsDragging(false);
    }, []);

    // 3. Drag Over (Allow Drop)
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    // 4. Drop (Execute Move)
    const handleDrop = useCallback((e: React.DragEvent, targetUserId: string, targetDate: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        
        if (taskId && targetUserId && targetDate) {
            // Find current task to check if anything actually changed
            const currentTask = tasks.find(t => t.id === taskId);
            
            // Logic check: Is it valid move? (e.g. prevent dropping on same day same person)
            // But we generally allow it to trigger re-render or explicit update
            
            onTaskMove(taskId, targetUserId, targetDate);
        }
        
        // Cleanup
        setDraggedTaskId(null);
        setIsDragging(false);
    }, [tasks, onTaskMove]);

    return {
        draggedTaskId,
        isDragging,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop
    };
};
