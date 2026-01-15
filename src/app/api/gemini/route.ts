import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);

    // 【重要】モデル名を "gemini-1.5-flash-latest" に変更
    // これにより、API v1 エンドポイントで最も確実にヒットするエイリアスを使用します
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" 
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("V1_ULTIMATE_FATAL:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_ACCESS_DENIED",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}