import React from 'react';
import { motion } from 'framer-motion';
import { DailyOverdueConfigCard } from '../DailyOverdueConfigCard';
import { DailySummaryTabProps } from '../types';

export const DailySummaryTab: React.FC<DailySummaryTabProps> = ({
    isDailyAlertEnabled,
    setIsDailyAlertEnabled,
    dailyAlertTime,
    setDailyAlertTime,
    dailyOverdueExcludedStatuses,
    handleToggleExcludedStatus,
    handleBatchSelectExcludedStatuses,
    masterOptions,
}) => {
    return (
        <motion.div
            id="daily-summary-tab-content"
            key="daily-summary-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
        >
            <DailyOverdueConfigCard
                isDailyAlertEnabled={isDailyAlertEnabled}
                onToggleEnabled={(val) => setIsDailyAlertEnabled(val)}
                dailyAlertTime={dailyAlertTime}
                onChangeAlertTime={(val) => setDailyAlertTime(val)}
                excludedStatuses={dailyOverdueExcludedStatuses}
                onToggleExcludedStatus={handleToggleExcludedStatus}
                onBatchSelectExcludedStatuses={handleBatchSelectExcludedStatuses}
                masterOptions={masterOptions}
            />
        </motion.div>
    );
};
