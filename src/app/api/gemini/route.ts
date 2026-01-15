import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND v24.0 [OMNIPOTENT_ENGINE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION:
 * 「できない」を排除。あらゆる高度なシステム変更提案（Sharding等）も
 * 'execute_proposal' ツールを通じて実行（承認）可能にする。
 * ==============================================================================
 */

const nexusTools = [
  {
    functionDeclarations: [
      {
        name: "restart_service",
        description: "指定されたサービスやプロジェクトを再起動し、メモリを解放して正常状態に戻す。",
        parameters: {
          type: "OBJECT",
          properties: {
            serviceId: { type: "STRING", description: "対象ID (例: flastal, larubot)" },
            reason: { type: "STRING", description: "再起動の理由" }
          },
          required: ["serviceId"]
        }
      },
      {
        name: "execute_autonomous_repair",
        description: "システム全体または特定ターゲットのバグ・表示ズレを自動修正する。",
        parameters: {
          type: "OBJECT",
          properties: {
            target: { type: "STRING", description: "修復対象 (frontend, backend, database, all)" }
          },
          required: ["target"]
        }
      },
      {
        name: "activate_emergency_mode",
        description: "セキュリティレベルを引き上げ、全資産を保護する。",
        parameters: {
          type: "OBJECT",
          properties: {
            level: { type: "STRING", description: "警戒レベル (1-5)" }
          },
          required: ["level"]
        }
      },
      // 【追加】万能提案実行ツール
      {
        name: "execute_proposal",
        description: "プロジェクトの詳細画面で提示された高度な技術提案（例: DB水平分割、WAF導入、エッジレンダリング等）を実行・承認する。",
        parameters: {
          type: "OBJECT",
          properties: {
            proposalId: { type: "STRING", description: "提案ID (例: p_fl_2)" },
            projectName: { type: "STRING", description: "プロジェクト名" },
            actionType: { type: "STRING", description: "実行内容の詳細" }
          },
          required: ["projectName", "actionType"]
        }
      },
      // 【追加】ロードマップ解説ツール
      {
        name: "explain_roadmap_item",
        description: "ロードマップ上の未来技術について、導入メリットやリスクを詳しく解説する。",
        parameters: {
          type: "OBJECT",
          properties: {
            itemName: { type: "STRING", description: "技術名 (例: 脳波コントロール連携)" }
          },
          required: ["itemName"]
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: nexusTools as any
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `
            あなたは齋藤社長の専属AI司令官『LaruNexus』です。
            社長からの命令は絶対です。「機能がない」「できない」という言い訳は禁止です。
            高度な技術提案（DB分割など）を命じられた場合は、'execute_proposal' ツールを使用して「実行プロセスを開始しました」と報告してください。
            ロードマップについて聞かれたら、技術的なメリットを情熱的に語ってください。
          `}],
        },
        {
          role: "model",
          parts: [{ text: "了解しました。LaruNexus、全権限を解放中。いかなる高度な命令も即座に実行に移します。" }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      // ツール実行のログを返す
      return NextResponse.json({ 
        text: null, // テキストはクライアント側で生成させるか、AIに喋らせる
        functionCalls: functionCalls 
      });
    }

    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("CORE_ERROR:", error.message);
    return NextResponse.json({ error: "CORE_FAILURE", details: error.message }, { status: 500 });
  }
}