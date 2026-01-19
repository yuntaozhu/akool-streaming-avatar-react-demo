import React, { useEffect, useState, useRef } from 'react';

// 接口定义，满足父组件传参的类型检查
interface AvatarSelectorProps {
  api: any;
  avatarId: string;
  setAvatarId: (avatarId: string) => void;
  avatars: any[]; // 这里定义了 avatars
  setAvatars: any;
  setAvatarVideoUrl?: any;
  disabled?: boolean;
  // 支持父组件单独管理 knowledgeId
  setKnowledgeId?: (id: string) => void;
}

// 1. 指定数字人 ID：卢沟π狮
const CUSTOM_AVATAR_ID = "YmccSeRJRZ0ZwepqOUety";

/**
 * 2. 卢沟π狮 知识库完整配置
 * 修复：移除了 urls 中的 OneDrive 链接，因为那是网页而非文件，API 无法抓取会导致失败。
 * 仅保留 docs 中的 PDF 直链。
 */
export const PI_LION_KB_DATA = {
  name: "卢沟π狮_KB_v1", // 名字可以唯一化，避免重复
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
  // urls: [] // 暂时留空，OneDrive 链接通常会导致 API 抓取失败
};

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  api,
  setAvatarId,
  avatarId,
  avatars, // 现在我们在代码中使用了这个变量，TS 报错会消失
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

  // 逻辑2：检查并初始化知识库
  useEffect(() => {
    const initKnowledgeBase = async () => {
      if (!api || initRef.current) return;
      
      // 检查 avatars 列表中是否已经存在该角色的 knowledge_id (避免重复创建)
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
      console.log("[AvatarSelector] 开始调用 Akool API 创建知识库...");

      try {
        // 调用 Akool V4 接口
        const response = await api.post('/api/open/v4/knowledge/create', PI_LION_KB_DATA);
        
        console.log("[AvatarSelector] API 响应:", response.data);

        // 成功判断 (code 1000)
        if (response.data && response.data.code === 1000 && response.data.data?._id) {
          const newKbId = response.data.data._id;
          console.log(`[AvatarSelector] 知识库创建成功! ID: ${newKbId}`);
          
          setCurrentKbId(newKbId);
          setKbStatus('ready');

          // 更新父组件状态，将 ID 注入到对应的数字人对象中
          if (setAvatars) {
            setAvatars((prev: any[]) => {
              if (!prev || prev.length === 0) {
                 return [{ 
                   avatar_id: CUSTOM_AVATAR_ID, 
                   name: "卢沟π狮", 
                   knowledge_id: newKbId 
                 }];
              }
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
          console.error("[AvatarSelector] 知识库创建失败:", response.data);
          setKbStatus('error');
        }
      } catch (error) {
        console.error("[AvatarSelector] API 网络或 CORS 错误:", error);
        setKbStatus('error');
      }
    };

    initKnowledgeBase();
  }, [api, setAvatars, setKnowledgeId, avatars]); // 添加 avatars 到依赖

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
