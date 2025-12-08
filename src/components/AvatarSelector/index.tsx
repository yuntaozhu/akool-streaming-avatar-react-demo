import React, { useState, useEffect } from 'react';
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

const FIXED_AVATAR_ID = 'Ydgl3krdKDIruU6QiSxS6';

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
  disabled = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAvatarList = async () => {
    if (!api || isRefreshing) return;

    setIsRefreshing(true);
    try {
      const avatarList = await api.getAvatarList();
      setAvatars(avatarList);
    } catch (error) {
      logger.error('Error refreshing avatar list', { error });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setAvatarId(FIXED_AVATAR_ID);
    if (avatars.length === 0) {
      refreshAvatarList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    const targetAvatar = avatars.find((a) => a.avatar_id === FIXED_AVATAR_ID);
    if (targetAvatar) {
      logger.info('Auto-set fixed avatar video url', { url: targetAvatar.url });
      setAvatarVideoUrl(targetAvatar.url);
    }
  }, [avatars, setAvatarVideoUrl]);

  // 计算按钮是否禁用
  const isButtonDisabled = isRefreshing || disabled;

  return (
    <div>
      <label>
        Avatar (Fixed):
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            value={FIXED_AVATAR_ID}
            readOnly
            disabled
            className="avatar-select"
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', width: '100%' }}
          />
          <button
            onClick={}
            disabled={isButtonDisabled}
            className={`icon-button ${isButtonDisabled ? 'disabled' : ''}`}
            title="Reload avatar data"
          >
            <span className={`material-icons ${isRefreshing ? 'spinning' : ''}`}>refresh</span>
          </button>
        </div>
      </label>
    </div>
  );
};

export default AvatarSelector;
