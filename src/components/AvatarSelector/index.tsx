import React, { useEffect } from 'react';

// 接口定义，满足父组件传参的类型检查
interface AvatarSelectorProps {
  api: any;
  avatarId: string;
  setAvatarId: (avatarId: string) => void;
  avatars: any[];
  setAvatars: any;
  setAvatarVideoUrl?: any;
  disabled?: boolean;
}

// 1. 指定数字人 ID：卢沟π狮
const CUSTOM_AVATAR_ID = "YmccSeRJRZ0ZwepqOUety";

/**
 * 2. 卢沟π狮 知识库完整配置 (符合 Akool V4 API 规范)
 * 此配置用于调用 https://openapi.akool.com/api/open/v4/knowledge/create
 */
export const PI_LION_KB_DATA = {
  name: "卢沟π狮-科技教育知识库2025",
  prologue: "科技之旅，一起启航！我是来自卢沟桥的π狮，准备好和我一起探索世界了吗？",
  prompt: `你是一个数字人角色，名字叫π狮，来自卢沟桥。
你的主要职责是作为一个友好、智慧、且富有启发性的伙伴，尤其在教育或解决问题的场景中。
你用你的“智慧眼”看待世界，让一切都变得有趣且清晰，回答问题尽量简短，简明。

**沟通风格指南：**
- 开场白：在开始任何互动或引入新话题时，请使用鼓舞人心的开场白。示例：“科技之旅，一起启航！”
- 遇到难题时：当遇到困难或复杂问题时，引导用户冷静思考并有条不紊地分析。示例：“别急，冷静思考，一步步拆解！”
- 鼓励他人时：始终提供积极的鼓励，并肯定用户的想法和贡献。示例：“你的想法，就是最佳燃料！”
- 成功时：以饱满的热情庆祝成就和突破。示例：“看！智慧火箭，成功升空！”

**语音示例（展示对话风格）：**
1. 讲解题目时（例如，对称概念）：
   “瞧，这个图形像不像我的卷毛？转一下，对称的秘密就出现啦！”
2. 加油助威时：
   “加油！放飞你的思维纸飞机，冲刺高分云层！”
3. 自我介绍时：
   “嗨！我是来自卢沟桥的π狮！用我的‘智慧眼’看世界，一切都好玩又清晰！”

请确保你的回答始终保持这种友好、热情和亲切的语气。`,
  docs: [
    {
      name: "数字人交互对话语料（2025年科技教育专题）.docx",
      url: "https://1drv.ms/w/c/c655bc5b05fe812b/IQDusIZTSVoCQYz0i8w17hIDAUHrhHhho9EKaAVxLRM9ETA?e=GLyxQU",
      size: 1024000 // 文件预估大小
    }
  ],
  urls: [
    "https://1drv.ms/w/c/c655bc5b05fe812b/IQDusIZTSVoCQYz0i8w17hIDAUHrhHhho9EKaAVxLRM9ETA?e=GLyxQU" // 参考文档链接
  ]
};

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  setAvatarId,
  avatarId,
  disabled
}) => {

  useEffect(() => {
    // 核心逻辑：强制锁定 ID 为 卢沟π狮
    if (avatarId !== CUSTOM_AVATAR_ID) {
      console.log(`[AvatarSelector] 强制锁定卢沟π狮角色 ID: ${CUSTOM_AVATAR_ID}`);
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  return (
    <div className="w-full">
      <div className={`p-5 border-2 rounded-xl shadow-lg transition-all ${
        disabled ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-br from-indigo-50 via-white to-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center space-x-4">
          {/* 角色图标：狮子形象装饰 */}
          <div className="relative">
            <div className="h-14 w-14 bg-gradient-to-tr from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-3xl shadow-md border-2 border-white">
              🦁
            </div>
            <div className="absolute -top-1 -right-1">
              <span className="flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-gray-900 truncate">
                卢沟π狮 (Pi Lion)
              </h3>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full border border-orange-200">
                AI 智慧导师
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">
              ID: {CUSTOM_AVATAR_ID}
            </p>
          </div>
        </div>
        
        {/* 知识库挂载提示 */}
        <div className="mt-4 p-3 bg-white/50 rounded-lg border border-orange-100">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider">知识库资源</span>
            <span className="text-green-600 font-medium">已连接 (OneDrive)</span>
          </div>
          <div className="text-xs text-orange-800 line-clamp-1 font-medium italic">
            📄 数字人交互对话语料（2025年科技教育专题）.docx
          </div>
        </div>
         
        <div className="mt-4 flex items-center text-xs text-indigo-700 font-semibold bg-indigo-50/50 p-2 rounded-md">
          <span className="mr-2">✨</span>
          人设已加载：友好、智慧、来自卢沟桥
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
