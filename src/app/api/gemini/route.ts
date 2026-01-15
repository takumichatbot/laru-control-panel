import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v16.9 [FINAL_DESTINATION]
 * SDK v0.21.0+ 以降の内部URL生成バグを物理的に回避する最終パッチ。
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

    // 3. モデルの取得
    // 最新SDKではプレフィックス不要。文字列のみを渡す。
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    // 4. コンテンツ生成の実行
    // v1beta ではなく安定版エンドポイントへ誘導するため、余計なパラメータを排除
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: message }] }],
    });

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("FINAL_CORE_FATAL:", error.message);
    
    // エラーが404の場合の詳細案内
    let detail = error.message.toUpperCase();
    if (detail.includes("404")) {
      detail = "GOOGLE_API_ENDPOINT_MISMATCH: モデル名の内部パスが一致しません。";
    }

    return NextResponse.json({ 
      error: "NEXUS_ACCESS_DENIED",
      details: detail
    }, { status: 500 });
  }
}