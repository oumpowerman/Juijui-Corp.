import React from 'react';
import { motion } from 'framer-motion';
import { ContentAlertToggleCard } from './ContentAlertToggleCard';
import { LeadTimeConfigCard } from './LeadTimeConfigCard';
import { LookbackConfigCard } from './LookbackConfigCard';
import { StatusGateConfigCard } from './StatusGateConfigCard';
import { ChannelScopeConfigCard } from './ChannelScopeConfigCard';
import { PreReleaseTabProps } from '../../types';

export const PreReleaseTab: React.FC<PreReleaseTabProps> = ({
    isEnabled,
    setIsEnabled,
    leadMinutes,
    setLeadMinutes,
    maxLookbackHours,
    setMaxLookbackHours,
    masterOptions,
    requiredStatuses,
    handleToggleStatus,
    handleBatchSelectStatuses,
    channels,
    targetChannels,
    setTargetChannels,
    handleToggleChannel,
}) => {
    return (
        <motion.div
            id="pre-release-tab-content"
            key="pre-release-tab"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
        >
            {/* 1.1 Master Toggle */}
            <ContentAlertToggleCard
                isEnabled={isEnabled}
                onToggle={(val) => setIsEnabled(val)}
            />

            {/* 1.2 Time Configs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LeadTimeConfigCard
                    leadMinutes={leadMinutes}
                    onChange={(val) => setLeadMinutes(val)}
                />

                <LookbackConfigCard
                    maxLookbackHours={maxLookbackHours}
                    onChangeLookback={(val) => setMaxLookbackHours(val)}
                />
            </div>

            {/* 1.3 Ready Status Gate */}
            <StatusGateConfigCard
                masterOptions={masterOptions}
                requiredStatuses={requiredStatuses}
                onToggleStatus={handleToggleStatus}
                onBatchSelect={handleBatchSelectStatuses}
            />

            {/* 1.4 Channel Scope */}
            <ChannelScopeConfigCard
                channels={channels}
                targetChannels={targetChannels}
                onSelectAll={() => setTargetChannels('ALL')}
                onToggleChannel={handleToggleChannel}
            />
        </motion.div>
    );
};
