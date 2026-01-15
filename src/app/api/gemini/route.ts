import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v17.1 [STABLE_FIX]
 * 404 Not Found (v1beta) を物理的に回避し、製品版 v1 エンドポイントへ強制接続。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. 環境変数の取得と徹底洗浄
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 2. SDKの初期化
    const genAI = new GoogleGenerativeAI(cleanKey);

    // 3. モデルの取得
    // 404を回避するため、apiVersion を明示的に "v1" に指定し、
    // モデル名を安定版の "gemini-1.5-flash" に固定します。
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" }
    );

    // 4. コンテンツ生成
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("FINAL_CORE_FATAL:", error.message);
    
    // エラーが404の場合、モデルとバージョンの不一致として詳細を表示
    let detail = error.message.toUpperCase();
    if (detail.includes("404")) {
      detail = "ENDPOINT_MISMATCH: V1BETA ではなく V1 エンドポイントを使用してください。";
    }

    return NextResponse.json({ 
      error: "NEXUS_ACCESS_DENIED",
      details: detail
    }, { status: 500 });
  }
}