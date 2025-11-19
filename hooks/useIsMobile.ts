import { useEffect, useState } from 'react';

/**
 * モバイルデバイス判定カスタムフック
 *
 * @param breakpoint - モバイル判定のブレークポイント（デフォルト: 768px）
 * @returns isMobile - 現在の画面幅がブレークポイント未満かどうか
 * @returns isReady - クライアント環境での判定が完了したかどうか
 *
 * @example
 * const { isMobile } = useIsMobile(); // 768px未満でtrue
 * const { isMobile: isTablet } = useIsMobile(1024); // 1024px未満でtrue
 */
interface UseIsMobileResult {
  isMobile: boolean;
  isReady: boolean;
}

const RESIZE_DEBOUNCE_MS = 150;

export function useIsMobile(breakpoint = 768): UseIsMobileResult {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });
  const [isReady, setIsReady] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    // SSR対応: windowが存在しない場合は早期リターン
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
      setIsReady(true);
    };
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(checkMobile, RESIZE_DEBOUNCE_MS);
    };

    // 初期チェック
    checkMobile();

    // リサイズイベントリスナー登録
    window.addEventListener('resize', handleResize);

    // クリーンアップ
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return { isMobile, isReady };
}
