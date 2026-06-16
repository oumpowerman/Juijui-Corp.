
import React from 'react';
import { format } from 'date-fns';
import th from 'date-fns/locale/th';
import { ChevronLeft, ChevronRight, Search, Calendar, Briefcase, UserX, UserCheck } from 'lucide-react';

interface TimesheetHeaderProps {
    viewMode: 'WEEK' | 'MONTH';
    setViewMode: (mode: 'WEEK' | 'MONTH') => void;
    dateRange: Date[];
    onNav: (offset: number) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterDepartment: string;
    setFilterDepartment: (dept: string) => void;
    departments: string[];
    showInactive: boolean;
    setShowInactive: (show: boolean) => void;
}

const TimesheetHeader: React.FC<TimesheetHeaderProps> = ({
    viewMode,
    setViewMode,
    dateRange,
    onNav,
    searchTerm,
    setSearchTerm,
    filterDepartment,
    setFilterDepartment,
    departments,
    showInactive,
    setShowInactive
}) => {
    return (
        <div className="bg-slate-900 rounded-3xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-slate-800 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            
            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6 relative z-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/30 text-indigo-400 shrink-0">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <div className="w-full text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Timesheet Central</h2>
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-500 text-[10px] font-black uppercase tracking-widest">{viewMode}</span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md w-full sm:w-fit">
                            <button onClick={() => onNav(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all" aria-label="สัปดาห์ก่อนหน้า"><ChevronLeft className="w-4 h-4"/></button>
                            <span className="text-[12px] sm:text-sm font-black min-w-[130px] sm:min-w-[180px] text-center px-1 sm:px-2">
                                {format(dateRange[0], 'd MMM', { locale: th })} - {format(dateRange[dateRange.length-1], 'd MMM yyyy', { locale: th })}
                            </span>
                            <button onClick={() => onNav(1)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all" aria-label="สัปดาห์ถัดไป"><ChevronRight className="w-4 h-4"/></button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-center gap-3 w-full xl:w-auto">
                     <button 
                        onClick={() => setShowInactive(!showInactive)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border w-full sm:w-auto cursor-pointer select-none bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 active:scale-95"
                        title={showInactive ? "ซ่อนสมาชิกที่ลาออก" : "แสดงสมาชิกที่ลาออก"}
                    >
                        {showInactive ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <UserX className="w-4 h-4" />}
                        {showInactive ? 'SHOWING INACTIVE' : 'HIDE INACTIVE'}
                    </button>

                     <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 flex w-full sm:w-auto">
                        <button 
                            onClick={() => setViewMode('WEEK')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === 'WEEK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            WEEKLY
                        </button>
                        <button 
                            onClick={() => setViewMode('MONTH')}
                            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${viewMode === 'MONTH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            MONTHLY
                        </button>
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <select 
                            value={filterDepartment}
                            onChange={e => setFilterDepartment(e.target.value)}
                            className="appearance-none w-full bg-slate-800 border border-slate-700 text-slate-300 py-2.5 pl-9 pr-8 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
                        >
                            <option value="ALL">ทุกแผนก (All Teams)</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>

                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="ค้นหาชื่อลูกทีม..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-200"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimesheetHeader;
