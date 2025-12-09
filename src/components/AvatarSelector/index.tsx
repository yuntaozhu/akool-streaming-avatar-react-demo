import React, { useEffect } from 'react';

// 为了防止引入找不到类型的错误，这里对复杂类型暂时使用 any
// 这样可以确保 build 一定能通过
interface AvatarSelectorProps {
  api: any;             // 父组件传来的 api 实例
  avatarId: string;     // 当前选中的 id
  setAvatarId: (avatarId: string) => void; // 设置 id 的方法
  avatars: any[];       // 头像列表
  setAvatars: any;      // 设置头像列表的方法
  setAvatarVideoUrl?: any; // 可选
  disabled?: boolean;   // 是否禁用
}

// 您指定的 Custom Avatar ID
const CUSTOM_AVATAR_ID = "KW3VZF-FccCBAuAZmEws8";

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  setAvatarId,
  avatarId,
  // 下面这些 props 是父组件传进来的，我们接收它们以消除 TS 报错，
  // 但我们在逻辑中并不真正使用它们去拉取列表。
  api, 
  avatars,
  disabled
}) => {

  useEffect(() => {
    // 核心逻辑：一旦组件加载或 ID 变动，强制将其“纠正”为您指定的 ID
    if (avatarId !== CUSTOM_AVATAR_ID) {
      console.log(`[AvatarSelector] Enforcing custom avatar: ${CUSTOM_AVATAR_ID}`);
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  return (
    <div className="w-full">
      {/* 这里是一个静态的 UI，展示当前强制使用的 Avatar 信息 */}
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
        
        {/* 状态提示 */}
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
