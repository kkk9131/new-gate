'use client';

import { useEffect, useState } from 'react';
import {
  RiMoneyDollarCircleLine,
  RiWallet3Line,
  RiPieChartLine,
  RiFlagLine,
} from 'react-icons/ri';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { subYears, subMonths, subWeeks, format } from 'date-fns';
import type { DashboardData, PeriodType } from '@/types/revenue';
import { useProjectStore } from '@/store/useProjectStore';

// Chart.js登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * ダッシュボードコンポーネント
 * - 売上・経費・粗利のサマリー表示
 * - 目標達成状況
 * - 月次推移グラフ（Chart.js）
 * - 期間フィルター（年間・月間・週間）
 * - プロジェクトフィルター
 */
export function RevenueDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Zustand storeからプロジェクト一覧を取得
  const { projects, fetchProjects, error: projectError } = useProjectStore();

  // プロジェクト一覧取得
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // プロジェクト取得エラー表示
  useEffect(() => {
    if (projectError) {
      setError(projectError);
    }
  }, [projectError]);

  // ダッシュボードデータ取得
  useEffect(() => {
    fetchDashboardData();
  }, [period, selectedProjectId]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 期間に応じた開始日を計算（date-fns使用で安全な日付計算）
      const endDate = new Date();
      let startDate: Date;

      switch (period) {
        case 'year':
          startDate = subYears(endDate, 1);
          break;
        case 'month':
          startDate = subMonths(endDate, 1);
          break;
        case 'week':
          startDate = subWeeks(endDate, 1);
          break;
      }

      const params = new URLSearchParams({
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      // プロジェクトフィルター
      if (selectedProjectId) {
        params.append('project_id', selectedProjectId);
      }

      const response = await fetch(`/api/dashboard?${params}`);

      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cloud">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-accent-sand">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cloud">データがありません</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルターエリア */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-surface border border-white/40 rounded-2xl p-4 shadow-soft">
        {/* 期間フィルター */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('year')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === 'year'
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            年間
          </button>
          <button
            onClick={() => setPeriod('month')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            月間
          </button>
          <button
            onClick={() => setPeriod('week')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            週間
          </button>
        </div>

        {/* プロジェクトフィルター */}
        <div className="flex items-center gap-2">
          <label htmlFor="project-filter" className="text-sm text-cloud whitespace-nowrap">
            プロジェクト:
          </label>
          <select
            id="project-filter"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={isLoading}
            className={`px-3 py-2 bg-mist border border-cloud/30 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="">全体</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="合計売上"
          value={`¥${data.summary.total_revenue.toLocaleString()}`}
          icon={<RiMoneyDollarCircleLine className="w-6 h-6" />}
          bgColor="bg-accent-sand/20"
        />
        <SummaryCard
          title="合計経費"
          value={`¥${data.summary.total_expense.toLocaleString()}`}
          icon={<RiWallet3Line className="w-6 h-6" />}
          bgColor="bg-cloud/20"
        />
        <SummaryCard
          title="粗利"
          value={`¥${data.summary.gross_profit.toLocaleString()}`}
          subtitle={`粗利率: ${data.summary.gross_profit_rate}%`}
          icon={<RiPieChartLine className="w-6 h-6" />}
          bgColor="bg-accent-warm/20"
        />
        {data.target && (
          <SummaryCard
            title="目標達成率"
            value={`${data.target.achievement_rate.toFixed(1)}%`}
            subtitle={`目標: ¥${data.target.target_amount.toLocaleString()}`}
            icon={<RiFlagLine className="w-6 h-6" />}
            bgColor="bg-indigo-100"
          />
        )}
      </div>

      {/* 月次推移グラフ */}
      <div className="bg-surface border border-white/40 rounded-3xl p-6 shadow-soft">
        <h3 className="text-lg font-semibold mb-4">月次推移</h3>
        <MonthlyChart monthly={data.monthly} />
      </div>
    </div>
  );
}

/**
 * サマリーカードコンポーネント
 */
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  bgColor,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl p-5 shadow-soft">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-cloud mb-1">{title}</p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs text-cloud">{subtitle}</p>}
    </div>
  );
}

/**
 * 月次推移グラフコンポーネント（Chart.js）
 */
function MonthlyChart({ monthly }: { monthly: Record<string, { revenue: number; expense: number; gross_profit: number }> }) {
  // データを月順にソート
  const sortedMonths = Object.keys(monthly).sort();

  const chartData = {
    labels: sortedMonths.map((month) => {
      const [year, m] = month.split('-');
      return `${year}年${parseInt(m)}月`;
    }),
    datasets: [
      {
        label: '売上',
        data: sortedMonths.map((month) => monthly[month].revenue),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: '経費',
        data: sortedMonths.map((month) => monthly[month].expense),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: '粗利',
        data: sortedMonths.map((month) => monthly[month].gross_profit),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '¥' + context.parsed.y.toLocaleString();
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '¥' + value.toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
}
