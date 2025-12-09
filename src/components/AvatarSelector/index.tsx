import React, { useState, useEffect } from 'react'; // 1. 引入 useEffect
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
  const [useManualAvatarId, setUseManualAvatarId] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(false);

  // =================================================================
  // 新增功能：系统加载时默认选中指定 Avatar ID
  // =================================================================
  useEffect(() => {
    const targetId = 'Ydgl3krdKDIruU6QiSxS6';

    // 1. 设置 ID
    // 只有当当前 ID 不等于目标 ID 时才设置，避免重复渲染
    if (avatarId !== targetId) {
       setAvatarId(targetId);
    }

    // 2. 同步设置视频 URL
    // 我们需要在 avatars 列表中查找该 ID 对应的 URL
    if (avatars && avatars.length > 0) {
      const targetAvatar = avatars.find((a) => a.avatar_id === targetId);
      
      if (targetAvatar) {
        logger.info('Auto-selecting default avatar', { 
          id: targetId, 
          url: targetAvatar.url 
        });
        setAvatarVideoUrl(targetAvatar.url);
      }
    }
    
    // 依赖项包含 avatars：
    // 这样即使组件刚加载时 avatars 列表是空的，等 api 加载完列表后，
    // 这个 effect 会再次运行，从而正确找到并设置 Video URL。
  }, [avatars, setAvatarId, setAvatarVideoUrl]); 
  // =================================================================


  const refreshAvatarList = async () => {
    if (!api || isRefreshing || refreshCooldown) return;

    setIsRefreshing(true);
    try {
      const avatarList = await api.getAvatarList();
      setAvatars(avatarList);

      setRefreshCooldown(true);
      setTimeout(() => setRefreshCooldown(false), 5000);
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
                        key={index}
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
                        key={index}
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
