import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, action } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    // --- ブラウザ起動設定 ---
    // 修正: headless: "new" -> headless: true (型エラー回避)
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // サーバー環境での安定化用
    });
    
    const page = await browser.newPage();

    // ビューポート設定 (一般的なPC画面サイズ)
    await page.setViewport({ width: 1280, height: 800 });

    // ページ移動 (タイムアウト設定などを追加して堅牢化)
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    let result;

    if (action === 'screenshot') {
      // スクリーンショット (Base64)
      const screenshotBuffer = await page.screenshot({ encoding: 'base64', type: 'png' });
      result = { 
        type: 'image', 
        data: `data:image/png;base64,${screenshotBuffer}`,
        message: "スクリーンショットを取得しました。"
      };
    } else if (action === 'scrape') {
      // テキスト抽出
      const text = await page.evaluate(() => document.body.innerText);
      // 長すぎるとトークンオーバーするので冒頭3000文字にカット
      const cleanedText = text.replace(/\s+/g, ' ').trim().substring(0, 3000);
      result = { 
        type: 'text', 
        data: cleanedText,
        message: "Webサイトのテキスト情報を取得しました。"
      };
    } else {
      await browser.close();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await browser.close();

    return NextResponse.json({ status: 'SUCCESS', result });

  } catch (error: any) {
    console.error("BROWSER_AGENT_ERROR:", error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}