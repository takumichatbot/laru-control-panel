'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // チャンク読み込みエラーの場合、強制的にリロードして復旧させる
    if (error.message.includes('Loading chunk') || error.message.includes('minified react error')) {
      window.location.reload();
    }
  }, [error]);

  return (
    <html>
      <body className="bg-black text-cyan-500 font-mono flex flex-col items-center justify-center h-screen p-4">
        <div className="border border-red-500/50 bg-red-950/20 p-8 rounded-2xl max-w-lg w-full text-center shadow-[0_0_50px_rgba(255,0,0,0.2)]">
          <h2 className="text-2xl font-black text-red-500 mb-4 tracking-widest uppercase italic">SYSTEM CRITICAL ERROR</h2>
          <p className="text-gray-300 mb-8 font-bold">
            要塞システムのバージョン不整合を検知しました。<br/>
            最新のセキュリティプロトコルへ再接続します。
          </p>
          <button
            onClick={() => window.location.reload()} // reset()ではなくreload()でキャッシュを破棄
            className="bg-red-600 hover:bg-red-500 text-white font-black py-4 px-10 rounded-full tracking-[0.2em] shadow-lg transition-all active:scale-95"
          >
            SYSTEM_REBOOT (RELOAD)
          </button>
        </div>
      </body>
    </html>
  );
}