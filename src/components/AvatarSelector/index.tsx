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

// 2. 您的核心凭证
const AKOOL_CREDENTIALS = {
  clientId: "cWFdsLqE7c2Dnd60dNKvtg==", 
  clientSecret: "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue" 
};

/**
 * 3. 知识库基础配置
 */
const BASE_KB_CONFIG = {
  // Prologue 是最高优先级指令
  prologue: "重要指令：你不是通用AI，你是【卢沟π狮】。你必须仅基于知识库文档回答。如果被问到‘你是谁’，回答‘我是卢沟π狮’。如果被问到文档外的问题，请说‘这个我不知道’。",
  prompt: `你是一个数字人角色，名字叫卢沟π狮（Pi Lion）。
**绝对规则：**
1. 你的回答必须完全基于上传的PDF文档。
2. 严禁回答“我是人工智能助手”。
3. 你的语气要热情、自信。`,
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
      initRef.current = true;
      setKbStatus('loading');
      setDebugLog("步骤1: 获取 Token (V3)...");

      try {
        // 1. 获取 Token
        const tokenRes = await fetch("https://openapi.akool.com/api/open/v3/getToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(AKOOL_CREDENTIALS)
        });
        
        const tokenData = await tokenRes.json();
        let accessToken = tokenData.token || tokenData.data?.token;
        
        if (!accessToken) throw new Error("Token 获取失败");

        setDebugLog("步骤2: 创建知识库...");

        // 2. 动态生成唯一名称
        const uniqueName = `Pi_Lion_${Date.now()}`;
        const kbPayload = { ...BASE_KB_CONFIG, name: uniqueName };

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
          
          // 【核心修正】将 ID 写入 localStorage，供父组件强制读取
          localStorage.setItem("AKOOL_KB_ID", newKbId);
          console.log("已将知识库 ID 写入 localStorage: AKOOL_KB_ID =", newKbId);

          // 更新 React 状态
          if (setAvatars) {
            setAvatars((prev: any[]) => {
              const newAvatarData = { 
                avatar_id: CUSTOM_AVATAR_ID, 
                name: "卢沟π狮", 
                knowledge_id: newKbId,
                knowledge_base_id: newKbId
              };

              if (!prev || prev.length === 0) return [newAvatarData];
              
              const index = prev.findIndex((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
              if (index !== -1) {
                const newList = [...prev];
                newList[index] = { ...newList[index], knowledge_id: newKbId, knowledge_base_id: newKbId };
                return newList;
              }
              return [...prev, newAvatarData];
            });
          }
          if (setKnowledgeId) setKnowledgeId(newKbId);

        } else {
            throw new Error(`创建失败: ${kbResult.msg}`);
        }

      } catch (error: any) {
        console.error(error);
        setDebugLog(`❌ 错误: ${error.message}`);
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
            <h3 className="text-base font-bold text-gray-900 truncate">卢沟π狮 (Pi Lion)</h3>
            <p className="text-xs text-gray-500 font-mono mt-1">ID: {CUSTOM_AVATAR_ID}</p>
          </div>
        </div>
        
        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
           kbStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-white/50 border-orange-100'
        }`}>
           <div className="text-[10px] text-gray-500 font-mono mb-2 break-all bg-gray-50 p-1 rounded">
             {debugLog}
           </div>
           {kbStatus === 'ready' && (
             <div className="text-[10px] text-green-600 font-bold">
               缓存写入成功，请重启会话
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
