import React, { useState } from 'react';
import { Copy, X, Loader2, Minus, Plus } from 'lucide-react';
import { InventoryItem } from '../../types';

interface AssetCloneModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: InventoryItem;
    onClone: (asset: InventoryItem, amount: number) => Promise<boolean>;
}

const AssetCloneModal: React.FC<AssetCloneModalProps> = ({ isOpen, onClose, asset, onClone }) => {
    const [amount, setAmount] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleClone = async () => {
        setIsSubmitting(true);
        const success = await onClone(asset, amount);
        setIsSubmitting(false);
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 relative animate-in zoom-in-95">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
                        <Copy className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800">ทำสำเนา (Clone Asset)</h3>
                    <p className="text-sm text-gray-500 mt-1 px-4">
                        คุณกำลังจะสร้างสำเนาของ <br/><span className="font-bold text-indigo-600">"{asset.name}"</span>
                    </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6 flex flex-col items-center">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">จำนวนที่ต้องการเพิ่ม</label>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setAmount(Math.max(1, amount - 1))}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                        >
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-3xl font-black text-gray-800 w-12 text-center">{amount}</span>
                        <button 
                            onClick={() => setAmount(Math.min(50, amount + 1))}
                            className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleClone}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
                    ยืนยันการทำสำเนา
                </button>
            </div>
        </div>
    );
};

export default AssetCloneModal;