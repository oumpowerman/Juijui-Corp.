
import { supabase } from '../../lib/supabase';
import { Duty, User, DutyConfig } from '../../types';
import { useToast } from '../../context/ToastContext';
import { addDays, getDay, format, isWeekend } from 'date-fns';

export const useDutyRandomizer = (configs: DutyConfig[], calendarMetadata: any) => {
    const { showToast } = useToast();

    const isDayWorking = (date: Date): boolean => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const exception = calendarMetadata.calendarExceptions.find((e: any) => e.date === dateStr);
        if (exception) return exception.type === 'WORK_DAY';
        const isAnnual = calendarMetadata.annualHolidays.some((h: any) => h.day === date.getDate() && h.month === (date.getMonth() + 1));
        if (isAnnual) return false;
        return !isWeekend(date);
    };

    const calculateRandomDuties = async (startDate: Date, mode: 'ROTATION' | 'DURATION', weeksToGenerate: number, activeUsers: User[]) => {
        if (activeUsers.length === 0) return [];

        const endDate = addDays(startDate, weeksToGenerate * 7);
        const { data: leaves } = await supabase
            .from('leave_requests')
            .select('user_id, start_date, end_date')
            .eq('status', 'APPROVED')
            .gte('end_date', format(startDate, 'yyyy-MM-dd'))
            .lte('start_date', format(endDate, 'yyyy-MM-dd'));

        const isUserOnLeaveOnDate = (userId: string, date: Date) => {
            if (!leaves) return false;
            const d = format(date, 'yyyy-MM-dd');
            return leaves.some(l => l.user_id === userId && d >= l.start_date && d <= l.end_date);
        };

        const shuffle = (array: User[]) => {
            let currentIndex = array.length, randomIndex;
            const newArray = [...array];
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
            }
            return newArray;
        };

        let userQueue = shuffle(activeUsers); 
        const assignedUserIds = new Set<string>();
        
        const getNextUsers = (count: number, date: Date): User[] => {
            const selected: User[] = [];
            let attempts = 0;
            const maxAttempts = userQueue.length * 2;

            while (selected.length < count && attempts < maxAttempts) {
                attempts++;
                if (userQueue.length === 0) {
                    userQueue = shuffle(activeUsers);
                }
                const user = userQueue[0];
                if (isUserOnLeaveOnDate(user.id, date)) {
                    userQueue.push(userQueue.shift()!);
                    continue;
                }
                selected.push(userQueue.shift()!);
                assignedUserIds.add(user.id);
            }

            if (selected.length < count) {
                const remainingNeeded = count - selected.length;
                for (let i = 0; i < remainingNeeded; i++) {
                    if (userQueue.length === 0) userQueue = shuffle(activeUsers);
                    const user = userQueue.shift()!;
                    selected.push(user);
                    assignedUserIds.add(user.id);
                }
            }
            return selected;
        };

        const draftDuties: Duty[] = [];
        let currentGenDate = new Date(startDate);
        let daysGenerated = 0;
        const targetWorkDays = weeksToGenerate * 5; 

        while (true) {
            if (mode === 'DURATION') {
                if (daysGenerated >= targetWorkDays) break;
            } else if (mode === 'ROTATION') {
                if (assignedUserIds.size >= activeUsers.length && daysGenerated % 5 === 0) break;
                if (daysGenerated > activeUsers.length * 5) break; 
            }
            if (daysGenerated > 60) break; 

            if (isDayWorking(currentGenDate)) {
                let dayNum = getDay(currentGenDate);
                if (dayNum === 0 || dayNum === 6) dayNum = 5; 

                const config = configs.find(c => c.dayOfWeek === dayNum) || { 
                    dayOfWeek: dayNum, requiredPeople: 1, taskTitles: ['เวรประจำวัน'] 
                };

                const peopleNeeded = config.requiredPeople;
                const assignedUsers = getNextUsers(peopleNeeded, currentGenDate);

                assignedUsers.forEach((user, idx) => {
                    let title = config.taskTitles[idx];
                    if (!title || title.trim() === '') {
                        title = config.taskTitles[0] || 'เวรประจำวัน';
                        if (peopleNeeded > 1) title += ` (${idx + 1})`;
                    }
                    draftDuties.push({
                        id: crypto.randomUUID(),
                        title,
                        assigneeId: user.id,
                        date: new Date(currentGenDate),
                        isDone: false
                    });
                });
                daysGenerated++;
            }
            currentGenDate = addDays(currentGenDate, 1);
        }
        return draftDuties;
    };

    const saveDuties = async (newDuties: Duty[]) => {
        try {
            if (newDuties.length === 0) return;
            const dates = newDuties.map(d => d.date.getTime());
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            const startStr = format(minDate, 'yyyy-MM-dd');
            const endStr = format(maxDate, 'yyyy-MM-dd');

            await supabase.from('duties').delete().gte('date', startStr).lte('date', endStr);
            
            const payload = newDuties.map(d => ({
                title: d.title,
                assignee_id: d.assigneeId,
                date: format(d.date, 'yyyy-MM-dd'),
                is_done: d.isDone
            }));

            const { error } = await supabase.from('duties').insert(payload);
            if (error) throw error;
            showToast('บันทึกตารางเวรเรียบร้อย 🎉', 'success');
        } catch (err: any) {
            showToast('บันทึกไม่สำเร็จ: ' + err.message, 'error');
        }
    };

    return {
        calculateRandomDuties,
        saveDuties
    };
};
