'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View as BigCalendarView } from 'react-big-calendar';
import { RiCalendarLine, RiTimeLine, RiMapPinLine, RiAddLine, RiEdit2Line, RiDeleteBin6Line } from 'react-icons/ri';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfWeek as getStartOfWeek, endOfWeek as getEndOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { CalendarEvent, BigCalendarEvent } from '@/types/calendar';
import { EventFormModal } from './calendar/EventFormModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// date-fns localizer設定
const locales = { ja };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function CalendarApp() {
  // 状態管理
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'today' | 'month' | 'week'>('today');
  const [bigCalendarView, setBigCalendarView] = useState<BigCalendarView>('month');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // イベントデータ取得
  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let startDate: Date;
      let endDate: Date;

      if (view === 'today') {
        // 今日のみ
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (view === 'month') {
        // 月の最初から最後 + 前後の週
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        startDate = getStartOfWeek(monthStart, { locale: ja });
        endDate = getEndOfWeek(monthEnd, { locale: ja });
      } else {
        // 週
        startDate = getStartOfWeek(currentDate, { locale: ja });
        endDate = getEndOfWeek(currentDate, { locale: ja });
      }

      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: '1000',
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

      await fetchEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // イベント作成ハンドラー
  const handleCreate = async (formData: any) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        project_id: formData.project_id || undefined,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'イベントの作成に失敗しました');
    }

    await fetchEvents();
  };

  // イベント更新ハンドラー
  const handleUpdate = async (formData: any) => {
    if (!selectedEvent) return;

    const response = await fetch(`/api/events/${selectedEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        project_id: formData.project_id || undefined,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'イベントの更新に失敗しました');
    }

    await fetchEvents();
    setSelectedEvent(null);
  };

  // CalendarEventをBigCalendarEvent形式に変換
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: event.all_day,
      resource: event,
    }));
  }, [events]);

  // BigCalendarのイベント選択ハンドラー
  const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
    setSelectedEvent(event.resource);
    setIsEditModalOpen(true);
  }, []);

  // BigCalendarのスロット選択ハンドラー
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setIsCreateModalOpen(true);
  }, []);

  // BigCalendarのイベントスタイル
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

  // カラーマッピング（今日ビュー用）
  const getEventColorClass = (color?: string) => {
    const colorToClass: Record<string, string> = {
      '#3B82F6': 'border-blue-500/60 bg-blue-500/15',
      '#10B981': 'border-green-500/60 bg-green-500/15',
      '#8B5CF6': 'border-purple-500/60 bg-purple-500/15',
      '#EF4444': 'border-red-500/60 bg-red-500/15',
      '#F59E0B': 'border-amber-500/60 bg-amber-500/15',
    };
    return colorToClass[color || '#3B82F6'] || 'border-accent-bloom/60 bg-accent-bloom/15';
  };

  // 時刻フォーマット（今日ビュー用）
  const formatTime = (startTime: string, endTime: string, allDay: boolean) => {
    if (allDay) return '終日';
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors"
        >
          <RiAddLine className="w-4 h-4" /> 新規イベント
        </button>
      </div>

      {/* ビュー切り替え */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('today')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === 'today'
              ? 'bg-accent-sand text-ink'
              : 'bg-mist text-cloud border border-cloud/30 hover:bg-cloud/10'
          }`}
        >
          今日
        </button>
        <button
          onClick={() => {
            setView('month');
            setBigCalendarView('month');
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === 'month'
              ? 'bg-accent-sand text-ink'
              : 'bg-mist text-cloud border border-cloud/30 hover:bg-cloud/10'
          }`}
        >
          月
        </button>
        <button
          onClick={() => {
            setView('week');
            setBigCalendarView('week');
          }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            view === 'week'
              ? 'bg-accent-sand text-ink'
              : 'bg-mist text-cloud border border-cloud/30 hover:bg-cloud/10'
          }`}
        >
          週
        </button>
      </div>

      {/* 今日ビュー */}
      {view === 'today' && (
        <>
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
                        setSelectedEvent(event);
                        setIsEditModalOpen(true);
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
        </>
      )}

      {/* 月・週ビュー（react-big-calendar） */}
      {(view === 'month' || view === 'week') && (
        <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden p-4" style={{ height: '600px' }}>
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={bigCalendarView}
            onView={setBigCalendarView}
            date={currentDate}
            onNavigate={setCurrentDate}
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
      )}

      {/* 新規作成モーダル */}
      <EventFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 編集モーダル */}
      <EventFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleUpdate}
        initialData={
          selectedEvent
            ? {
                title: selectedEvent.title,
                description: selectedEvent.description || '',
                location: selectedEvent.location || '',
                start_time: selectedEvent.start_time,
                end_time: selectedEvent.end_time,
                all_day: selectedEvent.all_day,
                project_id: selectedEvent.project_id || '',
                category: selectedEvent.category || '',
                color: selectedEvent.color,
              }
            : undefined
        }
        mode="edit"
      />
    </div>
  );
}
