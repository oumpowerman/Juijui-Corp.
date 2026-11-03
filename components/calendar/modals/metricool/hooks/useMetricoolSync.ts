import { useState, useCallback } from 'react';
import { Task, Channel, MasterOption } from '../../../../../types';
import { MetricoolTabType } from '../constants';
import { useMetricoolExport } from './useMetricoolExport';
import { useMetricoolImport } from './useMetricoolImport';

interface UseMetricoolSyncParams {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    channels: Channel[];
    masterOptions: MasterOption[];
    currentDate: Date;
    activeChannelFilterId?: string;
    onSaveTask?: (task: Task) => Promise<void> | void;
    onRangeChange?: (targetDate: Date) => void;
    onNavigateDate?: (targetDate: Date) => void;
}

/**
 * Lightweight orchestrator hook that composes `useMetricoolExport` and `useMetricoolImport`
 * along with top-level modal tab and collapsible usage guide state.
 */
export function useMetricoolSync({
    isOpen,
    onClose,
    tasks,
    channels,
    masterOptions,
    currentDate,
    activeChannelFilterId,
    onRangeChange,
    onNavigateDate
}: UseMetricoolSyncParams) {
    const [activeTab, setActiveTab] = useState<MetricoolTabType>('EXPORT');

    const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

    const toggleGuide = useCallback(() => {
        setIsGuideOpen(prev => !prev);
    }, []);

    const exportHook = useMetricoolExport({
        isOpen,
        tasks,
        channels,
        currentDate,
        activeChannelFilterId
    });

    const importHook = useMetricoolImport({
        isOpen,
        onClose,
        tasks,
        channels,
        masterOptions,
        currentDate,
        activeChannelFilterId,
        onRangeChange,
        onNavigateDate
    });

    return {
        activeTab,
        setActiveTab,
        isGuideOpen,
        toggleGuide,
        ...exportHook,
        ...importHook
    };
}
