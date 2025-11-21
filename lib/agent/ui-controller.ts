import { useDesktopStore } from '@/store/desktopStore';
import { AppId } from '@/components/desktop/appRegistry';

export class UIController {
    /**
     * レイアウトを設定する
     */
    setLayout(layout: 1 | 2 | 3 | 4): void {
        const store = useDesktopStore.getState();
        store.setLayout(layout);
        console.log(`[UIController] Layout set to: ${layout}`);
    }

    /**
     * 指定したスクリーンでアプリを開く
     */
    openApp(screenId: number, appId: string): void {
        const store = useDesktopStore.getState();

        // 1. Screen状態を更新
        store.openAppInScreenForAgent(appId, screenId);

        // 2. 実際にウィンドウを開く
        // splitModeに応じて適切なscreenId(文字列)に変換
        const splitMode = store.splitMode;
        let targetScreenKey = '';

        if (splitMode === 1) {
            // シングルモードの場合は通常のopenWindowを使用
            store.openWindow(appId as AppId);
            return;
        }

        if (splitMode === 2) {
            targetScreenKey = screenId === 1 ? 'left' : 'right';
        } else if (splitMode === 3) {
            targetScreenKey = screenId === 1 ? 'left' : screenId === 2 ? 'topRight' : 'bottomRight';
        } else if (splitMode === 4) {
            targetScreenKey = screenId === 1 ? 'topLeft' : screenId === 2 ? 'topRight' : screenId === 3 ? 'bottomLeft' : 'bottomRight';
        }

        if (targetScreenKey) {
            store.openWindowInScreen(targetScreenKey, appId as AppId);
            console.log(`[UIController] Opened ${appId} in screen ${screenId} (${targetScreenKey})`);
        }
    }

    /**
     * スクリーンのステータスを更新する
     */
    updateStatus(screenId: number, status: string, progress?: number): void {
        const store = useDesktopStore.getState();
        store.updateScreenStatus(screenId, status, progress);
        console.log(`[UIController] Screen ${screenId} status: ${status} (${progress}%)`);
    }

    /**
     * 現在のスクリーン状態を取得する
     */
    getScreenState(screenId: number) {
        const store = useDesktopStore.getState();
        return store.screens[screenId];
    }
}

// シングルトンインスタンス
export const uiController = new UIController();
