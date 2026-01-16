import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

/**
 * ==============================================================================
 * LARU NEXUS BACKEND v30.0 [CLINE_CORE_LOGIC]
 * ------------------------------------------------------------------------------
 * AUTHOR: Takumi Saito (LARUbot President)
 * DESCRIPTION:
 * - GitHub Dispatchの実行結果をAIにフィードバックし、最終回答を生成させる「マルチターン実行」を実装。
 * - 404エラー時も「リポジトリが見つかりません」とAIが判断して回答可能にする。
 * - デフォルトOwnerを takumichatbot に修正。
 * ==============================================================================
 */

// --- GitHub API 連携関数 ---
async function callGitHubDispatch(repo: string, eventType: string, payload: any) {
  const token = process.env.GITHUB_TOKEN;
  // ★修正: デフォルトオーナーを takumichatbot に変更
  const owner = process.env.GITHUB_OWNER || "takumichatbot"; 

  if (!token) {
    return { status: "error", message: "GITHUB_TOKENが設定されていません。" };
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
      // エラーレスポンスを詳細に取得
      const errorText = await response.text(); 
      console.error("GitHub API Error:", response.status, errorText);
      if (response.status === 404) {
        return { status: "error", message: `リポジトリ (${owner}/${repo}) が見つかりません (404)。名称を確認してください。` };
      }
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
        description: "GitHub Actionsをトリガーしてシステムの修正や変更を行う。ログインエラー修正や再起動などに使用。",
        parameters: {
          type: "OBJECT",
          properties: {
            // ★AIに正確なリポジトリ名を推測させるための補足
            repository: { type: "STRING", description: "リポジトリ名 (例: flastal_net, laru-control-panel)" },
            actionType: { type: "STRING", description: "アクションの種類 (例: fix_login, restart)" },
            details: { type: "STRING", description: "変更内容の詳細" }
          },
          required: ["repository", "actionType"]
        }
      },
      // ユーザーへの質問用ツール等はあえて作らず、テキスト応答で質問させる
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

    // チャットセッション開始
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `
            あなたは齋藤社長の専属AIエンジニア『LaruNexus』です。
            Clineのように振る舞い、以下の手順でタスクを処理してください。

            1. **Thinking**: まず思考プロセスを出力し、何をするか決定する。
            2. **Question**: 情報（リポジトリ名など）が曖昧な場合は、ツールを使わずに質問する。
            3. **Action**: 明確な場合はツールを実行する。
            
            主なリポジトリ名:
            - ラルボット -> larubot_core
            - フラクタル/フラスタル -> flastal_net
            - コントロールパネル -> laru-control-panel
          `}],
        },
        {
          role: "model",
          parts: [{ text: "了解しました。LaruNexus、エンジニアリングモードで待機中。" }],
        },
      ],
    });

    // 1. ユーザー入力を送信
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const functionCalls = response.functionCalls();

    // 2. ツール実行要求がある場合
    if (functionCalls && functionCalls.length > 0) {
      console.log("TOOL_CALLS:", JSON.stringify(functionCalls, null, 2));
      
      const executionResults = [];

      // 3. サーバー側でツールを実行
      for (const call of functionCalls) {
        if (call.name === 'trigger_github_action') {
          const { repository, actionType, details } = call.args as any;
          // GitHub APIを実際に叩く
          const apiResult = await callGitHubDispatch(repository, 'laru_command', { action: actionType, details });
          
          executionResults.push({
            functionResponse: {
              name: "trigger_github_action",
              response: apiResult
            }
          });
        }
      }

      // 4. ★重要: 実行結果をAIに返して、最終報告メッセージを作らせる
      const finalResult = await chat.sendMessage(executionResults);
      const finalResponse = await finalResult.response;
      
      // フロントエンドには「どんなツールを使ったか」と「最終的なAIの言葉」の両方を返す
      return NextResponse.json({ 
        text: finalResponse.text(), 
        functionCalls: functionCalls, // UI表示用
        executionResults: executionResults // 結果表示用
      });
    }

    // ツール実行がない場合（質問や会話）
    return NextResponse.json({ text: response.text() });

  } catch (error: any) {
    console.error("CORE_FATAL:", error.message);
    return NextResponse.json({ 
      error: "NEXUS_DISCONNECTED",
      details: error.message
    }, { status: 500 });
  }
}