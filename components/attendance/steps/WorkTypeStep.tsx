
import React from 'react';
import { Building2, Home, Briefcase, ChevronRight, Check } from 'lucide-react';
import { WorkLocation, LocationDef } from '../../../types/attendance';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface WorkTypeStepProps {
    matchedLocation?: LocationDef;
    onSelect: (type: WorkLocation) => void;
    approvedWFH?: boolean;
}

const WorkTypeStep: React.FC<WorkTypeStepProps> = ({ matchedLocation, onSelect, approvedWFH }) => {
    const { showAlert } = useGlobalDialog();
    
    const handleSelectOffice = () => {
        if (!matchedLocation) {
            showAlert(`คุณไม่ได้อยู่ในพื้นที่ Office หรือ Site งานที่กำหนดไว้ครับ \n\nกรุณาเลือก "On Site" หากออกกองนอกสถานที่ หรือ "WFH"`, 'อยู่นอกพื้นที่');
            return;
        }
        onSelect('OFFICE');
    };

    // Auto-suggest logic: If WFH is approved, we can highlight it. 
    // The user still clicks to confirm.

    return (
        <div className="space-y-3 animate-in slide-in-from-right-8 duration-300">
            <p className="text-sm text-gray-500 font-bold mb-2">เลือกรูปแบบการทำงาน</p>
            
            <button 
                onClick={handleSelectOffice}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    matchedLocation
                    ? 'border-indigo-100 bg-indigo-50 hover:border-indigo-300 cursor-pointer' 
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Building2 className="w-6 h-6"/></div>
                    <div className="text-left">
                        <h4 className="font-bold text-gray-800">เข้าออฟฟิศ (Office)</h4>
                        <p className="text-xs text-gray-500">
                            {matchedLocation ? `📍 ${matchedLocation.name}` : 'อยู่นอกพื้นที่ ❌'}
                        </p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>

            <button 
                onClick={() => onSelect('WFH')}
                className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                    approvedWFH 
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                    : 'border-blue-100 bg-blue-50 hover:border-blue-300'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl shadow-sm ${approvedWFH ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}>
                        <Home className="w-6 h-6"/>
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            Work From Home 
                            {approvedWFH && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">APPROVED</span>}
                        </h4>
                        <p className="text-xs text-gray-500">
                            {approvedWFH ? 'ได้รับอนุมัติแล้ว' : '⚠️ ไม่ได้ขออนุญาต (หัก 5 HP)'}
                        </p>
                    </div>
                </div>
                {approvedWFH ? <Check className="w-6 h-6 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
            </button>

            <button 
                onClick={() => onSelect('SITE')}
                className="w-full p-4 rounded-2xl border-2 border-orange-100 bg-orange-50 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm"><Briefcase className="w-6 h-6"/></div>
                    <div className="text-left">
                        <h4 className="font-bold text-gray-800">On Site / ข้างนอก</h4>
                        <p className="text-xs text-gray-500">ไปหาลูกค้า / ออกกอง</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
        </div>
    );
};

export default WorkTypeStep;
