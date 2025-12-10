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

// 1. 定义默认数字人配置
const DEFAULT_TARGET_AVATAR: any = { 
  avatar_id: 'KW3VZF-FccCBAuAZmEws8',
  name: 'dgdavatar',
  url: 'https://drz0f01yeq1cx.cloudfront.net/1764832345393-39b9ea6e-5850-479f-908c-6a7d26b36489-3511.mp4',
  available: true,
  from: 1, 
  type: 2  
};

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  avatarId,
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
  disabled = false,
}) => {
  const [useManualAvatarId, setUseManualAvatarId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  // 2. 初始化逻辑：设置默认选中
  useEffect(() => {
    // 如果没有 ID，设置默认值
    if (!avatarId) {
      logger.info('Initializing default avatar', { avatarId: DEFAULT_TARGET_AVATAR.avatar_id });
      setAvatarId(DEFAULT_TARGET_AVATAR.avatar_id);
      setAvatarVideoUrl(DEFAULT_TARGET_AVATAR.url);
    }

    // 如果列表中没有默认值，添加到列表
    const exists = avatars.find(a => a.avatar_id === DEFAULT_TARGET_AVATAR.avatar_id);
    if (!exists) {
      setAvatars([DEFAULT_TARGET_AVATAR, ...avatars]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const refreshAvatarList = async () => {
    if (!api || isRefreshing || refreshCooldown) return;

    setIsRefreshing(true);
    try {
      const avatarList = await api.getAvatarList();
      
      // 3. 刷新逻辑：确保默认值不丢失
      const isDefaultInList = avatarList.find((a: Avatar) => a.avatar_id === DEFAULT_TARGET_AVATAR.avatar_id);
      
      let finalList = avatarList;
      if (!isDefaultInList) {
        finalList = [DEFAULT_TARGET_AVATAR, ...avatarList];
      }

      setAvatars(finalList);

      setRefreshCooldown(true);
      setTimeout(() => setRefreshCooldown(false), 5000);
      
      // 再次确保护底
      if (!avatarId) {
         setAvatarId(DEFAULT_TARGET_AVATAR.avatar_id);
         setAvatarVideoUrl(DEFAULT_TARGET_AVATAR.url);
      }

    } catch (error) {
      logger.error('Error refreshing avatar list', { error });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAvatarChange = (newAvatarId: string) => {
    setAvatarId(newAvatarId);
    const avatar = avatars.find((a) => a.avatar_id === newAvatarId);
    if (avatar) {
      logger.info('Update avatar video url', { url: avatar.url });
      setAvatarVideoUrl(avatar.url);
    }
  };

  return (
    <div>
      <label>
        Avatar:
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!useManualAvatarId ? (
            <>
              <select
                value={avatarId}
                onChange={(e) => handleAvatarChange(e.target.value)}
                disabled={!avatars.length || disabled}
                className="avatar-select"
              >
                <option value="">Select an avatar</option>
                <optgroup label="Official Avatars">
                  {avatars
                    .filter((avatar) => avatar.from !== 3)
                    .map((avatar, index) => (
                      <option
                        key={`${avatar.avatar_id}-${index}`}
                        value={avatar.avatar_id}
                        className={avatar.available ? 'available' : 'unavailable'}
                      >
                        {avatar.available ? '🟢' : '🔴'} {avatar.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Custom Avatars">
                  {avatars
                    .filter((avatar) => avatar.from === 3)
                    .map((avatar, index) => (
                      <option
                        key={`${avatar.avatar_id}-${index}`}
                        value={avatar.avatar_id}
                        className={avatar.available ? 'available' : 'unavailable'}
                      >
                        {avatar.available ? '🟢' : '🔴'} {avatar.name}
                      </option>
                    ))}
                </optgroup>
              </select>
              <button
                onClick={} 
                disabled={isRefreshing || refreshCooldown || disabled}
                className={`icon-button ${isRefreshing || refreshCooldown || disabled ? 'disabled' : ''}`}
                title={refreshCooldown ? 'Please wait before refreshing again' : 'Refresh avatar list'}
              >
                <span className={`material-icons ${isRefreshing ? 'spinning' : ''}`}>refresh</span>
              </button>
            </>
          ) : (
            <input
              type="text"
              value={avatarId}
              onChange={(e) => handleAvatarChange(e.target.value)}
              placeholder="Enter avatar ID"
              disabled={disabled}
            />
          )}
          <button
            onClick={() => setUseManualAvatarId(!useManualAvatarId)}
            className="icon-button"
            title={useManualAvatarId ? 'Switch to dropdown' : 'Switch to manual input'}
          >
            <span className="material-icons">{useManualAvatarId ? 'list' : 'edit'}</span>
          </button>
        </div>
      </label>
    </div>
  );
};

export default AvatarSelector;
