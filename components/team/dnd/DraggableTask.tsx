import React from 'react';

interface DraggableTaskProps {
    taskId: string;
    onDragStart: (e: React.DragEvent, taskId: string, clickDate?: Date) => void;
    onDragEnd: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
    children: React.ReactNode;
    className?: string;
}

const DraggableTask: React.FC<DraggableTaskProps> = ({ 
    taskId, 
    onDragStart, 
    onDragEnd, 
    onContextMenu,
    children,
    className = ""
}) => {
    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'copyMove';
                onDragStart(e, taskId);
            }}
            onDragEnd={onDragEnd}
            onContextMenu={onContextMenu}
            title="คลิกขวาเพื่อจัดการงาน หรือกด Alt ค้างไว้แล้วลากเพื่อคัดลอกงาน (Duplicate)"
            className={`relative cursor-grab active:cursor-grabbing hover:scale-105 hover:z-50 transition-all ${className}`}
            style={{ touchAction: 'none' }} // Help mobile browsers understand dragging
        >
            {children}
        </div>
    );
};

export default DraggableTask;
