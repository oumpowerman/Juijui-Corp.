import React, { useState } from 'react';

interface DroppableCellProps {
    userId: string;
    date: Date;
    onDragOver?: (e: React.DragEvent) => void;
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        onDragOver?.(e);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsOver(false);
        }
    };

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        onDrop(e, userId, date);
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDropInternal}
            className={`
                transition-colors duration-200 h-full w-full relative
                ${isOver ? 'bg-indigo-100 ring-2 ring-inset ring-indigo-300 z-30' : ''}
                ${className}
            `}
        >
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