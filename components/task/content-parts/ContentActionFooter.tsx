import React from 'react';
import { Trash2, Send, X, Save, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

interface ContentActionFooterProps {
    mode: 'CREATE' | 'EDIT';
    onCancel: () => void;
    onDelete?: () => void;
    onSendQC?: () => void;
    
    isSaving: boolean;
    isSendingQC?: boolean;
    canSendQC?: boolean;
    isReadOnly?: boolean; // NEW
    
    showSendQC?: boolean;
    showDelete?: boolean;
}

const ContentActionFooter: React.FC<ContentActionFooterProps> = ({
    mode,
    onCancel,
    onDelete,
    onSendQC,
    isSaving,
    isSendingQC = false,
    canSendQC = false,
    isReadOnly = false, // NEW
    showSendQC = false,
    showDelete = false
}) => {
    return (
        <div className="flex flex-col gap-4 pt-6 mt-6 border-t border-gray-100 bg-white relative z-20 pb-safe-area">
            
            {/* Action Row */}
            <div className="flex items-center justify-between gap-2 sm:gap-3">
                
                {/* Left: Danger Zone */}
                <div className="shrink-0">
                    {showDelete && onDelete && !isReadOnly && (
                        <button 
                            type="button" 
                            onClick={onDelete} 
                            className="group flex items-center justify-center p-3 text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-2xl transition-all active:scale-95"
                            title="ลบงานนี้"
                        >
                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="hidden md:inline-block ml-2 text-xs font-medium">ลบ</span>
                        </button>
                    )}
                </div>

                {/* Right: Primary Actions */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
                    
                    {/* Send to QC Button */}
                    {showSendQC && onSendQC && (
                        <div className="relative group/qc">
                            <button 
                                type="button" 
                                onClick={onSendQC}
                                disabled={isSendingQC || !canSendQC || isReadOnly}
                                className={`
                                    relative overflow-hidden flex items-center justify-center gap-2 p-3 sm:px-5 sm:py-3 rounded-2xl text-sm font-bold transition-all shadow-sm active:scale-95 border-2
                                    ${(!canSendQC || isReadOnly)
                                        ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                                        : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-indigo-100'
                                    }
                                `}
                                title="ส่งตรวจ (QC)"
                            >
                                {isSendingQC ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className={`w-5 h-5 ${canSendQC && !isReadOnly ? 'group-hover/qc:-translate-y-0.5 group-hover/qc:translate-x-0.5 transition-transform' : ''}`} />
                                )}
                                <span className="hidden sm:inline-block whitespace-nowrap">ส่งตรวจ (QC)</span>
                            </button>
                            
                            {/* Disabled Tooltip */}
                            {!canSendQC && !isReadOnly && (
                                <div className="absolute bottom-full right-0 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover/qc:opacity-100 transition-opacity pointer-events-none z-50">
                                    เฉพาะผู้รับผิดชอบงานเท่านั้น
                                </div>
                            )}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>

                    {/* Cancel Button */}
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="p-3 sm:px-5 sm:py-3 text-md font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 hover:text-gray-700 rounded-2xl transition-colors active:scale-95 flex items-center justify-center"
                        title={isReadOnly ? "ปิด" : "ยกเลิก"}
                    >
                        <X className="w-5 h-5 sm:hidden" />
                        <span className="hidden sm:inline-block">{isReadOnly ? "ปิด" : "ยกเลิก"}</span>
                    </button>
                    
                    {/* Save Button (Primary) */}
                    {!isReadOnly && (
                        <button 
                            type="submit" 
                            disabled={isSaving}
                            className={`
                                group relative flex items-center justify-center gap-2 px-5 py-3 sm:px-8 sm:py-3 text-white font-medium text-md rounded-2xl shadow-xl transition-all active:scale-95 overflow-hidden flex-1 sm:flex-none
                                ${mode === 'CREATE' 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-200' 
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                                }
                                disabled:opacity-70 disabled:cursor-not-allowed
                            `}
                        >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>กำลังบันทึก...</span>
                                </>
                            ) : (
                                <>
                                    {mode === 'CREATE' ? <Save className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                    <span>{mode === 'CREATE' ? 'สร้างงานใหม่' : 'บันทึกแก้ไข'}</span>
                                    {mode === 'CREATE' && <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentActionFooter;