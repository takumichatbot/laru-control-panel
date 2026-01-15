import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // あらゆるルートからキーを抽出
    let key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 診断ログ：Renderの「Logs」タブにリアルタイムで出力されます
    console.log("=== NEXUS_DEEP_DIAGNOSTIC ===");
    console.log(`Key Found: ${key ? "YES" : "NO"}`);
    if (key) {
      const clean = key.replace(/[\s\t\n\r]/g, '').trim();
      console.log(`Original Length: ${key.length}`);
      console.log(`Cleaned Length: ${clean.length}`);
      console.log(`Pattern Match: ${clean.startsWith("AIza") ? "VALID_PREFIX" : "INVALID_PREFIX"}`);
      key = clean; // 洗浄後のキーを使用
    }
    console.log("==============================");

    if (!key) throw new Error("API_KEY_NOT_FOUND_IN_SYSTEM");

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);

    return NextResponse.json({ text: result.response.text() });

  } catch (error: any) {
    console.error("DIAGNOSTIC_ERROR:", error.message);
    return NextResponse.json({ 
      error: "AUTH_PROTOCOL_REJECTED",
      details: error.message.toUpperCase() 
    }, { status: 500 });
  }
}