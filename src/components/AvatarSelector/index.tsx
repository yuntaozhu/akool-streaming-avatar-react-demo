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

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  setAvatarId,
  avatars,
  setAvatars,
  setAvatarVideoUrl,
}) => {

  useEffect(() => {
    if (api) {
      // 1. 获取最新的 Avatar 列表
      api.getAvatarList().then((list) => {
        setAvatars(list);
        console.log("=== 可用的 Avatar 列表 ===");
        list.forEach(a => {
            console.log(`名称: ${a.name}, ID: ${a.avatar_id}`);
        });
        console.log("==========================");

        // 2. 自动选择列表中的第一个作为默认值（保证 ID 是有效的）
        if (list.length > 0) {
            const validAvatar = list[0];
            logger.info('自动选择有效的 Avatar', { id: validAvatar.avatar_id });
            setAvatarId(validAvatar.avatar_id);
            setAvatarVideoUrl(validAvatar.url);
        }
      }).catch(err => {
          logger.error("获取列表失败", err);
      });
    }
  }, [api, setAvatars, setAvatarId, setAvatarVideoUrl]);

  return (
    <div>
      <label>
        Avatar (Auto-Selecting Valid ID):
        <div style={{ marginTop: '8px', color: 'green' }}>
           请查看浏览器控制台(F12)获取 ID，或直接使用自动选中的第一个。
        </div>
      </label>
    </div>
  );
};

export default AvatarSelector;
