'use client';

import { useDesktopStore } from '@/store/desktopStore';
import { Window } from './Window';

interface WindowManagerProps {
  scale?: number;
}

export function WindowManager({ scale = 1 }: WindowManagerProps) {
  const windows = useDesktopStore((state) => state.windows);

  return (
    <>
      {windows.map((window) => (
        <Window key={window.id} window={window} scale={scale} />
      ))}
    </>
  );
}
