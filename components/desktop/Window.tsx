'use client';

import { useCallback, useMemo } from 'react';
import { useDesktopStore, WindowState } from '@/store/desktopStore';
import { BaseWindow } from './BaseWindow';
import { appComponents } from './appRegistry';

interface WindowProps {
  window: WindowState;
}

export function Window({ window }: WindowProps) {
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const maximizeWindow = useDesktopStore((state) => state.maximizeWindow);
  const bringToFront = useDesktopStore((state) => state.bringToFront);
  const updateWindowPosition = useDesktopStore((state) => state.updateWindowPosition);
  const updateWindowSize = useDesktopStore((state) => state.updateWindowSize);

  const AppComponent = useMemo(() => appComponents[window.appId], [window.appId]);

  const handleClose = useCallback(() => closeWindow(window.id), [closeWindow, window.id]);
  const handleMinimize = useCallback(() => minimizeWindow(window.id), [minimizeWindow, window.id]);
  const handleMaximize = useCallback(() => maximizeWindow(window.id), [maximizeWindow, window.id]);
  const handleFocus = useCallback(() => bringToFront(window.id), [bringToFront, window.id]);
  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
    updateWindowPosition(window.id, position);
  }, [updateWindowPosition, window.id]);
  const handleResize = useCallback((size: { width: number; height: number }, position: { x: number; y: number }) => {
    updateWindowSize(window.id, size);
    updateWindowPosition(window.id, position);
  }, [updateWindowPosition, updateWindowSize, window.id]);

  if (window.isMinimized) return null;

  return (
    <BaseWindow
      window={window}
      AppComponent={AppComponent}
      onClose={handleClose}
      onMinimize={handleMinimize}
      onMaximize={handleMaximize}
      onFocus={handleFocus}
      onPositionChange={handlePositionChange}
      onResize={handleResize}
    />
  );
}
