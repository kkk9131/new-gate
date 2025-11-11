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
import type { DashboardData } from '@/types/revenue';

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
 */
export function RevenueDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ダッシュボードデータ取得
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 直近6ヶ月のデータを取得
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5);

      const params = new URLSearchParams({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

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
