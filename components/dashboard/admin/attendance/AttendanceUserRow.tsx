import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Clock, UserX, Briefcase, FileText, MapPin } from 'lucide-react';
import { User } from '../../../../types';

interface AttendanceUserRowProps {
    user: User;
    log: any;
    statusClass: 'ON_TIME' | 'LATE' | 'LEAVE' | 'ABSENT';
    checkInStr: string;
    checkOutStr: string;
    workTypeDisplay: string;
    parsedNote: {
        proofUrl: string | null;
        location: { lat: number; lng: number } | null;
        locationName: string | null;
        reason: string | null;
        cleanNote: string;
    };
    index: number;
}

const AttendanceUserRow: React.FC<AttendanceUserRowProps> = ({
    user,
    log,
    statusClass,
    checkInStr,
    checkOutStr,
    workTypeDisplay,
    parsedNote,
    index
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200/60 transition-all gap-4"
        >
            <div className="flex items-center gap-3.5">
                <div className="relative">
                    <img 
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'} 
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-xl object-cover ring-2 ring-white border border-slate-200"
                    />
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        user.workStatus === 'ONLINE' ? 'bg-emerald-400' :
                        user.workStatus === 'MEETING' ? 'bg-indigo-400' :
                        user.workStatus === 'BUSY' ? 'bg-rose-400' : 'bg-slate-300'
                    }`} title={user.workStatus} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-sm">{user.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {user.position || 'พนักงาน'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                            {user.email}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="text-left sm:text-right space-y-0.5">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">เช็กอิน / เช็กเอาต์</p>
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                        <span className={statusClass === 'LATE' ? 'text-orange-600' : statusClass === 'ON_TIME' ? 'text-emerald-600' : 'text-slate-400'}>
                            {checkInStr}
                        </span>
                        <span className="text-slate-300">/</span>
                        <span className="text-slate-500">
                            {checkOutStr}
                        </span>
                    </div>
                </div>
                
                {log && (
                    <div className="text-left sm:text-right space-y-0.5">
                        <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider">รูปแบบงาน</p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                            workTypeDisplay === 'WFH' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                            workTypeDisplay === 'FIELD' ? 'bg-teal-50 border-teal-100 text-teal-600' :
                            workTypeDisplay === 'LEAVE' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                            'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                            {workTypeDisplay}
                        </span>
                    </div>
                )}
                
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                        statusClass === 'ON_TIME' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        statusClass === 'LATE' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        statusClass === 'LEAVE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                        {statusClass === 'ON_TIME' ? 'ตรงเวลา' :
                         statusClass === 'LATE' ? 'เข้าสาย' :
                         statusClass === 'LEAVE' ? 'ลา / WFH' : 'ยังไม่เข้าการเข้างาน'}
                    </span>
                </div>
            </div>
            
            {(parsedNote.cleanNote || parsedNote.proofUrl || parsedNote.locationName) && (
                <div className="w-full sm:w-auto flex items-center gap-1.5 bg-slate-100/60 p-2 rounded-xl border border-slate-200 self-start sm:self-center">
                    {parsedNote.proofUrl && (
                        <a 
                            href={parsedNote.proofUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="ดูเอกสารประกอบ"
                        >
                            <FileText className="w-3.5 h-3.5" />
                        </a>
                    )}
                    {parsedNote.location && (
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${parsedNote.location.lat},${parsedNote.location.lng}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            title={parsedNote.locationName || 'ดูพิกัด GPS'}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                        </a>
                    )}
                    {parsedNote.cleanNote && (
                        <p className="text-[11px] text-slate-500 font-medium px-2 max-w-[150px] truncate" title={parsedNote.cleanNote}>
                            "{parsedNote.cleanNote}"
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default AttendanceUserRow;
