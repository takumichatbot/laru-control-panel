import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { repository } = await req.json();
  
  // スクリーンショットに基づくOwner固定
  const owner = process.env.GITHUB_OWNER || "takumichatbot";
  const token = process.env.GITHUB_TOKEN;

  if (!token) return NextResponse.json({ status: 'error', message: 'Token missing' });

  try {
    // 1. 最新のWorkflow Runを取得
    const runsRes = await fetch(`https://api.github.com/repos/${owner}/${repository}/actions/runs?per_page=1`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github.v3+json" }
    });
    
    if (!runsRes.ok) throw new Error('Failed to fetch runs');
    const runsData = await runsRes.json();
    const latestRun = runsData.workflow_runs[0];

    if (!latestRun) return NextResponse.json({ status: 'idle', message: 'No runs found' });

    // 2. そのRunの詳細（ジョブ）を取得して、今何をしているか特定
    const jobsRes = await fetch(latestRun.jobs_url, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github.v3+json" }
    });
    const jobsData = await jobsRes.json();
    
    // 実行中のステップや完了したステップを抽出
    const activeJob = jobsData.jobs.find((j: any) => j.status === 'in_progress') || jobsData.jobs[0];
    const currentStep = activeJob.steps.find((s: any) => s.status === 'in_progress') || activeJob.steps[activeJob.steps.length - 1];

    return NextResponse.json({
      status: latestRun.status,      // queued, in_progress, completed
      conclusion: latestRun.conclusion, // success, failure, null
      runId: latestRun.id,
      jobName: activeJob.name,
      stepName: currentStep ? currentStep.name : 'Initializing',
      htmlUrl: latestRun.html_url
    });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message });
  }
}