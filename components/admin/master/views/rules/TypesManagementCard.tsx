import React from 'react';
import { Heart, Edit2, Trash2 } from 'lucide-react';
import { MasterOption } from '../../../../../types';

interface TypesManagementCardProps {
    attendanceTypes: MasterOption[];
    leaveTypes: MasterOption[];
    onEdit: (option: MasterOption) => void;
    onDelete: (id: string) => void;
    onCreate: (type: string) => void;
    showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const TypesManagementCard: React.FC<TypesManagementCardProps> = ({
    attendanceTypes,
    leaveTypes,
    onEdit,
    onDelete,
    onCreate,
    showConfirm,
}) => {
    const renderListItem = (opt: MasterOption) => (
        <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 group hover:border-indigo-200 transition-all relative">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${opt.color?.split(' ')[0] || 'bg-gray-400'}`}></div>
                <span className="text-sm font-bold text-gray-700">{opt.label}</span>
            </div>
            <div className="flex items-center gap-3">
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm p-0.5 absolute right-2 md:relative md:right-0 md:bg-transparent md:border-0 md:shadow-none md:p-0">
                    <button 
                        onClick={() => onEdit(opt)} 
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-md transition-colors"
                        title="แก้ไขชื่อ/สี"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                        onClick={async () => { 
                            if (await showConfirm('ยืนยันลบรายการนี้?', 'ลบข้อมูล')) {
                                onDelete(opt.id); 
                            }
                        }} 
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md transition-colors"
                        title="ลบรายการ"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div id="types-management-card" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-gray-400" />
                    จัดการประเภทการลา & สถานะ (Types Management)
                </h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Attendance Types */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">สถานะการเข้างาน (Attendance Types)</h4>
                    <div className="space-y-3">
                        {attendanceTypes.map(opt => renderListItem(opt))}
                        <button 
                            id="btn-create-attendance-type"
                            onClick={() => onCreate('ATTENDANCE_TYPE')} 
                            className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition-all"
                        >
                            + เพิ่มสถานะ
                        </button>
                    </div>
                </div>

                {/* Leave Types */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">ประเภทการลา (Leave Types)</h4>
                    <div className="space-y-3">
                        {leaveTypes.map(opt => renderListItem(opt))}
                        <button 
                            id="btn-create-leave-type"
                            onClick={() => onCreate('LEAVE_TYPE')} 
                            className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl hover:border-indigo-300 hover:text-indigo-600 text-xs font-bold transition-all"
                        >
                            + เพิ่มประเภทลา
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypesManagementCard;
