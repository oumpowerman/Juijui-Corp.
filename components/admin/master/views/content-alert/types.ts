import { MasterOption } from '../../../../../types';

export type AlertSubTabId = 'PRE_RELEASE' | 'DAILY_SUMMARY' | 'LINE_INTEGRATION';

export interface ChannelOption {
    id: string;
    name: string;
    color?: string;
}

export interface ContentAlertSubNavProps {
    activeTab: AlertSubTabId;
    onTabChange: (tab: AlertSubTabId) => void;
    leadMinutes: string;
    dailyAlertTime: string;
    isDailyAlertEnabled: boolean;
    requiredStatusCount: number;
    channelScopeCount: string;
    isPreReleaseEnabled: boolean;
    excludedStatusCount: number;
}

export interface DailyOverdueConfigCardProps {
    isDailyAlertEnabled: boolean;
    onToggleEnabled: (val: boolean) => void;
    dailyAlertTime: string;
    onChangeAlertTime: (val: string) => void;
    excludedStatuses: string[];
    onToggleExcludedStatus: (statusKey: string) => void;
    onBatchSelectExcludedStatuses?: (statusKeys: string[]) => void;
    masterOptions: MasterOption[];
}

export interface ContentAlertToggleCardProps {
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export interface LeadTimeConfigCardProps {
    leadMinutes: string;
    onChange: (minutes: string) => void;
}

export interface LookbackConfigCardProps {
    maxLookbackHours: string;
    onChangeLookback: (val: string) => void;
}

export interface StatusGateConfigCardProps {
    masterOptions: MasterOption[];
    requiredStatuses: string[];
    onToggleStatus: (statusKey: string) => void;
    onBatchSelect: (statusKeys: string[]) => void;
}

export interface ChannelScopeConfigCardProps {
    channels: ChannelOption[];
    targetChannels: string;
    onSelectAll: () => void;
    onToggleChannel: (channelId: string) => void;
}

export interface LineDestinationCardProps {
    targetDestination: string;
    onChangeDestination: (val: string) => void;
}

export interface AlertDiagnosticsCardProps {
    isTestingAlert: boolean;
    isTestingOverdueSummary: boolean;
    isSaving: boolean;
    leadMinutes: string;
    onTestPreRelease: () => void | Promise<void>;
    onTestOverdueSummary: () => void | Promise<void>;
}

export interface ContentAlertRulesViewProps {
    masterOptions: MasterOption[];
    onUpdate: (option: MasterOption) => Promise<boolean>;
    onAdd: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    saveMasterOptionsBulk?: (options: Partial<MasterOption>[]) => Promise<boolean>;
}

export interface PreReleaseTabProps {
    isEnabled: boolean;
    setIsEnabled: (val: boolean) => void;
    leadMinutes: string;
    setLeadMinutes: (val: string) => void;
    maxLookbackHours: string;
    setMaxLookbackHours: (val: string) => void;
    masterOptions: MasterOption[];
    requiredStatuses: string[];
    handleToggleStatus: (statusKey: string) => void;
    handleBatchSelectStatuses: (statusKeys: string[]) => void;
    channels: ChannelOption[];
    targetChannels: string;
    setTargetChannels: (val: string) => void;
    handleToggleChannel: (channelId: string) => void;
}

export interface DailySummaryTabProps {
    isDailyAlertEnabled: boolean;
    setIsDailyAlertEnabled: (val: boolean) => void;
    dailyAlertTime: string;
    setDailyAlertTime: (val: string) => void;
    dailyOverdueExcludedStatuses: string[];
    handleToggleExcludedStatus: (statusKey: string) => void;
    handleBatchSelectExcludedStatuses: (statusKeys: string[]) => void;
    masterOptions: MasterOption[];
}

export interface LineIntegrationTabProps {
    targetDestination: string;
    setTargetDestination: (val: string) => void;
    isTestingAlert: boolean;
    isTestingOverdueSummary: boolean;
    isSaving: boolean;
    leadMinutes: string;
    onTestPreRelease: () => void | Promise<void>;
    onTestOverdueSummary: () => void | Promise<void>;
}
