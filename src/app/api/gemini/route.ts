import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND v27.0 [GITHUB_SYNCED_ENGINE + BROWSER_EYE]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION:
 * Gemini 2.5 Flash に「GitHub操作権限」と「Webブラウジング能力」を付与。
 * 開発タスクの実行に加え、URLの視覚的・テキスト的な解析を可能にする。
 * ==============================================================================
 */

// --- GitHub API 連携関数 ---
async function callGitHubDispatch(repo: string, eventType: string, payload: any) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "takumi-saito";

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

// --- AIツール定義 (GitHub + Browser) ---
const nexusTools = [
  {
    functionDeclarations: [
      // 1. GitHub操作ツール
      {
        name: "trigger_github_action",
        description: "GitHub Actionsワークフローをトリガーし、システム変更や修復を実際に実行する。",
        parameters: {
          type: "OBJECT",
          properties: {
            repository: { type: "STRING", description: "対象リポジトリ名 (例: flastal_net, larubot_core)" },
            actionType: { type: "STRING", description: "実行するアクション (例: sharding_db, restart_service, fix_css)" },
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
        description: "ロードマップ上の技術について、導入メリットや具体的な実装ステップを解説する。",
        parameters: {
          type: "OBJECT",
          properties: {
            technology: { type: "STRING", description: "技術名" }
          },
          required: ["technology"]
        }
      },
      // 2. ブラウザ操作ツール (新規追加)
      {
        name: "browse_website",
        description: "指定されたURLにアクセスし、Webサイトの内容を確認する。デザイン確認ならscreenshot、情報収集ならscrapeを使用。",
        parameters: {
          type: "OBJECT",
          properties: {
            url: { type: "STRING", description: "アクセスするURL (https://...)" },
            mode: { type: "STRING", description: "実行モード: 'screenshot' (画像取得) または 'scrape' (テキスト取得)" }
          },
          required: ["url", "mode"]
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // APIキー処理
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
            
            1. システム変更の命令が来たら、'trigger_github_action' を使用。
            2. 「サイトを見て」「確認して」と言われたら、迷わず 'browse_website' を使用して視覚的に確認してください。
            3. プロジェクト名は正確に識別してください。
          `}],
        },
        {
          role: "model",
          parts: [{ text: "了解しました。LaruNexus、GitHub連携およびブラウジングモジュール起動完了。全領域をカバーします。" }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      console.log("NEXUS_ACTION:", JSON.stringify(functionCalls, null, 2));

      // GitHub連携のみバックエンドで処理 (ブラウザ操作はクライアント側または別ルートで処理させるため、ここではFCを返す)
      for (const call of functionCalls) {
        if (call.name === 'trigger_github_action') {
          const { repository, actionType } = call.args as any;
          await callGitHubDispatch(repository, 'laru_command', { action: actionType });
        }
        // browse_website の場合は、フロントエンド側で api/browser を叩くフローになるため、
        // ここではAPIを実行せず、FunctionCall情報をそのまま返す。
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