import { useEffect, useState } from 'react';

/**
 * モバイルデバイス判定カスタムフック
 *
 * @param breakpoint - モバイル判定のブレークポイント（デフォルト: 768px）
 * @returns isMobile - 現在の画面幅がブレークポイント未満かどうか
 *
 * @example
 * const isMobile = useIsMobile(); // 768px未満でtrue
 * const isTablet = useIsMobile(1024); // 1024px未満でtrue
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // SSR対応: windowが存在しない場合は早期リターン
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // 初期チェック
    checkMobile();

    // リサイズイベントリスナー登録
    window.addEventListener('resize', checkMobile);

    // クリーンアップ
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}
