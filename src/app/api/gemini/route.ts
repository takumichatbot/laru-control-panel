import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS DIAGNOSTIC PROTOCOL v16.6 [DEEP_ANALYSIS]
 * PATTERN不一致の正体を暴くための自己診断ロジックを搭載。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. 環境変数の抽出
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!rawKey) {
      return NextResponse.json({ error: "KEY_MISSING", details: "Environment variables are empty." }, { status: 500 });
    }

    // 2. 物理的な洗浄（クレンジング）
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 3. 自己診断ログの生成 (Renderの「Logs」タブに表示されます)
    console.log("--- NEXUS_DIAGNOSTIC_START ---");
    console.log(`Key Length: ${cleanKey.length} chars`);
    console.log(`Prefix Check: ${cleanKey.startsWith("AIza") ? "PASS" : "FAIL"}`);
    console.log(`First 5: ${cleanKey.substring(0, 5)}...`);
    console.log(`Last 3: ...${cleanKey.substring(cleanKey.length - 3)}`);
    console.log("--- NEXUS_DIAGNOSTIC_END ---");

    // 4. キーの文字数異常チェック (通常39文字程度)
    if (cleanKey.length < 30) {
      return NextResponse.json({ 
        error: "KEY_TOO_SHORT", 
        details: `キーが短すぎます(${cleanKey.length}文字)。正しくコピーされていますか？` 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(cleanKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "あなたはLARU NEXUSのコアAIです。齋藤拓海社長の相棒として応答してください。"
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    return NextResponse.json({
      text: response.text(),
      functionCalls: response.functionCalls() || []
    });

  } catch (error: any) {
    console.error("DIAGNOSTIC_API_ERROR:", error);
    
    // Google側が「パターン不一致」を返してきた場合の詳細分析
    let errorDetail = error.message;
    if (errorDetail.includes("API_KEY_INVALID")) {
      errorDetail = "Googleがこのキーを『無効』と判断しています。新しいプロジェクトでキーを再発行してください。";
    }

    return NextResponse.json({ 
      error: "AUTH_PROTOCOL_REJECTED",
      details: errorDetail.toUpperCase() 
    }, { status: 500 });
  }
}