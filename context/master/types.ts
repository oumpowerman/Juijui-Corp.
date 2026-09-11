import { MasterOption, Channel } from '../../types';

export type MasterVersionKey = 'master_options_version' | 'inventory_version' | 'channels_version';

export interface MasterDataContextType {
    masterOptions: MasterOption[];
    annualHolidays: any[];
    calendarExceptions: any[];
    inventoryItems: any[];
    channels: Channel[];
    isLoading: boolean;
    fetchMasterOptions: () => Promise<void>;
    fetchChannels: () => Promise<void>;
    addMasterOption: (option: Omit<MasterOption, 'id'>) => Promise<boolean>;
    updateMasterOption: (option: MasterOption) => Promise<boolean>;
    deleteMasterOption: (id: string) => Promise<boolean>;
    saveMasterOptionsBulk: (options: any[]) => Promise<boolean>;
    // Channels Mutations
    handleAddChannel: (channel: Channel, file?: File) => Promise<boolean>;
    handleUpdateChannel: (updatedChannel: Channel, file?: File) => Promise<boolean>;
    handleDeleteChannel: (channelId: string) => Promise<boolean>;
    // Inventory Mutations
    addInventoryItem: (item: any) => Promise<boolean>;
    updateInventoryItem: (item: any) => Promise<boolean>;
    deleteInventoryItem: (id: string) => Promise<boolean>;
    batchUpdateInventoryItems: (ids: string[], payload: any) => Promise<boolean>;
    updateInventoryStock: (id: string, newQuantity: number) => Promise<boolean>;
    seedDefaults: () => Promise<void>;
}
