import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * LARU NEXUS BACKEND API PROTOCOL v18.0 [2026_STABLE]
 * 引退した1.5系を廃止し、最新の Gemini 2.5 Flash に完全換装。
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);

    // 【重要】2026年の最新安定モデル "gemini-2.5-flash" を指定
    // v1.5は既にGoogleによって提供終了(404)されています
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("LATEST_CORE_FATAL:", error.message);
    
    return NextResponse.json({ 
      error: "NEXUS_CORE_DISCONNECTED",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}