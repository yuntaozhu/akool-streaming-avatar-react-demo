import React, { useEffect, useRef, useState, useCallback } from 'react';
import StreamingAvatar, {
  AvatarQuality,
  VoiceEmotion,
} from '@akool/streaming-avatar-sdk';
import AvatarSelector from './components/AvatarSelector';

// 定义消息类型
interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: number;
}

const App: React.FC = () => {
  // -----------------------------------------------------------------------
  // 1. 状态定义
  // -----------------------------------------------------------------------
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [avatarId, setAvatarId] = useState<string>('YmccSeRJRZ0ZwepqOUety'); 
  const [voiceId] = useState<string>('69365315003a8848fff1545e');
  
  // 兼容 AvatarSelector 的 props
  const [, setVideoUrl] = useState<string>(''); 
  const [avatars, setAvatars] = useState<any[]>([]);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // 【UI状态】侧边栏开关
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // 聊天相关
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Refs
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------------
  // 2. 辅助功能：自动滚动聊天
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // -----------------------------------------------------------------------
  // 3. 核心功能：开始会话 (Start Streaming)
  // -----------------------------------------------------------------------
  const startStreaming = useCallback(async () => {
    if (isLoading || isStreaming) return;

    setIsLoading(true);
    setStatusMessage('步骤 1/3: 正在验证权限...');

    try {
      // 1. 直接获取 Token (不依赖外部文件，确保成功)
      const credentials = {
        clientId: "cWFdsLqE7c2Dnd60dNKvtg==", 
        clientSecret: "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue" 
      };
      
      const tokenRes = await fetch("https://openapi.akool.com/api/open/v3/getToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.token || tokenData.data?.token;

      if (!accessToken) {
        throw new Error(`Token 获取失败: ${JSON.stringify(tokenData)}`);
      }

      setStatusMessage('步骤 2/3: 初始化 SDK...');

      // 2. 初始化 SDK
      const avatar = new StreamingAvatar({
        token: accessToken,
      });
      avatarRef.current = avatar;

      // 3. 设置事件监听
      avatar.on('stream_ready', (event: any) => {
        console.log('[App] Stream Ready:', event.detail.url);
        setStreamUrl(event.detail.url);
        setIsStreaming(true);
        setStatusMessage('连接成功！');
        
        // 自动播放视频
        if (videoRef.current) {
          videoRef.current.srcObject = event.detail.stream;
          videoRef.current.play().catch(e => console.error("自动播放被拦截:", e));
        }
      });

      avatar.on('disconnected', () => {
        setIsStreaming(false);
        setStreamUrl('');
        setStatusMessage('连接断开');
      });

      avatar.on('error', (error: any) => {
        console.error('[App] SDK Error:', error);
        setStatusMessage(`运行错误: ${error.detail?.message || 'Unknown'}`);
      });

      // 4. 【核心修复】获取知识库 ID
      // 强制从 localStorage 读取 AvatarSelector 存入的 ID
      const storedKbId = localStorage.getItem("AKOOL_KB_ID");
      
      // 备选：从 avatars 列表查找
      const currentAvatarData = avatars.find(a => a.avatar_id === avatarId) || {};
      const fallbackKbId = currentAvatarData.knowledge_id || "";
      
      // 最终 ID
      const finalKbId = storedKbId || fallbackKbId;

      console.log("🚀 [App] 启动参数检查:");
      console.log("   - Avatar ID:", avatarId);
      console.log("   - Knowledge ID (Local):", storedKbId);
      console.log("   - Knowledge ID (List):", fallbackKbId);
      console.log("   👉 最终使用的 ID:", finalKbId);

      setStatusMessage(`步骤 3/3: 启动数字人 (KB: ${finalKbId ? '已启用' : '未检测到'})...`);

      // 5. 创建会话
      await avatar.createStartAvatar({
        avatar_id: avatarId,
        voice_id: voiceId,
        quality: AvatarQuality.High,
        // 关键：必须同时传递这几个参数以确保知识库生效
        knowledge_base_id: finalKbId, 
        knowledge_id: finalKbId,      
        chat_mode: finalKbId ? "knowledge_base" : undefined, 
        voice_emotion: VoiceEmotion.Happy, 
        mode_type: 2, 
      });

    } catch (error: any) {
      console.error("[App] 启动失败:", error);
      setStatusMessage(`启动失败: ${error.message}`);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, [avatarId, voiceId, avatars, isLoading, isStreaming]);

  // -----------------------------------------------------------------------
  // 4. 结束会话
  // -----------------------------------------------------------------------
  const stopStreaming = useCallback(async () => {
    if (!avatarRef.current) return;
    try {
      await avatarRef.current.stopAvatar();
      avatarRef.current = null;
    } catch (e) {
      console.error(e);
    }
    setIsStreaming(false);
    setStreamUrl('');
    setMessages([]);
    setStatusMessage('');
  }, []);

  // -----------------------------------------------------------------------
  // 5. 聊天处理
  // -----------------------------------------------------------------------
  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || !avatarRef.current) return;
    
    const text = chatInput;
    setChatInput('');
    
    // UI 立即显示
    setMessages((prev) => [...prev, { text, isUser: true, timestamp: Date.now() }]);

    try {
      // @ts-ignore - SDK 类型定义有时候不准确
      await avatarRef.current.sendMessage(text);
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  }, [chatInput]);

  // -----------------------------------------------------------------------
  // 6. 渲染 UI
  // -----------------------------------------------------------------------
  return (
    <div className="flex w-screen h-screen bg-gray-900 overflow-hidden relative font-sans text-gray-800">
      
      {/* 
         === 左侧侧边栏 (Settings) ===
      */}
      <div 
        className={`
          absolute left-0 top-0 h-full bg-white z-30 shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200
          ${isSidebarOpen ? 'w-[400px] translate-x-0 opacity-100' : 'w-[400px] -translate-x-full opacity-0 pointer-events-none'}
        `}
      >
        {/* 标题栏 */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
            <h1 className="text-lg font-bold text-gray-800">Akool Demo</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* AvatarSelector 组件 (不需要改动, 保持引用) */}
          <AvatarSelector
            api={null} // App.tsx 内部处理了鉴权，这里传 null 即可
            avatarId={avatarId}
            setAvatarId={setAvatarId}
            avatars={avatars}
            setAvatars={setAvatars}
            setAvatarVideoUrl={setVideoUrl}
            // 当 AvatarSelector 生成 ID 时，同步到 localStorage
            setKnowledgeId={(id: string) => {
               console.log("[App] 收到并缓存 KB_ID:", id);
               localStorage.setItem("AKOOL_KB_ID", id);
            }}
            disabled={isStreaming}
          />

          {/* 状态监控 */}
          <div className={`p-3 rounded-lg border text-xs font-mono break-all ${statusMessage.includes('失败') || statusMessage.includes('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            Status: {statusMessage || "Ready to connect"}
          </div>

          {/* Start/Stop 按钮 */}
          <div className="pt-2">
            {!isStreaming ? (
              <button
                onClick={startStreaming}
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justi
