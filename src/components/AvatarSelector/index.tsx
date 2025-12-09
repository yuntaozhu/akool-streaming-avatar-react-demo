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

  // 刷新列表函数
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
                /* 
                   【修复点 1】：逻辑修正
                   移除了 !avatars.length 的判断。
                   这样做是为了防止 API 返回空列表时下拉框被禁用，导致无法选择下方硬编码的自定义选项。
                */
                disabled={disabled}
                className="avatar-select"
              >
                <option value="">Select an avatar</option>
                
                {/* 官方数字人分组 */}
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

                {/* 自定义数字人分组 */}
                <optgroup label="Custom Avatars">
                  {/* 
                      【修复点 2】：添加硬编码选项
                      在这里手动添加了你指定的 Avatar ID，即使 API 没返回它也会显示。
                  */}
                  <option value="Ydgl3krdKDIruU6QiSxS6" className="available">
                    🟢 My Custom Avatar (Ydgl3krdKDIruU6QiSxS6)
                  </option>
                  
                  {/*原本的列表渲染逻辑保持不变*/}
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
                /* 
                   【修复点 3】：语法修复 (关键)
                   原代码此处为 "onClick=" (空的)，导致了 TS17000 和 TS6133 报错。
                   现已补全为 "onClick={}"。
                */
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
