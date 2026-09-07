import { format } from 'date-fns';
import { User } from '../../../../types';
import { UserStat, LateViewMode, DateFilterMode, GradeInfo } from '../types';

interface ExportCSVParams {
    filteredStats: UserStat[];
    userMap: Map<string, User>;
    getGrade: (stat: UserStat) => GradeInfo;
    lateViewMode: LateViewMode;
    dateFilterMode: DateFilterMode;
    currentMonth: Date;
    customStartDate: Date;
    customEndDate: Date;
}

export const exportAttendanceCSV = ({
    filteredStats,
    userMap,
    getGrade,
    lateViewMode,
    dateFilterMode,
    currentMonth,
    customStartDate,
    customEndDate
}: ExportCSVParams) => {
    // 1. Header
    const headers = [
        "Employee Name", 
        "Position", 
        "Days Present", 
        lateViewMode === 'HOURS' ? "Late Duration" : "Late Count", 
        "Leave Days", 
        "Total Hours", 
        "Performance Grade"
    ];
    
    // 2. Rows
    const rows = filteredStats.map(stat => {
        const user = userMap.get(stat.userId);
        const gradeInfo = getGrade(stat);
        
        let lateValue: string | number = stat.late;
        if (lateViewMode === 'HOURS') {
            const totalMins = stat.totalLateMinutes || 0;
            const hrs = Math.floor(totalMins / 60);
            const mins = totalMins % 60;
            lateValue = hrs > 0 ? `"${hrs}h ${mins}m"` : `"${mins}m"`;
        }

        return [
            `"${user?.name || 'Unknown'}"`,
            `"${user?.position || '-'}"`,
            stat.present,
            lateValue,
            stat.leaves,
            stat.totalHours.toFixed(2),
            `"${gradeInfo.grade}"`
        ].join(",");
    });

    // 3. Combine & Download
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const dateRangeStr = dateFilterMode === 'MONTH' 
        ? format(currentMonth, 'MMMM_yyyy') 
        : `${format(customStartDate, 'yyyy-MM-dd')}_to_${format(customEndDate, 'yyyy-MM-dd')}`;
    const fileName = `Attendance_Report_${dateRangeStr}.csv`;
    
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
