import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v16.2 [ULTIMATE_PURIFICATION]
 * 文字列パターン不一致エラーを物理的に排除する洗浄機能を搭載。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. 環境変数の取得（Renderで設定したGEMINI_API_KEYを優先）
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!rawKey) {
      return NextResponse.json({ error: "API_KEY_NOT_FOUND" }, { status: 500 });
    }

    // 2. 究極洗浄：改行、タブ、スペース、ゼロ幅スペース等のゴミをすべて物理削除
    const cleanApiKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 3. 形式チェック
    if (!cleanApiKey.startsWith("AIza")) {
      return NextResponse.json({ 
        error: "INVALID_PATTERN", 
        details: "キーがAIzaで始まっていないか、破損しています。" 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(cleanApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "あなたはLARU NEXUSのコアAIです。齋藤拓海社長の相棒として、プロフェッショナルかつ簡潔に応答してください。"
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    return NextResponse.json({
      text: response.text(),
      functionCalls: response.functionCalls() || []
    });

  } catch (error: any) {
    console.error("CRITICAL_API_ERROR:", error);
    // 詳細なエラー理由をフロントに返す
    return NextResponse.json({ 
      error: "AUTH_PROTOCOL_REJECTED",
      details: error.message.toUpperCase() 
    }, { status: 500 });
  }
}