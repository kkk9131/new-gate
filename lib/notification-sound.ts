/**
 * 通知音を再生するユーティリティ
 */

// 通知音の再生フラグ（グローバル設定）
let soundEnabled = true;

/**
 * 通知音の有効/無効を設定
 */
export function setNotificationSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

/**
 * 通知音の有効/無効状態を取得
 */
export function isNotificationSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * 通知音を再生
 * Web Audio APIを使用してビープ音を生成
 */
export function playNotificationSound() {
  if (!soundEnabled || typeof window === 'undefined') {
    return;
  }

  try {
    // AudioContextを作成
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // オシレーター（音の波形を生成）を作成
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // オシレーターをゲインノードに接続
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 音の設定
    oscillator.type = 'sine'; // 正弦波（柔らかい音）
    oscillator.frequency.value = 800; // 周波数 800Hz（通知音らしい高さ）

    // 音量の設定（フェードイン・フェードアウト）
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // フェードイン
    gainNode.gain.linearRampToValueAtTime(0, now + 0.2); // フェードアウト

    // 音を再生
    oscillator.start(now);
    oscillator.stop(now + 0.2); // 0.2秒後に停止

  } catch (error) {
    console.error('通知音の再生に失敗しました:', error);
  }
}

/**
 * カスタム通知音を再生（音声ファイルを使用）
 * @param audioUrl 音声ファイルのURL
 */
export function playCustomNotificationSound(audioUrl: string) {
  if (!soundEnabled || typeof window === 'undefined') {
    return;
  }

  try {
    const audio = new Audio(audioUrl);
    audio.volume = 0.5; // 音量50%
    audio.play().catch(error => {
      console.error('通知音の再生に失敗しました:', error);
    });
  } catch (error) {
    console.error('通知音の再生に失敗しました:', error);
  }
}
