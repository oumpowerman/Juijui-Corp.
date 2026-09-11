
import { useMasterDataContext } from '../context/MasterDataContext';

export const useChannels = () => {
    const {
        channels,
        fetchChannels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel
    } = useMasterDataContext();

    return {
        channels,
        fetchChannels,
        handleAddChannel,
        handleUpdateChannel,
        handleDeleteChannel
    };
};

