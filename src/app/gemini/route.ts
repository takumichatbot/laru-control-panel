import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "APIキーが設定されていません。" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 最新のSDK仕様に基づいたツール定義
    const tools: Tool[] = [{
      functionDeclarations: [
        {
          name: "restart_service",
          description: "指定されたシステムサービスを再起動し、ステータスを初期化します。",
          parameters: {
            // ここを文字列で直接指定することで型エラーを回避します
            type: "object" as any, 
            properties: {
              serviceId: { 
                type: "string" as any, 
                description: "対象のID（larubot, laruvisona, flastalのいずれか）" 
              }
            },
            required: ["serviceId"]
          }
        },
        {
          name: "optimize_all",
          description: "全ノードのCPU負荷を最適化し、システムを安定させます。"
        }
      ]
    }];

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", tools });
    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    return NextResponse.json({
      text: response.text(),
      functionCalls: response.functionCalls()
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "通信エラーが発生しました。" }, { status: 500 });
  }
}