import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v17.2 [FORCE_STABLE_V1]
 * SDKの自動バージョン判定を無効化し、物理的に v1 へ固定する最終パッチ。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 1. SDKの初期化
    const genAI = new GoogleGenerativeAI(cleanKey);

    // 2. モデルの取得：ここを「最も原始的かつ確実な方法」に変更
    // モデル名に "models/" を含めず、第2引数の設定を極限までシンプルにします
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    }, { 
      apiVersion: "v1" 
    });

    // 3. コンテンツ生成の実行 (最も標準的な呼び出し)
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("V1_STABLE_FATAL:", error.message);
    
    // エラーが404の場合の最終診断
    let detail = error.message.toUpperCase();
    if (detail.includes("404")) {
      detail = "V1_ENDPOINT_NOT_FOUND: キーまたはモデル設定が製品版(V1)に未対応です。";
    }

    return NextResponse.json({ 
      error: "NEXUS_ACCESS_DENIED",
      details: detail
    }, { status: 500 });
  }
}