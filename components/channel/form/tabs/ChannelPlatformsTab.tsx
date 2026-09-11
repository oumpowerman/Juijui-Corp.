import React from 'react';
import { PlatformGridSelector } from '../inputs/PlatformGridSelector';
import { Platform, SocialLinks, PlatformFollowers } from '../../../../types';

interface ChannelPlatformsTabProps {
  selectedPlatforms: Platform[];
  togglePlatform: (platform: Platform) => void;
  socialLinks: SocialLinks;
  onSocialLinkChange: (platform: Platform, url: string) => void;
  followers: PlatformFollowers;
  onFollowersChange: (platform: Platform, count: number | undefined) => void;
  isSubmitting: boolean;
}

export const ChannelPlatformsTab: React.FC<ChannelPlatformsTabProps> = ({
  selectedPlatforms,
  togglePlatform,
  socialLinks,
  onSocialLinkChange,
  followers,
  onFollowersChange,
  isSubmitting,
}) => {
  return (
    <div className="space-y-4">
      <PlatformGridSelector
        selectedPlatforms={selectedPlatforms}
        togglePlatform={togglePlatform}
        socialLinks={socialLinks}
        onSocialLinkChange={onSocialLinkChange}
        followers={followers}
        onFollowersChange={onFollowersChange}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
