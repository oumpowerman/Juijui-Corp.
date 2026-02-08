
import React from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface Props {
    receiptUrl: string;
    setReceiptUrl: (url: string) => void;
    isUploading: boolean;
    isDriveReady: boolean;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ReceiptUploader: React.FC<Props> = ({ receiptUrl, setReceiptUrl, isUploading, isDriveReady, onFileChange }) => {
    return (
        <div className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${receiptUrl ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-white'}`}>
            {receiptUrl ? (
                <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 bg-white rounded-lg border border-green-200 flex items-center justify-center overflow-hidden">
                        <img src={receiptUrl} className="w-full h-full object-cover" alt="receipt" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-green-700 truncate">แนบใบเสร็จแล้ว</p>
                        <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] text-green-600 underline">ดูรูปภาพ</a>
                    </div>
                    <button type="button" onClick={() => setReceiptUrl('')} className="p-2 text-red-400 hover:bg-red-50 rounded-full"><X className="w-4 h-4"/></button>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center w-full">
                    {isUploading ? (
                        <div className="text-indigo-400 text-xs font-bold flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2"/> กำลังอัปโหลด...</div>
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-gray-300 mb-2" />
                            <p className="text-xs font-bold text-gray-500">คลิกเพื่อแนบใบเสร็จ / สลิป</p>
                            {!isDriveReady && <p className="text-[9px] text-orange-400 mt-1">Google Drive not ready</p>}
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={!isDriveReady || isUploading} />
                </label>
            )}
        </div>
    );
};

export default ReceiptUploader;
