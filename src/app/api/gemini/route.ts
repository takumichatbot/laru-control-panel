import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v16.8 [MODEL_FIX]
 * 404 NOT FOUND エラーを回避するためのモデルパス修正パッチ。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. 環境変数の取得と洗浄
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 2. SDKの初期化
    const genAI = new GoogleGenerativeAI(cleanKey);

    // 3. モデルの取得 (最新の安定版モデル名を指定)
    // 404エラーを防ぐため "models/" プレフィックスを明示的に外すか確認
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // バージョン指定を含まない安定名称
    });

    // 4. コンテンツ生成 (generateContentを使用)
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("GEMINI_CORE_ERROR:", error.message);
    
    // エラーが 404 の場合、モデル名の指定ミスとして社長に通知
    let detail = error.message.toUpperCase();
    if (detail.includes("404")) {
      detail = "MODEL_NOT_FOUND: モデル名 'gemini-1.5-flash' が無効です。SDKの更新が必要です。";
    }

    return NextResponse.json({ 
      error: "CORE_ACCESS_FAILED",
      details: detail
    }, { status: 500 });
  }
}