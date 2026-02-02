
import React, { useState } from 'react';

interface DroppableCellProps {
    userId: string;
    date: Date;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, userId: string, date: Date) => void;
    children: React.ReactNode;
    className?: string;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ 
    userId, 
    date, 
    onDragOver, 
    onDrop, 
    children,
    className = ""
}) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
    };

    const handleDropInternal = (e: React.DragEvent) => {
        setIsOver(false);
        onDrop(e, userId, date);
    };

    return (
        <div
            onDragOver={onDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDropInternal}
            className={`
                transition-colors duration-200 h-full w-full relative
                ${isOver ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-300 z-30' : ''}
                ${className}
            `}
        >
            {/* Visual Cue when dragging over */}
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 bg-white/50 backdrop-blur-[1px]">
                    <span className="text-indigo-600 font-bold text-xs bg-white px-3 py-1.5 rounded-full shadow-lg border border-indigo-100 animate-bounce">
                        วางที่นี่
                    </span>
                </div>
            )}
            {children}
        </div>
    );
};

export default DroppableCell;
