import React from 'react';
import { Share2, X, Copy } from 'lucide-react';
import { GoogleDocsIcon } from '../components/GoogleDocsIcon';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    isPublic: boolean;
    handleToggleShare: () => void;
    magicLink: string;
    showToast: (message: string, type: 'success' | 'error') => void;
    isConnectedToDoc: boolean;
    setShowExportConfirm: (show: boolean) => void;
    handleConnectGoogle: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    isPublic,
    handleToggleShare,
    magicLink,
    showToast,
    isConnectedToDoc,
    setShowExportConfirm,
    handleConnectGoogle,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-indigo-600" /> แบ่งปันสคริปต์ (Share)
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                            <p className="font-bold text-gray-700 text-sm">Magic Link (Public View)</p>
                            <p className="text-xs text-gray-500">ใครที่มีลิงก์นี้สามารถอ่านบทได้</p>
                        </div>
                        <div 
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isPublic ? 'bg-green-500' : 'bg-gray-300'}`} 
                            onClick={handleToggleShare}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                        </div>
                    </div>

                    {isPublic && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">Your Link</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={magicLink} 
                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 focus:outline-none"
                                />
                                <button 
                                    onClick={() => { 
                                        navigator.clipboard.writeText(magicLink); 
                                        showToast('คัดลอกลิงก์แล้ว! ส่งให้เพื่อนได้เลย', 'success');
                                    }}
                                    className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 flex items-center"
                                >
                                    <Copy className="w-3 h-3 mr-1" /> Copy
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400">* นักแสดงสามารถเปิดลิงก์นี้ในมือถือเพื่อซ้อมบทได้ทันที (ไม่ต้องล็อกอิน)</p>
                        </div>
                    )}
                </div>

                {/* Google Docs Export Section */}
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3 mt-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100/60 rounded-xl text-blue-600">
                            <GoogleDocsIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-xs">Google Docs Integration</h4>
                            <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                                ส่งออกบทเนื้อหาสคริปต์ไปยัง Google Docs เพื่อทำการพิมพ์ ตรวจทาน หรือแชร์กับทีมงานทำงานร่วมกันแบบเรียลไทม์
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={isConnectedToDoc ? () => { onClose(); setShowExportConfirm(true); } : handleConnectGoogle}
                        className={`
                            w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all border shadow-sm
                            ${isConnectedToDoc 
                                ? 'bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-blue-100' 
                                : 'bg-white text-gray-700 border-gray-200 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50'
                            }
                        `}
                    >
                        <GoogleDocsIcon className={`w-3.5 h-3.5 ${isConnectedToDoc ? 'brightness-0 invert' : ''}`} />
                        <span>
                            {isConnectedToDoc ? 'Export to Google Doc' : 'Connect Google Docs'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
