import { beforeEach, describe, expect, it } from 'vitest';
import { useDesktopStore, resetDesktopStore, type WindowState } from './desktopStore';
import { type AppId } from '@/components/desktop/appRegistry';

const createWindow = (overrides: Partial<WindowState>): WindowState => ({
  id: overrides.id ?? 'window-id',
  appId: (overrides.appId ?? 'projects') as AppId,
  title: overrides.title ?? 'Projects',
  position: overrides.position ?? { x: 0, y: 0 },
  size: overrides.size ?? { width: 800, height: 600 },
  isMinimized: overrides.isMinimized ?? false,
  isMaximized: overrides.isMaximized ?? false,
  zIndex: overrides.zIndex ?? 1,
});

describe('desktopStore', () => {
  beforeEach(() => {
    resetDesktopStore();
  });

  it('opens new windows and restores existing ones instead of duplicating', () => {
    const { openWindow } = useDesktopStore.getState();

    openWindow('projects');
    expect(useDesktopStore.getState().windows).toHaveLength(1);

    useDesktopStore.setState((state) => ({
      ...state,
      windows: state.windows.map((w) => ({ ...w, isMinimized: true })),
    }));

    openWindow('projects');
    const windows = useDesktopStore.getState().windows;
    expect(windows).toHaveLength(1);
    expect(windows[0].isMinimized).toBe(false);
  });

  it('normalizes z-index values when they grow too large', () => {
    const { bringToFront } = useDesktopStore.getState();

    useDesktopStore.setState((state) => ({
      ...state,
      windows: [
        createWindow({ id: 'w1', title: 'Projects', appId: 'projects', zIndex: 1500 }),
        createWindow({ id: 'w2', title: 'Settings', appId: 'settings', zIndex: 1501 }),
      ],
    }));

    bringToFront('w1');

    const zIndexes = useDesktopStore.getState().windows.map((w) => w.zIndex);
    expect(Math.max(...zIndexes)).toBeLessThanOrEqual(useDesktopStore.getState().windows.length + 1);

    const target = useDesktopStore.getState().windows.find((w) => w.id === 'w1');
    const other = useDesktopStore.getState().windows.find((w) => w.id === 'w2');
    expect(target).toBeDefined();
    expect(other).toBeDefined();
    expect((target!.zIndex)).toBeGreaterThan(other!.zIndex);
  });

  it('opens split-screen windows once and restores them on re-open', () => {
    const { openWindowInScreen } = useDesktopStore.getState();

    openWindowInScreen('left', 'projects');
    expect(useDesktopStore.getState().splitScreenWindows.left).toHaveLength(1);

    useDesktopStore.setState((state) => ({
      ...state,
      splitScreenWindows: {
        ...state.splitScreenWindows,
        left: state.splitScreenWindows.left.map((w) => ({ ...w, isMinimized: true })),
      },
    }));

    openWindowInScreen('left', 'projects');
    const [splitWindow] = useDesktopStore.getState().splitScreenWindows.left;
    expect(splitWindow).toBeDefined();
    expect(splitWindow?.isMinimized).toBe(false);
    expect(useDesktopStore.getState().splitScreenWindows.left).toHaveLength(1);
  });

  // レビュー指摘: 分割モードの切り替えテスト
  it('toggles split mode in sequence 1→2→3→4→1', () => {
    const { toggleSplitMode } = useDesktopStore.getState();

    // 初期状態は1（通常モード）
    expect(useDesktopStore.getState().splitMode).toBe(1);

    // 1→2
    toggleSplitMode();
    expect(useDesktopStore.getState().splitMode).toBe(2);

    // 2→3
    toggleSplitMode();
    expect(useDesktopStore.getState().splitMode).toBe(3);

    // 3→4
    toggleSplitMode();
    expect(useDesktopStore.getState().splitMode).toBe(4);

    // 4→1（ループバック）
    toggleSplitMode();
    expect(useDesktopStore.getState().splitMode).toBe(1);
  });

  // レビュー指摘: ウィンドウ位置・サイズ更新テスト
  it('updates window position', () => {
    const { openWindow, updateWindowPosition } = useDesktopStore.getState();

    openWindow('projects');
    const window = useDesktopStore.getState().windows[0];

    updateWindowPosition(window.id, { x: 200, y: 300 });

    const updatedWindow = useDesktopStore.getState().windows[0];
    expect(updatedWindow.position).toEqual({ x: 200, y: 300 });
  });

  it('updates window size', () => {
    const { openWindow, updateWindowSize } = useDesktopStore.getState();

    openWindow('projects');
    const window = useDesktopStore.getState().windows[0];

    updateWindowSize(window.id, { width: 1024, height: 768 });

    const updatedWindow = useDesktopStore.getState().windows[0];
    expect(updatedWindow.size).toEqual({ width: 1024, height: 768 });
  });

  // レビュー指摘: 存在しないアプリIDを開こうとした場合のテスト
  it('does not create window for non-existent app ID', () => {
    const { openWindow } = useDesktopStore.getState();

    // 存在しないアプリIDを開こうとする
    openWindow('non-existent-app' as any);

    // ウィンドウが作成されないことを確認
    expect(useDesktopStore.getState().windows).toHaveLength(0);
  });

  it('does not create split-screen window for non-existent app ID', () => {
    const { openWindowInScreen } = useDesktopStore.getState();

    // 存在しないアプリIDを開こうとする
    openWindowInScreen('left', 'non-existent-app' as any);

    // ウィンドウが作成されないことを確認
    expect(useDesktopStore.getState().splitScreenWindows.left).toHaveLength(0);
  });

  // レビュー指摘: ウィンドウIDの一意性テスト
  it('generates unique window IDs even when opening same app multiple times', () => {
    const { openWindow, closeWindow } = useDesktopStore.getState();

    // 同じアプリを3回開く→閉じる→開くを繰り返す
    openWindow('projects');
    const firstId = useDesktopStore.getState().windows[0].id;

    closeWindow(firstId);
    openWindow('projects');
    const secondId = useDesktopStore.getState().windows[0].id;

    closeWindow(secondId);
    openWindow('projects');
    const thirdId = useDesktopStore.getState().windows[0].id;

    // すべてのIDが異なることを確認
    expect(firstId).not.toBe(secondId);
    expect(secondId).not.toBe(thirdId);
    expect(firstId).not.toBe(thirdId);

    // UUID形式であることを確認（crypto.randomUUID()を使っている場合）
    const uuidRegex = /^window-projects-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(firstId).toMatch(uuidRegex);
    expect(secondId).toMatch(uuidRegex);
    expect(thirdId).toMatch(uuidRegex);
  });

  // レビュー指摘: z-index正規化の閾値テスト
  it('normalizes z-index when exceeding threshold of 1000', () => {
    const { bringToFront } = useDesktopStore.getState();

    // 初期状態: z-indexが閾値を超える状態を作る
    useDesktopStore.setState((state) => ({
      ...state,
      windows: [
        createWindow({ id: 'w1', appId: 'projects', zIndex: 998 }),
        createWindow({ id: 'w2', appId: 'settings', zIndex: 999 }),
        createWindow({ id: 'w3', appId: 'revenue', zIndex: 1000 }),
      ],
    }));

    // w1を最前面に持ってくる（z-index = 1001になる）
    bringToFront('w1');

    // z-indexが1001になったことで、閾値1000を超える
    // 次の操作で正規化されるはず
    let windows = useDesktopStore.getState().windows;
    const w1BeforeNormalization = windows.find((w) => w.id === 'w1');
    expect(w1BeforeNormalization?.zIndex).toBe(1001);

    // さらにw2を最前面に（これで正規化がトリガーされる）
    bringToFront('w2');

    // 正規化後、すべてのz-indexが閾値以下に収まっている
    windows = useDesktopStore.getState().windows;
    const maxZIndex = Math.max(...windows.map((w) => w.zIndex));
    expect(maxZIndex).toBeLessThanOrEqual(windows.length);

    // 相対的な順序は保たれている
    const w2 = windows.find((w) => w.id === 'w2');
    const w1 = windows.find((w) => w.id === 'w1');
    const w3 = windows.find((w) => w.id === 'w3');

    expect(w2).toBeDefined();
    expect(w1).toBeDefined();
    expect(w3).toBeDefined();

    // w2が最前面、次にw1、w3が最後
    expect(w2!.zIndex).toBeGreaterThan(w1!.zIndex);
    expect(w1!.zIndex).toBeGreaterThan(w3!.zIndex);
  });
});
