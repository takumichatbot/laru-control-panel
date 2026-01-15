import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    // 1. SDKの初期化
    const genAI = new GoogleGenerativeAI(cleanKey);

    // 2. モデルの取得
    // -latest を外し、apiVersion を "v1" に完全固定。
    // かつモデル名に models/ を明示的に付与して 404 を回避します。
    const model = genAI.getGenerativeModel(
      { model: "models/gemini-1.5-flash" },
      { apiVersion: "v1" }
    );

    // 3. コンテンツ生成
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("V1_STABLE_FATAL:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_ACCESS_DENIED",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}