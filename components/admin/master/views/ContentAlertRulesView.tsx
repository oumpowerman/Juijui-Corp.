import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption } from '../../../../types';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../context/ToastContext';

// Sub-components
import { ContentAlertHeader } from './content-alert/ContentAlertHeader';
import { ContentAlertSubNav, AlertSubTabId } from './content-alert/ContentAlertSubNav';
import { ContentAlertToggleCard } from './content-alert/ContentAlertToggleCard';
import { LeadTimeConfigCard } from './content-alert/LeadTimeConfigCard';
import { LookbackConfigCard } from './content-alert/LookbackConfigCard';
import { StatusGateConfigCard } from './content-alert/StatusGateConfigCard';
import { ChannelScopeConfigCard, ChannelOption } from './content-alert/ChannelScopeConfigCard';
import { LineDestinationCard } from './content-alert/LineDestinationCard';
import { AlertWorkflowGuideCard } from './content-alert/AlertWorkflowGuideCard';

interface ContentAlertRulesViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    saveMasterOptionsBulk?: (options: Partial<MasterOption>[]) => Promise<boolean>;
}

const ContentAlertRulesView: React.FC<ContentAlertRulesViewProps> = ({
    masterOptions,
    onUpdate,
    onAdd,
    saveMasterOptionsBulk,
}) => {
    const { showToast } = useToast();

    // Active Sub Tab
    const [activeSubTab, setActiveSubTab] = useState<AlertSubTabId>('TIMING');

    // Primary State
    const [isEnabled, setIsEnabled] = useState(true);
    const [leadMinutes, setLeadMinutes] = useState('30');
    const [requiredStatuses, setRequiredStatuses] = useState<string[]>(['APPROVE', 'DONE', 'FINAL']);
    const [targetDestination, setTargetDestination] = useState('');
    const [maxLookbackHours, setMaxLookbackHours] = useState('2');
    const [targetChannels, setTargetChannels] = useState('ALL');

    const [channels, setChannels] = useState<ChannelOption[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingAlert, setIsTestingAlert] = useState(false);

    // Fetch channels from database
    useEffect(() => {
        let isMounted = true;
        const fetchChannels = async () => {
            try {
                const { data } = await supabase
                    .from('channels')
                    .select('id, name, color')
                    .order('name');
                if (data && isMounted) {
                    setChannels(data);
                }
            } catch (err) {
                console.warn('Failed to load channels for content alert', err);
            }
        };
        fetchChannels();
        return () => {
            isMounted = false;
        };
    }, []);

    // Load initial options from masterOptions
    useEffect(() => {
        const enabledOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'CONTENT_ALERT_ENABLED'
        );
        const leadMinutesOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'CONTENT_ALERT_LEAD_MINUTES'
        );
        const requiredStatusOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'CONTENT_ALERT_REQUIRED_STATUS'
        );
        const targetDestOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'CONTENT_ALERT_TARGET_DESTINATION'
        );
        const lookbackOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'CONTENT_ALERT_MAX_LOOKBACK_HOURS'
        );
        const channelsOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'CONTENT_ALERT_TARGET_CHANNELS'
        );

        if (enabledOpt) setIsEnabled(enabledOpt.label === 'true');
        if (leadMinutesOpt) setLeadMinutes(leadMinutesOpt.label || '30');
        if (requiredStatusOpt) {
            const parsed = (requiredStatusOpt.label || 'APPROVE,DONE,FINAL')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (parsed.length > 0) {
                setRequiredStatuses(parsed);
            }
        }
        if (targetDestOpt) setTargetDestination(targetDestOpt.label || '');
        if (lookbackOpt) setMaxLookbackHours(lookbackOpt.label || '2');
        if (channelsOpt) setTargetChannels(channelsOpt.label || 'ALL');
    }, [masterOptions]);

    // Handle Status Toggle (supports exact key matching including emojis)
    const handleToggleStatus = (statusKey: string) => {
        if (requiredStatuses.includes(statusKey)) {
            const next = requiredStatuses.filter((s) => s !== statusKey);
            setRequiredStatuses(next.length > 0 ? next : [statusKey]);
        } else {
            setRequiredStatuses([...requiredStatuses, statusKey]);
        }
    };

    // Handle Batch Status Selection
    const handleBatchSelectStatuses = (statusKeys: string[]) => {
        setRequiredStatuses(statusKeys);
    };

    // Handle Channel Toggle
    const selectedChannelList = useMemo(() => {
        return targetChannels === 'ALL' ? [] : targetChannels.split(',').filter(Boolean);
    }, [targetChannels]);

    const handleToggleChannel = (channelId: string) => {
        if (targetChannels === 'ALL') {
            setTargetChannels(channelId);
            return;
        }

        if (selectedChannelList.includes(channelId)) {
            const next = selectedChannelList.filter((id) => id !== channelId);
            setTargetChannels(next.length > 0 ? next.join(',') : 'ALL');
        } else {
            setTargetChannels([...selectedChannelList, channelId].join(','));
        }
    };

    // Handle Save
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const optionsToSave: Partial<MasterOption>[] = [];

            const prepareOption = (key: string, label: string) => {
                const existing = masterOptions.find(
                    (o) => o.type === 'WORK_CONFIG' && o.key === key
                );
                if (existing) {
                    optionsToSave.push({
                        ...existing,
                        label,
                    });
                } else {
                    optionsToSave.push({
                        type: 'WORK_CONFIG',
                        key,
                        label,
                        color: '',
                        sortOrder: 99,
                        isActive: true,
                        isDefault: false,
                    });
                }
            };

            prepareOption('CONTENT_ALERT_ENABLED', isEnabled ? 'true' : 'false');
            prepareOption('CONTENT_ALERT_LEAD_MINUTES', leadMinutes || '30');
            prepareOption('CONTENT_ALERT_REQUIRED_STATUS', requiredStatuses.join(','));
            prepareOption('CONTENT_ALERT_TARGET_DESTINATION', targetDestination.trim());
            prepareOption('CONTENT_ALERT_MAX_LOOKBACK_HOURS', maxLookbackHours || '2');
            prepareOption('CONTENT_ALERT_TARGET_CHANNELS', targetChannels || 'ALL');

            if (saveMasterOptionsBulk) {
                await saveMasterOptionsBulk(optionsToSave);
            } else {
                for (const opt of optionsToSave) {
                    if (opt.id) {
                        await onUpdate(opt as MasterOption);
                    } else {
                        await onAdd(opt as Omit<MasterOption, 'id'>);
                    }
                }
            }

            showToast('บันทึกการตั้งค่าการแจ้งเตือนคอนเทนต์เรียบร้อยแล้ว! ✨', 'success');
        } catch (error: any) {
            console.error('Failed to save content alert options:', error);
            showToast('เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Test send LINE notification
    const handleTestNotification = async () => {
        setIsTestingAlert(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const currentUserId = userData.user?.id;

            const sampleChannel = channels[0] || { name: 'Silly Buddies', color: '#6366f1' };
            const testPayload = {
                user_id: currentUserId,
                type: 'CONTENT_PLANNER_ALERT',
                title: '⚠️ [ทดสอบระบบ] คอนเทนต์ใกล้ถึงเวลาลง: Vlog สรุปแคมเปญ Q3',
                message: `เหลือเวลาอีกประมาณ ${leadMinutes} นาที (สถานะปัจจุบัน: EDIT_CLIP)`,
                related_id: '00000000-0000-0000-0000-000000000000',
                link_path: 'CALENDAR',
                is_read: false,
                line_status: null,
                metadata: {
                    content_id: '00000000-0000-0000-0000-000000000000',
                    title: 'Vlog สรุปแคมเปญ Q3 (Test Notification)',
                    status: 'EDIT_CLIP',
                    channel_name: sampleChannel.name,
                    channel_color: sampleChannel.color || '#6366f1',
                    target_platform: ['YOUTUBE', 'TIKTOK', 'FACEBOOK'],
                    content_formats: ['Short Form', 'Long Form'],
                    scheduled_time: '18:00',
                    remaining_minutes: parseInt(leadMinutes, 10) || 30,
                    remaining_text: `${leadMinutes} นาที`,
                    assignee_names: 'ทีม Content Planner',
                    editor_names: 'ทีมตัดต่อ Video',
                },
            };

            const { error } = await supabase.from('notifications').insert(testPayload);
            if (error) throw error;

            showToast('ส่งข้อความทดสอบแจ้งเตือนคอนเทนต์เข้า LINE เรียบร้อยแล้ว! 🚀', 'success');
        } catch (err: any) {
            console.error('Test notification failed:', err);
            showToast('ส่งข้อความทดสอบไม่สำเร็จ: ' + err.message, 'error');
        } finally {
            setIsTestingAlert(false);
        }
    };

    const channelScopeBadge =
        targetChannels === 'ALL'
            ? 'ALL'
            : selectedChannelList.length.toString();

    return (
        <div id="content-alert-rules-view" className="space-y-6">
            {/* Top Hero Banner */}
            <ContentAlertHeader
                isEnabled={isEnabled}
                isSaving={isSaving}
                isTestingAlert={isTestingAlert}
                onSave={handleSave}
                onTestNotification={handleTestNotification}
            />

            {/* Horizontal Sub-Navigation Tabs */}
            <ContentAlertSubNav
                activeTab={activeSubTab}
                onTabChange={(tab) => setActiveSubTab(tab)}
                leadMinutes={leadMinutes}
                requiredStatusCount={requiredStatuses.length}
                channelScopeCount={channelScopeBadge}
            />

            {/* Sub-Tab Content with Animated Transitions */}
            <div className="min-h-[420px]">
                <AnimatePresence mode="wait">
                    {activeSubTab === 'TIMING' && (
                        <motion.div
                            key="timing-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-6"
                        >
                            {/* Master Switch */}
                            <ContentAlertToggleCard
                                isEnabled={isEnabled}
                                onToggle={(val) => setIsEnabled(val)}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Lead Time Countdown */}
                                <LeadTimeConfigCard
                                    leadMinutes={leadMinutes}
                                    onChange={(val) => setLeadMinutes(val)}
                                />

                                {/* Max Lookback Hours */}
                                <LookbackConfigCard
                                    maxLookbackHours={maxLookbackHours}
                                    onChangeLookback={(val) => setMaxLookbackHours(val)}
                                />
                            </div>
                        </motion.div>
                    )}

                    {activeSubTab === 'STATUS_GATE' && (
                        <motion.div
                            key="status-gate-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-6"
                        >
                            {/* Status Gate Full Width Card */}
                            <StatusGateConfigCard
                                masterOptions={masterOptions}
                                requiredStatuses={requiredStatuses}
                                onToggleStatus={handleToggleStatus}
                                onBatchSelect={handleBatchSelectStatuses}
                            />
                        </motion.div>
                    )}

                    {activeSubTab === 'CHANNEL_SCOPE' && (
                        <motion.div
                            key="channel-scope-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-6"
                        >
                            {/* Channel Scope Full Width Card */}
                            <ChannelScopeConfigCard
                                channels={channels}
                                targetChannels={targetChannels}
                                onSelectAll={() => setTargetChannels('ALL')}
                                onToggleChannel={handleToggleChannel}
                            />
                        </motion.div>
                    )}

                    {activeSubTab === 'LINE_DESTINATION' && (
                        <motion.div
                            key="line-destination-tab"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                            className="space-y-6"
                        >
                            {/* LINE Group Destination */}
                            <LineDestinationCard
                                targetDestination={targetDestination}
                                onChangeDestination={(val) => setTargetDestination(val)}
                                onTestNotification={handleTestNotification}
                                isTestingAlert={isTestingAlert}
                                isEnabled={isEnabled}
                            />

                            {/* Automation Flow & Architecture */}
                            <AlertWorkflowGuideCard />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ContentAlertRulesView;
