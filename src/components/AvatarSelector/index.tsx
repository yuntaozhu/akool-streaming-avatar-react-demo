import React, { useState, useEffect } from 'react'; // 引入 useEffect
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
// 根据已有代码结构，我们需要适配 Avatar 接口
// 假设 Avatar 接口包含 avatar_id, name, url, available, from 等字段
const DEFAULT_TARGET_AVATAR: any = { // 使用 any 或 Avatar 类型，取决于具体类型定义
  avatar_id: 'KW3VZF-FccCBAuAZmEws8',
  name: 'dgdavatar',
  url: 'https://drz0f01yeq1cx.cloudfront.net/1764832345393-39b9ea6e-5850-479f-908c-6a7d26b36489-3511.mp4',
  available: true,
  from: 1, // 对应 prompt 中的 url_from: 1 (非3，所以会显示在 Official 分组)
  type: 2  // 保留原始信息
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

  // 2. 新增: 组件挂载时的初始化逻辑
  useEffect(() => {
    // 如果当前没有选中任何 ID，则设置为默认数字人
    if (!avatarId) {
      logger.info('Initializing default avatar', { avatarId: DEFAULT_TARGET_AVATAR.avatar_id });
      setAvatarId(DEFAULT_TARGET_AVATAR.avatar_id);
      setAvatarVideoUrl(DEFAULT_TARGET_AVATAR.url);
    }

    // 检查当前列表是否包含该默认头像，如果不包含则添加
    // 注意：这里依赖 avatars 可能会导致循环，所以只检查是否需要添加
    const exists = avatars.find(a => a.avatar_id === DEFAULT_TARGET_AVATAR.avatar_id);
    if (!exists) {
      // 将默认头像放到列表最前面
      setAvatars([DEFAULT_TARGET_AVATAR, ...avatars]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组，确保只在挂载时执行一次初始化检查

  const refreshAvatarList = async () => {
    if (!api || isRefreshing || refreshCooldown) return;

    setIsRefreshing(true);
    try {
      const avatarList = await api.getAvatarList();
      
      // 3. 修改: 刷新列表时，确保默认头像依然存在
      const isDefaultInList = avatarList.find((a: Avatar) => a.avatar_id === DEFAULT_TARGET_AVATAR.avatar_id);
      
      let finalList = avatarList;
      if (!isDefaultInList) {
        // 如果 API 返回的列表里没有这个默认头像，我们手动加进去
        finalList = [DEFAULT_TARGET_AVATAR, ...avatarList];
      }

      setAvatars(finalList);

      setRefreshCooldown(true);
      setTimeout(() => setRefreshCooldown(false), 5000);
      
      // 如果刷新后当前选中的 ID 还是空的（理论上不太可能，但也处理一下），再次选中默认值
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
                        key={`${avatar.avatar_id}-${index}`} // 优化 key，防止 ID 重复时的冲突
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
