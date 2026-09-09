import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useContentAlertRules } from '../../../../hooks/useContentAlertRules';
import {
    ContentAlertHeader,
    ContentAlertSubNav,
    PreReleaseTab,
    DailySummaryTab,
    LineIntegrationTab,
    ContentAlertRulesViewProps,
} from './content-alert';

const ContentAlertRulesView: React.FC<ContentAlertRulesViewProps> = (props) => {
    const {
        // Active Sub Tab
        activeSubTab,
        setActiveSubTab,

        // State: Pre-Release
        isEnabled,
        setIsEnabled,
        leadMinutes,
        setLeadMinutes,
        maxLookbackHours,
        setMaxLookbackHours,
        requiredStatuses,
        targetChannels,
        setTargetChannels,
        targetDestination,
        setTargetDestination,

        // State: Daily Summary
        isDailyAlertEnabled,
        setIsDailyAlertEnabled,
        dailyAlertTime,
        setDailyAlertTime,
        dailyOverdueExcludedStatuses,

        // State: Channels & Statuses
        channels,
        channelScopeBadge,
        activeRequiredCount,
        activeExcludedCount,

        // Loading states
        isSaving,
        isTestingAlert,
        isTestingOverdueSummary,

        // Handlers
        handleToggleStatus,
        handleBatchSelectStatuses,
        handleToggleExcludedStatus,
        handleBatchSelectExcludedStatuses,
        handleToggleChannel,
        handleSave,
        handleTestPreReleaseNotification,
        handleTestOverdueSummary,
    } = useContentAlertRules(props);

    const { masterOptions } = props;

    return (
        <div id="content-alert-rules-view" className="space-y-6">
            {/* Top Hero Banner & Unified Actions */}
            <ContentAlertHeader
                isEnabled={isEnabled || isDailyAlertEnabled}
                isSaving={isSaving}
                isTestingAlert={isTestingAlert}
                isTestingOverdueSummary={isTestingOverdueSummary}
                onSave={handleSave}
                onTestNotification={handleTestPreReleaseNotification}
                onTestOverdueSummary={handleTestOverdueSummary}
            />

            {/* Horizontal Sub-Navigation Tabs (3 Feature-Centric Sections) */}
            <ContentAlertSubNav
                activeTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
                leadMinutes={leadMinutes}
                dailyAlertTime={dailyAlertTime}
                isDailyAlertEnabled={isDailyAlertEnabled}
                requiredStatusCount={activeRequiredCount}
                channelScopeCount={channelScopeBadge}
                isPreReleaseEnabled={isEnabled}
                excludedStatusCount={activeExcludedCount}
            />

            {/* Sub-Tab Content with Smooth Animated Transitions */}
            <div className="min-h-[420px]">
                <AnimatePresence mode="wait">
                    {/* TAB 1: เตือนก่อนคลิปลง (Pre-Release Alert) */}
                    {activeSubTab === 'PRE_RELEASE' && (
                        <PreReleaseTab
                            isEnabled={isEnabled}
                            setIsEnabled={setIsEnabled}
                            leadMinutes={leadMinutes}
                            setLeadMinutes={setLeadMinutes}
                            maxLookbackHours={maxLookbackHours}
                            setMaxLookbackHours={setMaxLookbackHours}
                            masterOptions={masterOptions}
                            requiredStatuses={requiredStatuses}
                            handleToggleStatus={handleToggleStatus}
                            handleBatchSelectStatuses={handleBatchSelectStatuses}
                            channels={channels}
                            targetChannels={targetChannels}
                            setTargetChannels={setTargetChannels}
                            handleToggleChannel={handleToggleChannel}
                        />
                    )}

                    {/* TAB 2: สรุปค้างลงประจำวัน (Daily Overdue Summary) */}
                    {activeSubTab === 'DAILY_SUMMARY' && (
                        <DailySummaryTab
                            isDailyAlertEnabled={isDailyAlertEnabled}
                            setIsDailyAlertEnabled={setIsDailyAlertEnabled}
                            dailyAlertTime={dailyAlertTime}
                            setDailyAlertTime={setDailyAlertTime}
                            dailyOverdueExcludedStatuses={dailyOverdueExcludedStatuses}
                            handleToggleExcludedStatus={handleToggleExcludedStatus}
                            handleBatchSelectExcludedStatuses={handleBatchSelectExcludedStatuses}
                            masterOptions={masterOptions}
                        />
                    )}

                    {/* TAB 3: ปลายทาง LINE & ทดสอบระบบ (LINE Integration & Testing) */}
                    {activeSubTab === 'LINE_INTEGRATION' && (
                        <LineIntegrationTab
                            targetDestination={targetDestination}
                            setTargetDestination={setTargetDestination}
                            isTestingAlert={isTestingAlert}
                            isTestingOverdueSummary={isTestingOverdueSummary}
                            isSaving={isSaving}
                            leadMinutes={leadMinutes}
                            onTestPreRelease={handleTestPreReleaseNotification}
                            onTestOverdueSummary={handleTestOverdueSummary}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ContentAlertRulesView;
