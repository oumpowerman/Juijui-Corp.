import React from 'react';
import { MasterOption } from '../../../../../types';
import LocationMasterView from '../LocationMasterView';

interface LocationGeofencingCardProps {
    masterOptions: MasterOption[];
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onDelete: (id: string) => void;
}

const LocationGeofencingCard: React.FC<LocationGeofencingCardProps> = ({
    masterOptions,
    onAdd,
    onUpdate,
    onDelete,
}) => {
    return (
        <div id="location-geofencing-card" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-40 pointer-events-none"></div>
            
            <div className="relative z-10 space-y-4">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg sm:text-xl">ตั้งค่าพิกัดสำนักงาน & สาขาหลัก</h3>
                    <p className="text-xs text-gray-400 mt-1">
                        จัดการพิกัด GPS และรัศมีตรวจจับสำหรับออฟฟิศหลัก / สำนักงานใหญ่ทั้งหมดในระบบ เพื่อควบคุมสิทธิ์การลงเวลาเข้างานแบบออฟฟิศ
                    </p>
                </div>

                <LocationMasterView 
                    masterOptions={masterOptions}
                    onAdd={onAdd}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    type="WORK_LOCATION"
                />
            </div>
        </div>
    );
};

export default LocationGeofencingCard;
