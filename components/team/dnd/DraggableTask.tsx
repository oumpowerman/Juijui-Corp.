
import React from 'react';

interface DraggableTaskProps {
    taskId: string;
    onDragStart: (e: React.DragEvent, taskId: string, clickDate?: Date) => void;
    onDragEnd: () => void;
    children: React.ReactNode;
    className?: string;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ 
    taskId, 
    onDragStart, 
    onDragEnd, 
    children,
    className = ""
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, taskId)}
            onDragEnd={onDragEnd}
            className={`relative cursor-grab active:cursor-grabbing hover:scale-105 hover:z-50 transition-all ${className}`}
            style={{ touchAction: 'none' }} // Help mobile browsers understand dragging
        >
            {children}
        </div>
    );
};

export default DraggableTask;
