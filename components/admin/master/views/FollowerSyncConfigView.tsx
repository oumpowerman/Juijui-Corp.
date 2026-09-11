import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Tv, Layers, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MasterOption } from '../../../../types';
import { useToast } from '../../../../context/ToastContext';
import { useChannels } from '../../../../hooks/useChannels';

import { 
    FollowerSyncConfig, 
    FollowerSyncSubTab, 
    DEFAULT_FOLLOWER_SYNC_CONFIG,
    FullSyncSummary 
} from './follower-sync/types';

import { SyncHeaderBanner } from './follower-sync/components/SyncHeaderBanner';
import { SyncResultSummaryModal } from './follower-sync/components/SyncResultSummaryModal';
import { GeneralScheduleTab } from './follower-sync/tabs/GeneralScheduleTab';
import { ChannelSelectionTab } from './follower-sync/tabs/ChannelSelectionTab';
import { PlatformFilterTab } from './follower-sync/tabs/PlatformFilterTab';
import { BandwidthCalculatorTab } from './follower-sync/tabs/BandwidthCalculatorTab';

interface FollowerSyncConfigViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
}

const FollowerSyncConfigView: React.FC<FollowerSyncConfigViewProps> = ({
    masterOptions,
    onUpdate,
    onAdd
}) => {
    const { showToast } = useToast();
    const { channels, fetchChannels } = useChannels();
    const [activeSubTab, setActiveSubTab] = useState<FollowerSyncSubTab>('schedule');

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [lastSyncResult, setLastSyncResult] = useState<FullSyncSummary | null>(null);

    // Find existing config option in masterOptions
    const existingOption = useMemo(() => {
        return masterOptions.find(o => o.type === 'MASTER_DATA_CONFIG' && o.key === 'FOLLOWER_SYNC_CONFIG');
    }, [masterOptions]);

    // Local state for configuration
    const [config, setConfig] = useState<FollowerSyncConfig>(() => {
        if (existingOption?.label) {
            try {
                const parsed = JSON.parse(existingOption.label);
                return {
                    ...DEFAULT_FOLLOWER_SYNC_CONFIG,
                    ...parsed,
                    platforms: {
                        ...DEFAULT_FOLLOWER_SYNC_CONFIG.platforms,
                        ...(parsed.platforms || {})
                    },
                    enabledChannelIds: Array.isArray(parsed.enabledChannelIds) ? parsed.enabledChannelIds : [],
                };
            } catch (e) {
                console.error('Failed to parse FOLLOWER_SYNC_CONFIG', e);
            }
        }
        return DEFAULT_FOLLOWER_SYNC_CONFIG;
    });

    // Synchronize when masterOptions changes
    useEffect(() => {
        if (existingOption?.label) {
            try {
                const parsed = JSON.parse(existingOption.label);
                setConfig({
                    ...DEFAULT_FOLLOWER_SYNC_CONFIG,
                    ...parsed,
                    platforms: {
                        ...DEFAULT_FOLLOWER_SYNC_CONFIG.platforms,
                        ...(parsed.platforms || {})
                    },
                    enabledChannelIds: Array.isArray(parsed.enabledChannelIds) ? parsed.enabledChannelIds : [],
                });
            } catch (e) {
                console.error('Failed to parse FOLLOWER_SYNC_CONFIG', e);
            }
        }
    }, [existingOption]);

    // Save configuration
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payloadLabel = JSON.stringify(config);
            let success = false;

            if (existingOption) {
                success = await onUpdate({
                    ...existingOption,
                    label: payloadLabel,
                    isActive: config.isEnabled,
                });
            } else {
                success = await onAdd({
                    type: 'MASTER_DATA_CONFIG',
                    key: 'FOLLOWER_SYNC_CONFIG',
                    label: payloadLabel,
                    color: '#6366F1',
                    sortOrder: 1,
                    isActive: config.isEnabled,
                });
            }

            // Reschedule cron in backend server
            try {
                await fetch('/api/cron/reschedule', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config }),
                });
            } catch (err) {
                console.warn('Backend cron reschedule notification failed:', err);
            }

            if (success) {
                showToast('บันทึกการตั้งค่าระบบ Auto-Sync เรียบร้อยแล้ว! 🚀', 'success');
            } else {
                showToast('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง', 'error');
            }
        } catch (error: any) {
            console.error('Save error:', error);
            showToast('เกิดข้อผิดพลาด: ' + (error?.message || 'Error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Live test sync
    const handleTestSyncNow = async () => {
        if (isTesting) return;
        setIsTesting(true);
        setLastSyncResult(null);
        showToast('กำลังทดสอบดึงยอดผู้ติดตามตามช่องและแพลตฟอร์มที่เลือก... ⏳', 'info');

        try {
            const res = await fetch('/api/cron/sync-followers?source=manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }), // Pass active config
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLastSyncResult(data.summary);
                const updated = data.summary?.totalChannelsUpdated || 0;
                const total = data.summary?.totalChannelsChecked || 0;
                showToast(`ทดสอบสำเร็จ! ตรวจสอบ ${total} ช่อง (อัปเดต ${updated} ช่อง) 🎉`, 'success');
            } else {
                showToast(`เกิดข้อผิดพลาด: ${data.error || 'Server error'}`, 'error');
            }
        } catch (err: any) {
            showToast(`การเชื่อมต่อล้มเหลว: ${err?.message || 'Network error'}`, 'error');
        } finally {
            setIsTesting(false);
        }
    };

    // Active selected channels count
    const selectedChannelsCount = useMemo(() => {
        if (!config.enabledChannelIds || config.enabledChannelIds.length === 0) {
            return channels.length;
        }
        return channels.filter(c => config.enabledChannelIds.includes(c.id)).length;
    }, [channels, config.enabledChannelIds]);

    const enabledPlatformsCount = Object.values(config.platforms).filter(Boolean).length;

    // Sub-Tabs list
    const subTabs = [
        {
            id: 'schedule' as FollowerSyncSubTab,
            label: '⏰ การตั้งเวลา & เงื่อนไข',
            desc: 'ตั้งเวลารันประจำวัน และการหน่วงเวลา',
            icon: Clock,
            badge: config.isEnabled ? config.syncTime : 'ปิดอยู่'
        },
        {
            id: 'channels' as FollowerSyncSubTab,
            label: '📺 เลือกช่องที่ต้องการซิงค์',
            desc: 'เลือกเฉพาะช่องในระบบที่ต้องการอัปเดต',
            icon: Tv,
            badge: `${selectedChannelsCount}/${channels.length} ช่อง`
        },
        {
            id: 'platforms' as FollowerSyncSubTab,
            label: '🌐 แพลตฟอร์มเป้าหมาย',
            desc: 'เปิด/ปิด YouTube, FB, IG, TikTok',
            icon: Layers,
            badge: `${enabledPlatformsCount}/4`
        },
        {
            id: 'bandwidth' as FollowerSyncSubTab,
            label: '📊 แบนด์วิดท์ & การคำนวณ',
            desc: 'ตารางคำนวณ Data & Bandwidth',
            icon: Wifi,
            badge: 'Insights'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Top Banner Header */}
            <SyncHeaderBanner
                isTesting={isTesting}
                isSaving={isSaving}
                onTestSyncNow={handleTestSyncNow}
                onSave={handleSave}
            />

            {/* Sub-Tab Navigation Bar */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                    {subTabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeSubTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveSubTab(tab.id)}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left ${
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 font-bold'
                                        : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                    <span className="text-xs truncate">{tab.label}</span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {tab.badge}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Test Results Summary Modal / Card */}
            {lastSyncResult && (
                <SyncResultSummaryModal
                    result={lastSyncResult}
                    onClose={() => setLastSyncResult(null)}
                />
            )}

            {/* Sub-Tab Content Router */}
            <div className="pt-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSubTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {activeSubTab === 'schedule' && (
                            <GeneralScheduleTab
                                config={config}
                                onChange={setConfig}
                            />
                        )}

                        {activeSubTab === 'channels' && (
                            <ChannelSelectionTab
                                channels={channels}
                                config={config}
                                onChange={setConfig}
                            />
                        )}

                        {activeSubTab === 'platforms' && (
                            <PlatformFilterTab
                                config={config}
                                onChange={setConfig}
                            />
                        )}

                        {activeSubTab === 'bandwidth' && (
                            <BandwidthCalculatorTab
                                config={config}
                                totalChannelsCount={channels.length}
                                selectedChannelsCount={selectedChannelsCount}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FollowerSyncConfigView;
