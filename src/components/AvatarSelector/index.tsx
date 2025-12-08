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

// 定义固定的 Avatar ID
const FIXED_AVATAR_ID = 'Ydgl3krdKDIruU6QiSxS6';

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  // setAvatarId 用于设置 ID
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
  disabled = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 保持获取列表逻辑，用于匹配 Video URL
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

  // 初始化副作用：强制设置 ID 并拉取数据
  useEffect(() => {
    setAvatarId(FIXED_AVATAR_ID);
    if (avatars.length === 0) {
      refreshAvatarList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]); 

  // 监听列表变化，自动设置 Video URL
  useEffect(() => {
    const targetAvatar = avatars.find((a) => a.avatar_id === FIXED_AVATAR_ID);
    if (targetAvatar) {
      logger.info('Auto-set fixed avatar video url', { url: targetAvatar.url });
      setAvatarVideoUrl(targetAvatar.url);
    }
  }, [avatars, setAvatarVideoUrl]);

  return (
    <div>
      <label>
        Avatar (Fixed):
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 强制显示固定 ID 的输入框 */}
          <input
            type="text"
            value={FIXED_AVATAR_ID}
            readOnly={true}
            disabled={true}
            className="avatar-select"
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', width: '100%' }}
          />
          {/* 按钮部分：显式赋值避免 TS17000 错误 */}
          <button
            onClick={}
            disabled={isRefreshing || disabled}
            className={`icon-button ${isRefreshing || disabled ? 'disabled' : ''}`}
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
