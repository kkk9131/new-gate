import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/store/useNotificationStore';
import { playNotificationSound } from '@/lib/notification-sound';
import type { Notification } from '@/types/notification';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Supabase Realtimeを使った通知のリアルタイム購読フック
 * 新しい通知が作成されたらストアに自動追加される
 */
export function useNotificationRealtime(userId: string | undefined) {
  const { addNotification } = useNotificationStore();
  const soundEnabledRef = useRef(true);

  // 通知音設定を読み込み
  useEffect(() => {
    async function fetchSoundSettings() {
      try {
        const response = await fetch('/api/settings/notifications');
        if (response.ok) {
          const data = await response.json();
          soundEnabledRef.current = data.notification_sound ?? true;
        }
      } catch (error) {
        console.error('通知設定の取得に失敗しました:', error);
      }
    }
    fetchSoundSettings();
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createClient();
    let channel: RealtimeChannel;

    // Realtimeチャンネルを購読
    async function subscribeToNotifications() {
      try {
        channel = supabase
          .channel(`notifications-${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              // 新しい通知をストアに追加
              const newNotification = payload.new as Notification;
              addNotification(newNotification);

              // ブラウザ通知を表示（許可されている場合）
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(newNotification.title, {
                  body: newNotification.message,
                  icon: '/favicon.ico',
                  tag: newNotification.id,
                });
              }

              // 通知音を再生（設定で有効な場合）
              if (soundEnabledRef.current) {
                playNotificationSound();
              }
            }
          )
          .subscribe();
      } catch (error) {
        console.error('通知の購読中にエラーが発生しました:', error);
      }
    }

    subscribeToNotifications();

    // クリーンアップ: コンポーネントアンマウント時に購読解除
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, addNotification]);
}
