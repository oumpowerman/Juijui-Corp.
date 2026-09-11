import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export const useCalendarMasterDomain = () => {
    const [annualHolidays, setAnnualHolidays] = useState<any[]>([]);
    const [calendarExceptions, setCalendarExceptions] = useState<any[]>([]);

    const loadCalendarData = useCallback(async () => {
        try {
            const [holidaysRes, exceptionsRes] = await Promise.all([
                supabase.from('annual_holidays').select('*'),
                supabase.from('calendar_exceptions').select('*')
            ]);

            if (holidaysRes.data) setAnnualHolidays(holidaysRes.data);
            if (exceptionsRes.data) setCalendarExceptions(exceptionsRes.data);
        } catch (err) {
            console.error('Failed to load calendar master data:', err);
        }
    }, []);

    return {
        annualHolidays,
        calendarExceptions,
        setAnnualHolidays,
        setCalendarExceptions,
        loadCalendarData
    };
};
