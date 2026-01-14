import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v16.0 [FATAL_ERROR_FIX]
 * 不正な文字列パターンの自動クレンジング機能を搭載。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 環境変数の取得と浄化
    let rawApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!rawApiKey) {
      return NextResponse.json({ error: "API_KEY_MISSING" }, { status: 500 });
    }

    // クレンジング：前後の空白、改行、目に見えない制御文字をすべて排除
    const cleanApiKey = rawApiKey.replace(/[\s\t\n\r]/g, '').trim();

    if (!cleanApiKey.startsWith("AIza")) {
      return NextResponse.json({ 
        error: "INVALID_KEY_PATTERN", 
        details: "キーがAIzaで始まっていません。Renderの設定を確認してください。" 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(cleanApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "あなたはLARU NEXUSのコアAIです。齋藤拓海社長の相棒として、法学的厳格さとSF的プロフェッショナリズムを持って応答してください。"
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    return NextResponse.json({
      text: response.text(),
      functionCalls: response.functionCalls() || []
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ 
      error: "AUTH_PROTOCOL_REJECTED",
      details: error.message.toUpperCase() 
    }, { status: 500 });
  }
}