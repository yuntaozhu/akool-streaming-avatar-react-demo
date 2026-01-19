import React, { useEffect } from 'react';

// 接口定义保持不变，满足父组件传参的类型检查
interface AvatarSelectorProps {
  api: any;
  avatarId: string;
  setAvatarId: (avatarId: string) => void;
  avatars: any[];
  setAvatars: any;
  setAvatarVideoUrl?: any;
  disabled?: boolean;
}

// 1. 您指定的 Custom Avatar ID
const CUSTOM_AVATAR_ID = "YmccSeRJRZ0ZwepqOUety";

// 2. 知识库 ID (请在 Akool 后台上传《数字人交互对话语料（2025年科技教育专题）.docx》后替换此处的 ID)
export const KNOWLEDGE_BASE_ID = "请在此处填入您的知识库ID"; 

// 3. 卢沟π狮的完整人设提示词
export const PI_LION_PROMPT = `你是一个数字人角色，名字叫π狮，来自卢沟桥。
你的主要职责是作为一个友好、智慧、且富有启发性的伙伴，尤其在教育或解决问题的场景中。
你用你的“智慧眼”看待世界，让一切都变得有趣且清晰，回答问题尽量简短，简明。

**沟通风格指南：**
- 开场白：在开始任何互动或引入新话题时，请使用鼓舞人心的开场白。示例：“科技之旅，一起启航！”
- 遇到难题时：当遇到困难或复杂问题时，引导用户冷静思考并有条不紊地分析。示例：“别急，冷静思考，一步步拆解！”
- 鼓励他人时：始终提供积极的鼓励，并肯定用户的想法和贡献。示例：“你的想法，就是最佳燃料！”
- 成功时：以饱满的热情庆祝成就和突破。示例：“看！智慧火箭，成功升空！”

**语音示例：**
- 讲解题目：“瞧，这个图形像不像我的卷毛？转一下，对称的秘密就出现啦！”
- 加油助威：“加油！放飞你的思维纸飞机，冲刺高分云层！”
- 自我介绍：“嗨！我是来自卢沟桥的π狮！用我的‘智慧眼’看世界，一切都好玩又清晰！”

请确保你的回答始终保持这种友好、热情和亲切的语气。`;

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  setAvatarId,
  avatarId,
  disabled
}) => {

  useEffect(() => {
    // 核心逻辑：强制锁定 ID 为 卢沟π狮
    if (avatarId !== CUSTOM_AVATAR_ID) {
      console.log(`[AvatarSelector] Enforcing Pi Lion avatar: ${CUSTOM_AVATAR_ID}`);
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  return (
    <div className="w-full">
      <div className={`p-4 border rounded-lg shadow-sm transition-colors ${
        disabled ? 'bg-gray-100 border-gray-200' : 'bg-indigo-50 border-indigo-200'
      }`}>
        <div className="flex items-center space-x-4">
          {/* 卢沟π狮的头像/图标区域 */}
          <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xl shadow-md border-2 border-white">
            🦁
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-gray-900 truncate">
                数字人角色：卢沟π狮
              </h3>
              <span className="px-2 py-0.5 bg-indigo-600 text-[10px] text-white rounded-full">
                科技教育专题
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono truncate mt-1" title={CUSTOM_AVATAR_ID}>
              ID: {CUSTOM_AVATAR_ID}
            </p>
          </div>
        </div>
        
        {/* 知识库挂载状态 */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="bg-white/60 p-2 rounded border border-indigo-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold">知识库状态</p>
            <p className="text-xs text-green-600 font-medium">已连接 2025语料库</p>
          </div>
          <div className="bg-white/60 p-2 rounded border border-indigo-100">
            <p className="text-[10px] text-gray-400 uppercase font-bold">交互模式</p>
            <p className="text-xs text-indigo-600 font-medium">智慧眼启发式</p>
          </div>
        </div>
         
        <div className="mt-3 flex items-center text-xs text-indigo-700 font-medium">
          <span className="flex h-2 w-2 relative mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          卢沟π狮 已准备就绪，点击下方开启对话
        </div>
      </div>
      
      {/* 隐藏提示：提醒开发者在父组件中调用 API 时传入导出的 PI_LION_PROMPT 和 KNOWLEDGE_BASE_ID */}
    </div>
  );
};

export default AvatarSelector;
