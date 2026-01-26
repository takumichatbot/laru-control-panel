import { NextResponse } from 'next/server';
// puppeteer-core の型定義を利用
import { Browser, Page } from 'puppeteer-core';

/**
 * ==============================================================================
 * AUTO LOGIN CONTROLLER (OAUTH SUPPORT)
 * ------------------------------------------------------------------------------
 * OAuth連携（GitHub認証など）を含む複雑なログインフローを処理する。
 * ==============================================================================
 */
async function handleLogin(page: Page, url: string) {
  const waitOptions = { waitUntil: 'networkidle0' as const, timeout: 30000 };

  try {
    // ---------------------------------------------------------
    // 1. GitHub Login (直接アクセス時)
    // ---------------------------------------------------------
    if (url.includes('github.com') && url.includes('login')) {
      console.log('🐈 GitHub ログイン処理を実行...');
      await githubLoginSequence(page);
    }

    // ---------------------------------------------------------
    // 2. Render Login (GitHub認証経由)
    // ---------------------------------------------------------
    else if (url.includes('render.com')) {
      console.log('☁️ Render ログインシーケンス起動 (GitHub経由)...');
      
      if (!url.includes('login')) await page.goto('https://dashboard.render.com/login', waitOptions);

      // "Continue with GitHub" ボタンを探してクリック
      // (セレクタは状況により変わる可能性があるため、複数の候補でトライ)
      try {
        const githubBtnSelector = 'button[data-provider="github"], a[href*="/auth/github"], button';
        
        // ボタンが表示されるまで待つ
        await page.waitForSelector(githubBtnSelector, { timeout: 5000 });
        
        // "GitHub" という文字が含まれるボタンをクリック
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const githubBtn = buttons.find(b => (b.textContent || '').includes('GitHub'));
          if (githubBtn) (githubBtn as HTMLElement).click();
        });

        console.log('👆 Render: GitHub連携ボタンをクリックしました');
        
        // 画面遷移を待つ (GitHubのログイン画面へ)
        await page.waitForNavigation(waitOptions).catch(() => {});

        // もしGitHubのログイン画面が表示されたら、GitHubの認証情報を入力
        if (page.url().includes('github.com/login')) {
          console.log('🔄 Render -> GitHub認証画面を検知。認証情報を注入します。');
          await githubLoginSequence(page);
        } else {
          console.log('✅ Render: 既にGitHub認証済み、またはログイン完了');
        }

      } catch (e) {
        console.log('⚠️ Render: GitHubボタンの特定または遷移に失敗');
      }
    }

    // ---------------------------------------------------------
    // 3. LARUBOT & FLASTAL (通常フォーム)
    // ---------------------------------------------------------
    else if (url.includes('larubot.com') || url.includes('flastal.net')) {
      console.log('🏢 一般サイト ログインシーケンス...');
      const userSelector = 'input[name="email"], input[name="username"], input[type="text"]';
      const passSelector = 'input[name="password"]';

      try {
        await page.waitForSelector(userSelector, { timeout: 5000 });
        // URLに応じて環境変数を切り替え
        const user = url.includes('larubot') ? process.env.LARUBOT_LOGIN_USER : process.env.FLASTAL_LOGIN_USER;
        const pass = url.includes('larubot') ? process.env.LARUBOT_LOGIN_PASS : process.env.FLASTAL_LOGIN_PASS;

        await page.type(userSelector, user || '');
        await page.type(passSelector, pass || '');
        await page.keyboard.press('Enter');
        await page.waitForNavigation(waitOptions).catch(() => {});
        console.log('✅ 一般ログイン: 入力完了');
      } catch (e) {
        console.log('⚠️ ログインフォームが見つかりません');
      }
    }

  } catch (error) {
    console.error("LOGIN_FAILED:", error);
  }
}

// --- 共通部品: GitHubのID/PASS入力ロジック ---
async function githubLoginSequence(page: Page) {
  try {
    await page.waitForSelector('#login_field', { timeout: 5000 });
    await page.type('#login_field', process.env.GITHUB_LOGIN_USER || '');
    await page.type('#password', process.env.GITHUB_LOGIN_PASS || '');
    
    await Promise.all([
      page.click('input[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {})
    ]);
    console.log('✅ GitHub: 認証情報を送信しました');
  } catch (e) {
    console.log('ℹ️ GitHub: ログイン画面ではない、または入力済みです');
  }
}

export async function POST(req: Request) {
  const { url, action } = await req.json();

  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  let browser: Browser | null = null;

  try {
    // --- 環境判定とブラウザ起動 ---
    if (process.env.NODE_ENV === 'production') {
      const chromium = require('@sparticuz/chromium');
      const puppeteerCore = require('puppeteer-core');
      chromium.setGraphicsMode = false; 
      
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });
    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    if (!browser) throw new Error('Browser failed to launch');

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log(`Navigating to ${url}...`);
    // Renderなどはロードが遅い場合があるのでタイムアウト長め
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // ★ログイン判定を実行★
    await handleLogin(page as any, url);

    let result;

    if (action === 'screenshot') {
      // 描画待ち
      await new Promise(r => setTimeout(r, 3000));
      const screenshotBuffer = await page.screenshot({ encoding: 'base64', type: 'png', fullPage: false });
      result = { 
        type: 'image', 
        data: `data:image/png;base64,${screenshotBuffer}`,
        message: "画面を取得しました。"
      };
    } else if (action === 'scrape') {
      const text = await page.evaluate(() => document.body.innerText);
      const cleanedText = text.replace(/\s+/g, ' ').trim().substring(0, 3000);
      result = { 
        type: 'text', 
        data: cleanedText,
        message: "テキスト情報を取得しました。"
      };
    } else {
      await browser.close();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await browser.close();
    return NextResponse.json({ status: 'SUCCESS', result });

  } catch (error: any) {
    console.error("BROWSER_ERROR:", error);
    if (browser) await browser.close();
    
    return NextResponse.json({ 
      status: 'ERROR', 
      message: error.message || 'Browser operation failed' 
    }, { status: 500 });
  }
}