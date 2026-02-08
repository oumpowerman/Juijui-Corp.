
import React from 'react';
import { Box, Layers, Monitor } from 'lucide-react';
import { AssetType } from '../../../types';

interface Props {
    assetType: AssetType;
    setAssetType: (type: AssetType) => void;
}

const AssetTypeSelector: React.FC<Props> = ({ assetType, setAssetType }) => {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center">
                <Box className="w-3 h-3 mr-1"/> ประเภทพัสดุ (Asset Type)
            </label>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button 
                    type="button" 
                    onClick={() => setAssetType('NONE')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border flex flex-col items-center gap-1 transition-all ${assetType === 'NONE' ? 'bg-white text-gray-700 border-gray-300 shadow-sm' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <span className="text-base">💸</span>
                    ค่าใช้จ่ายทั่วไป
                </button>
                <button 
                    type="button" 
                    onClick={() => setAssetType('CONSUMABLE')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border flex flex-col items-center gap-1 transition-all ${assetType === 'CONSUMABLE' ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm' : 'border-transparent text-gray-400 hover:text-orange-600'}`}
                >
                    <Layers className="w-4 h-4" />
                    วัสดุสิ้นเปลือง
                </button>
                <button 
                    type="button" 
                    onClick={() => setAssetType('FIXED_ASSET')} 
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold border flex flex-col items-center gap-1 transition-all ${assetType === 'FIXED_ASSET' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 'border-transparent text-gray-400 hover:text-indigo-600'}`}
                >
                    <Monitor className="w-4 h-4" />
                    ทรัพย์สินถาวร
                </button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5 ml-1">
                {assetType === 'NONE' && 'ค่าบริการ, ค่ารถ, ค่าอาหาร หรือค่าใช้จ่ายที่ไม่มีตัวตน'}
                {assetType === 'CONSUMABLE' && 'ของที่ใช้แล้วหมดไป เช่น ทิชชู่, กระดาษ A4, ปากกา, ถ่านไฟฉาย'}
                {assetType === 'FIXED_ASSET' && 'ของที่คงทนถาวร อายุเกิน 1 ปี เช่น คอมพิวเตอร์, กล้อง, โต๊ะ, เก้าอี้'}
            </p>
        </div>
    );
};

export default AssetTypeSelector;
