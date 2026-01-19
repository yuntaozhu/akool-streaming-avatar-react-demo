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

// 2. 【关键】在此处填入你申请的新 API Key
const MY_AKOOL_KEY = "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue"; 

/**
 * 3. 卢沟π狮 知识库配置
 */
export const PI_LION_KB_DATA = {
  name: "卢沟π狮_KB_Auto_v5", 
  prologue: "你是一个数字人，名字叫卢沟π狮。 你的主要职责是作为一个友好、智慧、且富有启发性的伙伴，尤其在教育或解决问题的场景中。",
  // 强化 Prompt，强制要求使用知识库
  prompt: `你是一个数字人角色，名字叫π狮，来自卢沟桥。
你必须基于上传的文档（Docs）内容来回答用户的问题。
如果用户问的问题在文档里找不到，请礼貌地回答“这个知识点我还得去学习一下”。

**沟通风格指南：**
- 热情、友好、充满智慧。
- 喜欢用比喻，例如把困难比作“未解的谜题”，把成功比作“升空的火箭”。
- 开场白示例：“科技之旅，一起启航！”

请记住：优先检索知识库文档回答问题。`,
  docs: [
    {
      name: "数字人交互对话语料（2025年科技教育专题）.pdf",
      // 确保这个链接是公网可访问的直链（点击能直接下载或预览的）
      url: "https://d5v2vcqcwe9y5.cloudfront.net/default/260119/6895c322a2c15d2d55d6a3d9/i575uiupbqm8.pdf",
      size: 1024000
    }
  ],
  urls: [
    "https://docs.akool.com/"
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
  const [debugLog, setDebugLog] = useState<string>('准备连接...');
  const initRef = useRef(false);

  // 强制锁定 ID
  useEffect(() => {
    if (avatarId !== CUSTOM_AVATAR_ID) {
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  // 核心逻辑：创建/连接知识库
  const initKnowledgeBase = async () => {
    setKbStatus('loading');
    setDebugLog("正在使用新 Key 连接云端...");

    // 使用你提供的新 Key
    const token = MY_AKOOL_KEY;

    try {
      const myHeaders = new Headers();
      myHeaders.append("Authorization", `Bearer ${token}`);
      myHeaders.append("Content-Type", "application/json");

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(PI_LION_KB_DATA),
        redirect: "follow"
      };

      // 调用 Akool 接口
      const response = await fetch("https://openapi.akool.com/api/open/v4/knowledge/create", requestOptions);
      const result = await response.json();
      
      console.log("[AvatarSelector] API 响应:", result);

      if (response.ok && result.code === 1000 && result.data?._id) {
        const newKbId = result.data._id;
        setDebugLog(`✅ 连接成功! KB_ID: ${newKbId}`);
        setCurrentKbId(newKbId);
        setKbStatus('ready');

        // 【至关重要】将 KB_ID 更新到父组件的列表中
        // 这样点击 Start Streaming 时，父组件才能把 ID 发送给 Akool
        if (setAvatars) {
          setAvatars((prev: any[]) => {
            // 如果列表里还没这个角色，造一个
            const hasAvatar = prev?.find((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
            
            // 构造新的角色对象
            const updatedAvatar = { 
                avatar_id: CUSTOM_AVATAR_ID, 
                name: "卢沟π狮", 
                knowledge_id: newKbId  // 注入 ID
            };

            if (!prev || prev.length === 0) {
                return [updatedAvatar];
            }

            if (!hasAvatar) {
                return [...prev, updatedAvatar];
            }

            // 更新现有列表
            return prev.map(avatar => {
              if (avatar.avatar_id === CUSTOM_AVATAR_ID) {
                return { ...avatar, knowledge_id: newKbId };
              }
              return avatar;
            });
          });
        }
        
        // 备用更新方式
        if (setKnowledgeId) setKnowledgeId(newKbId);

      } else {
        setDebugLog(`❌ API 返回错误: ${result.msg || JSON.stringify(result)}`);
        setKbStatus('error');
      }
    } catch (error) {
      console.error(error);
      setDebugLog(`❌ 网络/代码错误: ${error}`);
      setKbStatus('error');
    }
  };

  // 组件加载时自动执行
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // 检查是否已经有 ID (避免重复创建)
    if (avatars && avatars.length > 0) {
        const existing = avatars.find((a: any) => a.avatar_id === CUSTOM_AVATAR_ID && a.knowledge_id);
        if (existing) {
            setDebugLog(`✅ 复用已有 ID: ${existing.knowledge_id}`);
            setCurrentKbId(existing.knowledge_id);
            setKbStatus('ready');
            return;
        }
    }

    // 立即执行连接
    initKnowledgeBase();
  }, [avatars]);

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
        
        {/* 知识库状态区域 */}
        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
           kbStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-white/50 border-orange-100'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider">知识库资源</span>
            
            {kbStatus === 'ready' && <span className="text-green-600 font-medium">✅ 已连接</span>}
            {kbStatus === 'loading' && <span className="text-orange-500 font-medium animate-pulse">正在连接...</span>}
            {kbStatus === 'error' && <span className="text-red-500 font-medium">❌ 未连接</span>}
          </div>
          
          {/* 日志显示 */}
          <div className="text-[10px] text-gray-500 font-mono mb-2 break-all bg-gray-50 p-1 rounded">
             {debugLog}
          </div>

          {kbStatus === 'ready' && (
            <>
              <div className="text-xs text-orange-800 line-clamp-1 font-medium italic">
                📄 数字人交互对话语料（2025年科技教育专题）.pdf
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                KB_ID: {currentKbId}
              </div>
            </>
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
