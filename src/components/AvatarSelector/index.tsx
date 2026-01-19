import React, { useEffect, useState, useRef } from 'react';

// 接口定义
interface AvatarSelectorProps {
  api: any;
  avatarId: string;
  setAvatarId: (avatarId: string) => void;
  avatars: any[];
  setAvatars: any;
  setAvatarVideoUrl?: any;
  disabled?: boolean;
  setKnowledgeId?: (id: string) => void;
}

// 1. 指定数字人 ID：卢沟π狮
const CUSTOM_AVATAR_ID = "YmccSeRJRZ0ZwepqOUety";

/**
 * 2. 卢沟π狮 知识库配置
 * 使用 Akool V4 接口规范
 */
export const PI_LION_KB_DATA = {
  name: "卢沟π狮_KB_Final",
  prologue: "你是一个数字人，名字叫卢沟π狮。 你的主要职责是作为一个友好、智慧、且富有启发性的伙伴，尤其在教育或解决问题的场景中。 你用你的“智慧眼”看待世界，让一切都变得有趣且清晰。",
  prompt: `你是一个数字人角色，名字叫π狮，来自卢沟桥。
你的主要职责是作为一个友好、智慧、且富有启发性的伙伴，尤其在教育或解决问题的场景中。
你用你的“智慧眼”看待世界，让一切都变得有趣且清晰，回答问题尽量简短，简明。

**沟通风格指南：**
- 开场白：在开始任何互动或引入新话题时，请使用鼓舞人心的开场白。示例：“科技之旅，一起启航！”
- 遇到难题时：当遇到困难或复杂问题时，引导用户冷静思考并有条不紊地分析。示例：“别急，冷静思考，一步步拆解！”
- 鼓励他人时：始终提供积极的鼓励，并肯定用户的想法和贡献。示例：“你的想法，就是最佳燃料！”
- 成功时：以饱满的热情庆祝成就和突破。示例：“看！智慧火箭，成功升空！”

请确保你的回答始终保持这种友好、热情和亲切的语气。`,
  docs: [
    {
      name: "数字人交互对话语料（2025年科技教育专题）.pdf",
      url: "https://d5v2vcqcwe9y5.cloudfront.net/default/260119/6895c322a2c15d2d55d6a3d9/i575uiupbqm8.pdf",
      size: 1024000
    }
  ],
  // 按照您的示例代码，保留 urls 字段，可以是相关帮助文档链接
  urls: [
    "https://docs.akool.com/ai-tools-suite/knowledge-base"
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
  // 状态管理
  const [kbStatus, setKbStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [currentKbId, setCurrentKbId] = useState<string>('');
  const initRef = useRef(false);

  // 逻辑1：强制锁定 ID
  useEffect(() => {
    if (avatarId !== CUSTOM_AVATAR_ID) {
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  // 逻辑2：检查并初始化知识库 (使用 fetch)
  useEffect(() => {
    const initKnowledgeBase = async () => {
      // 1. 基础检查
      if (!api || initRef.current) return;
      
      // 2. 尝试从 api 对象中获取 Token
      // AkoolApi 类通常将 key 存储在 apiKey 或 token 属性中
      // 我们使用 (api as any) 绕过 TS 检查，以防属性是私有的
      const token = (api as any).apiKey || (api as any).token;

      if (!token) {
        console.warn("[AvatarSelector] 等待 API Token...");
        return; // Token 可能还没准备好，等待下一次渲染
      }

      // 3. 检查是否已经存在 knowledge_id，避免重复创建
      if (avatars && avatars.length > 0) {
        const targetAvatar = avatars.find((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
        if (targetAvatar && targetAvatar.knowledge_id) {
          console.log(`[AvatarSelector] 检测到已存在 Knowledge ID: ${targetAvatar.knowledge_id}`);
          setCurrentKbId(targetAvatar.knowledge_id);
          setKbStatus('ready');
          if (setKnowledgeId) setKnowledgeId(targetAvatar.knowledge_id);
          initRef.current = true;
          return;
        }
      }

      initRef.current = true;
      setKbStatus('loading');
      console.log("[AvatarSelector] 开始创建知识库 (Fetch Mode)...");

      try {
        // 4. 构建请求头 (参照您的示例代码)
        const myHeaders = new Headers();
        // 如果您的 Token 是 API Key 格式，通常使用 Authorization: Bearer
        // 如果 Akool V4 明确要求 x-api-key，可以取消下面注释的切换
        myHeaders.append("Authorization", `Bearer ${token}`); 
        // myHeaders.append("x-api-key", token); // 备选方案
        myHeaders.append("Content-Type", "application/json");

        const requestOptions: RequestInit = {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify(PI_LION_KB_DATA),
          redirect: "follow"
        };

        // 5. 发起请求 - 使用绝对 URL
        const response = await fetch("https://openapi.akool.com/api/open/v4/knowledge/create", requestOptions);
        const result = await response.json();

        console.log("[AvatarSelector] API 响应结果:", result);

        // 6. 处理响应
        if (response.ok && result.code === 1000 && result.data?._id) {
          const newKbId = result.data._id;
          console.log(`[AvatarSelector] 知识库创建成功! ID: ${newKbId}`);
          
          setCurrentKbId(newKbId);
          setKbStatus('ready');

          // 更新父组件状态
          if (setAvatars) {
            setAvatars((prev: any[]) => {
              // 确保列表中有这个角色
              const hasAvatar = prev?.find((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
              if (!prev || prev.length === 0 || !hasAvatar) {
                 // 如果列表为空或没找到，添加一个新的
                 const newAvatar = { 
                   avatar_id: CUSTOM_AVATAR_ID, 
                   name: "卢沟π狮", 
                   knowledge_id: newKbId 
                 };
                 return prev ? [...prev, newAvatar] : [newAvatar];
              }
              // 更新现有角色
              return prev.map(avatar => {
                if (avatar.avatar_id === CUSTOM_AVATAR_ID) {
                  return { ...avatar, knowledge_id: newKbId };
                }
                return avatar;
              });
            });
          }

          if (setKnowledgeId) setKnowledgeId(newKbId);

        } else {
          console.error("[AvatarSelector] 知识库创建失败，错误信息:", result);
          setKbStatus('error');
        }
      } catch (error) {
        console.error("[AvatarSelector] 网络请求异常:", error);
        setKbStatus('error');
      }
    };

    initKnowledgeBase();
  }, [api, setAvatars, setKnowledgeId, avatars]);

  return (
    <div className="w-full">
      <div className={`p-5 border-2 rounded-xl shadow-lg transition-all ${
        disabled ? 'bg-gray-100 border-gray-200' : 'bg-gradient-to-br from-indigo-50 via-white to-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center space-x-4">
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
        
        {/* 知识库状态栏 */}
        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
           kbStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-white/50 border-orange-100'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider">知识库资源</span>
            
            {kbStatus === 'loading' && <span className="text-orange-500 font-medium animate-pulse">正在连接...</span>}
            {kbStatus === 'ready' && <span className="text-green-600 font-medium">✅ 已连接</span>}
            {kbStatus === 'error' && <span className="text-red-500 font-medium">❌ 连接失败(请看控制台)</span>}
            {kbStatus === 'idle' && <span className="text-gray-400 font-medium">等待初始化...</span>}
          </div>
          
          <div className="text-xs text-orange-800 line-clamp-1 font-medium italic">
             📄 数字人交互对话语料（2025年科技教育专题）.pdf
          </div>
          
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
