import React, { useState, useMemo, useEffect } from 'react';
import { Avatar, ApiService } from '../../apiService';
import { logger } from '../../core/Logger';
import './styles.css';

interface AvatarSelectorProps {
  api: ApiService | null | undefined;
  avatarId: string;
  setAvatarId: (id:string) => void;
  avatars: Avatar[];
  setAvatars: (avatars: Avatar[]) => void;
  setAvatarVideoUrl: (url: string) => void;
  disabled?: boolean;
}

// 将指定的默认 Avatar ID 定义为常量
export const DEFAULT_AVATAR_ID = 'Ydgl3krdKDIruU6QiSxS6';

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
  
  // 使用 useMemo 来合并传入的 avatars 列表和我们指定的默认 avatar
  // 这样可以确保指定的 avatar 总是存在于列表中，并且避免在每次渲染时都重新计算
  const combinedAvatars = useMemo(() => {
    const customAvatarExists = avatars.some(a => a.avatar_id === DEFAULT_AVATAR_ID);
    
    // 如果 API 返回的列表中不包含这个 avatar，我们就手动添加一个
    if (!customAvatarExists) {
      const defaultCustomAvatar: Avatar = {
        avatar_id: DEFAULT_AVATAR_ID,
        name: 'Default Custom (Ydgl3krd)', // 给它一个清晰的名字
        available: true, // 假设它是可用的
        from: 3, // 确保它出现在 "Custom Avatars" 组中
        url: '', // URL 需要在选中时或从 API 获取后填充
      };
      return [...avatars, defaultCustomAvatar];
    }
    
    return avatars;
  }, [avatars]);

  // 使用 useEffect 来处理组件加载时的默认值
  // 当 avatarId 或 avatars 列表变化时，确保视频 URL 被正确设置
  useEffect(() => {
    if (avatarId) {
      const avatar = combinedAvatars.find((a) => a.avatar_id === avatarId);
      if (avatar && avatar.url) { // 只有在 avatar 有 url 时才更新
        logger.info('Update avatar video url on load/change', { url: avatar.url });
        setAvatarVideoUrl(avatar.url);
      }
    }
  }, [avatarId, combinedAvatars, setAvatarVideoUrl]);


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
    const avatar = combinedAvatars.find((a) => a.avatar_id === newAvatarId);
    if (avatar && avatar.url) {
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
                disabled={!combinedAvatars.length || disabled}
                className="avatar-select"
              >
                <option value="">Select an avatar</option>
                <optgroup label="Official Avatars">
                  {combinedAvatars
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
                  {combinedAvatars
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
