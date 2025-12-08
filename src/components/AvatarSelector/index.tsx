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

// 定义固定的 Avatar ID
const FIXED_AVATAR_ID = 'Ydgl3krdKDIruU6QiSxS6';

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  avatarId, // 注意：虽然接收此 props，但我们会强制覆盖它
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
  disabled = false,
}) => {
  // 仅保留刷新状态用于内部逻辑，移除了 manual 切换状态
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 保持获取列表的逻辑，为了能匹配到 ID 对应的 Video URL
  const refreshAvatarList = async () => {
    if (!api || isRefreshing) return; // 移除了 cooldown 限制以便初始化能顺利执行

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

  // 新增：初始化副作用
  // 1. 强制设置 Avatar ID
  // 2. 如果没有列表数据，自动拉取一次
  useEffect(() => {
    setAvatarId(FIXED_AVATAR_ID);
    if (avatars.length === 0) {
      refreshAvatarList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]); // 依赖项简化，确保挂载时执行

  // 新增：监听列表变化，自动设置对应的 Video URL
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
          {/* 强制显示固定 ID 的输入框，并设为禁用状态 */}
          <input
            type="text"
            value={FIXED_AVATAR_ID}
            readOnly
            disabled={true} 
            className="avatar-select" // 保持原有样式类名
            style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed', width: '100%' }}
          />
          {/* 保留刷新按钮，万一网络问题导致没获取到 URL，可以手动重试，但通常不需要 */}
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
