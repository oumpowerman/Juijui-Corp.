import React from 'react';
import { ChannelPillarsCategoriesManager } from '../ChannelPillarsCategoriesManager';
import { Channel } from '../../../types';

interface TempOption {
  id: string;
  type: 'PILLAR' | 'CATEGORY';
  key: string;
  label: string;
  parentKey?: string;
}

interface ChannelPillarsTabProps {
  targetId: string;
  channel: Channel | null;
  tempOptions: TempOption[];
  setTempOptions: React.Dispatch<React.SetStateAction<TempOption[]>>;
}

export const ChannelPillarsTab: React.FC<ChannelPillarsTabProps> = ({
  targetId,
  channel,
  tempOptions,
  setTempOptions,
}) => {
  return (
    <div className="space-y-4">
      <ChannelPillarsCategoriesManager
        targetId={targetId}
        channel={channel}
        tempOptions={tempOptions}
        setTempOptions={setTempOptions}
      />
    </div>
  );
};
