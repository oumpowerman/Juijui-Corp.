import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useToast } from '../../../../context/ToastContext';
import { checklistAlertTestService } from '../../../../services/checklistAlertTestService';
import { useChecklistCadenceAlerts } from '../../../../hooks/company-checklist/useChecklistCadenceAlerts';
import {
    MasterOption,
    ChecklistAlertSubTab,
    ChecklistAlertHeader,
    ChecklistAlertSegmentedTabs,
    ScheduleSettingsTab,
    LiveMonitorTab,
    AdvancedDestinationTab
} from './checklist-alert';

interface ChecklistAlertRulesViewProps {
    masterOptions: MasterOption[];
    saveMasterOptionsBulk?: (options: MasterOption[]) => Promise<boolean>;
    onUpdate?: (option: MasterOption) => Promise<boolean>;
    onAdd?: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
}

export const ChecklistAlertRulesView: React.FC<ChecklistAlertRulesViewProps> = ({
    masterOptions,
    saveMasterOptionsBulk,
    onUpdate,
    onAdd
}) => {
    const { showToast } = useToast();

    // 1. Active Tab State (Default is SCHEDULE - Core workflow: เปิด/ปิด & เลือกเวลา)
    const [activeTab, setActiveTab] = useState<ChecklistAlertSubTab>('SCHEDULE');

    // 2. Core Configuration States
    const [isEnabled, setIsEnabled] = useState(true);
    const [alertTime, setAlertTime] = useState('10:00');
    const [targetDestination, setTargetDestination] = useState('');
    const [selectedCycles, setSelectedCycles] = useState<string[]>([
        'DAILY',
        'WEEKLY',
        'SEMI_MONTHLY',
        'MONTHLY',
        'CUSTOM'
    ]);

    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // 3. Live Pending Overdue Alerts Hook
    const { pendingAlerts, pendingCount } = useChecklistCadenceAlerts(true);

    // 4. Default LINE summary destination from masterOptions
    const defaultLineSummary = useMemo(() => {
        const opt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'LINE_SUMMARY_DESTINATION');
        return opt?.label?.trim() || '';
    }, [masterOptions]);

    // 5. Load Initial Options from Master Options
    useEffect(() => {
        const enabledOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKLIST_DAILY_ALERT_ENABLED');
        if (enabledOpt) setIsEnabled(enabledOpt.label !== 'false');

        const timeOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKLIST_DAILY_ALERT_TIME');
        if (timeOpt && timeOpt.label) setAlertTime(timeOpt.label.trim());

        const destOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKLIST_ALERT_TARGET_DESTINATION');
        if (destOpt && destOpt.label) setTargetDestination(destOpt.label.trim());

        const cyclesOpt = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === 'CHECKLIST_DAILY_ALERT_CYCLES');
        if (cyclesOpt && cyclesOpt.label) {
            const parsed = cyclesOpt.label.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
            if (parsed.length > 0) setSelectedCycles(parsed);
        }
    }, [masterOptions]);

    // 6. Toggle Cycle Selection
    const toggleCycle = (cycleKey: string) => {
        setSelectedCycles(prev => {
            if (prev.includes(cycleKey)) {
                if (prev.length === 1) {
                    showToast('ต้องเลือกรอบการตรวจอย่างน้อย 1 ประเภท', 'info');
                    return prev;
                }
                return prev.filter(c => c !== cycleKey);
            } else {
                return [...prev, cycleKey];
            }
        });
    };

    // 7. Save Configuration to Master Options
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const configsToSave = [
                {
                    key: 'CHECKLIST_DAILY_ALERT_ENABLED',
                    label: isEnabled ? 'true' : 'false',
                    color: '#10b981',
                    sortOrder: 95
                },
                {
                    key: 'CHECKLIST_DAILY_ALERT_TIME',
                    label: alertTime,
                    color: '#6366f1',
                    sortOrder: 96
                },
                {
                    key: 'CHECKLIST_DAILY_ALERT_CYCLES',
                    label: selectedCycles.join(','),
                    color: '#0ea5e9',
                    sortOrder: 97
                },
                {
                    key: 'CHECKLIST_ALERT_TARGET_DESTINATION',
                    label: targetDestination.trim(),
                    color: '#64748b',
                    sortOrder: 98
                }
            ];

            if (saveMasterOptionsBulk) {
                const payload: MasterOption[] = configsToSave.map(c => {
                    const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === c.key);
                    return {
                        id: existing?.id || '',
                        type: 'WORK_CONFIG',
                        key: c.key,
                        label: c.label,
                        color: c.color,
                        sortOrder: c.sortOrder,
                        isActive: true
                    };
                });
                await saveMasterOptionsBulk(payload);
            } else if (onUpdate && onAdd) {
                for (const c of configsToSave) {
                    const existing = masterOptions.find(o => o.type === 'WORK_CONFIG' && o.key === c.key);
                    if (existing) {
                        await onUpdate({
                            ...existing,
                            label: c.label,
                            isActive: true
                        });
                    } else {
                        await onAdd({
                            type: 'WORK_CONFIG',
                            key: c.key,
                            label: c.label,
                            color: c.color,
                            sortOrder: c.sortOrder,
                            isActive: true
                        });
                    }
                }
            }

            showToast('บันทึกการตั้งค่าระบบแจ้งเตือนเช็คลิสต์บริษัทเรียบร้อยแล้ว! ✨', 'success');
        } catch (err: any) {
            console.error('Failed to save checklist alert config:', err);
            showToast('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || 'โปรดลองใหม่'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // 8. Test Alert Sending into LINE
    const handleTestAlert = async () => {
        setIsTesting(true);
        try {
            const res = await checklistAlertTestService.testCompanyChecklistAlert();
            if (res.isMockFallback) {
                showToast(`ส่งข้อความจำลองทดสอบ LINE เรียบร้อย (${res.count} หัวข้อ) เช็คในกลุ่ม LINE ได้เลย!`, 'success');
            } else {
                showToast(`ทริกเกอร์ตรวจจริงสำเร็จ! พบรายการค้าง ${res.count} หัวข้อ และส่งแจ้งเตือนเข้า LINE แล้ว`, 'success');
            }
        } catch (err: any) {
            console.error('Failed to test checklist alert:', err);
            showToast('ไม่สามารถส่งข้อความทดสอบได้: ' + (err.message || 'โปรดตรวจสอบการเชื่อมต่อ LINE Bot'), 'error');
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Top iOS Hero Banner */}
            <ChecklistAlertHeader
                isEnabled={isEnabled}
                isSaving={isSaving}
                isTesting={isTesting}
                onSave={handleSave}
                onTestAlert={handleTestAlert}
            />

            {/* iOS Segmented Pill Tabs */}
            <ChecklistAlertSegmentedTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                pendingCount={pendingCount}
                alertTime={alertTime}
                isEnabled={isEnabled}
            />

            {/* Tab Contents with Framer Motion transitions */}
            <div className="min-h-[380px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'SCHEDULE' && (
                        <ScheduleSettingsTab
                            key="tab-schedule"
                            isEnabled={isEnabled}
                            setIsEnabled={setIsEnabled}
                            alertTime={alertTime}
                            setAlertTime={setAlertTime}
                        />
                    )}

                    {activeTab === 'LIVE_MONITOR' && (
                        <LiveMonitorTab
                            key="tab-live-monitor"
                            pendingAlerts={pendingAlerts}
                            pendingCount={pendingCount}
                            alertTime={alertTime}
                        />
                    )}

                    {activeTab === 'ADVANCED' && (
                        <AdvancedDestinationTab
                            key="tab-advanced"
                            targetDestination={targetDestination}
                            setTargetDestination={setTargetDestination}
                            defaultLineSummary={defaultLineSummary}
                            selectedCycles={selectedCycles}
                            toggleCycle={toggleCycle}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChecklistAlertRulesView;
