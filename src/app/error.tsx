'use client'; // エラーコンポーネントは必ずClient Component

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをコンソールに出力
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-red-500 font-mono">
      <h2 className="text-xl font-bold border border-red-500 p-4 rounded mb-4">
        SYSTEM FAILURE: UNKNOWN ERROR
      </h2>
      <p className="text-sm text-gray-400 mb-8 max-w-lg text-center">
        {error.message || "An unexpected error occurred in the neural network."}
      </p>
      <button
        className="px-4 py-2 bg-red-900/30 border border-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
        onClick={
          // セグメントを再レンダリングして回復を試みる
          () => reset()
        }
      >
        REBOOT SYSTEM (TRY AGAIN)
      </button>
    </div>
  );
}