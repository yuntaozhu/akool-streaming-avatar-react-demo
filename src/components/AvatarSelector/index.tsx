import React, { useState } from 'react';
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
                // 【修改点 1】: 移除 !avatars.length 检查，确保即使列表为空也能下拉选择你的自定义项
                disabled={disabled}
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
                  {/* 【修改点 2】: 强制添加你的自定义 Avatar 选项 */}
                  <option value="Ydgl3krdKDIruU6QiSxS6" className="available">
                    🟢 My Custom Avatar (Ydgl3krdKDIruU6QiSxS6)
                  </option>
                  
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
                // 【修改点 3 - 关键修复】: 
                // 之前的代码是 "onClick=" (空的)，导致报错 TS17000。
                // 必须改为 "onClick={}"。
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
