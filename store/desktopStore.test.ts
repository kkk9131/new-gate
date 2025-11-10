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
});
