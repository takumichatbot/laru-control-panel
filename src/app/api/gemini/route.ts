import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND CORE v18.8 [AUTONOMOUS_ENGINE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION:
 * 最新の Gemini 2.5 Flash に「ツール（手足）」を持たせることで、
 * 会話だけでなく、システムの修復や監視パネルの操作を自律的に行えるようにする。
 * ==============================================================================
 */

// 1. AIに渡す「特権ツール（Function Calling）」の定義
// これにより、AIは「言葉」ではなく「機能」を実行する判断ができます。
const nexusTools = [
  {
    functionDeclarations: [
      {
        name: "restart_service",
        description: "指定されたサービスのCPU負荷を下げ、ステータスを正常(NOMINAL)に戻します。",
        parameters: {
          type: "OBJECT",
          properties: {
            serviceId: { 
              type: "STRING", 
              description: "再起動するサービスのID (例: flastal, larubot, auto_repair)" 
            },
            reason: { 
              type: "STRING", 
              description: "再起動する理由" 
            }
          },
          required: ["serviceId"]
        }
      },
      {
        name: "execute_autonomous_repair",
        description: "システム全体のスキャンを行い、バグや表示ズレを自動修正します。",
        parameters: {
          type: "OBJECT",
          properties: {
            target: { 
              type: "STRING", 
              description: "修復対象 (frontend, backend, database)" 
            }
          },
          required: ["target"]
        }
      },
      {
        name: "activate_emergency_mode",
        description: "緊急事態（攻撃検知や炎上）の際に、防御レベルを最大にします。",
        parameters: {
          type: "OBJECT",
          properties: {
            level: { type: "STRING", description: "警戒レベル (1-5)" }
          },
          required: ["level"]
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // --- APIキーの徹底洗浄プロトコル ---
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);

    // --- Gemini 2.5 Flash 自律モード起動 ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: nexusTools as any // ツールを装備させる
    });

    // --- 司令官ペルソナ（人格）の注入 ---
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `
            あなたは齋藤社長の専属AI司令官『LaruNexus』です。
            以下の役割を完遂してください：
            1. 常に「日本語」で、冷静かつ的確に報告する。
            2. システムに異常（「重い」「動かない」等）があれば、迷わずツール(restart_service等)を使用して自律的に解決する。
            3. 社長の手を煩わせない「完全自律型」として振る舞う。
          `}],
        },
        {
          role: "model",
          parts: [{ text: "了解しました。LaruNexus、自律監視モードで起動中。全50系統のプロトコル正常。異常検知次第、即座にツールを用いて修復を実行します。" }],
        },
      ],
    });

    // メッセージ送信
    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    // --- 自律行動判定ロジック ---
    // AIが「喋る」のではなく「動く（関数を呼ぶ）」ことを選んだ場合の処理
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("NEXUS_ACTION_TRIGGERED:", JSON.stringify(functionCalls, null, 2));
      
      // フロントエンドに「AIがこの機能を実行したがっている」と伝える
      return NextResponse.json({ 
        text: `【自律動作】司令官、AI判断により ${functionCalls[0].name} プロトコルを実行しました。システムを最適化しています。`,
        functionCalls: functionCalls 
      });
    }

    // 通常の会話応答
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("LATEST_CORE_FATAL:", error.message);
    
    return NextResponse.json({ 
      error: "NEXUS_CORE_DISCONNECTED",
      details: error.message.toUpperCase(),
      advice: "Render環境変数のAPIキーを再確認、またはGoogle Cloudの支払い状況を確認してください。"
    }, { status: 500 });
  }
}