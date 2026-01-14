import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND API PROTOCOL v15.8 [FATAL_ERROR_FIX]
 * ------------------------------------------------------------------------------
 * 「THE STRING DID NOT MATCH THE EXPECTED PATTERN」を物理的に解決するパッチ。
 * 不正な文字列パターンの自動クレンジング機能を搭載。
 * ==============================================================================
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. 環境変数の取得（二重チェック）
    let rawApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!rawApiKey) {
      return NextResponse.json({ error: "API_KEY_NOT_FOUND" }, { status: 500 });
    }

    // 2. キーのクレンジング（文字列パターンの正常化）
    // 前後の空白、改行、目に見えない制御文字をすべて排除
    const cleanApiKey = rawApiKey.replace(/[\s\t\n\r]/g, '').trim();

    // 3. パターンチェック（デバッグ用）
    if (!cleanApiKey.startsWith("AIza")) {
      return NextResponse.json({ 
        error: "INVALID_PATTERN", 
        details: "キーがAIzaで始まっていません。コピー範囲を再確認してください。" 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(cleanApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "あなたはLARU NEXUSのコアAIです。齋藤拓海社長の指示に対し、プロフェッショナルな司令塔として応答してください。"
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    return NextResponse.json({
      text: response.text(),
      functionCalls: response.functionCalls() || []
    });

  } catch (error: any) {
    // 4. エラーの可視化
    console.error("CRITICAL_AUTH_ERROR:", error);
    return NextResponse.json({ 
      error: "AUTH_PROTOCOL_REJECTED",
      details: error.message.toUpperCase() // ここで詳細な理由を返す
    }, { status: 500 });
  }
}