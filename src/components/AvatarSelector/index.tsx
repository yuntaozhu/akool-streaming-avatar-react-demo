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

// 2. 【核心凭证】根据您的截图填入
const AKOOL_CREDENTIALS = {
  clientId: "cWFdsLqE7c2Dnd60dNKvtg==", 
  clientSecret: "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue" 
};

/**
 * 3. 卢沟π狮 知识库配置
 */
export const PI_LION_KB_DATA = {
  name: "Pi_Lion_Correct_Auth_v4",
  prologue: "你是一个数字人，名字叫卢沟π狮。你的性格热情、幽默且富有智慧。你必须严格基于知识库文档的内容回答问题。",
  prompt: `你是一个数字人角色，名字叫卢沟π狮（Pi Lion）。
你的主要职责是作为一个AI智慧导师。

**重要规则：**
1. 必须优先检索上传的 PDF 文档回答问题。
2. 如果文档里没有答案，请明确告知“这个知识点文档里没有提到”。
3. 保持热情、像大哥哥一样的语调。`,
  docs: [
    {
      name: "数字人交互对话语料（2025年科技教育专题）.pdf",
      url: "https://d5v2vcqcwe9y5.cloudfront.net/default/260119/6895c322a2c15d2d55d6a3d9/i575uiupbqm8.pdf",
      size: 1024000
    }
  ],
  urls: []
};

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  setAvatarId,
  avatarId,
  avatars,
  setAvatars,
  disabled,
  setKnowledgeId
}) => {
  const [kbStatus, setKbStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [currentKbId, setCurrentKbId] = useState<string>('');
  const [debugLog, setDebugLog] = useState<string>('准备初始化...');
  const initRef = useRef(false);

  // 强制锁定 ID
  useEffect(() => {
    if (avatarId !== CUSTOM_AVATAR_ID) {
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  // 核心逻辑：获取 Token -> 创建知识库
  useEffect(() => {
    const initProcess = async () => {
      if (initRef.current) return;
      
      // 检查是否已有 ID (避免重复)
      if (avatars && avatars.length > 0) {
        const existing = avatars.find((a: any) => a.avatar_id === CUSTOM_AVATAR_ID && a.knowledge_id);
        if (existing) {
            setDebugLog(`✅ 已复用 ID: ${existing.knowledge_id}`);
            setCurrentKbId(existing.knowledge_id);
            setKbStatus('ready');
            initRef.current = true;
            return;
        }
      }

      initRef.current = true;
      setKbStatus('loading');
      setDebugLog("步骤1: 正在获取 Access Token...");

      try {
        // --- 第一步：获取 Token (修正为 getToken) ---
        // 之前错误地址: .../api/open/v3/token (404)
        // 正确地址: .../api/open/v3/getToken
        const tokenRes = await fetch("https://openapi.akool.com/api/open/v3/getToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(AKOOL_CREDENTIALS)
        });
        
        const tokenData = await tokenRes.json();
        console.log("[AvatarSelector] Token 响应:", tokenData);

        // 如果接口返回失败
        if (tokenData.code !== 1000 || !tokenData.token) {
           throw new Error(`获取 Token 失败: ${tokenData.msg || JSON.stringify(tokenData)}`);
        }

        const accessToken = tokenData.token;
        setDebugLog("步骤2: Token 获取成功，正在创建知识库...");

        // --- 第二步：创建知识库 ---
        const kbRes = await fetch("https://openapi.akool.com/api/open/v4/knowledge/create", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`, // 使用 Bearer Token
            "Content-Type": "application/json"
          },
          body: JSON.stringify(PI_LION_KB_DATA)
        });

        const kbResult = await kbRes.json();
        console.log("[AvatarSelector] KB 响应:", kbResult);

        if (kbRes.ok && kbResult.code === 1000 && kbResult.data?._id) {
          const newKbId = kbResult.data._id;
          setDebugLog(`✅ 全部成功! KB_ID: ${newKbId}`);
          setCurrentKbId(newKbId);
          setKbStatus('ready');

          // 更新父组件
          if (setAvatars) {
            setAvatars((prev: any[]) => {
              const newAvatarData = { 
                avatar_id: CUSTOM_AVATAR_ID, 
                name: "卢沟π狮", 
                knowledge_id: newKbId 
              };
              if (!prev || prev.length === 0) return [newAvatarData];
              const index = prev.findIndex((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
              if (index !== -1) {
                const newList = [...prev];
                newList[index] = { ...newList[index], knowledge_id: newKbId };
                return newList;
              }
              return [...prev, newAvatarData];
            });
          }
          if (setKnowledgeId) setKnowledgeId(newKbId);

        } else {
            throw new Error(`知识库创建失败: ${kbResult.msg} (Code: ${kbResult.code})`);
        }

      } catch (error: any) {
        console.error(error);
        setDebugLog(`❌ 错误: ${error.message || error}`);
        setKbStatus('error');
      }
    };

    initProcess();
  }, [avatars, setAvatars, setKnowledgeId]);

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
        
        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
           kbStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-white/50 border-orange-100'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider">知识库资源</span>
            {kbStatus === 'ready' && <span className="text-green-600 font-medium">✅ 已连接</span>}
            {kbStatus === 'loading' && <span className="text-orange-500 font-medium animate-pulse">连接中...</span>}
            {kbStatus === 'error' && <span className="text-red-500 font-medium">❌ 失败</span>}
          </div>
          
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
