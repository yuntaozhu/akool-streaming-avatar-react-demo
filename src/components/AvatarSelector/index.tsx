import React, { useEffect, useState, useRef } from 'react';

// 接口定义，满足父组件传参的类型检查
interface AvatarSelectorProps {
  api: any;
  avatarId: string;
  setAvatarId: (avatarId: string) => void;
  avatars: any[];
  setAvatars: any;
  setAvatarVideoUrl?: any;
  disabled?: boolean;
  // 新增：如果父组件支持单独设置 knowledgeId，可以使用此方法
  setKnowledgeId?: (id: string) => void;
}

// 1. 指定数字人 ID：卢沟π狮
const CUSTOM_AVATAR_ID = "YmccSeRJRZ0ZwepqOUety";

/**
 * 2. 卢沟π狮 知识库完整配置 (符合 Akool V4 API 规范)
 * 此配置用于调用 https://openapi.akool.com/api/open/v4/knowledge/create
 */
export const PI_LION_KB_DATA = {
  name: "卢沟π狮",
  prologue: "你是一个数字人，名字叫卢沟π狮。 你的主要职责是作为一个友好、智慧、且富有启发性的伙伴，尤其在教育或解决问题的场景中。 你用你的“智慧眼”看待世界，让一切都变得有趣且清晰。",
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
      name: "数字人交互对话语料（2025年科技教育专题）.pdf",
      url: "https://d5v2vcqcwe9y5.cloudfront.net/default/260119/6895c322a2c15d2d55d6a3d9/i575uiupbqm8.pdf",
      size: 1024000 // 文件预估大小
    }
  ],
  urls: [
    "https://1drv.ms/b/c/c655bc5b05fe812b/IQDz_arLHbemSLXFMOKh4EiNAfTXDY__-45LxAhzH0ZBX9s?e=yyha0i" // 参考文档链接
  ]
};

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  setAvatarId,
  avatarId,
  avatars,
  setAvatars,
  disabled,
  setKnowledgeId
}) => {
  // 状态管理：知识库加载状态
  const [kbStatus, setKbStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [currentKbId, setCurrentKbId] = useState<string>('');
  const initRef = useRef(false); // 防止重复调用

  // 核心逻辑1：强制锁定 ID 为 卢沟π狮
  useEffect(() => {
    if (avatarId !== CUSTOM_AVATAR_ID) {
      console.log(`[AvatarSelector] 强制锁定卢沟π狮角色 ID: ${CUSTOM_AVATAR_ID}`);
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  // 核心逻辑2：调用 API 创建/连接知识库，并将 ID 回传给 Avatar 对象
  useEffect(() => {
    const initKnowledgeBase = async () => {
      // 如果已经初始化过，或 API 实例不存在，则跳过
      if (initRef.current || !api) return;
      initRef.current = true;

      setKbStatus('loading');
      console.log("[AvatarSelector] 开始初始化知识库...");

      try {
        // 调用 Akool V4 接口创建知识库
        // 注意：Akool 的知识库如果 name 相同通常会返回已存在的 ID 或创建新的，这里假定每次会话初始化一次
        const response = await api.post('/api/open/v4/knowledge/create', PI_LION_KB_DATA);
        
        // 解析响应 (通常结构为 { code: 1000, data: { _id: "..." }, ... })
        if (response.data && response.data.code === 1000 && response.data.data?._id) {
          const newKbId = response.data.data._id;
          console.log(`[AvatarSelector] 知识库连接成功! KB_ID: ${newKbId}`);
          
          setCurrentKbId(newKbId);
          setKbStatus('ready');

          // 【关键步骤】将 knowledge_id 注入到 avatars 列表中对应的角色对象里
          // 这样父组件在调用 createSession 时，从 avatars 中获取当前角色信息时就能拿到 knowledge_id
          if (setAvatars) {
            setAvatars((prevAvatars: any[]) => {
              // 如果列表为空，至少创建一个包含当前 ID 的对象
              if (!prevAvatars || prevAvatars.length === 0) {
                 return [{ 
                   avatar_id: CUSTOM_AVATAR_ID, 
                   name: "卢沟π狮", 
                   knowledge_id: newKbId 
                 }];
              }
              // 否则更新列表中的目标角色
              return prevAvatars.map(avatar => {
                if (avatar.avatar_id === CUSTOM_AVATAR_ID) {
                  return { ...avatar, knowledge_id: newKbId };
                }
                return avatar;
              });
            });
          }

          // 如果父组件传递了专门的 setKnowledgeId 方法，也调用它
          if (setKnowledgeId) {
            setKnowledgeId(newKbId);
          }

        } else {
          console.error("[AvatarSelector] 知识库创建失败，API 响应异常:", response.data);
          setKbStatus('error');
        }
      } catch (error) {
        console.error("[AvatarSelector] 知识库 API 调用出错:", error);
        setKbStatus('error');
      }
    };

    initKnowledgeBase();
  }, [api, setAvatars, setKnowledgeId]);

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
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${kbStatus === 'ready' ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 border-2 border-white ${kbStatus === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
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
        
        {/* 知识库挂载提示 - 动态状态 */}
        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
           kbStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-white/50 border-orange-100'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider">知识库资源</span>
            
            {/* 状态显示 */}
            {kbStatus === 'loading' && <span className="text-orange-500 font-medium animate-pulse">正在连接云端...</span>}
            {kbStatus === 'ready' && <span className="text-green-600 font-medium">✅ 已连接 (Ready)</span>}
            {kbStatus === 'error' && <span className="text-red-500 font-medium">❌ 连接失败</span>}
            {kbStatus === 'idle' && <span className="text-gray-400 font-medium">等待初始化...</span>}
          </div>
          
          <div className="text-xs text-orange-800 line-clamp-1 font-medium italic">
             📄 数字人交互对话语料（2025年科技教育专题）.pdf
          </div>
          
          {/* 显示当前的 Knowledge ID (调试用) */}
          {currentKbId && (
            <div className="text-[10px] text-gray-400 mt-1 font-mono">
              KB_ID: {currentKbId}
            </div>
          )}
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
