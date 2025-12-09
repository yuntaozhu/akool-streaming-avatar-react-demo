import React, { useEffect } from 'react';
// 注意：请根据实际情况确认 configurationStore 的导入路径
import { useConfigurationStore } from '../../stores/configurationStore'; 

// 定义您的 Custom Avatar ID
const CUSTOM_AVATAR_ID = "KW3VZF-FccCBAuAZmEws8";

const AvatarSelector: React.FC = () => {
  // 从 Store 中获取设置 Avatar ID 的方法
  // 注意：如果是 useStreamingContext，请改为从 Context 获取
  const { setAvatarId, avatarId } = useConfigurationStore();

  useEffect(() => {
    // 组件加载时，强制设置为您指定的 Avatar ID
    if (avatarId !== CUSTOM_AVATAR_ID) {
      console.log(`[AvatarSelector] Forcing custom avatar: ${CUSTOM_AVATAR_ID}`);
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [setAvatarId, avatarId]);

  // 返回一个简单的 UI，提示当前正在使用的 Avatar
  // 我们屏蔽了原本的列表渲染，确保不会切换到其他 Avatar
  return (
    <div className="w-full p-4 border border-blue-200 bg-blue-50 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          A
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">Custom Avatar Active</h3>
          <p className="text-xs text-gray-500 font-mono">{CUSTOM_AVATAR_ID}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-blue-600">
        ✅ 系统已锁定使用此 Avatar 进行播报
      </div>
    </div>
  );
};

export default AvatarSelector;
