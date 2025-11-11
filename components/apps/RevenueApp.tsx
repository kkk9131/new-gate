'use client';

import { useState } from 'react';
import {
  RiDashboardLine,
  RiMoneyDollarCircleLine,
  RiWallet3Line,
  RiFlagLine,
} from 'react-icons/ri';
import { RevenueDashboard } from './revenue/RevenueDashboard';
import { RevenueList } from './revenue/RevenueList';
import { ExpenseList } from './revenue/ExpenseList';
import { TargetList } from './revenue/TargetList';

type TabType = 'dashboard' | 'revenues' | 'expenses' | 'targets';

/**
 * Revenue管理アプリのメインコンポーネント
 * - ダッシュボード: 売上・経費・粗利の集計とグラフ表示
 * - 売上一覧: 売上データの管理
 * - 経費一覧: 経費データの管理
 * - 目標一覧: 売上目標の設定と進捗管理
 */
export function RevenueApp() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink space-y-6">
      {/* ヘッダー */}
      <Header />

      {/* タブ切り替え */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <RevenueDashboard />}
        {activeTab === 'revenues' && <RevenueList />}
        {activeTab === 'expenses' && <ExpenseList />}
        {activeTab === 'targets' && <TargetList />}
      </div>
    </div>
  );
}

/**
 * ヘッダーコンポーネント
 */
function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-1">Revenue</h2>
        <p className="text-sm text-cloud">売上・経費管理と目標達成状況</p>
      </div>
    </div>
  );
}

/**
 * タブナビゲーションコンポーネント
 */
function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <RiDashboardLine className="w-5 h-5" /> },
    { id: 'revenues', label: '売上', icon: <RiMoneyDollarCircleLine className="w-5 h-5" /> },
    { id: 'expenses', label: '経費', icon: <RiWallet3Line className="w-5 h-5" /> },
    { id: 'targets', label: '目標', icon: <RiFlagLine className="w-5 h-5" /> },
  ];

  return (
    <div className="flex gap-2 border-b border-cloud/20 pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === tab.id
              ? 'bg-surface text-ink font-semibold border-b-2 border-accent-sand'
              : 'text-cloud hover:text-ink hover:bg-cloud/10'
          }`}
          aria-label={tab.label}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
