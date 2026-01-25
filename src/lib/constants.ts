// src/lib/constants.ts
import { 
  BrainCircuit, Code, Globe, Terminal, TrendingUp, 
  Briefcase, Network, Cpu, Settings, LucideIcon 
} from 'lucide-react';

// ChannelID に INFRA と DEV を追加
export type ChannelID = 
  | 'CENTRAL' 
  | 'LARUBOT' 
  | 'LARUVISONA' 
  | 'LARUNEXUS' 
  | 'TRADING' 
  | 'CLIENT' 
  | 'INFRA' 
  | 'DEV';

export interface ProjectMeta {
  id: ChannelID;
  name: string;
  jpName: string;
  role: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  hex: string;
  keywords: string[];
}

export const CHANNELS: ProjectMeta[] = [
  { 
    id: 'CENTRAL', name: 'CENTRAL INTELLIGENCE', jpName: '統合指令本部', role: 'CORE_AI',
    desc: '全プロジェクトの統括・日常会話・音声対話ハブ', 
    icon: BrainCircuit, color: 'cyan', hex: '#06b6d4', keywords: [] 
  },
  { 
    id: 'LARUBOT', name: 'LARUbot ENGINE', jpName: 'LARUbot 開発室', role: 'PROJECT',
    desc: '自社AIチャットボット・LLMチューニング・学習', 
    icon: Code, color: 'pink', hex: '#ec4899', keywords: ['bot', 'larubot', 'ai', '学習', '生成'] 
  },
  { 
    id: 'LARUVISONA', name: 'LARUVISONA CORP', jpName: '経営戦略・広報', role: 'PROJECT',
    desc: 'ブランディング・法人登記・経営判断', 
    icon: Globe, color: 'violet', hex: '#8b5cf6', keywords: ['会社', '経営', '登記', 'ビジョン', 'ロゴ'] 
  },
  { 
    id: 'LARUNEXUS', name: 'LARU NEXUS SYSTEM', jpName: 'NEXUS 開発拠点', role: 'PROJECT',
    desc: '本システムの機能拡張・UI/UX改善', 
    icon: Terminal, color: 'emerald', hex: '#10b981', keywords: ['nexus', 'システム', 'ui', '機能', 'バグ'] 
  },
  { 
    id: 'TRADING', name: 'ASSET MANAGEMENT', jpName: '投資戦略室', role: 'FINANCE',
    desc: '米国株・暗号資産・FX 自動売買', 
    icon: TrendingUp, color: 'yellow', hex: '#eab308', keywords: ['株', '投資', 'btc', 'nvda', '円', '資産'] 
  },
  { 
    id: 'CLIENT', name: 'CLIENT WORKS', jpName: '受託開発 (Flastal)', role: 'EXTERNAL',
    desc: 'Flastal案件・顧客折衝・納期管理', 
    icon: Briefcase, color: 'orange', hex: '#f97316', keywords: ['flastal', '客', '案件', '納期', '契約'] 
  },
  // --- 新設：バックエンドからの転送先部署 ---
  { 
    id: 'INFRA', name: 'INFRASTRUCTURE OPS', jpName: 'インフラ管理部', role: 'ADMIN',
    desc: 'サーバー監視・セキュリティ・ネットワーク制御', 
    icon: Network, color: 'blue', hex: '#3b82f6', keywords: ['infra', 'server', 'security', 'db', 'インフラ'] 
  },
  { 
    id: 'DEV', name: 'CORE DEVELOPMENT', jpName: 'システム開発部', role: 'DEV',
    desc: 'プログラム修正・エラー解析・デプロイ管理', 
    icon: Cpu, color: 'amber', hex: '#f59e0b', keywords: ['dev', 'debug', 'code', 'error', '修正'] 
  },
];