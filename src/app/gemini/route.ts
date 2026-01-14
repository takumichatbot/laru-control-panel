import { GoogleGenerativeAI, Tool, FunctionDeclarationSchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "APIキーが設定されていません。" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // ツール（関数の定義）
    const tools: Tool[] = [{
      functionDeclarations: [
        {
          name: "restart_service",
          description: "指定されたシステムサービスを再起動します。",
          parameters: {
            type: FunctionDeclarationSchemaType.OBJECT,
            properties: {
              serviceId: { type: FunctionDeclarationSchemaType.STRING, description: "larubot, laruvisona, flastalのいずれか" }
            },
            required: ["serviceId"]
          }
        },
        {
          name: "optimize_all",
          description: "全ノードの負荷を最適化します。"
        }
      ]
    }];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", tools });
    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Geminiからの回答（テキスト、または関数呼び出し指示）を返す
    return NextResponse.json({
      text: response.text(),
      functionCalls: response.functionCalls()
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "通信に失敗しました。" }, { status: 500 });
  }
}