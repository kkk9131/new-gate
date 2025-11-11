'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  RiAddLine,
  RiCalendarLine,
  RiFilter3Line,
  RiCloseLine,
} from 'react-icons/ri';
import type { CalendarEvent, BigCalendarEvent, CalendarView, EventFilters } from '@/types/calendar';
import { useProjectStore } from '@/store/useProjectStore';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// date-fns localizer設定（日本語対応）
const locales = {
  ja: ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

/**
 * カレンダーアプリメインコンポーネント
 * - react-big-calendarを使った月・週・日ビュー表示
 * - イベントCRUD操作
 * - プロジェクト・カテゴリ・タグフィルター
 * - 既存UIデザインを踏襲
 */
export function CalendarApp() {
  // 状態管理
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CalendarView>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // フィルター状態
  const [filters, setFilters] = useState<EventFilters>({
    project_id: undefined,
    category: undefined,
    tags: [],
    search: '',
  });

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

  // イベントデータ取得
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // クエリパラメータ構築
      const params = new URLSearchParams({
        limit: '1000', // 大量のイベントを取得
      });

      // フィルター適用
      if (filters.project_id) {
        params.append('project_id', filters.project_id);
      }

      if (filters.category) {
        params.append('category', filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      if (filters.search) {
        params.append('search', filters.search);
      }

      // 表示期間に基づいた日付フィルター（パフォーマンス最適化）
      const startDate = new Date(date);
      startDate.setMonth(startDate.getMonth() - 2); // 2ヶ月前から
      const endDate = new Date(date);
      endDate.setMonth(endDate.getMonth() + 2); // 2ヶ月後まで

      params.append('start_date', startDate.toISOString());
      params.append('end_date', endDate.toISOString());

      const response = await fetch(`/api/events?${params}`);

      if (!response.ok) {
        throw new Error('イベントデータの取得に失敗しました');
      }

      const result = await response.json();
      setEvents(result.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [date, filters]);

  // イベント取得（フィルター変更時）
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // CalendarEventをBigCalendarEvent形式に変換
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: event.all_day,
      resource: event, // 元のイベントデータを保存
    }));
  }, [events]);

  // イベント選択ハンドラー
  const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
    setSelectedEvent(event.resource);
    // TODO: イベント詳細モーダルを開く
    console.log('Selected event:', event.resource);
  }, []);

  // スロット選択ハンドラー（新規イベント作成）
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    // TODO: イベント作成モーダルを開く（start/endを初期値として渡す）
    console.log('Create new event:', slotInfo);
  }, []);

  // ビュー変更ハンドラー
  const handleViewChange = useCallback((newView: View) => {
    setView(newView as CalendarView);
  }, []);

  // 日付ナビゲーションハンドラー
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  // イベントスタイルカスタマイズ
  const eventStyleGetter = useCallback((event: BigCalendarEvent) => {
    const backgroundColor = event.resource?.color || '#3B82F6';

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '0.875rem',
        padding: '2px 6px',
      },
    };
  }, []);

  // フィルタークリア
  const handleClearFilters = () => {
    setFilters({
      project_id: undefined,
      category: undefined,
      tags: [],
      search: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-cloud">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-accent-sand">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <RiCalendarLine className="w-6 h-6 text-accent-sand" />
          <h2 className="text-2xl font-bold">カレンダー</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* フィルターボタン */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              isFilterOpen
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            }`}
            aria-label="フィルター切替"
          >
            <RiFilter3Line className="w-4 h-4" />
            フィルター
          </button>

          {/* 新規作成ボタン */}
          <button
            onClick={() => {
              // TODO: イベント作成モーダルを開く
              console.log('Create event clicked');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors"
          >
            <RiAddLine className="w-4 h-4" /> 新規イベント
          </button>
        </div>
      </div>

      {/* フィルターパネル */}
      {isFilterOpen && (
        <div className="bg-surface border border-white/40 rounded-2xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">フィルター</h3>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-2 rounded-full hover:bg-cloud/20 transition-colors"
              aria-label="フィルターを閉じる"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* プロジェクトフィルター */}
            <div>
              <label htmlFor="filter-project" className="block text-sm text-cloud mb-2">
                プロジェクト
              </label>
              <select
                id="filter-project"
                value={filters.project_id || ''}
                onChange={(e) =>
                  setFilters({ ...filters, project_id: e.target.value || undefined })
                }
                className="w-full px-3 py-2 bg-mist border border-cloud/30 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              >
                <option value="">すべて</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* カテゴリフィルター */}
            <div>
              <label htmlFor="filter-category" className="block text-sm text-cloud mb-2">
                カテゴリ
              </label>
              <select
                id="filter-category"
                value={filters.category || ''}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value || undefined })
                }
                className="w-full px-3 py-2 bg-mist border border-cloud/30 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              >
                <option value="">すべて</option>
                <option value="meeting">会議</option>
                <option value="task">タスク</option>
                <option value="deadline">締切</option>
                <option value="personal">個人</option>
                <option value="holiday">休日</option>
                <option value="other">その他</option>
              </select>
            </div>

            {/* 検索 */}
            <div>
              <label htmlFor="filter-search" className="block text-sm text-cloud mb-2">
                検索
              </label>
              <input
                type="text"
                id="filter-search"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="タイトル・説明を検索"
                className="w-full px-3 py-2 bg-mist border border-cloud/30 rounded-xl text-sm text-ink placeholder-cloud/50 focus:outline-none focus:ring-2 focus:ring-accent-sand"
              />
            </div>
          </div>

          {/* フィルタークリアボタン */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-cloud hover:bg-cloud/20 rounded-full transition-colors"
            >
              フィルターをクリア
            </button>
          </div>
        </div>
      )}

      {/* ビュー切替 */}
      <div className="flex gap-2">
        {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              view === v
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            }`}
          >
            {v === 'month' && '月'}
            {v === 'week' && '週'}
            {v === 'day' && '日'}
            {v === 'agenda' && 'アジェンダ'}
          </button>
        ))}
      </div>

      {/* カレンダー本体 */}
      <div className="flex-1 bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden p-4">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%', minHeight: '500px' }}
          view={view}
          onView={handleViewChange}
          date={date}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          culture="ja"
          messages={{
            next: '次へ',
            previous: '前へ',
            today: '今日',
            month: '月',
            week: '週',
            day: '日',
            agenda: 'アジェンダ',
            date: '日付',
            time: '時間',
            event: 'イベント',
            showMore: (total) => `+${total}件表示`,
          }}
        />
      </div>

      {/* TODO: イベント作成・編集モーダルコンポーネント */}
      {/* TODO: イベント詳細表示モーダルコンポーネント */}
    </div>
  );
}
