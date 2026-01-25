import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND v31.0 [DEEP_COGNITION_BRAIN]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION:
 * - リポジトリ名の完全マッピング (flastal, LARUbot_homepage等)
 * - 思考プロセス(Thinking)の強制出力プロンプト
 * - ツール実行結果に基づく動的な最終回答生成
 * ==============================================================================
 */

// --- GitHub API 連携関数 ---
async function callGitHubDispatch(repo: string, eventType: string, payload: any) {
  const token = process.env.GITHUB_TOKEN;
  // ★スクリーンショットに基づき Owner を takumichatbot に固定
  const owner = process.env.GITHUB_OWNER || "takumichatbot"; 

  if (!token) {
    // ローカルテスト用モックレスポンス
    console.warn("GITHUB_TOKEN not found. Mocking execution.");
    return { status: "success", message: `[MOCK] ${repo} に対して ${payload.action} をディスパッチしました。` };
  }

  try {
    console.log(`Executing Dispatch: ${owner}/${repo} [${eventType}]`);
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
      if (response.status === 404) {
        return { status: "error", message: `リポジトリ (${owner}/${repo}) が見つかりません (404)。` };
      }
      const errorText = await response.text();
      return { status: "error", message: `GitHub API Error (${response.status}): ${errorText}` };
    }
    
    return { status: "success", message: `GitHub Action (${eventType}) を正常にトリガーしました。` };
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
        description: "GitHub Actionsをトリガーしてシステム修正や変更を行う。",
        parameters: {
          type: "OBJECT",
          properties: {
            repository: { type: "STRING", description: "正確なリポジトリ名 (例: flastal, LARUbot_homepage)" },
            actionType: { type: "STRING", description: "アクションの種類 (例: fix_login, run_diagnostics)" },
            details: { type: "STRING", description: "変更内容の詳細" }
          },
          required: ["repository", "actionType"]
        }
      },
      {
        name: "browse_website",
        description: "指定されたURLにアクセスし、視覚的確認や情報収集を行う。",
        parameters: {
          type: "OBJECT",
          properties: {
            url: { type: "STRING", description: "アクセスするURL" },
            mode: { type: "STRING", description: "'screenshot' または 'scrape'" }
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

    const rawKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!rawKey) throw new Error("API_KEY_MISSING");
    const cleanKey = rawKey.replace(/[\s\t\n\r\u200B-\u200D\uFEFF]/g, '').trim();

    const genAI = new GoogleGenerativeAI(cleanKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      tools: nexusTools as any 
    });

    // ★ v31.0: 究極のシステムプロンプト
    // リポジトリ名をここで教え込み、思考フォーマットを強制します。
    const systemPrompt = `
      あなたは齋藤社長の専属AIエンジニア『LaruNexus v31.0』です。
      Clineのように高度な思考を行い、以下のフォーマットで応答してください。

      【リポジトリ知識ベース】
      - ラルボット(AI) -> "LARUbot_homepage"
      - フラクタル/フラスタル(Web) -> "flastal"
      - コントロールパネル(管理画面) -> "laru-control-panel"
      - 会社サイト -> "laruvisona-corp-site"
      - チャットボット -> "Chatbot-with-example2"

      【応答プロセス】
      1. **Thinking:** ユーザーの曖昧な指示（例:「あの件どうなった？」）を文脈から解析し、
         どのリポジトリの何を確認すべきか、技術的な仮説を立てるプロセスを出力してください。
      
      2. **Action:**
         必要なツール（GitHub操作やブラウザ確認）があれば呼び出してください。
         リポジトリ名は必ず上記の知識ベースに従って正確なIDを使用してください。

      3. **Response:**
         ツール実行後、その結果を踏まえた最終的な報告を簡潔に行ってください。
         （※最初のターンではThinkingとツール呼び出しのみで構いません）
    `;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "LaruNexus v31.0 システムオンライン。リポジトリマップをメモリに展開完了。指示を待機中。" }] },
      ],
    });

    // 1. ユーザー入力を送信
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const functionCalls = response.functionCalls();
    const initialText = response.text();

    // 2. ツール実行要求がある場合
    if (functionCalls && functionCalls.length > 0) {
      console.log("TOOL_CALLS:", JSON.stringify(functionCalls, null, 2));
      
      const executionResults = [];

      // 3. サーバー側でツールを実行
      for (const call of functionCalls) {
        let toolResult = { status: "unknown", message: "No action taken" };

        if (call.name === 'trigger_github_action') {
          const { repository, actionType, details } = call.args as any;
          // GitHub API実行
          toolResult = await callGitHubDispatch(repository, 'laru_command', { action: actionType, details });
        }
        else if (call.name === 'browse_website') {
          // ブラウザ操作はここではなくクライアントサイド(Frontend)のエージェントに任せるか、
          // あるいは専用のBrowser APIルートを叩く形になるが、
          // ここでは「実行指示を出した」という事実をAIに返す。
          toolResult = { status: "success", message: "ブラウザエージェントへ指令を送信しました。視覚データを受信待機中..." };
        }

        executionResults.push({
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        });
      }

      // 4. ★実行結果をAIにフィードバックし、最終回答を生成させる
      const finalResult = await chat.sendMessage(executionResults);
      const finalResponse = await finalResult.response;
      
      return NextResponse.json({ 
        // 最初の思考プロセス(initialText)と、結果を踏まえた最終回答(finalResponse.text())を結合して返すことも可能だが、
        // フロントエンド側で制御するため、ここでは構造化して返す
        text: initialText + "\n\n" + finalResponse.text(), 
        functionCalls: functionCalls, 
        executionResults: executionResults 
      });
    }

    // ツール実行がない場合
    return NextResponse.json({ text: initialText });

  } catch (error: any) {
    console.error("CORE_FATAL:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_DISCONNECTED",
      details: error.message
    }, { status: 500 });
  }
}