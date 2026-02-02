
import React from 'react';

interface DraggableTaskProps {
    taskId: string;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
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
            className={`cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${className}`}
            style={{ touchAction: 'none' }} // Help mobile browsers understand dragging
        >
            {children}
        </div>
    );
};

export default DraggableTask;
