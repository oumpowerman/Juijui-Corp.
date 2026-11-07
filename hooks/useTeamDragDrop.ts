import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Task } from '../types';

interface UseTeamDragDropProps {
    tasks: Task[];
    onTaskMove: (taskId: string, newAssigneeId: string, newDate: Date) => void;
    onTaskDuplicate?: (taskId: string, targetUserId: string, targetDate: Date) => void;
    onDragStartExtra?: (taskId: string, clickDate: Date) => void;
}

export const useTeamDragDrop = ({
    tasks,
    onTaskMove,
    onTaskDuplicate,
    onDragStartExtra,
}: UseTeamDragDropProps) => {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isAltDraggingRef = useRef<boolean>(false);
    const lastDropTimeRef = useRef<number>(0);

    // Keep Alt key state synchronized even if user presses/releases Alt mid-drag
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt' || e.altKey) {
                isAltDraggingRef.current = true;
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt' || !e.altKey) {
                isAltDraggingRef.current = false;
            }
        };
        const handleGlobalDragEnd = () => {
            setDraggedTaskId(null);
            setIsDragging(false);
            isAltDraggingRef.current = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('dragend', handleGlobalDragEnd);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, []);

    // 1. Start Dragging
    const handleDragStart = useCallback((e: React.DragEvent, taskId: string, clickDate?: Date) => {
        setDraggedTaskId(taskId);
        setIsDragging(true);
        isAltDraggingRef.current = e.altKey;

        // Allow both Move and Copy (Alt + Drag)
        e.dataTransfer.effectAllowed = 'copyMove';
        e.dataTransfer.setData('text/plain', taskId);
        e.dataTransfer.setData('taskId', taskId);
        
        if (onDragStartExtra && clickDate) {
            onDragStartExtra(taskId, clickDate);
        }
    }, [onDragStartExtra]);

    // 2. Drag End (Cleanup)
    const handleDragEnd = useCallback(() => {
        setDraggedTaskId(null);
        setIsDragging(false);
        isAltDraggingRef.current = false;
    }, []);

    // 3. Drag Over (Allow Drop & Switch Cursor Effect for Alt)
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        isAltDraggingRef.current = e.altKey;
        e.dataTransfer.dropEffect = e.altKey ? 'copy' : 'move';
    }, []);

    // 4. Drop (Execute Move or Alt + Duplicate with Debounce Guard)
    const handleDrop = useCallback((e: React.DragEvent, targetUserId: string, targetDate: Date) => {
        e.preventDefault();
        e.stopPropagation();

        // Debounce guard (prevent duplicate drop triggers within 250ms)
        const now = Date.now();
        if (now - lastDropTimeRef.current < 250) {
            return;
        }
        lastDropTimeRef.current = now;

        const isAltDuplicate = e.altKey || isAltDraggingRef.current;
        isAltDraggingRef.current = false;

        const taskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('taskId') || draggedTaskId;
        
        if (taskId && targetUserId && targetDate) {
            if (isAltDuplicate && onTaskDuplicate) {
                onTaskDuplicate(taskId, targetUserId, targetDate);
            } else {
                onTaskMove(taskId, targetUserId, targetDate);
            }
        }
        
        // Cleanup
        setDraggedTaskId(null);
        setIsDragging(false);
    }, [draggedTaskId, onTaskMove, onTaskDuplicate]);

    return {
        draggedTaskId,
        isDragging,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDrop
    };
};
