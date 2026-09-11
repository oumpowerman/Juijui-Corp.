import React from 'react';
import { motion } from 'framer-motion';
import { LineDestinationCard } from './LineDestinationCard';
import { AlertDiagnosticsCard } from './AlertDiagnosticsCard';
import { AlertWorkflowGuideCard } from './AlertWorkflowGuideCard';
import { LineIntegrationTabProps } from '../../types';

export const LineIntegrationTab: React.FC<LineIntegrationTabProps> = ({
    targetDestination,
    setTargetDestination,
    isTestingAlert,
    isTestingOverdueSummary,
    isSaving,
    leadMinutes,
    onTestPreRelease,
    onTestOverdueSummary,
}) => {
    return (
        <motion.div
            id="line-integration-tab-content"
            key="line-integration-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
        >
            <LineDestinationCard
                targetDestination={targetDestination}
                onChangeDestination={(val) => setTargetDestination(val)}
            />

            {/* Live Testing & Diagnostics Card */}
            <AlertDiagnosticsCard
                isTestingAlert={isTestingAlert}
                isTestingOverdueSummary={isTestingOverdueSummary}
                isSaving={isSaving}
                leadMinutes={leadMinutes}
                onTestPreRelease={onTestPreRelease}
                onTestOverdueSummary={onTestOverdueSummary}
            />

            <AlertWorkflowGuideCard />
        </motion.div>
    );
};
