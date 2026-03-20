import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import startOfWeek from 'date-fns/startOfWeek';
import endOfWeek from 'date-fns/endOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import endOfMonth from 'date-fns/endOfMonth';

export type TimeRange = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export type BadgeType = 'FIRE' | 'SHIELD' | 'SLEEPY' | 'RISK';

export interface LeaderboardEntry {
    user: User;
    rank: number;
    score: number;       
    missions: number;    
    penalties: number;   
    diffFromTop: number;
    diffFromNext: number;
    nextRankUser?: User; // Who is directly above me?
    badges: BadgeType[]; // Fun badges
}

export const useLeaderboard = (users: User[], currentUser: User) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('WEEKLY');
    const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        // กรองความซ้ำซ้อน: ถ้ายังไม่มีข้อมูล User ให้ข้ามไปก่อน
        if (users.length === 0) return;

        setIsLoading(true);
        try {
                        // For ALL_TIME, we don't need to fetch logs, we use the 'users' prop directly
            if (timeRange === 'ALL_TIME') {
                const allTimeSorted = [...users].filter(u => u.isActive).sort((a, b) => b.xp - a.xp);
                const allTimeEntries: LeaderboardEntry[] = allTimeSorted.map((u, index) => {
                    const badges: BadgeType[] = [];
                    if (u.level >= 5) badges.push('FIRE');
                    
                    return {
                        user: u,
                        rank: index + 1,
                        score: u.xp,
                        missions: 0, // Missions/Penalties not easily calculated for all-time without full log scan
                        penalties: 0,
                        diffFromTop: allTimeSorted[0].xp - u.xp,
                        diffFromNext: index > 0 ? allTimeSorted[index - 1].xp - u.xp : 0,
                        nextRankUser: index > 0 ? allTimeSorted[index - 1] : undefined,
                        badges: badges
                    };
                });
                setRankings(allTimeEntries);
                setIsLoading(false);
                return;
            }

            let query = supabase.from('game_logs').select('user_id, action_type, xp_change, created_at');

            // Date Filtering
            const now = new Date();
            let start: Date | null = null;
            let end: Date | null = null;

            if (timeRange === 'WEEKLY') {
                start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                end = endOfWeek(now, { weekStartsOn: 1 });
            } else if (timeRange === 'MONTHLY') {
                start = startOfMonth(now);
                end = endOfMonth(now);
            }

            if (start && end) {
                query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
            }

            const { data: logs, error } = await query;
            if (error) throw error;

            // Aggregation
            const statsMap = new Map<string, { xp: number, missions: number, penalties: number }>();
            
            // Initialize all active users with 0
            users.filter(u => u.isActive).forEach(u => {
                statsMap.set(u.id, { xp: 0, missions: 0, penalties: 0 });
            });

            if (logs) {
                logs.forEach((log: any) => {
                    const current = statsMap.get(log.user_id);
                    if (current) {
                        // XP Sum (Only count positive gain for Score)
                        if (log.xp_change > 0) current.xp += log.xp_change;
                        
                        // Missions Count (Completion)
                        if (['TASK_COMPLETE', 'DUTY_COMPLETE'].includes(log.action_type)) {
                            current.missions += 1;
                        }

                        // Penalty Count (Late/Missed)
                        if (['TASK_LATE', 'DUTY_MISSED', 'ATTENDANCE_ABSENT', 'ATTENDANCE_LATE'].includes(log.action_type)) {
                            current.penalties += 1;
                        }
                    }
                });
            }

            // Convert to Array & Sort
            const sorted = Array.from(statsMap.entries())
                .map(([userId, stat]) => {
                    const user = users.find(u => u.id === userId);
                    return user ? { user, ...stat } : null;
                })
                .filter(Boolean) as { user: User, xp: number, missions: number, penalties: number }[];

            // Sort by XP Desc
            sorted.sort((a, b) => b.xp - a.xp);

            // Calculate Thresholds for Badges (Dynamic relative to group)
            const maxMissions = Math.max(...sorted.map(s => s.missions), 1);

            // Map to LeaderboardEntry
            const entries: LeaderboardEntry[] = sorted.map((item, index) => {
                const prevScore = index > 0 ? sorted[index - 1].xp : item.xp;
                const topScore = sorted[0].xp;
                const nextRankUser = index > 0 ? sorted[index - 1].user : undefined;

                // --- BADGE LOGIC ---
                const badges: BadgeType[] = [];
                
                // 1. On Fire: High mission count (Top tier activity)
                if (item.missions > 0 && item.missions >= maxMissions * 0.8) {
                    badges.push('FIRE');
                }
                
                // 2. Iron Shield: Active but ZERO penalties
                if (item.missions >= 3 && item.penalties === 0) {
                    badges.push('SHIELD');
                }

                // 3. Risk Taker: High penalties
                if (item.penalties >= 3) {
                    badges.push('RISK');
                }

                // 4. Sleepy: No activity
                if (item.missions === 0 && item.xp === 0) {
                    badges.push('SLEEPY');
                }

                return {
                    user: item.user,
                    rank: index + 1,
                    score: item.xp,
                    missions: item.missions,
                    penalties: item.penalties,
                    diffFromTop: topScore - item.xp,
                    diffFromNext: prevScore - item.xp,
                    nextRankUser: nextRankUser,
                    badges: badges
                };
            });

            setRankings(entries);

        } catch (err) {
            console.error("Leaderboard error", err);
        } finally {
            setIsLoading(false);
        }
    }, [users, timeRange]);

    // Initial fetch and re-fetch when timeRange changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Dedicated Real-time subscription for game_logs
    useEffect(() => {
        const channel = supabase
            .channel('leaderboard-logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'game_logs' },
                () => {
                    // Only re-fetch if we are in a time-ranged view
                    // ALL_TIME is handled by the 'users' prop which is updated via useTeam's subscription
                    if (timeRange !== 'ALL_TIME') {
                        fetchStats();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [timeRange, fetchStats]); // ทำงานใหม่ถ้า User list เปลี่ยน หรือเปลี่ยนโหมดเวลา

    // Find current user stats
    const myStats = useMemo(() => rankings.find(r => r.user.id === currentUser.id), [rankings, currentUser]);
    const topThree = useMemo(() => rankings.slice(0, 3), [rankings]);
    const restList = useMemo(() => rankings.slice(3), [rankings]);

    return {
        rankings,
        topThree,
        restList,
        myStats,
        timeRange,
        setTimeRange,
        isLoading
    };
};
