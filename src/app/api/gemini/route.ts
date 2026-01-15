import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);

    // 404エラーを回避するための「安定板名称」での呼び出し
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // コンテンツ生成の実行
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("FINAL_DEBUG_ERROR:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_CORE_ERROR",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}