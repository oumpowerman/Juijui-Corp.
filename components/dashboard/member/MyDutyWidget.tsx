
import React, { useMemo } from 'react';
import { User, Duty, ViewMode, AnnualHoliday } from '../../../types';
import { format, isWeekend } from 'date-fns';

// Sub-components
import AbandonedState from './duty-widgets/AbandonedState';
import TribunalState from './duty-widgets/TribunalState';
import ActiveState from './duty-widgets/ActiveState';
import CompletedState from './duty-widgets/CompletedState';
import IdleState from './duty-widgets/IdleState';

interface MyDutyWidgetProps {
    duties: Duty[];
    currentUser: User;
    users: User[];
    onNavigate: (view: ViewMode) => void;
    onFixNegligence?: (duty: Duty) => void;
    calendarMetadata?: {
        annualHolidays: AnnualHoliday[];
        calendarExceptions: any[];
    };
}

const MyDutyWidget: React.FC<MyDutyWidgetProps> = ({ duties, currentUser, users, onNavigate, onFixNegligence, calendarMetadata }) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const today = new Date();
    today.setHours(0,0,0,0);

    // Helper to check today's status
    const todayStatus = useMemo(() => {
        if (!calendarMetadata) return { isHoliday: false, name: '' };
        
        const exception = calendarMetadata.calendarExceptions.find(e => e.date === todayStr);
        if (exception) {
            return { 
                isHoliday: exception.type === 'HOLIDAY', 
                name: exception.description || (exception.type === 'HOLIDAY' ? 'วันหยุดพิเศษ' : 'วันทำงานพิเศษ') 
            };
        }

        const holiday = calendarMetadata.annualHolidays.find(h => h.day === today.getDate() && h.month === today.getMonth() + 1 && h.isActive);
        if (holiday) return { isHoliday: true, name: holiday.name };

        if (isWeekend(today)) return { isHoliday: true, name: 'วันหยุดสุดสัปดาห์' };

        return { isHoliday: false, name: '' };
    }, [calendarMetadata, todayStr, today]);

    // 1. Get ALL duties for today
    const todaysDuties = useMemo(() => 
        duties.filter(d => {
            if (!d.date) return false;
            const dutyDateStr = format(new Date(d.date), 'yyyy-MM-dd');
            return dutyDateStr === todayStr;
        }),
    [duties, todayStr]);

    // 2. Check if current user has duty TODAY
    const myDutiesToday = todaysDuties.filter(d => d.assigneeId === currentUser.id && !d.isDone);
    const myCompletedDutyToday = todaysDuties.find(d => d.assigneeId === currentUser.id && d.isDone);
    const hasMyDutyToday = myDutiesToday.length > 0;

    // 3. CRITICAL CHECK: Find Missed Duties
    const tribunalDuties = useMemo(() => duties.filter(d => d.assigneeId === currentUser.id && d.penaltyStatus === 'AWAITING_TRIBUNAL'), [duties, currentUser]);
    
    const abandonedDuties = useMemo(() => duties.filter(d => 
        d.assigneeId === currentUser.id && 
        d.penaltyStatus === 'ABANDONED' && 
        !d.clearedBySystem
    ), [duties, currentUser]);

    // 4. Find Next Duty (Future)
    const nextDuty = useMemo(() => {
        return duties
            .filter(d => {
                if (!d.date) return false;
                const dutyDateStr = format(new Date(d.date), 'yyyy-MM-dd');
                return d.assigneeId === currentUser.id && dutyDateStr > todayStr;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
    }, [duties, currentUser, todayStr]);

    // --- PRIORITY 1: ABANDONED (SHAME LIST) ---
    if (abandonedDuties.length > 0) {
        return <AbandonedState abandonedDuty={abandonedDuties[0]} onFixNegligence={onFixNegligence} onNavigate={onNavigate} />;
    }

    // --- PRIORITY 2: TRIBUNAL (LAST CHANCE) ---
    if (tribunalDuties.length > 0) {
        return <TribunalState onNavigate={onNavigate} />;
    }

    // --- CASE 3: I HAVE DUTY TODAY (Active Mode) ---
    if (hasMyDutyToday) {
        return <ActiveState myDuty={myDutiesToday[0]} onNavigate={onNavigate} />;
    }

    // --- CASE 3.5: MISSION ACCOMPLISHED ---
    if (myCompletedDutyToday) {
        return (
            <CompletedState 
                completedDuty={myCompletedDutyToday} 
                nextDuty={nextDuty} 
                todaysDuties={todaysDuties} 
                users={users} 
                onNavigate={onNavigate} 
            />
        );
    }

    // --- CASE 4: NO DUTY (Idle Mode) ---
    return (
        <IdleState 
            todayStatus={todayStatus} 
            nextDuty={nextDuty} 
            todaysDuties={todaysDuties} 
            users={users} 
            onNavigate={onNavigate} 
        />
    );
};

export default MyDutyWidget;
