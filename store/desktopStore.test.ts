import { beforeEach, describe, expect, it } from 'vitest';
import { useDesktopStore, resetDesktopStore, type WindowState } from './desktopStore';

const createWindow = (overrides: Partial<WindowState>): WindowState => ({
  id: overrides.id ?? 'window-id',
  appId: overrides.appId ?? 'projects',
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
});
