import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v17.0 [STABLE_GATEWAY]
 * v1beta の 404 エラーを回避し、製品版 v1 エンドポイントへ強制接続。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 1. SDKの初期化時に API バージョンを "v1" に固定
    // これにより 404 Not Found (v1beta) を回避します
    const genAI = new GoogleGenerativeAI(cleanKey);

    // 2. モデルの取得 (最新SDKの標準的な書き方)
    // getGenerativeModel の第2引数で明示的に v1 を指定する手法をとります
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" } 
    );

    // 3. コンテンツ生成
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("GATEWAY_ERROR:", error.message);
    
    return NextResponse.json({ 
      error: "NEXUS_GATEWAY_REJECTED",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}