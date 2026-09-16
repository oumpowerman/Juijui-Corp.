import React from 'react';
import { ChannelBrandLinksManager } from '../inputs/ChannelBrandLinksManager';
import { BrandLink } from '../../../../types';

interface ChannelDocsTabProps {
  brandLinks: BrandLink[];
  setBrandLinks: React.Dispatch<React.SetStateAction<BrandLink[]>>;
  channelName?: string;
  channelColor?: string;
  logoPreview?: string | null;
  isSubmitting?: boolean;
}

export const ChannelDocsTab: React.FC<ChannelDocsTabProps> = ({
  brandLinks,
  setBrandLinks,
  isSubmitting = false,
}) => {
  return (
    <div className="w-full">
      <ChannelBrandLinksManager
        brandLinks={brandLinks}
        setBrandLinks={setBrandLinks}
        disabled={isSubmitting}
      />
    </div>
  );
};

export default ChannelDocsTab;
