import React from 'react';
import { motion, Variants } from 'framer-motion';
import { User } from '../../../../types';
import { AttendanceLog } from '../../../../types/attendance';
import AttendanceDistributionChart from './AttendanceDistributionChart';
import DailyAttendanceTrendChart from './DailyAttendanceTrendChart';
import CheckInTimeDistribution from './CheckInTimeDistribution';
import LeaderboardSection from './LeaderboardSection';

interface UserStat {
    userId: string;
    present: number;
    late: number;
    leaves: number;
    absent: number;
    totalHours: number;
    avgCheckIn: string;
    logs: AttendanceLog[];
}

interface AttendanceAnalyticsProps {
    users: User[];
    userStats: UserStat[];
    workingDaysInMonth: Date[];
    startTime: string;
    lateBuffer: number;
    currentMonth: Date;
    getGrade: (stat: UserStat) => { grade: string; color: string };
    onUserClick: (user: User, stat: UserStat) => void;
}

const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({
    users,
    userStats,
    workingDaysInMonth,
    startTime,
    lateBuffer,
    getGrade,
    onUserClick
}) => {
    // Framer Motion Animation Variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            {/* Top row: 2 main charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut Chart: Attendance Distribution */}
                <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
                    <AttendanceDistributionChart userStats={userStats} />
                </motion.div>

                {/* Spline Area Chart: Daily Trend */}
                <motion.div variants={itemVariants} className="lg:col-span-8 h-full">
                    <DailyAttendanceTrendChart 
                        workingDaysInMonth={workingDaysInMonth} 
                        userStats={userStats} 
                        startTime={startTime} 
                        lateBuffer={lateBuffer} 
                    />
                </motion.div>
            </div>

            {/* Second row: Bar chart & High quality Leaderboards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bar Chart: Check-In Distribution */}
                <motion.div variants={itemVariants} className="lg:col-span-5 h-full">
                    <CheckInTimeDistribution userStats={userStats} startTime={startTime} />
                </motion.div>

                {/* Leaderboards */}
                <motion.div variants={itemVariants} className="lg:col-span-7">
                    <LeaderboardSection 
                        users={users} 
                        userStats={userStats} 
                        getGrade={getGrade} 
                        onUserClick={onUserClick} 
                    />
                </motion.div>
            </div>
        </motion.div>
    );
};

export default AttendanceAnalytics;
