'use client';

import { useEffect, useState } from 'react';

type Trade = {
  ticker: string;
  side: string;
  qty: number;
  price: number;
  pnl: number;
  reason: string;
  time: string;
};

export default function TradeHistory() {
  const [history, setHistory] = useState<Trade[]>([]);

  // 履歴データを取得する関数
  const fetchHistory = async () => {
    try {
      // PythonのバックエンドAPIを叩く
      const res = await fetch('https://laru-brain.onrender.com/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("History fetch error", e);
    }
  };

  // 初回ロード時と、30秒ごとに定期更新
  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-black/80 border border-gray-800 rounded-lg p-4 mt-4 shadow-lg backdrop-blur-sm">
      <h2 className="text-emerald-400 text-sm font-bold mb-3 flex items-center">
        <span className="mr-2">📜</span> RECENT EXECUTIONS
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left text-gray-400">
          <thead className="text-gray-500 uppercase bg-gray-900/50">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Pair</th>
              <th className="px-3 py-2">Side</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">PnL</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4">NO DATA</td></tr>
            ) : (
              history.map((trade, i) => (
                <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                  <td className="px-3 py-2 font-mono">{trade.time}</td>
                  <td className="px-3 py-2 font-bold text-white">{trade.ticker}</td>
                  <td className={`px-3 py-2 font-bold ${trade.side === '買' ? 'text-blue-400' : 'text-red-400'}`}>
                    {trade.side}
                  </td>
                  <td className="px-3 py-2">${trade.price.toFixed(2)}</td>
                  <td className={`px-3 py-2 font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                    {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}