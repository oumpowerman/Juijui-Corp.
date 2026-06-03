import React, { useState, useEffect, useMemo } from 'react';
import { Gavel, SlidersHorizontal, ShieldAlert, AlertTriangle, ExternalLink, Scale, Clock } from 'lucide-react';
import { useTribunal } from '../../../hooks/useTribunal';
import { useTeam } from '../../../hooks/useTeam';
import { TribunalReport } from '../../../types';
import AdminTribunalReviewModal from '../../admin/AdminTribunalReviewModal';

interface TribunalReviewWidgetProps {
    currentUser: any;
}

const TribunalReviewWidget: React.FC<TribunalReviewWidgetProps> = ({ currentUser }) => {
    const { getReports, isLoading } = useTribunal(currentUser);
    const { allUsers: users } = useTeam();
    const [reports, setReports] = useState<TribunalReport[]>([]);
    const [isCtrlOpen, setIsCtrlOpen] = useState(false);

    const fetchPendingReports = async () => {
        try {
            const data = await getReports('PENDING');
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching dashboard pending reports:', error);
        }
    };

    // Load pending reports on mount and when modal closes/submits
    useEffect(() => {
        fetchPendingReports();
    }, [isCtrlOpen]);

    // Intelligence mapping for widget summary
    const metrics = useMemo(() => {
        const total = reports.length;
        const critical = reports.filter(r => r.category === 'property' || r.category === 'behavior').length;
        const warning = reports.filter(r => r.category === 'toilet' || r.category === 'kitchen' || r.category === 'other').length;
        
        const reportersCount: Record<string, number> = {};
        reports.forEach(r => {
            const matchedUser = users.find(u => u.id === r.reporter_id);
            const name = r.is_anonymous ? 'นิรนาม' : (matchedUser?.name || 'พนักงาน');
            reportersCount[name] = (reportersCount[name] || 0) + 1;
        });

        let topReporter = 'ไม่มี';
        let maxVal = 0;
        Object.entries(reportersCount).forEach(([name, val]) => {
            if (val > maxVal) {
                maxVal = val;
                topReporter = `${name} (${val} เรื่อง)`;
            }
        });

        return { total, critical, warning, topReporter };
    }, [reports, users]);

    return (
        <div className="bg-white rounded-3xl border border-slate-150 p-6 shadow-xs space-y-4 relative overflow-hidden text-left">
            {/* Subtle giant back banner gavel icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Gavel className="w-24 h-24 text-indigo-600" />
            </div>

            {/* Widget layout top Header */}
            <div className="flex items-center justify-between gap-3 relative z-10 text-left">
                <div className="flex items-center gap-3">
                    <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                        <Scale className="w-5 h-5 animate-pulse" />
                    </span>
                    <div className="text-left">
                        <h3 className="text-sm text-slate-800 font-bold">ศูนย์ศาลตัดสินเวรยาม</h3>
                        <p className="text-[10.5px] text-slate-400">รายการพฤติกรรมฟ้องและแก้ต่างในออฟฟิศ</p>
                    </div>
                </div>

                <span className="h-6 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] rounded-full flex items-center justify-center transition-colors font-semibold">
                    ค้างคา {reports.length} คดี
                </span>
            </div>

            {/* Micro Dashboard Insights row */}
            <div className="grid grid-cols-2 gap-2 text-left relative z-10">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase tracking-wider text-rose-500 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" /> ร้ายแรง/วิกฤต
                    </span>
                    <p className="text-base text-slate-850 mt-1 font-bold">{metrics.critical} เรื่อง</p>
                    <p className="text-[8.5px] text-slate-400">พฤติกรรม + ทำของพัง</p>
                </div>
                
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-w-0">
                    <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-indigo-550 shrink-0" /> ยื่นเรื่องบ่อยสุด
                    </span>
                    <p className="text-xs text-slate-750 mt-1.5 truncate font-bold">{metrics.topReporter}</p>
                    <p className="text-[8.5px] text-slate-400">ยื่นผ่านระบบศาลสัปดาห์นี้</p>
                </div>
            </div>

            {/* Launch Command center overlay CTA button */}
            <button 
                onClick={() => setIsCtrlOpen(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 active:scale-99 transition-all text-center focus:outline-none font-bold"
            >
                <SlidersHorizontal className="w-4 h-4" /> 
                เปิดบอร์ดศาลตัดสิน ({reports.length})
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </button>

            {/* Interactive Full Administrative Modal */}
            <AdminTribunalReviewModal 
                isOpen={isCtrlOpen} 
                onClose={() => setIsCtrlOpen(false)} 
                currentUser={currentUser} 
                allUsers={users}
            />
        </div>
    );
};

export default TribunalReviewWidget;
