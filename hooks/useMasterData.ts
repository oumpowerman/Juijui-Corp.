
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MasterOption } from '../types';
import { useToast } from '../context/ToastContext';
import { useGlobalDialog } from '../context/GlobalDialogContext';
import { useMasterDataContext } from '../context/MasterDataContext';

export const useMasterData = () => {
    const {
        masterOptions,
        annualHolidays,
        calendarExceptions,
        inventoryItems,
        channels,
        isLoading,
        fetchMasterOptions,
        fetchChannels,
        addMasterOption,
        updateMasterOption,
        deleteMasterOption,
        saveMasterOptionsBulk,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel,
        seedDefaults
    } = useMasterDataContext();

    return {
        masterOptions,
        annualHolidays,
        calendarExceptions,
        inventoryItems,
        channels,
        isLoading,
        fetchMasterOptions,
        fetchChannels,
        addMasterOption,
        updateMasterOption,
        deleteMasterOption,
        saveMasterOptionsBulk,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel,
        seedDefaults
    };
};
