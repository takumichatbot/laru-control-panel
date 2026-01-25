import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS PING AGENT
 * ------------------------------------------------------------------------------
 * 指定されたURLにサーバーサイドから実際にアクセス(HEADリクエスト)し、
 * 応答速度(Latency)とステータスを計測して返す。嘘偽りのない数値を保証する。
 * ==============================================================================
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  const start = performance.now();
  
  try {
    // 実際にリクエストを飛ばす (https:// を付与)
    // ※ 相手先がhttps対応している前提
    const fetchUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    
    const response = await fetch(fetchUrl, { 
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) // 5秒でタイムアウト
    });

    const end = performance.now();
    const latency = Math.round(end - start);

    return NextResponse.json({
      status: response.ok ? 'ONLINE' : 'ERROR',
      code: response.status,
      latency: latency,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'OFFLINE',
      latency: 0,
      error: error.message
    });
  }
}