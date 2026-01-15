import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);

    // モデル名を完全修飾名 (models/gemini-1.5-flash) で指定し、
    // かつ getGenerativeModel の引数を最も標準的な形に戻します
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });

  } catch (error: any) {
    console.error("FINAL_CORE_ERROR:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_CORE_FATAL",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}