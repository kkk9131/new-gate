'use client';

import { useEffect, useState } from 'react';
import { RiCalendarLine, RiTimeLine, RiMapPinLine, RiAddLine, RiEdit2Line, RiDeleteBin6Line } from 'react-icons/ri';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { CalendarEvent } from '@/types/calendar';

export function CalendarApp() {
  // 状態管理
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate] = useState(new Date());

  // イベントデータ取得
  useEffect(() => {
    fetchTodayEvents();
  }, []);

  const fetchTodayEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 今日の日付範囲を取得
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(currentDate);
      endOfDay.setHours(23, 59, 59, 999);

      // APIからイベント取得
      const params = new URLSearchParams({
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
        limit: '50',
      });

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
  };

  // イベント削除ハンドラー
  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('イベントの削除に失敗しました');
      }

      // 成功したらリロード
      await fetchTodayEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // カラーマッピング（既存のデザインを踏襲）
  const getEventColorClass = (color?: string) => {
    // HEXカラーコードをTailwindクラスにマッピング
    const colorToClass: Record<string, string> = {
      '#3B82F6': 'border-blue-500/60 bg-blue-500/15', // blue
      '#10B981': 'border-green-500/60 bg-green-500/15', // green
      '#8B5CF6': 'border-purple-500/60 bg-purple-500/15', // purple
      '#EF4444': 'border-red-500/60 bg-red-500/15', // red
      '#F59E0B': 'border-amber-500/60 bg-amber-500/15', // amber
    };

    return colorToClass[color || '#3B82F6'] || 'border-accent-bloom/60 bg-accent-bloom/15';
  };

  // 時刻フォーマット
  const formatTime = (startTime: string, endTime: string, allDay: boolean) => {
    if (allDay) {
      return '終日';
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    return `${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
  };

  if (isLoading) {
    return (
      <div className="p-6 h-full overflow-auto bg-mist text-ink flex items-center justify-center">
        <div className="text-cloud">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full overflow-auto bg-mist text-ink flex items-center justify-center">
        <div className="text-accent-sand">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-2xl font-bold mb-6">Calendar</h2>

      {/* 今日の日付 */}
      <div className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-accent-bloom/30 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xs text-cloud font-medium">
              {format(currentDate, 'M月', { locale: ja })}
            </span>
            <span className="text-2xl font-bold">{format(currentDate, 'd')}</span>
          </div>
          <div>
            <p className="text-sm text-cloud">今日</p>
            <p className="text-xl font-bold">
              {format(currentDate, 'yyyy年M月d日（E）', { locale: ja })}
            </p>
          </div>
        </div>
      </div>

      {/* イベント一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">今日の予定</h3>
          <span className="text-sm text-cloud">{events.length}件</span>
        </div>

        {events.length === 0 ? (
          <div className="bg-surface border border-white/40 p-8 rounded-2xl text-center text-cloud">
            <RiCalendarLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>今日の予定はありません</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-2xl border-l-4 ${getEventColorClass(event.color)} shadow-sm relative group`}
            >
              {/* イベント操作ボタン */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    // TODO: イベント編集モーダルを開く
                    console.log('Edit event:', event.id);
                  }}
                  className="p-2 rounded-full bg-surface/80 hover:bg-surface transition-colors"
                  aria-label="編集"
                  title="編集"
                >
                  <RiEdit2Line className="w-4 h-4 text-cloud" />
                </button>
                <button
                  onClick={() => handleDelete(event.id, event.title)}
                  className="p-2 rounded-full bg-surface/80 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="削除"
                  title="削除"
                >
                  <RiDeleteBin6Line className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-semibold mb-2 pr-20">{event.title}</h4>

              {event.description && (
                <p className="text-sm text-cloud mb-2">{event.description}</p>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-cloud">
                  <RiTimeLine className="w-4 h-4" />
                  <span>{formatTime(event.start_time, event.end_time, event.all_day)}</span>
                </div>

                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-cloud">
                    <RiMapPinLine className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.projects && (
                  <div className="flex items-center gap-2 text-sm text-cloud mt-2">
                    <span className="px-2 py-1 bg-accent-bloom/20 rounded-md text-xs">
                      {event.projects.name}
                    </span>
                  </div>
                )}

                {event.category && (
                  <div className="flex items-center gap-2 text-sm text-cloud">
                    <span className="px-2 py-1 bg-mist rounded-md text-xs capitalize">
                      {event.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新規予定追加ボタン */}
      <button
        onClick={() => {
          // TODO: イベント作成モーダルを開く
          console.log('Create new event');
        }}
        className="w-full mt-6 py-3 bg-accent-sand text-ink rounded-full transition-colors hover:bg-accent-sand/80 font-medium flex items-center justify-center gap-2"
      >
        <RiAddLine className="w-5 h-5" />
        新しい予定を追加
      </button>
    </div>
  );
}
