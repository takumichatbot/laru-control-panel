import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v15.6 [FORCE_SYNC]
 * 環境変数の取得とエラーログを極限まで強化。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // RenderのEnvironment設定で登録した可能性のあるすべての変数名をチェック
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      console.error("CRITICAL: API Key is missing.");
      return NextResponse.json({ 
        error: "API_KEY_MISSING",
        details: "Renderの環境変数が設定されていないか、反映されていません。" 
      }, { status: 500 });
    }

    // キーの形式をチェック（AIzaで始まっているか、空白がないか）
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith("AIza")) {
      return NextResponse.json({ 
        error: "INVALID_KEY_FORMAT",
        details: "APIキーが'AIza'で始まっていません。コピーミスを確認してください。" 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(trimmedKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "あなたはLARU NEXUSのコアAIです。齋藤拓海社長をサポートしてください。"
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
    // Google API側からのエラーメッセージを詳細に返す
    return NextResponse.json({ 
      error: "GOOGLE_API_ERROR",
      details: error.message 
    }, { status: 500 });
  }
}