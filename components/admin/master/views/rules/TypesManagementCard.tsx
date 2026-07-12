import React from 'react';
import { Heart, Edit2, Trash2, Info, AlertCircle, CalendarDays, UserCheck, Gamepad2, Settings } from 'lucide-react';
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
        <div key={opt.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 group hover:border-indigo-200 hover:bg-indigo-50/10 transition-all relative">
            <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full border border-white shadow-sm shrink-0 ${opt.color?.split(' ')[0] || 'bg-gray-400'}`}></div>
                <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black text-gray-700">{opt.label}</span>
                    {opt.color && (
                        <span className="text-[9px] text-gray-400 font-bold">{opt.color}</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm p-0.5 absolute right-2 md:relative md:right-0 md:bg-transparent md:border-0 md:shadow-none md:p-0">
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
        <div id="types-management-card" className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between h-full">
            <div>
                {/* Header Section */}
                <div className="px-6 py-5 border-b border-gray-100 bg-indigo-50/20 flex justify-between items-center">
                    <div>
                        <h3 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                            <Heart className="w-5 h-5 text-rose-500 animate-pulse" />
                            การจัดการประเภทวันลา & สถานะระบบ
                        </h3>
                        <p className="text-[11px] text-gray-400 font-bold mt-0.5">กำหนดประเภทการลา และสถานะเช็คอินหลักของพนักงาน</p>
                    </div>
                </div>
                
                {/* Columns Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Attendance Statuses */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-indigo-500" /> สถานะการเข้างาน (Attendance Types)
                            </h4>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/30">
                                {attendanceTypes.length} รายการ
                            </span>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {attendanceTypes.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl text-xs font-medium text-slate-400">
                                    ไม่มีข้อมูลสถานะการเข้างาน
                                </div>
                            ) : (
                                attendanceTypes.map(opt => renderListItem(opt))
                            )}
                        </div>
                        <button 
                            id="btn-create-attendance-type"
                            onClick={() => onCreate('ATTENDANCE_TYPE')} 
                            className="w-full py-2.5 bg-indigo-50/50 border-2 border-dashed border-indigo-100/70 text-indigo-600 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 text-xs font-black transition-all flex items-center justify-center gap-1.5 outline-none"
                        >
                            + เพิ่มสถานะเช็คอิน
                        </button>
                    </div>

                    {/* Leave Types */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between pb-1">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4 text-rose-500" /> ประเภทการลา (Leave Types)
                            </h4>
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/30">
                                {leaveTypes.length} รายการ
                            </span>
                        </div>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {leaveTypes.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-slate-100 rounded-xl text-xs font-medium text-slate-400">
                                    ไม่มีข้อมูลประเภทการลา
                                </div>
                            ) : (
                                leaveTypes.map(opt => renderListItem(opt))
                            )}
                        </div>
                        <button 
                            id="btn-create-leave-type"
                            onClick={() => onCreate('LEAVE_TYPE')} 
                            className="w-full py-2.5 bg-rose-50/50 border-2 border-dashed border-rose-100/70 text-rose-600 rounded-xl hover:border-rose-300 hover:bg-rose-50 text-xs font-black transition-all flex items-center justify-center gap-1.5 outline-none"
                        >
                            + เพิ่มประเภทการลา
                        </button>
                    </div>
                </div>
            </div>

            {/* Policy & Rule Mapping Help Section */}
            <div className="mx-6 mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
                    <Info className="w-4 h-4 text-indigo-500" />
                    <span>💡 คู่มือเกณฑ์คำนวณ ขาด / ลา / สาย</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100/80 space-y-1">
                        <span className="font-extrabold text-indigo-900 block">⏰ เกณฑ์เช็คอินสาย (Late Buffer)</span>
                        <p className="text-slate-500 font-medium">คำนวณอัตโนมัติเมื่อพนักงานเช็คอินเลยเวลาเริ่มงานบวกระยะผ่อนปรน (เช่น 10:15 น.) หากสายจะเปลี่ยนสถานะเป็น <b className="text-amber-600 font-bold">"สาย"</b> ทันที</p>
                    </div>
                    
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100/80 space-y-1">
                        <span className="font-extrabold text-rose-900 block">❌ การขาดงานและการลางาน (Absence & Leave)</span>
                        <p className="text-slate-500 font-medium">หากพนักงานไม่มีสถิติเวลาเช็คอินในวันทำงาน ระบบจะทำเครื่องหมาย <b className="text-red-600 font-bold">"ขาดงาน"</b> เว้นแต่จะมีการยื่นเรื่องส่งใบขอ <b className="text-indigo-600 font-bold">"ลางาน"</b> ที่ได้รับการอนุมัติ</p>
                    </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        เกณฑ์เหล่านี้ใช้สำหรับระบุสถานะและจำแนกวินัยพนักงานในรายงาน
                    </span>
                    <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100/40 px-2.5 py-1 rounded-lg text-[10px] font-black text-indigo-700 self-start sm:self-auto">
                        <Gamepad2 className="w-3 h-3 text-indigo-500" /> ปรับคะแนนหรือเหรียญที่หัก: หน้า Game Tuner
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TypesManagementCard;
