
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useScriptContext } from '../core/ScriptContext';
import { Lock, Zap } from 'lucide-react';

interface EditorShellProps {
    children: React.ReactNode;
}

const EditorShell: React.FC<EditorShellProps> = ({ children }) => {
    const { isReadOnly, lockerUser, forceTakeover } = useScriptContext();

    return createPortal(
        <motion.div 
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col h-[100dvh] font-sans overflow-hidden"
        >
            {/* Lock Notification Banner */}
            {isReadOnly && (
                <div className="bg-amber-100 px-4 py-2 flex items-center justify-between text-amber-900 border-b border-amber-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-amber-200 rounded-full">
                            <Lock className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">Read-Only Mode:</span>
                            <div className="flex items-center gap-1 bg-white/50 px-2 py-0.5 rounded-full">
                                {lockerUser?.avatarUrl && <img src={lockerUser.avatarUrl} className="w-4 h-4 rounded-full" />}
                                <span className="text-xs">{lockerUser?.name || 'Unknown'}</span>
                            </div>
                            <span className="text-xs">กำลังแก้ไขอยู่</span>
                        </div>
                    </div>
                    <button 
                        onClick={forceTakeover}
                        className="flex items-center gap-1 bg-white border border-amber-300 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-50 shadow-sm active:scale-95 transition-all"
                    >
                        <Zap className="w-3 h-3" /> แย่งสิทธิ์ (Force Edit)
                    </button>
                </div>
            )}
            
            {children}
        </motion.div>,
        document.body
    );
};

export default EditorShell;
