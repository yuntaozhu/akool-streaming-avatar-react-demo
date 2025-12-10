import React, { useEffect } from 'react';
import { Avatar, ApiService } from '../../apiService';
import { logger } from '../../core/Logger';
import './styles.css';

interface AvatarSelectorProps {
  api: ApiService | null | undefined;
  avatarId: string;
  setAvatarId: (id: string) => void;
  avatars: Avatar[];
  setAvatars: (avatars: Avatar[]) => void;
  setAvatarVideoUrl: (url: string) => void;
  disabled?: boolean;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  avatarId,
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
  disabled = false,
}) => {
  // Hardcoded default avatar details
  const DEFAULT_AVATAR = {
    avatar_id: 'KW3VZF-FccCBAuAZmEws8',
    name: 'dgdavatar',
    url: 'https://drz0f01yeq1cx.cloudfront.net/1764832345393-39b9ea6e-5850-479f-908c-6a7d26b36489-3511.mp4',
  };

  // Automatically set the specific avatar on component mount or if it changes
  useEffect(() => {
    if (avatarId !== DEFAULT_AVATAR.avatar_id) {
      logger.info('Auto-setting default avatar', { 
        id: DEFAULT_AVATAR.avatar_id, 
        name: DEFAULT_AVATAR.name 
      });
      setAvatarId(DEFAULT_AVATAR.avatar_id);
      setAvatarVideoUrl(DEFAULT_AVATAR.url);
    }
  }, [avatarId, setAvatarId, setAvatarVideoUrl]);

  return (
    <div>
      <label>
        Avatar:
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Replaced Selector UI with a static display of the current avatar */}
          <div className="avatar-select available" style={{ cursor: 'default', padding: '8px' }}>
            🟢 {DEFAULT_AVATAR.name} (Auto-selected)
          </div>
        </div>
      </label>
    </div>
  );
};

export default AvatarSelector;
