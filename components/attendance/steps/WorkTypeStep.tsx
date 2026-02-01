
import React from 'react';
import { Building2, Home, Briefcase, ChevronRight } from 'lucide-react';
import { WorkLocation, LocationDef } from '../../../types/attendance';

interface WorkTypeStepProps {
    matchedLocation?: LocationDef;
    onSelect: (type: WorkLocation) => void;
}

const WorkTypeStep: React.FC<WorkTypeStepProps> = ({ matchedLocation, onSelect }) => {
    
    const handleSelectOffice = () => {
        if (!matchedLocation) {
            alert(`คุณไม่ได้อยู่ในพื้นที่ Office หรือ Site งานที่กำหนดไว้ครับ \n\nกรุณาเลือก "On Site" หากออกกองนอกสถานที่ หรือ "WFH"`);
            return;
        }
        onSelect('OFFICE');
    };

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
                className="w-full p-4 rounded-2xl border-2 border-blue-100 bg-blue-50 hover:border-blue-300 cursor-pointer flex items-center justify-between transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm"><Home className="w-6 h-6"/></div>
                    <div className="text-left">
                        <h4 className="font-bold text-gray-800">Work From Home</h4>
                        <p className="text-xs text-gray-500">ทำงานที่บ้าน</p>
                    </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
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
