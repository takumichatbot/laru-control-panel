import { GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND API PROTOCOL v15.4
 * ------------------------------------------------------------------------------
 * 認証エラー(ERR_AUTH)を解消するための環境変数統合パッチ。
 * フロントエンドとバックエンドの変数名を同期させ、強固な接続を確立します。
 * ==============================================================================
 */

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 修正ポイント：フロント側と共通の変数名、またはバックエンド専用名の両方をチェック
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("CRITICAL: API Key not found in Environment Variables.");
      return NextResponse.json({ 
        error: "APIキーがシステムにロードされていません。RenderのEnvironment設定を確認してください。" 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // 最新のSDK仕様に基づいたツール定義（Function Calling）
    const tools: Tool[] = [{
      functionDeclarations: [
        {
          name: "restart_service",
          description: "指定されたシステムサービスを再起動し、ステータスを初期化します。",
          parameters: {
            type: "object" as any, 
            properties: {
              serviceId: { 
                type: "string" as any, 
                description: "対象のサービスID（larubot, laruvisona, flastalのいずれか）" 
              }
            },
            required: ["serviceId"]
          }
        },
        {
          name: "optimize_all",
          description: "全ノードのCPU負荷を最適化し、システム全体のパフォーマンスを安定させます。"
        }
      ]
    }];

    // モデルの初期化 (高速な Flash モデルを使用)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      tools,
      // システム命令：司令塔としての性格を定義
      systemInstruction: "あなたはLARU NEXUSのコアAIです。齋藤拓海社長の指示に従い、システム監視と対話を行います。回答は簡潔かつプロフェッショナルに行ってください。"
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const response = result.response;

    // レスポンスの解析
    const text = response.text();
    const functionCalls = response.functionCalls();

    return NextResponse.json({
      text: text || "プロトコル応答を受信しましたが、データが空です。",
      functionCalls: functionCalls || []
    });

  } catch (error: any) {
    console.error("API Route Execution Error:", error);
    
    // エラー詳細をフロントエンドに返し、デバッグを容易にする
    const errorMessage = error.message || "未知の通信エラーが発生しました。";
    return NextResponse.json({ 
      error: `通信エラー: ${errorMessage}`,
      suggestion: "APIキーの権限またはRenderのデプロイステータスを確認してください。"
    }, { status: 500 });
  }
}