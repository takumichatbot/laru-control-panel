'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
// ★重要: URLパラメータとルーターを取得するためのフック
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Terminal, Send, Cpu, Github, 
  ShieldCheck, AlertCircle, ImageIcon 
} from 'lucide-react';

// ★修正: チャンネルID（Repo ID）を受け取ってURLを作る
const getWebSocketUrl = (channelId: string) => {
  if (typeof window === 'undefined') return '';
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // バックエンドは /ws/{channel_id} で待っているため、個別に接続します
  return `${protocol}//${window.location.host}/ws/${channelId}`;
};

type Message = {
  role: 'user' | 'ai' | 'system';
  text: string;
  time: string;
  image?: string;
};

const REPOS = [
  { id: 'larubot', name: 'LARU_BOT', desc: 'AI Chat Service' },
  { id: 'flastal', name: 'FLASTAL', desc: 'Client Work' },
  { id: 'laruvisona', name: 'LARU_VISONA', desc: 'Image Gen' },
  { id: 'larunexus', name: 'LARU_NEXUS', desc: 'Core System' },
];

export default function DevConsole() {
  // ★重要: URLから projectId (例: larubot) を取得
  const params = useParams();
  const router = useRouter();
  
  // URLパラメータがある場合はそれを使い、なければデフォルトへ
  const projectId = typeof params?.projectId === 'string' ? params.projectId : 'larubot';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ★重要: projectId が変わるたびにWebSocketを再接続する
  useEffect(() => {
    // URLが変わったらメッセージ履歴をリセット（サーバーから履歴が送られてくるため）
    setMessages([]); 
    
    const wsUrl = getWebSocketUrl(projectId);
    if (!wsUrl) return;

    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log(`Connecting to Channel: ${projectId}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addMessage('system', `SECURE CONNECTION ESTABLISHED. CHANNEL: ${projectId.toUpperCase()}`);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // ★追加: サーバーから履歴同期（HISTORY_SYNC）が来た場合の処理
          if (data.type === 'HISTORY_SYNC' && Array.isArray(data.data)) {
            const history = data.data.map((log: any) => ({
              role: log.type === 'gemini' ? 'ai' : (log.type === 'user' ? 'user' : 'system'),
              text: log.msg,
              time: log.time,
              image: log.imageUrl
            }));
            // 履歴を一括セット（以前の重複を防ぐ）
            setMessages(history);
            return;
          }

          if (data.type === 'LOG' && data.payload) {
            const { msg, type, imageUrl } = data.payload;
            if (type === 'gemini') {
              setIsTyping(false);
              addMessage('ai', msg, imageUrl);
            } else if (type === 'error') {
              addMessage('system', `ERROR: ${msg}`);
            } else if (type === 'thinking') {
               setIsTyping(true);
            } else if (type === 'browser') {
               // ブラウザのスクショなどはシステムログとして表示
               addMessage('system', `[BROWSER LOG] ${msg}`, imageUrl);
            }
          }
        } catch (e) {
          console.error('Message parse error:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 3000);
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };
    };

    connect();
    return () => { 
      clearTimeout(reconnectTimeout);
      wsRef.current?.close(); 
    };
  }, [projectId]); // projectIdが変わるたびに再実行

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const addMessage = (role: Message['role'], text: string, image?: string) => {
    setMessages(prev => [...prev, {
      role, text, time: new Date().toLocaleTimeString(), image
    }]);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    // UI反映
    addMessage('user', input);
    setIsTyping(true);

    // WebSocket送信
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // コマンド送信
        wsRef.current.send(JSON.stringify({ type: 'CHAT', command: input }));
    } else {
        setTimeout(() => {
            setIsTyping(false);
            addMessage('system', 'OFFLINE MODE: Server not connected.');
        }, 500);
    }

    setInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      addMessage('user', 'Uploaded Screenshot Analysis Request', base64);
      setIsTyping(true);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            type: 'REALTIME_INPUT',
            image: base64Data,
            text: `Analyze this image in context of ${projectId}.`
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ★重要: サイドバーの切り替え処理
  const switchRepo = (repoId: string) => {
    // ページ遷移を実行（stateを変えるのではなくURLを変える）
    router.push(`/dev/${repoId}`);
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-zinc-950 text-zinc-300 font-mono flex flex-col md:flex-row overflow-hidden selection:bg-purple-500/30">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-black border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0 transition-all duration-300 z-30">
        <div className="h-12 md:h-14 flex items-center px-4 gap-3 bg-zinc-900/50 shrink-0">
          <Link href="/" className="text-zinc-500 hover:text-white transition-colors p-1">
            <ArrowLeft size={18} />
          </Link>
          <div className="font-bold text-sm tracking-wider text-purple-400 truncate">DEV_CONSOLE</div>
          
          <div className="md:hidden ml-auto flex items-center gap-2 text-[10px]">
             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}/>
          </div>
        </div>
        
        <div className="p-2 md:p-3 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:flex-1 scrollbar-hide md:scrollbar-thin">
           <div className="hidden md:block text-[10px] font-bold text-zinc-600 px-2 mb-1">TARGET REPOSITORY</div>
           {REPOS.map(repo => (
             <button
               key={repo.id}
               onClick={() => switchRepo(repo.id)} // ★URL変更処理へ
               className={`flex-shrink-0 text-left p-2 md:p-3 rounded-lg border transition-all group relative overflow-hidden min-w-[140px] md:min-w-0 ${
                 projectId === repo.id 
                   ? 'bg-purple-900/10 border-purple-500/40 text-purple-200' 
                   : 'bg-zinc-900/30 border-zinc-800 text-zinc-500 hover:bg-zinc-900'
               }`}
             >
                <div className="flex items-center gap-2 mb-1 relative z-10">
                   <Github size={14} />
                   <span className="font-bold text-xs truncate">{repo.name}</span>
                </div>
                <div className="text-[10px] opacity-70 relative z-10 truncate">{repo.desc}</div>
                {projectId === repo.id && <div className="absolute inset-0 bg-purple-500/5 animate-pulse z-0"/>}
             </button>
           ))}
        </div>
        
        <div className="hidden md:block p-4 border-t border-zinc-800 bg-zinc-900/20 mt-auto">
           <div className="flex items-center gap-2 text-[10px]">
             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}/>
             <span>{isConnected ? 'SYSTEM ONLINE' : 'DISCONNECTED'}</span>
           </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950 relative overflow-hidden">
        <div className="h-10 md:h-14 border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 bg-zinc-900/50 backdrop-blur shrink-0 z-10">
           <div className="flex items-center gap-3 overflow-hidden">
              <Terminal size={16} className="text-purple-500 shrink-0"/>
              <span className="font-bold text-xs md:text-sm truncate">
                Target: <span className="text-white">{projectId.toUpperCase()}</span>
              </span>
           </div>
           <div className="flex items-center gap-2 text-[10px] text-zinc-500 bg-black/40 px-3 py-1 rounded-full border border-zinc-800 shrink-0">
              <ShieldCheck size={12} className="text-emerald-500"/>
              <span className="hidden md:inline">WRITE_ACCESS</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 overscroll-contain pb-24">
           {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-zinc-700 gap-4 opacity-50 pb-20">
               <Cpu size={48} />
               <p className="text-xs text-center">INITIALIZING {projectId.toUpperCase()} CHANNEL...</p>
             </div>
           )}
           
           {messages.map((m, i) => (
             <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {m.role !== 'user' && (
                 <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${m.role === 'ai' ? 'bg-purple-900/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'}`}>
                   {m.role === 'ai' ? <Cpu size={16}/> : <AlertCircle size={16}/>}
                 </div>
               )}
               <div className={`max-w-[85%] space-y-1`}>
                  <div className={`flex items-center gap-2 text-[10px] ${m.role === 'user' ? 'justify-end text-zinc-500' : 'text-zinc-500'}`}>
                    <span>{m.role === 'user' ? 'YOU' : 'GOD_AI'}</span>
                    <span>{m.time}</span>
                  </div>
                  {m.image && <img src={m.image} alt="Upload" className="rounded border border-zinc-700 max-w-xs mb-2 w-full" />}
                  <div className={`p-3 rounded text-xs md:text-sm font-mono whitespace-pre-wrap leading-relaxed break-words ${
                    m.role === 'user' 
                      ? 'bg-zinc-800 text-white border border-zinc-700' 
                      : (m.role === 'ai' ? 'bg-purple-950/10 text-purple-100 border border-purple-500/20' : 'bg-red-900/10 text-red-300 border-red-900/30')
                  }`}>
                    {m.text}
                  </div>
               </div>
             </div>
           ))}
           {isTyping && <div className="text-xs text-purple-400 animate-pulse ml-12">Generating response...</div>}
           <div ref={messagesEndRef} className="h-1" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-black border-t border-zinc-800 shrink-0 pb-safe z-50">
           <div className="flex gap-2 max-w-4xl mx-auto relative z-50">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 transition-colors shrink-0">
                <ImageIcon size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isConnected ? `Command to ${projectId}...` : "Connecting..."}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white pl-4 pr-12 py-3 rounded-lg focus:outline-none focus:border-purple-500/50 font-mono text-sm shadow-lg"
                  autoComplete="off"
                />
                <button onClick={handleSend} disabled={!input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors disabled:opacity-50">
                   <Send size={16} />
                </button>
              </div>
           </div>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
      `}</style>
    </div>
  );
}