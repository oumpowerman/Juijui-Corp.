
import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, HelpCircle, Info, MessageSquare } from 'lucide-react';
import { useGlobalDialog } from '../context/GlobalDialogContext';

const GlobalDialog: React.FC = () => {
    const { dialogState, closeDialog } = useGlobalDialog();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (dialogState.isOpen && dialogState.type === 'prompt') {
            setInputValue(dialogState.defaultValue || '');
        }
    }, [dialogState.isOpen, dialogState.type, dialogState.defaultValue]);

    if (!dialogState.isOpen) return null;

    const { type, title, message, onConfirm, onCancel } = dialogState;

    // Icon mapping
    const getIcon = () => {
        switch (type) {
            case 'confirm': return <HelpCircle className="w-10 h-10 text-indigo-500" />;
            case 'prompt': return <MessageSquare className="w-10 h-10 text-blue-500" />;
            case 'success': return <CheckCircle2 className="w-10 h-10 text-green-500" />;
            case 'error': return <AlertCircle className="w-10 h-10 text-red-500" />;
            default: return <Info className="w-10 h-10 text-blue-500" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'confirm': return 'border-indigo-100 bg-indigo-50/50';
            case 'prompt': return 'border-blue-100 bg-blue-50/50';
            case 'success': return 'border-green-100 bg-green-50/50';
            case 'error': return 'border-red-100 bg-red-50/50';
            default: return 'border-blue-100 bg-blue-50/50';
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95 duration-300 border-4 ${getColors()}`}>
                
                {/* Icon Wrapper */}
                <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100">
                        {getIcon()}
                    </div>
                </div>

                <div className="text-center mb-6">
                    {title && <h3 className="text-xl font-black text-gray-800 mb-2">{title}</h3>}
                    <p className="text-gray-600 text-sm leading-relaxed font-medium">
                        {message}
                    </p>
                </div>

                {type === 'prompt' && (
                    <div className="mb-6">
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full p-3 border-2 border-blue-100 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all font-medium text-gray-800"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (onConfirm) onConfirm(inputValue);
                                    else closeDialog();
                                }
                            }}
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    {type === 'confirm' || type === 'prompt' ? (
                        <>
                            <button 
                                onClick={() => { if(onCancel) onCancel(); else closeDialog(); }}
                                className="flex-1 py-3 text-gray-600 font-bold bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-sm"
                            >
                                ยกเลิก
                            </button>
                            <button 
                                onClick={() => { if(onConfirm) onConfirm(inputValue); else closeDialog(); }}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                            >
                                ตกลง
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => { if(onConfirm) onConfirm(); else closeDialog(); }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 text-sm"
                        >
                            รับทราบ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalDialog;
