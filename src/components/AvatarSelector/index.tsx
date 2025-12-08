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

// 定义固定的 Avatar ID
const FIXED_AVATAR_ID = 'Ydgl3krdKDIruU6QiSxS6';

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
}) => {

  // 1. 初始化：设置 ID 并自动拉取列表（为了获取对应的 Video URL）
  useEffect(() => {
    // 强制设置 ID
    setAvatarId(FIXED_AVATAR_ID);

    // 如果 API 存在且列表为空，自动拉取一次数据
    if (api && avatars.length === 0) {
      api.getAvatarList()
        .then((list) => {
          setAvatars(list);
        })
        .catch((error) => {
          logger.error('Error auto-refreshing avatar list', { error });
        });
    }
  }, [api, setAvatarId, avatars.length, setAvatars]);

  // 2. 数据匹配：当 avatars 列表更新后，找到对应的 URL 并设置
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
        Avatar (Default):
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
          {/* 只保留一个只读输入框，移除所有按钮，彻底解决 TS17000 报错 */}
          <input
            type="text"
            value={FIXED_AVATAR_ID}
            readOnly={true}
            disabled={true}
            className="avatar-select"
            style={{ 
              backgroundColor: '#f0f0f0', 
              cursor: 'not-allowed', 
              width: '100%',
              color: '#666'
            }}
          />
        </div>
      </label>
    </div>
  );
};

export default AvatarSelector;
