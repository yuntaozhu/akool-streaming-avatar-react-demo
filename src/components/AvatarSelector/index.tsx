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

// 2. 【核心凭证】(保留您正确的凭证)
const AKOOL_CREDENTIALS = {
  clientId: "cWFdsLqE7c2Dnd60dNKvtg==", 
  clientSecret: "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue" 
};

/**
 * 3. 基础配置 (名称将在代码中动态生成)
 */
const BASE_KB_CONFIG = {
  prologue: "重要：你不是通用助手，你是【卢沟π狮】。必须基于知识库回答。如果被问到‘2025中秋天文活动’，请从文档中提取‘超级月亮’、‘土星伴月’等信息回答。",
  prompt: `你是一个数字人角色，名字叫卢沟π狮（Pi Lion）。
**绝对规则：**
1. 你的所有回答必须基于上传的《数字人交互对话语料》PDF文档。
2. 严禁回答“我是人工智能助手”，你必须回答“我是卢沟π狮”。
3. 如果文档里没有答案，请说“这个我得查查书”。`,
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

  // 核心逻辑
  useEffect(() => {
    const initProcess = async () => {
      if (initRef.current) return;
      
      // 检查复用 (如果有以前生成的 ID，直接用，不重复创建)
      if (avatars && avatars.length > 0) {
        const existing = avatars.find((a: any) => 
          a.avatar_id === CUSTOM_AVATAR_ID && (a.knowledge_id || a.knowledge_base_id)
        );
        if (existing) {
            const id = existing.knowledge_id || existing.knowledge_base_id;
            setDebugLog(`✅ 已复用 ID: ${id}`);
            setCurrentKbId(id);
            setKbStatus('ready');
            initRef.current = true;
            return;
        }
      }

      initRef.current = true;
      setKbStatus('loading');
      setDebugLog("步骤1: 获取 Token...");

      try {
        // 1. 获取 Token
        const tokenRes = await fetch("https://openapi.akool.com/api/open/v3/getToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(AKOOL_CREDENTIALS)
        });
        
        const tokenData = await tokenRes.json();
        
        // 兼容不同的 Token 返回结构
        let accessToken = "";
        if (tokenData.code === 1000 && tokenData.token) accessToken = tokenData.token;
        else if (tokenData.data?.token) accessToken = tokenData.data.token;
        else if (tokenData.token) accessToken = tokenData.token;
        
        if (!accessToken) throw new Error("Token 获取失败");

        setDebugLog("步骤2: 创建知识库 (生成唯一名)...");

        // 2. 动态生成唯一名称，防止 "Name already exists" 错误
        const uniqueName = `Pi_Lion_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const kbPayload = {
            ...BASE_KB_CONFIG,
            name: uniqueName
        };

        // 3. 创建 Knowledge Base
        const kbRes = await fetch("https://openapi.akool.com/api/open/v4/knowledge/create", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(kbPayload)
        });

        const kbResult = await kbRes.json();
        console.log("[AvatarSelector] KB Result:", kbResult);

        if (kbRes.ok && kbResult.code === 1000 && kbResult.data?._id) {
          const newKbId = kbResult.data._id;
          setDebugLog(`✅ 成功! ID: ${newKbId}`);
          setCurrentKbId(newKbId);
          setKbStatus('ready');

          // 更新父组件状态 (双重注入)
          if (setAvatars) {
            setAvatars((prev: any[]) => {
              const newAvatarData = { 
                avatar_id: CUSTOM_AVATAR_ID, 
                name: "卢沟π狮", 
                knowledge_id: newKbId,
                knowledge_base_id: newKbId, 
                description: `KB: ${uniqueName}`
              };

              if (!prev || prev.length === 0) return [newAvatarData];
              
              const index = prev.findIndex((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
              if (index !== -1) {
                const newList = [...prev];
                newList[index] = { 
                  ...newList[index], 
                  knowledge_id: newKbId, 
                  knowledge_base_id: newKbId 
                };
                return newList;
              }
              return [...prev, newAvatarData];
            });
          }
          
          if (setKnowledgeId) setKnowledgeId(newKbId);

        } else {
            // 如果是其它错误，打印出来
            throw new Error(`知识库创建失败: ${kbResult.msg} (${kbResult.code})`);
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
