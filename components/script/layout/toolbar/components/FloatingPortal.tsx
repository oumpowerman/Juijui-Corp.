import React, { useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';

interface FloatingPortalProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'right';
}

export const FloatingPortal: React.FC<FloatingPortalProps> = ({ 
    isOpen, 
    onClose, 
    anchorRef, 
    children, 
    className = '', 
    align = 'right' 
}) => {
    const [pos, setPos] = useState({ top: 0, left: 0, right: 0 });
    const [isReady, setIsReady] = useState(false);

    useLayoutEffect(() => {
        if (isOpen && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPos({
                top: rect.bottom + 8,
                left: rect.left,
                right: window.innerWidth - rect.right
            });
            setIsReady(true);
        } else {
            setIsReady(false);
        }
    }, [isOpen, anchorRef]);

    if (!isOpen) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 z-[10010]" onClick={onClose} />
            <div 
                style={{ 
                    position: 'fixed',
                    top: pos.top,
                    left: align === 'left' ? pos.left : 'auto',
                    right: align === 'right' ? pos.right : 'auto',
                    opacity: isReady ? 1 : 0,
                    zIndex: 10011
                }} 
                className={className} 
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </>,
        document.body
    );
};
