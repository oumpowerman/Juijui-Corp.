import React, { useState, useEffect } from 'react';
import { Copy, ArrowDownCircle } from 'lucide-react';

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
    const [isAltOver, setIsAltOver] = useState(false);

    useEffect(() => {
        if (!isOver) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt' || e.altKey) setIsAltOver(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt' || !e.altKey) setIsAltOver(false);
        };
        const handleGlobalDragEnd = () => {
            setIsOver(false);
            setIsAltOver(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('dragend', handleGlobalDragEnd);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('dragend', handleGlobalDragEnd);
        };
    }, [isOver]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
        setIsAltOver(e.altKey);
        onDragOver?.(e);
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(true);
        setIsAltOver(e.altKey);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsOver(false);
            setIsAltOver(false);
        }
    };

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
        setIsAltOver(false);
        onDrop(e, userId, date);
    };

    const activeCellHighlight = isOver
        ? isAltOver
            ? 'bg-emerald-50/90 ring-2 ring-inset ring-emerald-300 z-30'
            : 'bg-indigo-100/80 ring-2 ring-inset ring-indigo-300 z-30'
        : '';

    return (
        <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDropInternal}
            className={`
                transition-colors duration-200 h-full w-full relative
                ${activeCellHighlight}
                ${className}
            `}
        >
            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 bg-white/55 backdrop-blur-[1px]">
                    {isAltOver ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-full shadow-lg border border-emerald-200 animate-bounce">
                            <Copy className="w-3.5 h-3.5 text-emerald-500" />
                            <span>คัดลอกวางที่นี่</span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs bg-white px-3 py-1.5 rounded-full shadow-lg border border-indigo-100 animate-bounce">
                            <ArrowDownCircle className="w-3.5 h-3.5 text-indigo-500" />
                            <span>วางที่นี่</span>
                        </span>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};

export default DroppableCell;