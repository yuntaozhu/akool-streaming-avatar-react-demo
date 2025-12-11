import React, { useEffect } from 'react';

// 保持接口定义不变，以满足父组件传参的类型检查
interface AvatarSelectorProps {
  api: any;
  avatarId: string;
  setAvatarId: (avatarId: string) => void;
  avatars: any[];
  setAvatars: any;
  setAvatarVideoUrl?: any;
  disabled?: boolean;
}

// 您指定的 Custom Avatar ID
const CUSTOM_AVATAR_ID = "KW3VZF-FccCBAuAZmEws8";

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  setAvatarId,
  avatarId,
  disabled
  // api,      <-- 移除了这些未使用的变量
  // avatars,  <-- 移除了这些未使用的变量
}) => {

  useEffect(() => {
    // 核心逻辑：强制锁定 ID
    if (avatarId !== CUSTOM_AVATAR_ID) {
      console.log(`[AvatarSelector] Enforcing custom avatar: ${CUSTOM_AVATAR_ID}`);
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  return (
    <div className="w-full">
      <div className={`p-4 border rounded-lg shadow-sm transition-colors ${
        disabled ? 'bg-gray-100 border-gray-200' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            Custom
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              Custom Avatar Active
            </h3>
            <p className="text-xs text-gray-500 font-mono truncate" title={CUSTOM_AVATAR_ID}>
              ID: {CUSTOM_AVATAR_ID}
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center text-xs text-blue-700 font-medium">
          <span className="flex h-2 w-2 relative mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          系统已锁定此 Avatar 进行播报
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
