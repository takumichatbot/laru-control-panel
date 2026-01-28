import DevConsole from './DevConsole';

// ビルド時に必要なパラメータを生成（サーバー側で実行）
export function generateStaticParams() {
  return [
    { projectId: 'larubot' },
    { projectId: 'flastal' },
    { projectId: 'laruvisona' },
    { projectId: 'larunexus' },
  ];
}

// ページコンポーネント
export default function Page() {
  return <DevConsole />;
}