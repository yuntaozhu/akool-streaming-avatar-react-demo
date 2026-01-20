import React, { useEffect, useRef, useState, useCallback } from 'react';
import AkoolApi from './AkoolApi'; // 假设您的 API 类路径在此
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
  // ---------------------------------------------------------
  // 1. 状态管理
  // ---------------------------------------------------------
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [avatarId, setAvatarId] = useState<string>('YmccSeRJRZ0ZwepqOUety'); // 默认 ID
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // 侧边栏开关状态
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // 聊天相关
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [avatars, setAvatars] = useState<any[]>([]); // 存储从 AvatarSelector 传来的列表

  // 引用
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const apiRef = useRef<any>(null);

  // ---------------------------------------------------------
  // 2. 初始化 API 实例
  // ---------------------------------------------------------
  useEffect(() => {
    // 这里实例化 AkoolApi，您原来的代码可能从外部传入或在此创建
    // 这里假设 AkoolApi 不需要参数或从环境变量读取
    const api = new AkoolApi();
    apiRef.current = api;
  }, []);

  // ---------------------------------------------------------
  // 3. 核心功能：开始会话 (Start Streaming)
  // ---------------------------------------------------------
  const startStreaming = async () => {
    if (isLoading || isStreaming) return;

    setIsLoading(true);
    setStatusMessage('正在初始化 Session...');
    
    try {
      const api = apiRef.current;
      if (!api) throw new Error("API 未初始化");

      // 1. 获取 Token (使用 V3 接口，或者复用 AvatarSelector 里的逻辑，这里简化处理)
      // 如果 AvatarSelector 里已经把 Key 存入 localStorage，我们可以尝试直接获取 Token
      // 为了演示稳健性，这里再次获取一次 Token (或者您可以从 localStorage 读取 AccessToken)
      
      // 假设 AvatarSelector 已经验证过了，我们这里直接发起 Session 请求
      // 注意：Akool SDK 内部通常需要 accessToken。
      // 这里为了确保万无一失，我们手动获取一下 Token
      const credentials = {
        clientId: "cWFdsLqE7c2Dnd60dNKvtg==", // 您的 Client ID
        clientSecret: "d9Fgepd9nkGD2k380XiRxX0RT6VsNwue" // 您的 API Key
      };
      
      const tokenRes = await fetch("https://openapi.akool.com/api/open/v3/getToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.token || tokenData.data?.token;

      if (!accessToken) throw new Error("无法获取 Access Token");

      // 2. 初始化 SDK
      const avatar = new StreamingAvatar({
        token: accessToken,
      });
      avatarRef.current = avatar;

      // 3. 设置回调
      avatar.on('stream_ready', (event) => {
        setStreamUrl(event.detail.url);
        setIsStreaming(true);
        setStatusMessage('连接成功！');
        
        // 自动播放视频
        if (videoRef.current) {
          videoRef.current.srcObject = event.detail.stream;
          videoRef.current.play().catch(e => console.error("自动播放失败:", e));
        }
      });

      avatar.on('disconnected', () => {
        setIsStreaming(false);
        setStreamUrl('');
        setStatusMessage('连接断开');
      });

      // 4. 【至关重要】构建 Session 参数
      // 强制从 localStorage 读取我们在 AvatarSelector 里存好的 KB ID
      const storedKbId = localStorage.getItem("AKOOL_KB_ID");
      
      // 查找当前 avatar 对象
      const currentAvatarData = avatars.find(a => a.avatar_id === avatarId) || {};
      const fallbackKbId = currentAvatarData.knowledge_id || "";

      const finalKbId = storedKbId || fallbackKbId;
      console.log("🚀 [App] 正在创建 Session，使用的 Knowledge ID:", finalKbId);

      if (!finalKbId) {
        alert("警告：未检测到知识库 ID，数字人可能无法回答文档内容。请等待左侧‘知识库资源’变绿后再试。");
      }

      await avatar.createStartAvatar({
        avatar_id: avatarId,
        quality: AvatarQuality.High,
        knowledge_base_id: finalKbId, // 关键参数
        knowledge_id: finalKbId,      // 兼容参数
        chat_mode: finalKbId ? "knowledge_base" : "chat_mode", // 只要有 ID 就强制用 KB 模式
        voice_emotion: VoiceEmotion.Happy, // 设定情感
        mode_type: 2, // 交互模式
      });

      setStatusMessage('会话已创建，等待视频流...');

    } catch (error: any) {
      console.error("启动失败:", error);
      setStatusMessage(`启动失败: ${error.message}`);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // 4. 核心功能：结束会话
  // ---------------------------------------------------------
  const stopStreaming = async () => {
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
  };

  // ---------------------------------------------------------
  // 5. 聊天功能
  // ---------------------------------------------------------
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !avatarRef.current) return;
    
    const text = chatInput;
    setChatInput('');
    
    // 添加用户消息到列表
    setMessages(prev => [...prev, { text, isUser: true, timestamp: Date.now() }]);

    try {
      // 发送给数字人
      // Akool SDK 通常提供 sendMessage 或类似方法
      // 如果是 SDK v2/v3 可能是 chat()
      // 这里假设 SDK 方法名为 sendMessage
      // @ts-ignore
      await avatarRef.current.sendMessage(text); 
      
      // 注意：Akool 的回复通常是语音流，如果需要文字回复，
      // 需要监听 'message_received' 事件 (取决于具体 SDK 版本)
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  };

  // ---------------------------------------------------------
  // 6. 渲染 UI
  // ---------------------------------------------------------
  return (
    <div className="flex w-screen h-screen bg-gray-900 overflow-hidden relative font-sans text-gray-800">
      
      {/* ================= 左侧控制面板 (侧边栏) ================= */}
      <div 
        className={`
          absolute left-0 top-0 h-full bg-white z-20 shadow-2xl flex flex-col transition-all duration-300 ease-in-out border-r border-gray-200
          ${isSidebarOpen ? 'w-[400px] translate-x-0' : 'w-[400px] -translate-x-full'}
        `}
      >
        {/* 顶部标题 */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">🦁</div>
            <h1 className="text-lg font-bold text-gray-800">卢沟π狮 Demo</h1>
          </div>
          {/* 收起按钮 (内部) */}
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
             ✕
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* 组件：数字人选择器 (含知识库逻辑) */}
          <AvatarSelector
            api={apiRef.current}
            avatarId={avatarId}
            setAvatarId={setAvatarId}
            avatars={avatars}
            setAvatars={setAvatars}
            setAvatarVideoUrl={setVideoUrl}
            // 传递 setKnowledgeId 回调
            setKnowledgeId={(id) => {
               console.log("App收到KB_ID:", id);
               localStorage.setItem("AKOOL_KB_ID", id);
            }}
            disabled={isStreaming}
          />

          {/* 状态显示 */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800 font-mono break-all">
            Status: {statusMessage || "Ready"}
          </div>

          {/* 控制按钮 */}
          <div className="space-y-3">
            {!isStreaming ? (
              <button
                onClick={startStreaming}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2 ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-orange-500/30'
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
                className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gray-700 hover:bg-gray-800 shadow-lg transition-all"
              >
                ⏹ Stop Streaming
              </button>
            )}
          </div>

          {/* 聊天输入框 (侧边栏内) */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 mb-2">发送对话</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="问问卢沟π狮..."
                disabled={!isStreaming}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-gray-100"
              />
              <button
                onClick={handleSendMessage}
                disabled={!isStreaming || !chatInput.trim()}
                className="px-3 py-2 bg-orange-100 text-orange-600 rounded-lg font-bold hover:bg-orange-200 disabled:opacity-50 transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        </div>

        {/* 底部版权 */}
        <div className="p-4 bg-gray-50 text-center text-[10px] text-gray-400">
           Akool Streaming Avatar SDK
        </div>
      </div>

      {/* ================= 右侧主区域 (视频) ================= */}
      <div className="flex-1 relative h-full bg-black flex flex-col items-center justify-center">
        
        {/* 【关键功能】悬浮切换按钮 (Toggle Sidebar) */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`
            absolute top-6 left-6 z-50 p-3 rounded-full shadow-2xl transition-all duration-300 group
            ${isSidebarOpen 
               ? 'bg-white/10 text-white hover:bg-white/20'  // 侧边栏打开时，按钮低调一点
               : 'bg-white/10 text-orange-400 border border-orange-400/30 hover:bg-orange-500 hover:text-white backdrop-blur-md' // 侧边栏关闭时，按钮显眼一点
            }
          `}
          title={isSidebarOpen ? "隐藏设置面板" : "显示设置面板"}
        >
          {isSidebarOpen ? (
            // 向左箭头 (收起)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          ) : (
            // 向右箭头 (展开) - 或者是设置图标
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          )}
        </button>

        {/* 视频容器 */}
        <div className="relative w-full h-full flex items-center justify-center">
          {streamUrl ? (
             <video
               ref={videoRef}
               autoPlay
               playsInline
               className="w-full h-full object-contain pointer-events-none" // pointer-events-none 防止视频拦截点击
             />
          ) : (
            // 等待画面
            <div className="flex flex-col items-center justify-center text-white/20 space-y-4">
               <div className="w-20 h-20 rounded-full border-4 border-white/10 flex items-center justify-center">
                  <span className="text-4xl">🦁</span>
               </div>
               <p className="font-light tracking-widest uppercase text-sm">Waiting for signal</p>
            </div>
          )}

          {/* 聊天气泡层 (可选：如果侧边栏隐藏了，可以在这里显示对话历史) */}
          {!isSidebarOpen && messages.length > 0 && (
             <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl space-y-2 pointer-events-none">
                {messages.slice(-3).map((msg, idx) => (
                   <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                         px-4 py-2 rounded-2xl backdrop-blur-md text-sm font-medium shadow-lg max-w-[80%]
                         ${msg.isUser ? 'bg-orange-500/80 text-white rounded-br-none' : 'bg-white/80 text-gray-900 rounded-bl-none'}
                      `}>
                        {msg.text}
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default App;
