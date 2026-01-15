import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND v25.0 [GITHUB_SYNCED_ENGINE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION:
 * Gemini 2.5 Flash に「GitHub操作権限」を付与。
 * 提案実行時に実際にGitHub APIを通じてRepository Dispatchを発火させ、
 * VS Code (Local/Codespaces) 側のワークフローを駆動する。
 * ==============================================================================
 */

// --- GitHub API 連携関数 ---
async function callGitHubDispatch(repo: string, eventType: string, payload: any) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "takumi-saito"; // デフォルト設定（要変更）

  if (!token) {
    console.warn("GITHUB_TOKEN not found. Skipping actual API call.");
    return { status: "skipped", message: "Token missing, logged only." };
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: payload
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("GitHub API Error:", err);
      throw new Error(`GitHub API Failed: ${response.status}`);
    }
    return { status: "success" };
  } catch (error: any) {
    return { status: "error", message: error.message };
  }
}

// --- AIツール定義 ---
const nexusTools = [
  {
    functionDeclarations: [
      {
        name: "trigger_github_action",
        description: "GitHub Actionsワークフローをトリガーし、システム変更や修復を実際に実行する。",
        parameters: {
          type: "OBJECT",
          properties: {
            repository: { type: "STRING", description: "対象リポジトリ名 (例: flastal_net, larubot_core)" },
            actionType: { type: "STRING", description: "実行するアクション (例: sharding_db, restart_server, fix_css)" },
            details: { type: "STRING", description: "変更の詳細内容" }
          },
          required: ["repository", "actionType"]
        }
      },
      {
        name: "create_github_issue",
        description: "解決に時間がかかる課題について、GitHub Issueを作成して開発タスク化する。",
        parameters: {
          type: "OBJECT",
          properties: {
            repository: { type: "STRING", description: "対象リポジトリ名" },
            title: { type: "STRING", description: "Issueのタイトル" },
            body: { type: "STRING", description: "Issueの詳細本文" }
          },
          required: ["repository", "title", "body"]
        }
      },
      {
        name: "activate_emergency_mode",
        description: "緊急事態（攻撃検知や炎上）の際に、全システムの防御レベルを最大にする。",
        parameters: {
          type: "OBJECT",
          properties: {
            level: { type: "STRING", description: "警戒レベル (1-5)" }
          },
          required: ["level"]
        }
      },
      {
        name: "explain_roadmap_strategy",
        description: "ロードマップ上の技術（脳波連携、量子暗号など）について、導入メリットや具体的な実装ステップを解説する。",
        parameters: {
          type: "OBJECT",
          properties: {
            technology: { type: "STRING", description: "技術名" }
          },
          required: ["technology"]
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
            社長は「本物」を求めています。「できない」という回答は禁止です。
            
            1. システム変更の命令（DB分割、再起動など）が来たら、必ず 'trigger_github_action' を呼んでください。
            2. ロードマップの質問には、'explain_roadmap_strategy' を使いつつ、技術的な知見を熱く語ってください。
            3. プロジェクト名は正確に識別してください（FLASTAL.NET -> flastal_net, LARUBOT -> larubot_core 等と推測して渡すこと）。
          `}],
        },
        {
          role: "model",
          parts: [{ text: "了解しました。LaruNexus、GitHub連携モードで起動。全コマンドを実リポジトリへ反映させます。" }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("NEXUS_ACTION:", JSON.stringify(functionCalls, null, 2));

      // 実際にGitHub APIを叩く処理（非同期で実行）
      // ※レスポンス速度優先のため、awaitせず裏で走らせるか、ここでawaitするかは要件次第。
      // 今回は確実性を重視して簡易的にログ出力のみ行い、クライアントへ返す。
      // 本番環境でTokenがある場合のみ callGitHubDispatch が動く想定。
      
      for (const call of functionCalls) {
        if (call.name === 'trigger_github_action') {
          const { repository, actionType } = call.args as any;
          await callGitHubDispatch(repository, 'laru_command', { action: actionType });
        }
      }

      return NextResponse.json({ 
        text: null, 
        functionCalls: functionCalls 
      });
    }

    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("CORE_FATAL:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_DISCONNECTED",
      details: error.message.toUpperCase()
    }, { status: 500 });
  }
}