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

// 2. 【核心修改】直接写入您新申请的 API Key，不再自动获取
const FORCE_API_KEY = "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue";

/**
 * 3. 卢沟π狮 知识库与人设配置
 */
export const PI_LION_KB_DATA = {
  name: "Pi_Lion_Fixed_v1", // 名字唯一化
  // Prologue 直接定义人设，Akool 会优先读取这里
  prologue: "你是一个数字人，名字叫卢沟π狮。你的性格热情、幽默且富有智慧。你必须严格基于知识库文档的内容回答问题。如果文档里没有，就说不知道。",
  prompt: `你是一个数字人角色，名字叫卢沟π狮（Pi Lion）。
你的主要职责是作为一个AI智慧导师，尤其在教育或解决问题的场景中。

**重要规则：**
1. 必须优先检索上传的 PDF 文档回答问题。
2. 你的语气要活泼、像个大哥哥。
3. 如果用户问“你是谁”，必须回答“我是来自卢沟桥的π狮”。

**文档资源：**
我们已经上传了《数字人交互对话语料（2025年科技教育专题）.pdf》作为你的核心知识。`,
  docs: [
    {
      name: "数字人交互对话语料（2025年科技教育专题）.pdf",
      // 这个链接必须是公网可访问的
      url: "https://d5v2vcqcwe9y5.cloudfront.net/default/260119/6895c322a2c15d2d55d6a3d9/i575uiupbqm8.pdf",
      size: 1024000
    }
  ],
  urls: [] // 暂时置空避免干扰
};

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
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

  // 逻辑1：强制锁定 ID
  useEffect(() => {
    if (avatarId !== CUSTOM_AVATAR_ID) {
      setAvatarId(CUSTOM_AVATAR_ID);
    }
  }, [avatarId, setAvatarId]);

  // 逻辑2：组件加载时，强制使用 Key 连接 Akool
  useEffect(() => {
    const connectToAkool = async () => {
      // 防止重复调用
      if (initRef.current) return;
      
      // 检查是否已经存在 ID（比如父组件已经有了）
      if (avatars && avatars.length > 0) {
        const existing = avatars.find((a: any) => a.avatar_id === CUSTOM_AVATAR_ID && a.knowledge_id);
        if (existing) {
            console.log("复用已有 ID:", existing.knowledge_id);
            setDebugLog(`✅ 已复用 ID: ${existing.knowledge_id}`);
            setCurrentKbId(existing.knowledge_id);
            setKbStatus('ready');
            initRef.current = true;
            return;
        }
      }

      initRef.current = true;
      setKbStatus('loading');
      setDebugLog("正在使用内置 Key 连接...");

      try {
        const myHeaders = new Headers();
        // 强制使用我们写死的 Key
        myHeaders.append("Authorization", `Bearer ${FORCE_API_KEY}`);
        myHeaders.append("Content-Type", "application/json");

        const requestOptions: RequestInit = {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify(PI_LION_KB_DATA),
          redirect: "follow"
        };

        console.log("[AvatarSelector] 发送请求...");
        const response = await fetch("https://openapi.akool.com/api/open/v4/knowledge/create", requestOptions);
        const result = await response.json();
        
        console.log("[AvatarSelector] 响应:", result);

        if (response.ok && result.code === 1000 && result.data?._id) {
          const newKbId = result.data._id;
          setDebugLog(`✅ 连接成功! ID: ${newKbId}`);
          setCurrentKbId(newKbId);
          setKbStatus('ready');

          // 【关键】更新父组件数据，注入 knowledge_id
          if (setAvatars) {
            setAvatars((prev: any[]) => {
              const newAvatarData = { 
                avatar_id: CUSTOM_AVATAR_ID, 
                name: "卢沟π狮", 
                knowledge_id: newKbId 
              };

              // 如果列表为空，直接返回新列表
              if (!prev || prev.length === 0) return [newAvatarData];

              // 如果列表里已有该角色，更新它
              const index = prev.findIndex((a: any) => a.avatar_id === CUSTOM_AVATAR_ID);
              if (index !== -1) {
                const newList = [...prev];
                newList[index] = { ...newList[index], knowledge_id: newKbId };
                return newList;
              }

              // 否则追加
              return [...prev, newAvatarData];
            });
          }
          
          if (setKnowledgeId) setKnowledgeId(newKbId);

        } else {
          // 如果出错，打印具体 API 错误信息
          const errorMsg = result.msg || "未知错误";
          setDebugLog(`❌ API 拒绝: ${errorMsg}`);
          setKbStatus('error');
        }
      } catch (error) {
        setDebugLog(`❌ 网络错误: ${error}`);
        setKbStatus('error');
      }
    };

    connectToAkool();
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
        
        {/* 状态显示区 */}
        <div className={`mt-4 p-3 rounded-lg border transition-colors ${
           kbStatus === 'error' ? 'bg-red-50 border-red-200' : 'bg-white/50 border-orange-100'
        }`}>
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-gray-400 font-bold uppercase tracking-wider">知识库资源</span>
            
            {kbStatus === 'ready' && <span className="text-green-600 font-medium">✅ 已连接</span>}
            {kbStatus === 'loading' && <span className="text-orange-500 font-medium animate-pulse">正在连接...</span>}
            {kbStatus === 'error' && <span className="text-red-500 font-medium">❌ 未连接</span>}
          </div>
          
          {/* 这里是调试日志 */}
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
