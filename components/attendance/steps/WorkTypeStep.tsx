import React, { useState } from 'react';
import { Building2, Home, Briefcase, ChevronRight, Check, MapPin, Search } from 'lucide-react';
import { WorkLocation, LocationDef } from '../../../types/attendance';
import { useGlobalDialog } from '../../../context/GlobalDialogContext';

interface WorkTypeStepProps {
    matchedLocation?: LocationDef;
    onSelect: (type: WorkLocation, customName?: string) => void;
    approvedWFH?: boolean;
    allLocations?: any[]; // All configured locations in the system
}

const WorkTypeStep: React.FC<WorkTypeStepProps> = ({ 
    matchedLocation, onSelect, approvedWFH, allLocations = [] 
}) => {
    const { showAlert } = useGlobalDialog();
    const [showOnsiteSelector, setShowOnsiteSelector] = useState(false);
    const [selectedOnsiteLoc, setSelectedOnsiteLoc] = useState('');
    const [customOnsiteText, setCustomOnsiteText] = useState('');

    const handleSelectOffice = () => {
        if (!matchedLocation) {
            showAlert(
                'คุณไม่ได้อยู่ในพิกัดของออฟฟิศหลักที่ลงทะเบียนไว้ในระบบครับ\n\nหากคุณกำลังออกปฏิบัติงานนอกสถานที่ (เช่น ถ่ายทำภาพยนตร์, นัดประชุม) กรุณาเลือก "ทำงานนอกสถานที่ (On Site)" หรือหากอนุมัติการทำงานระยะไกลให้เลือก "Work From Home"',
                'อยู่นอกพื้นที่พิกัดออฟฟิศ'
            );
            return;
        }
        onSelect('OFFICE');
    };

    // Filter locations to only show shoot locations (or all) for reference
    const shootLocations = allLocations.filter(loc => loc.type === 'SHOOT_LOCATION' || loc.type === 'WORK_LOCATION');

    const handleConfirmOnsite = () => {
        let finalName = 'On Site';
        if (selectedOnsiteLoc && selectedOnsiteLoc !== 'CUSTOM') {
            const loc = shootLocations.find(l => l.id === selectedOnsiteLoc);
            if (loc) finalName = loc.name;
        } else if (selectedOnsiteLoc === 'CUSTOM' && customOnsiteText.trim()) {
            finalName = customOnsiteText.trim();
        }
        onSelect('SITE', finalName);
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
            <p className="text-sm font-bold text-gray-500 mb-1">เลือกประเภทการเข้างาน (Work Mode)</p>
            
            {/* 1. Office Option */}
            {!showOnsiteSelector && (
                <button 
                    onClick={handleSelectOffice}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                        matchedLocation
                        ? 'border-indigo-100 bg-indigo-50/50 hover:border-indigo-300 cursor-pointer' 
                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Building2 className="w-6 h-6"/></div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base">เข้าออฟฟิศหลัก (Office)</h4>
                            <p className="text-xs text-gray-500">
                                {matchedLocation ? `📍 อยู่ใกล้พิกัด: ${matchedLocation.name}` : 'อยู่นอกพื้นที่สำนักงานออฟฟิศหลัก ❌'}
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
            )}

            {/* 2. Work From Home Option */}
            {!showOnsiteSelector && (
                <button 
                    onClick={() => onSelect('WFH')}
                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${
                        approvedWFH 
                        ? 'border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200' 
                        : 'border-blue-100 bg-blue-50/50 hover:border-blue-300'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shadow-sm ${approvedWFH ? 'bg-blue-500 text-white' : 'bg-white text-blue-600'}`}>
                            <Home className="w-6 h-6"/>
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                                Work From Home
                                {approvedWFH && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">อนุมัติแล้ว</span>}
                            </h4>
                            <p className="text-xs text-gray-500">
                                {approvedWFH ? 'สิทธิ์ได้รับการอนุมัติในระบบแล้ว' : '⚠️ ไม่ได้รับสิทธิ์ล่วงหน้า (หัก 5 HP)'}
                            </p>
                        </div>
                    </div>
                    {approvedWFH ? <Check className="w-6 h-6 text-blue-600" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
                </button>
            )}

            {/* 3. On-site (Outside) option */}
            {!showOnsiteSelector ? (
                <button 
                    onClick={() => setShowOnsiteSelector(true)}
                    className="w-full p-4 rounded-2xl border-2 border-orange-100 bg-orange-50/50 hover:border-orange-300 cursor-pointer flex items-center justify-between transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm"><Briefcase className="w-6 h-6"/></div>
                        <div className="text-left">
                            <h4 className="font-bold text-gray-800 text-sm sm:text-base">ทำงานนอกสถานที่ / ออกกอง (On-site)</h4>
                            <p className="text-xs text-gray-500">ปฏิบัติงานต่างจังหวัด, ไปพบลูกค้า หรือเข้ากองถ่าย</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
            ) : (
                /* Collapsed Shoot Location selector to keep GPS tracking reliable on Onsite checkins */
                <div className="p-5 border-2 border-orange-200 bg-orange-50/30 rounded-3xl space-y-4 animate-in slide-in-from-bottom-3 duration-300">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            ระบุพิกัดปฏิบัติงานนอกสถานที่
                        </h4>
                        <button 
                            onClick={() => setShowOnsiteSelector(false)} 
                            className="text-xs font-bold text-gray-400 hover:text-gray-600"
                        >
                            ย้อนกลับ
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">เลือกจุดลงเวลานอกสถานที่ในระบบ:</label>
                            <select
                                value={selectedOnsiteLoc}
                                onChange={e => {
                                    setSelectedOnsiteLoc(e.target.value);
                                    if (e.target.value !== 'CUSTOM') setCustomOnsiteText('');
                                }}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none bg-white focus:border-orange-400"
                            >
                                <option value="">-- ไม่ระบุชื่อพิกัด (ใช้ตำแหน่ง GPS ปัจจุบัน) --</option>
                                {shootLocations.map(loc => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name} {loc.type === 'WORK_LOCATION' ? '(ออฟฟิศสาขา)' : '(สถานที่ถ่ายทำ)'}
                                    </option>
                                ))}
                                <option value="CUSTOM">-- พิมพ์ระบุสถานที่เอง --</option>
                            </select>
                        </div>

                        {selectedOnsiteLoc === 'CUSTOM' && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <label className="block text-xs font-bold text-gray-500 mb-1">ระบุชื่อสถานที่ทำงานนอกสถานที่:</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none bg-white focus:border-orange-400"
                                    placeholder="เช่น รพ.กรุงเทพ, ร้านกาแฟ Starbuck สาขา..."
                                    value={customOnsiteText}
                                    onChange={e => setCustomOnsiteText(e.target.value)}
                                />
                            </div>
                        )}

                        <button
                            onClick={handleConfirmOnsite}
                            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Check className="w-4 h-4" />
                            ยืนยันลงเวลาแบบ On-site
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkTypeStep;
