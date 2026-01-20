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
      // 1. 直接获取 Token (确保成功)
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

      // 4. 获取知识库 ID (强制从 localStorage 读取)
      const storedKbId = localStorage.getItem("AKOOL_KB_ID");
      const currentAvatarData = avatars.find(a => a.avatar_id === avatarId) || {};
      const fallbackKbId = currentAvatarData.knowledge_id || "";
      const finalKbId = storedKbId || fallbackKbId;

      console.log("🚀 [App] 启动参数检查:");
      console.log("   - Avatar ID:", avatarId);
      console.log("   - KB ID:", finalKbId);

      setStatusMessage(`步骤 3/3: 启动数字人 (KB: ${finalKbId ? '已启用' : '未检测到'})...`);

      // 5. 创建会话
      await avatar.createStartAvatar({
        avatar_id: avatarId,
        voice_id: voiceId,
        quality: AvatarQuality.High,
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
    setMessages((prev) => [...prev, { text, isUser: true, timestamp: Date.now() }]);

    try {
      // @ts-ignore
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
          
          <AvatarSelector
            api={null} 
            avatarId={avatarId}
            setAvatarId={setAvatarId}
            avatars={avatars}
            setAvatars={setAvatars}
            setAvatarVideoUrl={setVideoUrl}
            // 收到 KB ID 时存入缓存
            setKnowledgeId={(id: string) => {
               console.log("[App] 收到并缓存 KB_ID:", id);
               localStorage.setItem("AKOOL_KB_ID", id);
            }}
            disabled={isStreaming}
          />

          <div className={`p-3 rounded-lg border text-xs font-mono break-all ${statusMessage.includes('失败') || statusMessage.includes('Error') ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            Status: {statusMessage || "Ready to connect"}
          </div>

          {/* Start/Stop 按钮 */}
          <div className="pt-2">
            {!isStreaming ? (
              <button
                onClick={startStreaming}
                disabled={isLoading}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-orange-500/30 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>正在连接...</span>
                  </>
                ) : (
                  <>
                    <span>▶ Start Streaming</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopStreaming}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gray-700 hover:bg-gray-800 shadow-lg transition-all"
              >
                ⏹ Stop Streaming
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 text-center text-[10px] text-gray-400">
           Powered by Akool API V4
        </div>
      </div>


      {/* 
         === 右侧主区域 (Video + Chat) ===
      */}
      <div className="flex-1 relative h-full bg-black flex flex-col items-center justify-center overflow-hidden">
        
        {/* 悬浮按钮 (Toggle) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            absolute top-6 left-6 z-40 p-3 rounded-full shadow-2xl transition-all duration-300 group
            ${isSidebarOpen 
               ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm' 
               : 'bg-white text-orange-500 hover:bg-orange-500 hover:text-white hover:scale-110'
            }
          `}
          title={isSidebarOpen ? "隐藏设置" : "打开设置"}
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          )}
        </button>

        {/* 视频容器 */}
        <div className="w-full h-full relative">
          {streamUrl ? (
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               className="w-full h-full object-contain pointer-events-none" 
             />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 space-y-4">
               <div className="w-24 h-24 rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5 animate-pulse">
                  <span className="text-4xl">🦁</span>
               </div>
               <p className="font-light tracking-widest uppercase text-sm">Waiting for signal</p>
            </div>
          )}

          {/* 
             === 聊天 UI (悬浮在底部) ===
          */}
          {isStreaming && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl z-20 flex flex-col space-y-3">
              
              {/* 消息历史 */}
              <div 
                ref={chatScrollRef}
                className="max-h-[200px] overflow-y-auto px-2 space-y-2 custom-scrollbar"
              >
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-4 py-2 max-w-[85%] rounded-2xl text-sm font-medium backdrop-blur-md shadow-lg ${
                      msg.isUser ? 'bg-orange-500/80 text-white rounded-br-sm' : 'bg-white/80 text-gray-900 rounded-bl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* 输入框 */}
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl transition-all focus-within:bg-white/20 focus-within:border-white/40">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="与卢沟π狮对话..."
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/50 px-3 text-sm h-10"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="h-10 w-10 flex items-center justify-center bg-white/20 hover:bg-orange-500 rounded-xl text-white transition-all disabled:opacity-30 disabled:hover:bg-white/20"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
