import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { MasterOption } from '../types';
import { AlertSubTabId, ChannelOption, ContentAlertRulesViewProps } from '../components/admin/master/views/content-alert/types';
import { contentAlertTestService } from '../services/contentAlertTestService';

export function useContentAlertRules({
    masterOptions,
    onUpdate,
    onAdd,
    saveMasterOptionsBulk,
}: ContentAlertRulesViewProps) {
    const { showToast } = useToast();

    // Active Sub Tab: PRE_RELEASE | DAILY_SUMMARY | LINE_INTEGRATION
    const [activeSubTab, setActiveSubTab] = useState<AlertSubTabId>('PRE_RELEASE');

    // 1. System 1: Pre-Release Urgent Alert State
    const [isEnabled, setIsEnabled] = useState(true);
    const [leadMinutes, setLeadMinutes] = useState('30');
    const [maxLookbackHours, setMaxLookbackHours] = useState('2');
    const [requiredStatuses, setRequiredStatuses] = useState<string[]>(['APPROVE', 'DONE', 'FINAL']);
    const [targetChannels, setTargetChannels] = useState('ALL');
    const [targetDestination, setTargetDestination] = useState('');

    // 2. System 2: Daily Overdue Content Summary State
    const [isDailyAlertEnabled, setIsDailyAlertEnabled] = useState(true);
    const [dailyAlertTime, setDailyAlertTime] = useState('08:00');
    const [dailyOverdueExcludedStatuses, setDailyOverdueExcludedStatuses] = useState<string[]>([
        'PUBLISHED',
        'DONE',
        'POSTED',
        'COMPLETED',
        'APPROVED',
    ]);

    const [channels, setChannels] = useState<ChannelOption[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isTestingAlert, setIsTestingAlert] = useState(false);
    const [isTestingOverdueSummary, setIsTestingOverdueSummary] = useState(false);

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
        // Pre-release configs
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

        // Daily Overdue configs
        const dailyEnabledOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'DAILY_OVERDUE_ALERT_ENABLED'
        );
        const dailyTimeOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'DAILY_OVERDUE_ALERT_TIME'
        );
        const dailyExcludedOpt = masterOptions.find(
            (o) => o.type === 'WORK_CONFIG' && o.key === 'DAILY_OVERDUE_EXCLUDED_STATUSES'
        );

        if (enabledOpt) setIsEnabled(enabledOpt.label === 'true');
        if (leadMinutesOpt) setLeadMinutes(leadMinutesOpt.label || '30');
        if (requiredStatusOpt) {
            const rawLabel = requiredStatusOpt.label || '';
            const parsed = rawLabel
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            setRequiredStatuses(parsed);
        }
        if (targetDestOpt) setTargetDestination(targetDestOpt.label || '');
        if (lookbackOpt) setMaxLookbackHours(lookbackOpt.label || '2');
        if (channelsOpt) setTargetChannels(channelsOpt.label || 'ALL');

        if (dailyEnabledOpt) setIsDailyAlertEnabled(dailyEnabledOpt.label !== 'false');
        if (dailyTimeOpt) setDailyAlertTime(dailyTimeOpt.label || '08:00');
        if (dailyExcludedOpt) {
            const rawExcluded = dailyExcludedOpt.label || '';
            const parsedExcluded = rawExcluded
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            setDailyOverdueExcludedStatuses(parsedExcluded);
        }
    }, [masterOptions]);

    // Compute Active System Statuses for accurate 1:1 Badge & Card synchronization
    const activeSystemStatuses = useMemo(() => {
        const fromMaster = masterOptions
            .filter((o) => o.type === 'STATUS' && o.isActive !== false);
        if (fromMaster.length > 0) {
            return fromMaster.map((o) => o.key.toUpperCase());
        }
        return ['APPROVE', 'FINAL', 'DONE', 'EDIT_CLIP', 'FEEDBACK', 'SHOOTING', 'SCRIPT', 'IDEA'];
    }, [masterOptions]);

    const activeRequiredCount = useMemo(() => {
        return activeSystemStatuses.filter((sysKey) =>
            requiredStatuses.some((r) => r.toUpperCase() === sysKey)
        ).length;
    }, [activeSystemStatuses, requiredStatuses]);

    const activeExcludedCount = useMemo(() => {
        return activeSystemStatuses.filter((sysKey) =>
            dailyOverdueExcludedStatuses.some((e) => e.toUpperCase() === sysKey)
        ).length;
    }, [activeSystemStatuses, dailyOverdueExcludedStatuses]);

    // Handle Pre-release Status Toggle
    const handleToggleStatus = (statusKey: string) => {
        const upper = statusKey.toUpperCase();
        if (requiredStatuses.some((s) => s.toUpperCase() === upper)) {
            const next = requiredStatuses.filter((s) => s.toUpperCase() !== upper);
            setRequiredStatuses(next);
        } else {
            setRequiredStatuses([...requiredStatuses, statusKey]);
        }
    };

    const handleBatchSelectStatuses = (statusKeys: string[]) => {
        setRequiredStatuses(statusKeys);
    };

    // Handle Daily Overdue Excluded Status Toggle
    const handleToggleExcludedStatus = (statusKey: string) => {
        const upper = statusKey.toUpperCase();
        if (dailyOverdueExcludedStatuses.some((s) => s.toUpperCase() === upper)) {
            const next = dailyOverdueExcludedStatuses.filter((s) => s.toUpperCase() !== upper);
            setDailyOverdueExcludedStatuses(next);
        } else {
            setDailyOverdueExcludedStatuses([...dailyOverdueExcludedStatuses, upper]);
        }
    };

    const handleBatchSelectExcludedStatuses = (statusKeys: string[]) => {
        setDailyOverdueExcludedStatuses(statusKeys.map((k) => k.toUpperCase()));
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

    // Handle Save All Settings
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
                        sortOrder: 90,
                        isActive: true,
                        isDefault: false,
                    });
                }
            };

            // Pre-release alert options
            prepareOption('CONTENT_ALERT_ENABLED', isEnabled ? 'true' : 'false');
            prepareOption('CONTENT_ALERT_LEAD_MINUTES', leadMinutes || '30');
            prepareOption('CONTENT_ALERT_REQUIRED_STATUS', requiredStatuses.join(','));
            prepareOption('CONTENT_ALERT_TARGET_DESTINATION', targetDestination.trim());
            prepareOption('CONTENT_ALERT_MAX_LOOKBACK_HOURS', maxLookbackHours || '2');
            prepareOption('CONTENT_ALERT_TARGET_CHANNELS', targetChannels || 'ALL');

            // Daily overdue summary options
            prepareOption('DAILY_OVERDUE_ALERT_ENABLED', isDailyAlertEnabled ? 'true' : 'false');
            prepareOption('DAILY_OVERDUE_ALERT_TIME', dailyAlertTime || '08:00');
            prepareOption('DAILY_OVERDUE_EXCLUDED_STATUSES', dailyOverdueExcludedStatuses.join(','));

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

            showToast('บันทึกการตั้งค่าการแจ้งเตือนคอนเทนต์ทั้งหมดเรียบร้อยแล้ว! ✨', 'success');
        } catch (error: any) {
            console.error('Failed to save content alert options:', error);
            showToast('เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Test 1: Pre-Release Urgent Alert
    const handleTestPreReleaseNotification = async () => {
        setIsTestingAlert(true);
        try {
            const result = await contentAlertTestService.sendPreReleaseTestAlert({
                leadMinutes,
                dailyOverdueExcludedStatuses,
            });
            showToast(`ส่งแจ้งเตือนข้อมูลจริงของคลิป "${result.title}" เข้า LINE แล้ว! ⚡`, 'success');
        } catch (err: any) {
            if (err.message === 'NOT_FOUND_CONTENT') {
                showToast('ไม่พบคอนเทนต์ในระบบ กรุณาสร้างคอนเทนต์ในปฏิทินก่อนทดสอบ', 'warning');
            } else {
                console.error('Test notification failed:', err);
                showToast('ส่งข้อความทดสอบไม่สำเร็จ: ' + err.message, 'error');
            }
        } finally {
            setIsTestingAlert(false);
        }
    };

    // Test 2: Morning Overdue Content Summary
    const handleTestOverdueSummary = async () => {
        setIsTestingOverdueSummary(true);
        try {
            const result = await contentAlertTestService.sendDailyOverdueTestSummary({
                dailyAlertTime,
                dailyOverdueExcludedStatuses,
                masterOptions,
            });

            if (result.type === 'RPC_SUCCESS') {
                showToast(`เรียกใช้ Cron Job สำเร็จ! ประมวลผลและส่งรายงานสรุปคลิปค้างลงจริง (${result.count} รายการ) เข้า LINE เรียบร้อย 🌅`, 'success');
            } else if (result.type === 'RPC_NO_OVERDUE') {
                showToast('เรียกใช้ Cron Job สำเร็จ: ปัจจุบันไม่มีคลิปค้างลงในระบบ (จึงไม่มีการยิงแจ้งเตือนเข้า LINE เพื่อไม่ให้รบกวนกลุ่ม) ✨', 'info');
            } else if (result.type === 'FALLBACK_NO_OVERDUE') {
                showToast('ประมวลผลเสร็จสิ้น: ไม่มีคลิปค้างลงในระบบขณะนี้ (ไม่มีการส่งแจ้งเตือนเข้ากลุ่ม) ✨', 'info');
            } else {
                showToast(`ประมวลผลข้อมูลจริงสำเร็จ! ส่งรายงานสรุปคลิปค้างลง (${result.count} รายการ) เข้า LINE แล้ว 🌅`, 'success');
            }
        } catch (err: any) {
            console.error('Test overdue summary failed:', err);
            showToast('เกิดข้อผิดพลาดในการเรียกใช้ Cron Job: ' + err.message, 'error');
        } finally {
            setIsTestingOverdueSummary(false);
        }
    };

    const channelScopeBadge =
        targetChannels === 'ALL'
            ? 'ALL'
            : selectedChannelList.length.toString();

    return {
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
        selectedChannelList,
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
    };
}
